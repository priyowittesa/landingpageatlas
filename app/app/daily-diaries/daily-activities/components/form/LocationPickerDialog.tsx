"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { MapPin, Search } from "lucide-react";
import { env } from "@/lib/env";
import {
  fetchPlaceAutocomplete,
  fetchPlaceLocation,
  type PlacePrediction
} from "@/lib/google-places";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type PickedLocation = {
  latitude: number;
  longitude: number;
};

const DEFAULT_CENTER = { lat: 24.7136, lng: 46.6753 }; // Riyadh
const DEFAULT_ZOOM = 10;

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 5 * 60 * 1000,
      timeout: 10_000
    });
  });
}

export function LocationPickerDialog({
  open,
  onOpenChange,
  onConfirm
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (location: PickedLocation) => void;
}) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const optionsSetRef = useRef(false);
  // Ref-based readiness flag so the load-timeout callback doesn't rely on a
  // stale `mapStatus` closure value.
  const mapReadyRef = useRef(false);

  const [selected, setSelected] = useState<PickedLocation | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mapStatus, setMapStatus] = useState<"idle" | "ready" | "error">(
    "idle"
  );
  // Tracks whether the map container <div> is mounted. Radix Dialog renders
  // its content in a portal, so the node may be null on the first effect run
  // — this state forces a re-render (and thus a re-run of the load effect)
  // once the div is actually attached.
  const [mapMounted, setMapMounted] = useState(false);
  const setMapNode = useCallback((node: HTMLDivElement | null) => {
    mapNodeRef.current = node;
    mapInstanceRef.current = null;
    markerRef.current = null;
    mapReadyRef.current = false;
    setMapMounted(Boolean(node));
  }, []);
  // Static across renders, so this is a plain derived value rather than
  // state set inside an effect.
  const hasApiKey = Boolean(env.googleMapsApiKey);

  // Search state
  const [searchInput, setSearchInput] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);

  // Drops/moves the marker on the map (if loaded) and always records the
  // selected coordinates, so location selection still works even when the
  // map itself failed to load (e.g. missing/invalid API key).
  const placeMarker = useCallback((lat: number, lng: number) => {
    setSelected({ latitude: lat, longitude: lng });

    const map = mapInstanceRef.current;
    if (!map) return;

    const position = { lat, lng };
    if (markerRef.current) {
      markerRef.current.setPosition(position);
    } else {
      markerRef.current = new google.maps.Marker({
        position,
        map,
        draggable: true
      });
      markerRef.current.addListener(
        "dragend",
        (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          setSelected({
            latitude: e.latLng.lat(),
            longitude: e.latLng.lng()
          });
        }
      );
    }
    map.panTo(position);
  }, []);

  // Load Google Maps once and init the map when the dialog opens.
  // `mapMounted` is in the deps so the effect re-runs after Radix mounts
  // the portal content (the map div is null on the first render).
  useEffect(() => {
    if (!open || !mapMounted || !mapNodeRef.current) return;
    const apiKey = env.googleMapsApiKey;
    if (!apiKey) return;

    let cancelled = false;
    mapReadyRef.current = false;

    // A load hang (e.g. blocked request, key restricted to the wrong
    // domain) never rejects the loader's promise, so without this timeout
    // the UI would spin on "Loading map…" forever. The check uses a ref
    // (not the stale `mapStatus` closure) so it always reflects the
    // current readiness state.
    const timeoutId = setTimeout(() => {
      if (!cancelled && !mapReadyRef.current) {
        console.error(
          "[LocationPickerDialog] Google Maps failed to load within 8s. " +
            "Check that the API key is valid, the Maps JavaScript API is " +
            "enabled, and localhost is allowed under the key's HTTP " +
            "referrer restrictions."
        );
        setMapStatus("error");
      }
    }, 8000);

    Promise.resolve()
      .then(() => {
        if (!optionsSetRef.current) {
          setOptions({ key: apiKey, v: "weekly", libraries: ["places"] });
          optionsSetRef.current = true;
        }
        return importLibrary("maps");
      })
      .then(() => {
        if (cancelled || !mapNodeRef.current) return;
        if (!mapInstanceRef.current) {
          const map = new google.maps.Map(mapNodeRef.current, {
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
          });
          mapInstanceRef.current = map;

          // Click to pick a location
          map.addListener("click", (e: google.maps.MapMouseEvent) => {
            if (!e.latLng) return;
            placeMarker(e.latLng.lat(), e.latLng.lng());
          });

          // If a location was already selected (e.g. via geolocation before
          // the map finished loading), reflect it on the map now.
          if (selected) placeMarker(selected.latitude, selected.longitude);
        }
        if (cancelled) return;
        clearTimeout(timeoutId);
        mapReadyRef.current = true;
        setMapStatus("ready");
      })
      .catch((err) => {
        console.error("[LocationPickerDialog] Google Maps load failed:", err);
        if (!cancelled) {
          clearTimeout(timeoutId);
          setMapStatus("error");
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mapMounted, placeMarker]);

  // Clean up map instance when dialog closes so it re-inits cleanly next time.
  // State reset is handled in handleOpenChange to avoid setState-in-effect.
  useEffect(() => {
    if (open) return;
    markerRef.current?.setMap(null);
    markerRef.current = null;
    mapInstanceRef.current = null;
    mapReadyRef.current = false;
  }, [open]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setSelected(null);
        setSearchInput("");
        setPredictions([]);
        setShowPredictions(false);
        setGeoError(null);
        setMapStatus("idle");
      }
      onOpenChange(next);
    },
    [onOpenChange]
  );

  const handleUseMyLocation = useCallback(async () => {
    setGeoError(null);
    setGeoLoading(true);
    try {
      const position = await getCurrentPosition();
      placeMarker(position.coords.latitude, position.coords.longitude);
    } catch {
      setGeoError(
        "Location access is required. Please enable location permissions and try again."
      );
    } finally {
      setGeoLoading(false);
    }
  }, [placeMarker]);

  // Debounced autocomplete search
  useEffect(() => {
    if (!searchInput || searchInput.trim().length < 1) return;
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await fetchPlaceAutocomplete(searchInput, {
          signal: controller.signal
        });
        setPredictions(results);
        setShowPredictions(true);
      } catch {
        // aborted or failed
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchInput]);

  const handleSelectPrediction = useCallback(
    async (prediction: PlacePrediction) => {
      setShowPredictions(false);
      setSearchInput(prediction.text);
      const location = await fetchPlaceLocation(prediction.placeId);
      if (location) placeMarker(location.latitude, location.longitude);
    },
    [placeMarker]
  );

  const handleConfirm = useCallback(() => {
    if (!selected) return;
    onConfirm(selected);
    handleOpenChange(false);
  }, [selected, onConfirm, handleOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pick location for weather</DialogTitle>
          <DialogDescription>
            Use your current device location, or search and pick a spot on the
            map.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Search box */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  if (!e.target.value.trim()) setPredictions([]);
                }}
                onFocus={() => predictions.length && setShowPredictions(true)}
                onBlur={() => setTimeout(() => setShowPredictions(false), 150)}
                placeholder="Search for a place…"
                className="pl-9"
              />
            </div>
            {showPredictions && predictions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-52 overflow-auto">
                {predictions.map((prediction) => (
                  <li key={prediction.placeId}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectPrediction(prediction)}
                      className="flex w-full items-start gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50"
                    >
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span>
                        <span className="font-medium">
                          {prediction.primaryText}
                        </span>{" "}
                        <span className="text-gray-500">
                          {prediction.secondaryText}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {showPredictions &&
              !searchLoading &&
              predictions.length === 0 &&
              searchInput.trim().length > 0 && (
                <p className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 shadow-lg">
                  No places found.
                </p>
              )}
          </div>

          {/* Map */}
          <div className="relative h-64 w-full rounded-md border border-gray-200">
            <div ref={setMapNode} className="h-full w-full rounded-md" />
            {mapStatus !== "ready" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-md bg-white/90 px-4 text-center text-xs text-gray-500">
                {!hasApiKey &&
                  "Map preview unavailable: Google Maps API key is not configured. You can still use your location or search below."}
                {hasApiKey && mapStatus === "error" && (
                  <>
                    <span>
                      Map preview failed to load. You can still use your
                      location or search below.
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        mapReadyRef.current = false;
                        setMapStatus("idle");
                        // Force effect re-run by toggling mapMounted.
                        setMapMounted(false);
                        requestAnimationFrame(() =>
                          setMapMounted(Boolean(mapNodeRef.current))
                        );
                      }}
                    >
                      Retry loading map
                    </Button>
                  </>
                )}
                {hasApiKey && mapStatus === "idle" && "Loading map…"}
              </div>
            )}
          </div>

          {/* Selected coordinates + geo button */}
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-gray-600">
              {selected ? (
                <span>
                  Selected: {selected.latitude.toFixed(4)},{" "}
                  {selected.longitude.toFixed(4)}
                </span>
              ) : (
                <span className="text-gray-400">
                  Click the map or use your location.
                </span>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseMyLocation}
              disabled={geoLoading}
            >
              {geoLoading ? "Locating…" : "Use my location"}
            </Button>
          </div>

          {geoError && <p className="text-xs text-red-600">{geoError}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!selected}>
            Apply weather
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
