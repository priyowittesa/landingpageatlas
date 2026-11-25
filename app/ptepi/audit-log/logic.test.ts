import { describe, expect, it } from "vitest";
import { epiData } from "../data";
import { buildSeedActions } from "../store/action-helpers";
import { getAuditEvents, getSessionEvents } from "./logic";

const seeds = buildSeedActions(epiData);
const events = getAuditEvents(epiData, seeds);

describe("audit log", () => {
  it("seeds who, what and when from alerts, Nexa, signatures and intake", () => {
    const categories = new Set(events.map((event) => event.category));
    expect(categories).toEqual(new Set(["AI answer", "Alert", "Approval", "Change"]));
    expect(events.every((event) => event.when !== null && event.who.length > 0 && event.what.length > 0)).toBe(true);
    expect(events.filter((event) => event.category === "Alert")).toHaveLength(seeds.length);
  });

  it("logs the Nexa refusal as declined, with the reason", () => {
    const refusal = events.find((event) => event.id === "nexa-mos");
    expect(refusal?.what).toContain("Declined, evidence missing");
    expect(refusal?.detail).toContain("no BA Material On Site");
  });

  it("logs the week 18 report signature by name", () => {
    const signature = events.find((event) => event.id === "approval-BA-PNP126-17");
    expect(signature).toMatchObject({ when: "2026-11-08", category: "Approval", actorKind: "Person" });
    expect(signature?.who).toContain("Yulius Agus");
  });

  it("lists the newest first and never dates after the snapshot", () => {
    const dates = events.map((event) => event.when ?? "");
    expect([...dates].sort().reverse()).toEqual(dates);
    expect(dates.every((date) => date <= epiData.asAt)).toBe(true);
  });

  it("adds the changes made in this session", () => {
    const first = seeds[0]!;
    const actions = [
      { ...first, status: "done" as const, ownerRole: "Site Manager" },
      { ...first, id: "ACT-01", title: "New task", source: "Nexa Intelligence: test" }
    ];
    const session = getSessionEvents(seeds, actions, "Project Manager (demo)");
    expect(session.map((event) => event.what)).toEqual([
      `Set ${first.id} to done`,
      `Reassigned ${first.id} to Site Manager`,
      "Created ACT-01: New task"
    ]);
    expect(session.every((event) => event.when === null)).toBe(true);
  });
});
