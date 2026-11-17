"use client";

import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useUrlState } from "@/hooks/useUrlState";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import type { ScoringConfig } from "../lib/types";
import { LoadState } from "../components/cursor-pager";
import { DEFAULT_CONFIG } from "./config-utils";
import {
  useActivateScoringDraft,
  useActiveScoringConfiguration,
  useCreateScoringDraft,
  useDeleteScoringDraft,
  useRollbackScoringConfiguration,
  useScoringConfiguration,
  useScoringConfigurations,
  useUpdateScoringDraft,
  type ScoringConfigurationVersion,
} from "./use-scoring-configurations";
import { VersionDetail } from "./version-detail";
import { VersionList } from "./version-list";

interface ConfirmRequest {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  variant: "delete" | "submit";
  onConfirm: () => void;
}

export interface VersionActions {
  open: (id: string) => void;
  back: () => void;
  newVersion: () => void;
  duplicate: (version: ScoringConfigurationVersion) => void;
  deleteDraft: (draft: ScoringConfigurationVersion) => void;
  /** Rolls back to an archived version: the API copies it into a new active version. */
  activate: (version: ScoringConfigurationVersion) => void;
  /** Saves `config` into the draft when it changed, then makes the draft the active version. */
  publish: (draft: ScoringConfigurationVersion, config: ScoringConfig, dirty: boolean) => void;
  busy: boolean;
}

const URL_DEFAULTS = { id: "" };
const DRAFT_FILTER = { status: "draft" as const, page_size: 1 };

export function ScoringConfiguration() {
  const setBreadcrumbs = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const { values, set } = useUrlState(URL_DEFAULTS);
  const active = useActiveScoringConfiguration();
  // A tenant has at most one draft; it backs the "Continue draft" button and blocks rollbacks.
  const draftQuery = useScoringConfigurations(DRAFT_FILTER);
  const draft = draftQuery.data?.items[0] ?? null;
  const selected = useScoringConfiguration(values.id || undefined);
  const create = useCreateScoringDraft();
  const update = useUpdateScoringDraft();
  const remove = useDeleteScoringDraft();
  const activateDraft = useActivateScoringDraft();
  const rollback = useRollbackScoringConfiguration();
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  useEffect(() => {
    setBreadcrumbs([{ title: "Asset Management" }, { title: "Breakdown Triage" }, { title: "Scoring & Thresholds" }]);
    return clearBreadcrumbs;
  }, [setBreadcrumbs, clearBreadcrumbs]);

  const busy = create.isPending || update.isPending || remove.isPending || activateDraft.isPending || rollback.isPending;
  const openDraftFirst = () => {
    if (!draft) return false;
    toast.info(`Finish or delete draft v${draft.version} first`);
    actions.open(draft.id);
    return true;
  };

  const actions: VersionActions = {
    busy,
    open: (id) => {
      set("id", id);
      window.scrollTo(0, 0);
    },
    back: () => set("id", ""),
    newVersion: () => {
      if (draft) return actions.open(draft.id);
      // Without values the API copies the active version; the first version starts from the defaults.
      create.mutate(active.data ? {} : { config: DEFAULT_CONFIG }, {
        onSuccess: (created) => {
          toast.success(active.data ? `Draft created from active v${active.data.version}` : "Draft created");
          if (created) actions.open(created.id);
        },
      });
    },
    duplicate: (source) => {
      if (openDraftFirst()) return;
      create.mutate({ config: source.config }, {
        onSuccess: (created) => {
          toast.success(`Draft created from v${source.version}`);
          if (created) actions.open(created.id);
        },
      });
    },
    deleteDraft: (target) =>
      setConfirm({
        title: `Delete draft v${target.version}?`,
        description: "The draft and its changes are removed. The active version is not affected.",
        confirmLabel: "Delete draft",
        variant: "delete",
        onConfirm: () =>
          remove.mutate(target.id, {
            onSuccess: () => {
              actions.back();
              toast.success(`Draft v${target.version} deleted`);
            },
          }),
      }),
    activate: (source) => {
      if (openDraftFirst()) return;
      setConfirm({
        title: `Activate v${source.version}?`,
        description: `The v${source.version} settings are copied into a new version that becomes active right away. Subsequent triage uses them immediately, and the change is recorded in the audit log.`,
        confirmLabel: `Activate v${source.version}`,
        variant: "submit",
        onConfirm: () =>
          rollback.mutate(source.version, {
            onSuccess: (created) => {
              toast.success(created ? `v${created.version} (v${source.version} settings) is live.` : `v${source.version} settings are live.`);
              if (created) actions.open(created.id);
            },
          }),
      });
    },
    publish: (target, config, dirty) =>
      setConfirm({
        title: `Activate v${target.version}?`,
        description: active.data
          ? `Version v${target.version} replaces v${active.data.version} as the active version for all subsequent triage. v${active.data.version} is archived and can be activated again.`
          : `Version v${target.version} becomes the active version for all subsequent triage.`,
        confirmLabel: `Activate v${target.version}`,
        variant: "submit",
        onConfirm: async () => {
          try {
            if (dirty) await update.mutateAsync({ id: target.id, config });
            await activateDraft.mutateAsync(target.id);
            toast.success(`v${target.version} is live. Subsequent triage uses this version.`);
          } catch {
            // The failed request already shows its error toast.
          }
        },
      }),
  };

  let content: ReactNode;
  if (!values.id) content = <VersionList actions={actions} active={active} draft={draft} />;
  else if (!selected.data) content = <LoadState error={selected.isError} onRetry={() => selected.refetch()} />;
  else content = <VersionDetail key={selected.data.id} version={selected.data} active={active.data ?? null} actions={actions} />;

  return (
    <div className="space-y-5 pb-8">
      {content}
      <ConfirmationModal
        open={Boolean(confirm)}
        onOpenChange={(open) => !open && setConfirm(null)}
        variant={confirm?.variant}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        onConfirm={() => {
          confirm?.onConfirm();
          setConfirm(null);
        }}
      />
    </div>
  );
}
