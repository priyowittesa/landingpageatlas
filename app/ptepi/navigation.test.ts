import { describe, expect, it } from "vitest";
import { extractNavHrefs } from "@/components/layout/dasbhoard/navigation";
import {
  HERO_PROJECT_PATH,
  PTEPI_NAV,
  getActiveNavHref,
  getProjectIdFromPath,
  getScreenTitle,
  isProjectScreen,
  switchProjectPath,
  withProject
} from "./navigation";

describe("ptepi sidebar navigation", () => {
  it("links the eight prototype screens, all inside /ptepi", () => {
    const hrefs = extractNavHrefs(PTEPI_NAV);
    expect(hrefs).toHaveLength(8);
    expect(hrefs.every((href) => href === "/ptepi" || href.startsWith("/ptepi/"))).toBe(true);
    expect(new Set(hrefs).size).toBe(8);
  });

  it("highlights the portfolio only on the portfolio page", () => {
    expect(getActiveNavHref("/ptepi")).toBe("/ptepi");
    expect(getActiveNavHref("/ptepi/")).toBe("/ptepi");
    expect(getActiveNavHref("/ptepi/commercial")).toBe("/ptepi/commercial");
  });

  it("highlights the project items for every project id", () => {
    expect(getActiveNavHref("/ptepi/project/PNP126")).toBe(HERO_PROJECT_PATH);
    expect(getActiveNavHref("/ptepi/project/IKT0126")).toBe(HERO_PROJECT_PATH);
    expect(getActiveNavHref("/ptepi/project/IKT0126/evidence")).toBe(`${HERO_PROJECT_PATH}/evidence`);
  });

  it("highlights the other screens", () => {
    expect(getActiveNavHref("/ptepi/cost")).toBe("/ptepi/cost");
    expect(getActiveNavHref("/ptepi/service-contracts")).toBe("/ptepi/service-contracts");
    expect(getActiveNavHref("/ptepi/ask-atlas")).toBe("/ptepi/ask-atlas");
    expect(getActiveNavHref("/ptepi/actions")).toBe("/ptepi/actions");
  });

  it("titles the top bar after the current screen", () => {
    expect(getScreenTitle("/ptepi")).toBe("Portfolio Health");
    expect(getScreenTitle("/ptepi/commercial")).toBe("Commercial and Billing");
    expect(getScreenTitle("/ptepi/project/IKT0126")).toBe("Project Cockpit");
    expect(getScreenTitle("/ptepi/project/IKT0126/evidence")).toBe("Evidence Gate");
    expect(getScreenTitle("/ptepi/unknown")).toBe("Portfolio Health");
    expect(getScreenTitle("/elsewhere")).toBe("ATLAS x EPI");
  });
});

describe("project switching", () => {
  it("reads the project from project routes only", () => {
    expect(getProjectIdFromPath("/ptepi/project/PNP126")).toBe("PNP126");
    expect(getProjectIdFromPath("/ptepi/project/PNP126/evidence")).toBe("PNP126");
    expect(getProjectIdFromPath("/ptepi/cost")).toBeNull();
  });

  it("offers the switcher on project, commercial and cost screens", () => {
    expect(isProjectScreen("/ptepi/project/PNP127/evidence")).toBe(true);
    expect(isProjectScreen("/ptepi/commercial")).toBe(true);
    expect(isProjectScreen("/ptepi/cost")).toBe(true);
    expect(isProjectScreen("/ptepi")).toBe(false);
    expect(isProjectScreen("/ptepi/actions")).toBe(false);
  });

  it("keeps the sub-screen when the project changes", () => {
    expect(switchProjectPath("/ptepi/project/PNP126", "PNP127")).toBe("/ptepi/project/PNP127");
    expect(switchProjectPath("/ptepi/project/PNP126/evidence", "PNP127")).toBe("/ptepi/project/PNP127/evidence");
    expect(switchProjectPath("/ptepi/cost", "PNP127")).toBe("/ptepi/cost");
  });

  it("points sidebar project links at the selected project", () => {
    expect(withProject(`${HERO_PROJECT_PATH}/evidence`, "PNP127")).toBe("/ptepi/project/PNP127/evidence");
    expect(withProject("/ptepi/cost", "PNP127")).toBe("/ptepi/cost?project=PNP127");
    expect(withProject("/ptepi/commercial", null)).toBe("/ptepi/commercial");
    expect(withProject(HERO_PROJECT_PATH, null)).toBe(HERO_PROJECT_PATH);
    expect(withProject("/ptepi/actions", "PNP126")).toBe("/ptepi/actions");
  });
});
