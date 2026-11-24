import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { epiData } from "../data";
import {
  ACTIONS_STORAGE_KEY,
  safeStorage,
  useActionsStore,
  type NewEpiAction
} from "./actions-store";
import {
  buildSeedActions,
  filterActions,
  getActionSummary,
  getProjectOptions,
  getSourceOptions,
  isOverdue,
  sortActions,
  sourceScreen
} from "./action-helpers";
import { DEMO_ROLES, OWNER_ROLES, canPerform, getDemoRole, isRelevantTo } from "./roles";

const seeds = buildSeedActions(epiData);
const none = { search: "", project: "all", owner: "all", status: "all", source: "all" };

describe("seeded actions", () => {
  it("builds one action per detected seeded exception, ids EXC-01 to EXC-12", () => {
    expect(seeds).toHaveLength(12);
    expect(seeds.map((s) => s.id)).toEqual(
      Array.from({ length: 12 }, (_, i) => `EXC-${String(i + 1).padStart(2, "0")}`)
    );
    expect(seeds.every((s) => s.status === "open")).toBe(true);
    expect(new Set(seeds.map((s) => s.source)).size).toBe(12);
  });

  it("uses org-chart owner roles, English titles and the autonomy ladder", () => {
    for (const seed of seeds) {
      expect(OWNER_ROLES as readonly string[]).toContain(seed.ownerRole);
      expect(seed.title.startsWith("Resolve: ")).toBe(true);
      expect(["L0", "L1", "L2"]).toContain(seed.autonomy);
    }
    const first = seeds[0];
    expect(first).toMatchObject({
      projectId: "PNP126",
      ownerRole: "ASM Teknik",
      dueDate: "2026-11-15",
      source: "Project cockpit: exception #1",
      autonomy: "L1"
    });
    expect(first?.title).toBe("Resolve: Plan vs actual deviation of more than 10 points");
  });

  it("gives billing exceptions to Finance at L2 and watch projects 14 days", () => {
    const billing = seeds.filter((s) => s.ownerRole === "Finance");
    expect(billing.map((s) => s.id)).toEqual(["EXC-04", "EXC-07", "EXC-08", "EXC-10"]);
    expect(billing.every((s) => s.autonomy === "L2")).toBe(true);
    expect(seeds.find((s) => s.id === "EXC-07")?.dueDate).toBe("2026-11-22");
  });

  it("covers the exceptions of the projects in the data", () => {
    expect(getProjectOptions(seeds)).toEqual(["IKT0126", "PNP126", "PSL0126", "PSL0326", "PSL0426", "PTP1025", "PTP1125", "TPK125"]);
    expect(getSourceOptions(seeds)).toEqual([
      "Commercial and billing",
      "Evidence gate",
      "Portfolio health",
      "Procurement and cost",
      "Project cockpit",
      "Service contracts"
    ]);
  });
});

