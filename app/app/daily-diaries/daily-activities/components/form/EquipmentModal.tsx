"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useParams } from "next/navigation";
import { FormModal } from "./FormModal";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEquipmentList } from "@/app/app/master-data/equipment/use-equipment";
import type { EquipmentItem } from "@/app/app/master-data/equipment/types";
import type { EquipmentEntry } from "./dailyDiaryFormSchema";

function equipmentLabel(item: EquipmentItem) {
  return item.model || item.name || item.code || "Unnamed equipment";
}

export function EquipmentModal({
  selected,
  onSave,
  onClose
}: {
  selected: EquipmentEntry[];
  onSave: (equipments: EquipmentEntry[]) => void;
  onClose: () => void;
}) {
  const params = useParams();

  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<string[]>(
    selected.map((equipment) => equipment.id)
  );

  const { data, isLoading } = useEquipmentList({
    project_id: params.projectId as string
  });
  const equipments = data?.items;

  const filtered = useMemo(
    () =>
      equipments?.filter((item) =>
        equipmentLabel(item).toLowerCase().includes(query.toLowerCase())
      ),
    [equipments, query]
  );

  function toggle(equipmentId: string) {
    setChosen((current) =>
      current.includes(equipmentId)
        ? current.filter((id) => id !== equipmentId)
        : [...current, equipmentId]
    );
  }

  function handleSave() {
    if (!equipments) return;

    const result: EquipmentEntry[] = equipments
      .filter((item) => chosen.includes(String(item.id)))
      .map((item) => {
        const previous = selected.find(
          (equipment) => equipment.id === String(item.id)
        );

        return {
          id: String(item.id),
          model: equipmentLabel(item),
          workType: previous?.workType ?? "",
          usedHours: previous?.usedHours ?? 0
        };
      });

    onSave(result);
    onClose();
  }

  return (
    <FormModal
      title="Add Equipment"
      description="Search and select equipment to add"
      onClose={onClose}
    >
      <label className="relative block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Equipment"
          className="h-10 w-full rounded-md border border-gray-200 pl-9 pr-3 text-xs outline-none focus:border-primary-400"
        />
      </label>

      <div className="mt-3 max-h-90 space-y-2 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-50 items-center justify-center">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : !equipments || equipments.length === 0 ? (
          <p className="flex h-50 items-center justify-center text-sm text-gray-500">
            No equipment data
          </p>
        ) : (
          filtered?.map((item) => {
            const isChosen = chosen.includes(String(item.id));

            return (
              <label
                key={item.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm",
                  isChosen
                    ? "border-primary-300 bg-primary-50/30"
                    : "border-gray-200"
                )}
              >
                <Input
                  type="checkbox"
                  checked={isChosen}
                  onChange={() => toggle(String(item.id))}
                  className="size-4 shrink-0 rounded border-gray-300 p-0 accent-primary-600"
                />

                <span className="min-w-0 flex-1">
                  <strong className="block truncate">
                    {equipmentLabel(item)}
                  </strong>
                  <span className="block text-gray-500">
                    {item.code || "-"}
                  </span>
                </span>
              </label>
            );
          })
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="px-3 py-2 text-xs"
        >
          Cancel
        </Button>

        <Button
          type="button"
          onClick={handleSave}
          disabled={chosen.length === 0}
          className="rounded-md bg-primary-700 px-3 py-2 text-xs text-white"
        >
          Add +
        </Button>
      </div>
    </FormModal>
  );
}
