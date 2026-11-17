"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { FormModal } from "./FormModal";
import { Spinner } from "@/components/ui/spinner";
import type { ProjectActivityItem } from "@/types/type-daily-diaries";
import type { ActivityEntry, SelectedEmployee } from "./dailyDiaryFormSchema";
import { useCreateProjectActivity } from "../../hooks/useDailyDiaries";

export function ActivityModal({
  selected,
  onSave,
  onClose,
  activities,
  isLoading,
  projectId
}: {
  selected: SelectedEmployee[];
  onSave: (activities: ActivityEntry[]) => void;
  onClose: () => void;
  activities?: ProjectActivityItem[];
  isLoading?: boolean;
  projectId?: string;
}) {
  const [query, setQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newActivityName, setNewActivityName] = useState("");
  const [newActivityDescription, setNewActivityDescription] = useState("");
  const [selectedActivities, setSelectedActivities] = useState<ActivityEntry[]>(
    () => selected[0]?.activities ?? []
  );

  const createActivity = useCreateProjectActivity();

  function handleCreateActivity() {
    if (!projectId) return;
    const name = newActivityName.trim();
    if (!name) return;

    createActivity.mutate(
      {
        description: newActivityDescription.trim(),
        name,
        project_id: projectId
      },
      {
        onSuccess: (created) => {
          setSelectedActivities((current) => [
            ...current,
            {
              id: created.id,
              name: created.name,
              desc: created.description || "",
              hours:
                selected[0]?.activities.find((item) => item.id === created.id)
                  ?.hours ?? 0
            }
          ]);
          setNewActivityName("");
          setNewActivityDescription("");
          setIsCreating(false);
        }
      }
    );
  }

  function closeCreateForm() {
    setNewActivityName("");
    setNewActivityDescription("");
    setIsCreating(false);
  }

  const filtered = activities?.filter((activity) =>
    activity.name?.toLowerCase().includes(query.toLowerCase())
  );

  function toggle(activity: ActivityEntry) {
    setSelectedActivities((current) =>
      current.some((item) => item.id === activity.id)
        ? current.filter((item) => item.id !== activity.id)
        : [...current, activity]
    );
  }

  function isChecked(activityId: string) {
    return selectedActivities.some((activity) => activity.id === activityId);
  }

  function handleSave() {
    onSave(selectedActivities);
    onClose();
  }

  return (
    <FormModal title="Add Activity" onClose={onClose}>
      <label className="relative block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search..."
          className="h-10 w-full rounded-md border border-gray-200 pl-9 pr-3 text-xs"
        />
      </label>

      {isCreating ? (
        <div className="mt-3 rounded-xl bg-primary-50 p-3">
          <label className="block text-sm font-medium text-gray-900">
            Activity Name
            <input
              value={newActivityName}
              onChange={(event) => setNewActivityName(event.target.value)}
              placeholder="Activity Name"
              className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-gray-900">
            Activity Description
            <input
              value={newActivityDescription}
              onChange={(event) =>
                setNewActivityDescription(event.target.value)
              }
              placeholder="Activity Description"
              className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={closeCreateForm}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateActivity}
              disabled={
                createActivity.isPending ||
                !projectId ||
                !newActivityName.trim()
              }
              className="rounded-lg bg-primary-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createActivity.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="mt-3 flex items-center gap-1.5 text-sm font-medium text-black hover:underline"
        >
          <Plus className="size-4" />
          Create New Activity
        </button>
      )}

      <div className="mt-3 space-y-3 max-h-90 overflow-y-scroll">
        {isLoading ? (
          <div className="flex items-center justify-center h-50">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : !activities || activities.length === 0 ? (
          <p className="h-50 flex items-center justify-center text-sm text-gray-500">
            No activity data
          </p>
        ) : (
          filtered?.map((activity) => (
            <label
              key={activity.id}
              className="flex items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                checked={isChecked(activity.id)}
                onChange={() =>
                  toggle({
                    id: activity.id,
                    name: activity.name,
                    desc: activity.description || "",
                    hours:
                      selected[0]?.activities.find(
                        (item) => item.id === activity.id
                      )?.hours ?? 0
                  })
                }
              />
              {activity.name}
            </label>
          ))
        )}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-3 py-2 text-xs">
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-md bg-primary-700 px-3 py-2 text-xs text-white"
        >
          Add +
        </button>
      </div>
    </FormModal>
  );
}