describe("action list helpers", () => {
  it("reads the screen code from the source", () => {
    expect(sourceScreen("Evidence gate: PNP126 stage 2")).toBe("Evidence gate");
    expect(sourceScreen("S4 Evidence gate: PNP126 stage 2")).toBe("Evidence gate");
    expect(sourceScreen("Nexa Intelligence: x")).toBe("Nexa Intelligence");
    expect(sourceScreen("manual")).toBe("Other");
  });

  it("flags overdue actions only while unfinished", () => {
    expect(isOverdue({ dueDate: "2026-11-01", status: "open" }, "2026-11-08")).toBe(true);
    expect(isOverdue({ dueDate: "2026-11-01", status: "done" }, "2026-11-08")).toBe(false);
    expect(isOverdue({ dueDate: "2026-11-08", status: "open" }, "2026-11-08")).toBe(false);
  });

  it("filters by project, owner, status, source and search", () => {
    expect(filterActions(seeds, { ...none, project: "IKT0126" })).toHaveLength(2);
    expect(filterActions(seeds, { ...none, owner: "Finance" })).toHaveLength(4);
    expect(filterActions(seeds, { ...none, status: "done" })).toHaveLength(0);
    expect(filterActions(seeds, { ...none, source: "Commercial and billing" })).toHaveLength(4);
    expect(filterActions(seeds, { ...none, search: "retensi" })).toHaveLength(1);
    expect(filterActions(seeds, { ...none, search: "exc-12" })).toHaveLength(1);
  });

  it("sorts unfinished first, then by due date", () => {
    const sorted = sortActions([
      { ...seeds[0]!, id: "A", status: "done", dueDate: "2026-01-01" },
      { ...seeds[0]!, id: "B", status: "open", dueDate: "2026-12-01" },
      { ...seeds[0]!, id: "C", status: "in-progress", dueDate: "2026-02-01" },
      { ...seeds[0]!, id: "D", status: "open", dueDate: "2026-03-01" }
    ]);
    expect(sorted.map((a) => a.id)).toEqual(["D", "B", "C", "A"]);
  });

  it("summarises the list", () => {
    const list = [
      { ...seeds[0]!, status: "open" as const, dueDate: "2026-11-01" },
      { ...seeds[1]!, status: "in-progress" as const },
      { ...seeds[2]!, status: "done" as const, dueDate: "2026-11-01" }
    ];
    expect(getActionSummary(list, "2026-11-08")).toEqual({
      total: 3,
      open: 1,
      inProgress: 1,
      done: 1,
      overdue: 1
    });
  });
});

const sample: NewEpiAction = {
  title: "Get PO Vendor (Confirmation Order) signed: Power Transformer (PNP126)",
  projectId: "PNP126",
  ownerRole: "Project Manager",
  dueDate: "2026-11-15",
  source: "Evidence gate: PNP126 stage 2",
  autonomy: "L1"
};

describe("actions store: seed, assign, close", () => {
  beforeEach(() => useActionsStore.getState().reset());

  it("seeds once and keeps actions created before", () => {
    const created = useActionsStore.getState().addAction(sample);
    useActionsStore.getState().seed(seeds);
    useActionsStore.getState().seed(seeds);
    const { actions, seeded } = useActionsStore.getState();
    expect(seeded).toBe(true);
    expect(actions).toHaveLength(13);
    expect(actions[0]?.id).toBe(created.id);
  });

  it("does not seed an action whose source already exists", () => {
    useActionsStore.getState().addAction({ ...sample, source: seeds[0]!.source });
    useActionsStore.getState().seed(seeds);
    expect(useActionsStore.getState().actions).toHaveLength(12);
  });

  it("keeps ids unique when S4 or S7 create actions before and after seeding", () => {
    useActionsStore.getState().addAction(sample);
    useActionsStore.getState().seed(seeds);
    const later = useActionsStore.getState().addAction({ ...sample, source: "Nexa Intelligence: x" });
    const ids = useActionsStore.getState().actions.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(later.id).toBe("ACT-002");
  });

  it("assigns an action to another owner role", () => {
    useActionsStore.getState().seed(seeds);
    useActionsStore.getState().assignAction("EXC-01", "SM Operasi dan Teknik");
    expect(useActionsStore.getState().actions.find((a) => a.id === "EXC-01")?.ownerRole).toBe(
      "SM Operasi dan Teknik"
    );
  });

  it("moves an action through in progress to done, then reopens it", () => {
    useActionsStore.getState().seed(seeds);
    const status = () => useActionsStore.getState().actions.find((a) => a.id === "EXC-02")?.status;
    useActionsStore.getState().setStatus("EXC-02", "in-progress");
    expect(status()).toBe("in-progress");
    useActionsStore.getState().setStatus("EXC-02", "done");
    expect(status()).toBe("done");
    useActionsStore.getState().setStatus("EXC-02", "open");
    expect(status()).toBe("open");
  });

  it("reset clears the seed flag", () => {
    useActionsStore.getState().seed(seeds);
    useActionsStore.getState().reset();
    expect(useActionsStore.getState()).toMatchObject({ actions: [], seeded: false, nextNumber: 1 });
  });
});

