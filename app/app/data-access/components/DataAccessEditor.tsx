"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuthMe } from "@/hooks/useAuthMe";
import type { PortalModule } from "../catalog";
import {
  applyConnectionDraft,
  connectionDraft,
  hasUnrepresentableSelections,
  parseConnectionKey,
  selectedConnectionKeys,
  type ConnectionDraft
} from "../connections";
import { useModuleConnections } from "../use-module-connections";
import { useModuleDetail } from "../use-module-detail";
import { useSubmodules } from "../use-submodules";
import { useUpdateModule } from "../use-update-module";
import { ModuleConnectionsPanel } from "./ModuleConnectionsPanel";
import { DesignIcon, ErrorState, LoadingState } from "./shared";

const LIST_HREF = "/app/data-access";
type Confirmation =
  | { action: "save"; moduleId: string }
  | { action: "discard"; href: string };

function EditForm({
  moduleId,
  detail,
  scope
}: {
  moduleId: string;
  detail: PortalModule;
  scope: string | null;
}) {
  const router = useRouter();
  const updateModule = useUpdateModule(moduleId, scope);
  const [description, setDescription] = useState(detail.description ?? "");
  const descriptionDirty = description !== (detail.description ?? "");
  const submodules = useSubmodules(moduleId, scope);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeSubmodule =
    !submodules.isLoading && !submodules.error
      ? (submodules.data?.find((item) => item.id === activeId) ??
        submodules.data?.[0])
      : undefined;
  const connectionModuleId = activeSubmodule?.id ?? "";
  const connections = useModuleConnections(connectionModuleId, scope);
  const [drafts, setDrafts] = useState<Record<string, ConnectionDraft>>({});
  const [confirmation, setConfirmation] = useState<Confirmation | null>(
    () => null
  );
  const saveInFlight = useRef(false);
  const [catalogOperations, setCatalogOperations] = useState(0);
  const saved = selectedConnectionKeys(connections.data ?? []);
  const draft = drafts[connectionModuleId] ?? { additions: [], removals: [] };
  const selected = applyConnectionDraft(saved, draft);
  const pending = connectionDraft(saved, selected);
  const connectionDirty =
    pending.additions.length > 0 || pending.removals.length > 0;
  const clearDraft = () =>
    setDrafts((current) => ({
      ...current,
      [connectionModuleId]: { additions: [], removals: [] }
    }));
  const blocked =
    pending.additions.length > 0 &&
    Boolean(connections.data && hasUnrepresentableSelections(connections.data));
  const saving = updateModule.isPending || connections.save.isPending;
  const invalidConnections =
    connectionDirty &&
    (!activeSubmodule ||
      !connections.data ||
      Boolean(connections.error) ||
      blocked);
  const canSave =
    (descriptionDirty || connectionDirty) &&
    !invalidConnections &&
    !saving &&
    catalogOperations === 0;
  const hasUnsaved =
    descriptionDirty ||
    Object.values(drafts).some(
      (item) => item.additions.length > 0 || item.removals.length > 0
    );
  const returnHref = detail.parent_id
    ? `/app/data-access/${encodeURIComponent(detail.parent_id)}/edit`
    : LIST_HREF;

  const requestNavigation = (href: string) => {
    if (saving || catalogOperations > 0) return;
    if (hasUnsaved) setConfirmation({ action: "discard", href });
    else router.push(href);
  };

  const executeSave = async (confirmedExisting: boolean) => {
    if (!canSave || saveInFlight.current) return;
    saveInFlight.current = true;
    try {
      if (connectionDirty) {
        await connections.save.mutateAsync({ ...pending, confirmedExisting });
        clearDraft();
      }
      if (descriptionDirty) await updateModule.mutateAsync(description);
    } catch {
      // Each mutation exposes its error below and leaves unsaved edits intact.
    } finally {
      saveInFlight.current = false;
      setConfirmation(null);
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    if (
      pending.removals.length > 0 ||
      (pending.additions.length > 0 && saved.length > 0)
    ) {
      setConfirmation({ action: "save", moduleId: connectionModuleId });
    } else {
      void executeSave(false);
    }
  };

  return (
    <form onSubmit={submit} className="min-w-0 space-y-4">
      <div className="mb-6 flex items-start gap-1">
        <Link
          href={returnHref}
          onClick={(event) => {
            if (saving || catalogOperations > 0 || hasUnsaved) {
              event.preventDefault();
              requestNavigation(returnHref);
            }
          }}
          aria-label={
            detail.parent_id ? "Back to parent module" : "Back to Data Access"
          }
          className="mt-2 rounded p-1 hover:bg-gray-100"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold leading-8">Edit Module</h1>
          <p className="mt-1 text-sm text-gray-500">
            Choose which databases and tables {detail.name} reads its data from.
          </p>
        </div>
      </div>
      <section className="rounded-xl border bg-white p-4 sm:p-6">
        <div className="flex items-center gap-2 border-b pb-4">
          <DesignIcon name="module-setting" small />
          <div>
            <h2 className="text-xl font-semibold">Module Setting</h2>
            <p className="text-sm text-gray-500">
              Module name is read-only. You can update its description.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2 md:gap-6">
          <div className="space-y-1">
            <label htmlFor="module-name" className="text-sm font-medium">
              Module Name
            </label>
            <Input
              id="module-name"
              value={detail.name}
              readOnly
              className="bg-gray-50 text-gray-500"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="module-description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="module-description"
              className="min-h-[74px] resize-y"
              disabled={saving}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="No description provided"
            />
          </div>
        </div>
      </section>
      <fieldset disabled={saving}>
        <ModuleConnectionsPanel
          items={connections.data}
          error={connections.error}
          isLoading={connections.isLoading}
          selected={selected}
          scope={scope}
          onChange={(update) =>
            setDrafts((current) => ({
              ...current,
              [connectionModuleId]: connectionDraft(
                saved,
                update(
                  applyConnectionDraft(
                    saved,
                    current[connectionModuleId] ?? {
                      additions: [],
                      removals: []
                    }
                  )
                )
              )
            }))
          }
          retry={() => void connections.refetch()}
          submodules={submodules.data}
          submodulesError={submodules.error}
          submodulesLoading={submodules.isLoading}
          retrySubmodules={() => void submodules.refetch()}
          activeSubmodule={activeSubmodule}
          selectionDisabled={saving || catalogOperations > 0}
          onSelectSubmodule={(id) => {
            if (saving || catalogOperations > 0 || id === connectionModuleId)
              return;
            connections.save.reset();
            setActiveId(id);
          }}
          onCatalogBusyChange={(delta) =>
            setCatalogOperations((current) => current + delta)
          }
        />
      </fieldset>
      {catalogOperations > 0 && (
        <p role="status" className="text-sm text-gray-500">
          Loading tables for schema selection...
        </p>
      )}
      {updateModule.isError && (
        <p role="alert" className="text-sm text-red-600">
          {updateModule.error?.message ??
            "Unable to save the module description."}
        </p>
      )}
      {blocked && (
        <p role="alert" className="text-sm text-amber-700">
          A selected database has no selected tables. Saving is unavailable
          because its existing selection cannot be preserved.
        </p>
      )}
      {connections.save.isError && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 text-sm text-red-600"
        >
          <span>
            {connections.save.error?.message ?? "Unable to save changes."}
          </span>
          <button type="button" onClick={clearDraft} className="underline">
            Clear pending changes
          </button>
        </div>
      )}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => requestNavigation(returnHref)}
          disabled={saving || catalogOperations > 0}
        >
          Discard
        </Button>
        <Button type="submit" disabled={!canSave}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
      <ConfirmationModal
        open={confirmation !== null}
        role="alertdialog"
        isLoading={saving}
        onOpenChange={(open) => {
          if (!open && !saving) setConfirmation(null);
        }}
        variant={
          confirmation?.action === "discard" || pending.removals.length > 0
            ? "delete"
            : "submit"
        }
        title={
          confirmation?.action === "discard"
            ? "Discard unsaved changes?"
            : "Save connection changes?"
        }
        confirmLabel={
          confirmation?.action === "discard"
            ? "Discard Changes"
            : "Save Changes"
        }
        description={
          confirmation?.action === "discard" ? (
            "Your unsaved description and table selections will be discarded."
          ) : (
            <>
              <span className="block">
                Save changes for {activeSubmodule?.name}?
              </span>
              {pending.removals.length > 0 && (
                <span className="mt-2 block">
                  Remove access to {pending.removals.length} table
                  {pending.removals.length === 1 ? "" : "s"}:
                  <span className="mt-2 block max-h-40 overflow-y-auto text-left">
                    {pending.removals.map((key) => {
                      const item = parseConnectionKey(key);
                      return (
                        <span key={key} className="block break-all">
                          {item.database_name}.{item.schema_name}.
                          {item.table_name}
                        </span>
                      );
                    })}
                  </span>
                </span>
              )}
              {pending.additions.length > 0 && saved.length > 0 && (
                <span className="mt-2 block">
                  Additions include current selections to preserve them. If the
                  API appends instead of replacing connections, this may create
                  duplicates.
                </span>
              )}
            </>
          )
        }
        onConfirm={() => {
          if (confirmation?.action === "discard") {
            router.push(confirmation.href);
            setConfirmation(null);
          } else if (confirmation?.action === "save") {
            if (confirmation.moduleId === connectionModuleId)
              void executeSave(true);
            else setConfirmation(null);
          }
        }}
      />
    </form>
  );
}

export function DataAccessEditor({ moduleId }: { moduleId: string }) {
  const me = useAuthMe();
  const scope = me.data?.user_id
    ? `${me.data.tenant_id ?? "personal"}:${me.data.user_id}`
    : null;
  const detail = useModuleDetail(moduleId, scope);
  if (me.isLoading) return <LoadingState />;
  if (me.error || !scope) return <ErrorState retry={() => void me.refetch()} />;
  if (detail.isLoading) return <LoadingState />;
  if (detail.error || !detail.data)
    return <ErrorState retry={() => void detail.refetch()} />;
  return (
    <EditForm
      key={`${scope}:${moduleId}`}
      moduleId={moduleId}
      detail={detail.data}
      scope={scope}
    />
  );
}
