"use client";

import { useState } from "react";
import { ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TriageAsset } from "../lib/types";

function PickForm({
  assets,
  onCancel,
  onPick,
}: {
  assets: [string, TriageAsset][];
  onCancel: () => void;
  onPick: (assetId: string) => void;
}) {
  const [assetId, setAssetId] = useState("");
  const [error, setError] = useState(false);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Correct asset attributes</DialogTitle>
        <DialogDescription>Choose the asset whose criticality or bottleneck you want to correct</DialogDescription>
      </DialogHeader>
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Asset <span className="text-red-600">*</span>
        </label>
        <Select
          value={assetId}
          onValueChange={(value) => {
            setAssetId(value);
            setError(false);
          }}
        >
          <SelectTrigger className="w-full" aria-label="Asset" aria-invalid={error}>
            <SelectValue placeholder="Choose an asset" />
          </SelectTrigger>
          <SelectContent>
            {assets.map(([id, asset]) => (
              <SelectItem key={id} value={id}>
                {asset.name} · {id} ·{" "}
                {asset.source === "manual" ? "manual" : `LLM ${Math.round((asset.confidence ?? 0) * 100)}%`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && <p className="mt-1.5 text-xs text-red-600">Choose an asset first.</p>}
        <p className="mt-3 flex items-start gap-1.5 text-xs text-gray-500">
          <Info className="mt-px h-3.5 w-3.5 shrink-0" />
          Attributes sourced from Fabrix are changed in Fabrix, not in Atlas.
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => (assetId ? onPick(assetId) : setError(true))}>
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </DialogFooter>
    </>
  );
}

export function AttributePickDialog({
  open,
  assets,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  /** Assets that can be corrected in Atlas (not sourced from Fabrix). */
  assets: [string, TriageAsset][];
  onOpenChange: (open: boolean) => void;
  onPick: (assetId: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        {open && <PickForm assets={assets} onCancel={() => onOpenChange(false)} onPick={onPick} />}
      </DialogContent>
    </Dialog>
  );
}
