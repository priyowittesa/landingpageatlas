"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { findOpenMatch, useActionsStore, type EpiAction, type NewEpiAction } from "../store/actions-store";
import { HERO_PROJECT_PATH } from "../navigation";
import type { SignalModule } from "../operations/signals";

/** What the sidebar needs to know about a signal: where it belongs and how its action is tracked. */
export type SignalRef = { module: SignalModule; action: Pick<NewEpiAction, "source" | "projectId" | "issue"> };

/** Sidebar screen -> the signals module whose open items it shows. */
const HREF_MODULE: Record<string, SignalModule> = {
  "/ptepi/portfolio": "portfolio",
  [HERO_PROJECT_PATH]: "cockpit",
  [`${HERO_PROJECT_PATH}/evidence`]: "evidence",
  "/ptepi/commercial": "commercial",
  "/ptepi/cost": "cost",
  "/ptepi/service-contracts": "service"
};

/** Operations Intelligence shows every open signal. */
const ALL_SIGNALS_HREF = "/ptepi/actions";

type AlertsApi = { countFor: (href: string | undefined) => number };

const ModuleAlertsContext = createContext<AlertsApi>({ countFor: () => 0 });

/**
 * Counts of new items per sidebar screen: the signals nobody has acted on yet. The seeded
 * actions load here too, so a signal about a tracked exception does not count as new.
 */
export function ModuleAlertsProvider({ refs, seeds, children }: { refs: SignalRef[]; seeds: EpiAction[]; children: ReactNode }) {
  const actions = useActionsStore((state) => state.actions);
  const seed = useActionsStore((state) => state.seed);
  useEffect(() => seed(seeds), [seed, seeds]);

  const api = useMemo<AlertsApi>(() => {
    const open = refs.filter((ref) => findOpenMatch(actions, ref.action) === undefined);
    return {
      countFor: (href) => {
        if (!href) return 0;
        if (href === ALL_SIGNALS_HREF) return open.length;
        const target = HREF_MODULE[href];
        return target ? open.filter((ref) => ref.module === target).length : 0;
      }
    };
  }, [refs, actions]);

  return <ModuleAlertsContext.Provider value={api}>{children}</ModuleAlertsContext.Provider>;
}

/** New items of one sidebar screen. */
export function useModuleAlert(href: string | undefined): number {
  return useContext(ModuleAlertsContext).countFor(href);
}

/** New items across several screens, for a group that is collapsed. */
export function useModuleAlertTotal(hrefs: string[]): number {
  const api = useContext(ModuleAlertsContext);
  return hrefs.reduce((sum, href) => sum + api.countFor(href), 0);
}