describe("actions store: optional localStorage", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");

  afterEach(() => {
    if (original) Object.defineProperty(globalThis, "window", original);
    else Reflect.deleteProperty(globalThis, "window");
  });

  it("never throws when storage is missing (server, node)", () => {
    expect(() => safeStorage.setItem("k", "v")).not.toThrow();
    expect(safeStorage.getItem("k")).toBeNull();
    expect(() => safeStorage.removeItem("k")).not.toThrow();
  });

  it("never throws when storage is blocked", () => {
    const blocked = () => {
      throw new Error("blocked");
    };
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { localStorage: { getItem: blocked, setItem: blocked, removeItem: blocked } }
    });
    expect(() => safeStorage.setItem("k", "v")).not.toThrow();
    expect(safeStorage.getItem("k")).toBeNull();
    useActionsStore.getState().reset();
    expect(() => useActionsStore.getState().addAction(sample)).not.toThrow();
  });

  it("writes actions to storage when it works, and rehydrates them", async () => {
    const memory = new Map<string, string>();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: (key: string) => memory.get(key) ?? null,
          setItem: (key: string, value: string) => void memory.set(key, value),
          removeItem: (key: string) => void memory.delete(key)
        }
      }
    });
    useActionsStore.getState().reset();
    useActionsStore.getState().addAction(sample);
    const raw = memory.get(ACTIONS_STORAGE_KEY) ?? "{}";
    const stored = JSON.parse(raw) as {
      state: { actions: unknown[]; nextNumber: number };
    };
    expect(stored.state.actions).toHaveLength(1);
    expect(stored.state.nextNumber).toBe(2);

    // setState writes through to storage too, so put the saved copy back first.
    useActionsStore.setState({ actions: [], nextNumber: 1 });
    memory.set(ACTIONS_STORAGE_KEY, raw);
    await useActionsStore.persist.rehydrate();
    expect(useActionsStore.getState().actions).toHaveLength(1);
    useActionsStore.getState().reset();
  });
});

describe("demo roles", () => {
  const pm = getDemoRole("pm");
  const em = getDemoRole("engineering-manager");
  const finance = getDemoRole("finance");
  const director = getDemoRole("director");
  const financeAction = seeds.find((s) => s.ownerRole === "Finance")!;
  const pmAction = seeds.find((s) => s.ownerRole === "Project Manager")!;
  const emAction = seeds.find((s) => s.ownerRole === "ASM Teknik")!;

  it("offers the four roles of the demo", () => {
    expect(DEMO_ROLES.map((r) => r.label)).toEqual([
      "Project Manager",
      "Engineering Manager",
      "Finance",
      "Director (SM Operasi dan Teknik)"
    ]);
  });

  it("highlights the actions owned by the role", () => {
    expect(isRelevantTo(pm, pmAction)).toBe(true);
    expect(isRelevantTo(pm, financeAction)).toBe(false);
    expect(isRelevantTo(finance, financeAction)).toBe(true);
    expect(isRelevantTo(em, emAction)).toBe(true);
    expect(isRelevantTo(director, seeds.find((s) => s.ownerRole === "SM Operasi dan Teknik")!)).toBe(true);
  });

  it("lets a Project Manager create and work own actions, but not assign or close", () => {
    expect(canPerform(pm, "create")).toBe(true);
    expect(canPerform(pm, "status", pmAction)).toBe(true);
    expect(canPerform(pm, "status", financeAction)).toBe(false);
    expect(canPerform(pm, "assign")).toBe(false);
    expect(canPerform(pm, "close", pmAction)).toBe(false);
  });

  it("lets Finance work and close only its own actions and never create", () => {
    expect(canPerform(finance, "create")).toBe(false);
    expect(canPerform(finance, "close", financeAction)).toBe(true);
    expect(canPerform(finance, "close", pmAction)).toBe(false);
    expect(canPerform(finance, "status")).toBe(false);
  });

  it("lets the Engineering Manager assign, and the Director do everything everywhere", () => {
    expect(canPerform(em, "assign")).toBe(true);
    expect(canPerform(em, "close", emAction)).toBe(true);
    expect(canPerform(em, "close", pmAction)).toBe(false);
    for (const permission of ["create", "assign", "status", "close"] as const) {
      expect(canPerform(director, permission, financeAction)).toBe(true);
    }
  });
});
