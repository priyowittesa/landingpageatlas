import { env } from "./env";

const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const DETAILS_URL = "https://places.googleapis.com/v1/places";

export type PlacePrediction = {
  placeId: string;
  /** Full description text, e.g. "Bandung, West Java, Indonesia". */
  text: string;
  /** Main line, e.g. "Bandung". */
  primaryText: string;
  /** Secondary line, e.g. "West Java, Indonesia". */
  secondaryText: string;
};

export type AutocompleteOptions = {
  /** Places (New) type filters, e.g. ["country"], ["(cities)"]. */
  includedPrimaryTypes?: string[];
  /** ISO 3166-1 alpha-2 region codes to restrict results, e.g. ["id"]. */
  includedRegionCodes?: string[];
  signal?: AbortSignal;
};

type ApiSuggestion = {
  placePrediction?: {
    placeId: string;
    text?: { text?: string };
    structuredFormat?: {
      mainText?: { text?: string };
      secondaryText?: { text?: string };
    };
  };
};

/**
 * Calls the Places API (New) Autocomplete endpoint. This endpoint supports CORS,
 * so it can be called directly from the browser with the public Maps API key.
 */
export async function fetchPlaceAutocomplete(
  input: string,
  options: AutocompleteOptions = {},
): Promise<PlacePrediction[]> {
  const apiKey = env.googleMapsApiKey;
  if (!apiKey || input.trim().length < 1) return [];

  const body: Record<string, unknown> = { input };
  if (options.includedPrimaryTypes?.length) {
    body.includedPrimaryTypes = options.includedPrimaryTypes;
  }
  if (options.includedRegionCodes?.length) {
    body.includedRegionCodes = options.includedRegionCodes;
  }

  const response = await fetch(AUTOCOMPLETE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
    },
    body: JSON.stringify(body),
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`Places autocomplete failed: ${response.status}`);
  }

  const data = (await response.json()) as { suggestions?: ApiSuggestion[] };
  return (data.suggestions ?? [])
    .map((suggestion) => suggestion.placePrediction)
    .filter((prediction): prediction is NonNullable<typeof prediction> =>
      Boolean(prediction?.placeId),
    )
    .map((prediction) => ({
      placeId: prediction.placeId,
      text: prediction.text?.text ?? "",
      primaryText:
        prediction.structuredFormat?.mainText?.text ??
        prediction.text?.text ??
        "",
      secondaryText: prediction.structuredFormat?.secondaryText?.text ?? "",
    }));
}

/**
 * Resolves the ISO 3166-1 alpha-2 region code for a place (used to cascade the
 * country restriction down to state / city / site lookups).
 */
export async function fetchPlaceRegionCode(
  placeId: string,
): Promise<string | null> {
  const apiKey = env.googleMapsApiKey;
  if (!apiKey) return null;

  const response = await fetch(`${DETAILS_URL}/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "addressComponents",
    },
  });
  if (!response.ok) return null;

  const data = (await response.json()) as {
    addressComponents?: { shortText?: string; types?: string[] }[];
  };
  const country = data.addressComponents?.find((component) =>
    component.types?.includes("country"),
  );
  return country?.shortText?.toLowerCase() ?? null;
}

export type PlaceLocation = {
  latitude: number;
  longitude: number;
};

/**
 * Resolves the geographic coordinates (lat/lng) for a place using the
 * Places API (New) Details endpoint.
 */
export async function fetchPlaceLocation(
  placeId: string,
): Promise<PlaceLocation | null> {
  const apiKey = env.googleMapsApiKey;
  if (!apiKey) return null;

  const response = await fetch(`${DETAILS_URL}/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "location",
    },
  });
  if (!response.ok) return null;

  const data = (await response.json()) as {
    location?: { latitude?: number; longitude?: number };
  };
  if (
    typeof data.location?.latitude !== "number" ||
    typeof data.location?.longitude !== "number"
  ) {
    return null;
  }
  return {
    latitude: data.location.latitude,
    longitude: data.location.longitude,
  };
}
