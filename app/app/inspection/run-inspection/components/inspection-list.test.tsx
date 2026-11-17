import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TemplateDetail } from "../../templates/types";
import type { InspectionDetail } from "../use-available-inspections";
import { InspectionList } from "./inspection-list";
import type { RunInspectionDialog } from "./run-inspection-dialog";

type DialogProps = ComponentProps<typeof RunInspectionDialog>;
const mocks = vi.hoisted(() => ({
  detail: vi.fn(),
  template: vi.fn(),
  usage: vi.fn(),
  update: vi.fn(),
  dialog: vi.fn<(props: DialogProps) => void>()
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      const state = actual.useState(initial);
      return initial === null ? ["draft-1", vi.fn()] : state;
    }
  };
});
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() })
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: [], isLoading: false, isError: false })
}));
vi.mock("@/lib/axios", () => ({ axiosConfig: () => ({}) }));
vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "" } }));
vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ user: { id: "inspector-1", name: "Inspector" } })
}));
vi.mock("@/components/Table", () => ({ default: () => null }));
vi.mock("../../templates/use-templates", () => ({
  useTemplateDetail: mocks.template
}));
vi.mock("../use-available-inspections", () => ({
  EMPTY_INSPECTION_USAGE_TRACKING: {},
  useInspectionDetail: mocks.detail,
  useInspectionUsageTracking: mocks.usage,
  useUpdateInspection: () => ({ mutate: mocks.update, isPending: false })
}));
vi.mock("./run-inspection-dialog", () => ({
  RunInspectionDialog: (props: DialogProps) => {
    mocks.dialog(props);
    return null;
  }
}));

function template(): TemplateDetail {
  return {
    templateId: "template-3",
    familyId: "family-1",
    name: "Checklist",
    status: "Published",
    version: 3,
    versionList: [3],
    frequency: "daily",
    customDays: 0,
    isUsageTracking: false,
    equipmentId: "equipment-1",
    equipmentName: "Machine",
    equipmentCode: "M1",
    sections: [
      { id: "empty", name: "Empty section", items: [] },
      {
        id: "preparation",
        name: "Preparation",
        items: [{
          id: "item-1", label: "Check power", type: "pass_fail",
          minValue: "", maxValue: "", controlPoints: []
        }]
      },
      {
        id: "final",
        name: "Final checks",
        items: [{
          id: "item-2", label: "Check finish", type: "pass_fail",
          minValue: "", maxValue: "", controlPoints: []
        }]
      }
    ],
    products: [],
    references: [],
    createdBy: "Inspector",
    updatedBy: "Inspector",
    createdAt: "",
    publishedAt: ""
  };
}

function inspection(category: "asset" | "quality"): InspectionDetail {
  return {
    id: "draft-1",
    name: "Draft inspection",
    category,
    status: "INSPECTION_STATUS_IN_PROGRESS",
    templateId: "template-3",
    templateFamilyId: "family-1",
    templateVersion: 3,
    equipmentId: "equipment-1",
    equipmentName: "Machine",
    completedAt: "",
    currentUsage: "",
    inspector: "Inspector",
    isUsageTracking: false,
    templateName: "Checklist",
    items: [2, 1].map((number) => ({
      id: `result-${number}`,
      itemId: `item-${number}`,
      result: number === 1 ? "pass" : "fail",
      notes: number === 2 ? "Needs rework" : "",
      itemType: "pass_fail",
      numberValue: 0,
      itemMinValue: 0,
      itemMaxValue: 0,
      attachments: [],
      witnessed: false,
      witnessedBy: "",
      holdApproved: false,
      holdApprovedBy: "",
      createdBy: "Inspector",
      label: `Checklist item ${number}`,
      section: "Checklist items",
      expectedRange: ""
    }))
  };
}

function renderEditor() {
  renderToStaticMarkup(<InspectionList />);
  return mocks.dialog.mock.lastCall![0];
}

describe.each(["asset", "quality"] as const)("%s draft checklist sections", (category) => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.detail.mockReturnValue({ data: inspection(category), isLoading: false });
    mocks.template.mockReturnValue({ data: template(), isLoading: false });
    mocks.usage.mockReturnValue({ data: undefined, isLoading: false });
  });

  it("loads the draft's template category and revision", () => {
    renderEditor();
    expect(mocks.template).toHaveBeenCalledWith(
      "family-1", "template-3", category, 3
    );
  });

  it("uses template section identities, names and item order", () => {
    const dialog = renderEditor();
    expect(dialog.open).toBe(true);
    expect(dialog.sections).toEqual([
      { id: "preparation", name: "Preparation" },
      { id: "final", name: "Final checks" }
    ]);
    expect(dialog.items).toMatchObject([
      {
        id: "item-1", label: "Check power",
        sectionId: "preparation", sectionName: "Preparation"
      },
      {
        id: "item-2", label: "Check finish",
        sectionId: "final", sectionName: "Final checks"
      }
    ]);
    expect(dialog.initialResults).toMatchObject({
      "item-1": { passed: true },
      "item-2": { passed: false, notes: "Needs rework" }
    });
  });

  it("waits for section metadata before showing editable items", () => {
    mocks.template.mockReturnValue({ data: undefined, isLoading: true });
    expect(renderEditor().isLoading).toBe(true);
  });

  it("falls back to saved section names if the template is unavailable", () => {
    const detail = inspection(category);
    detail.items[0].section = "Saved final checks";
    detail.items[1].section = "Saved preparation";
    mocks.detail.mockReturnValue({ data: detail, isLoading: false });
    mocks.template.mockReturnValue({ data: undefined, isLoading: false });

    const dialog = renderEditor();
    expect(dialog.sections).toBeUndefined();
    expect(dialog.items.map((item) => item.sectionName)).toEqual([
      "Saved final checks", "Saved preparation"
    ]);
  });

  it("preserves saved result IDs and answers when updating the draft", () => {
    const dialog = renderEditor();
    dialog.onSubmit(true, dialog.initialResults!);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        is_draft: true,
        items: expect.arrayContaining([
          expect.objectContaining({
            item_id: "result-1", template_item_id: "item-1", status: "pass"
          }),
          expect.objectContaining({
            item_id: "result-2", template_item_id: "item-2",
            status: "fail", notes: "Needs rework"
          })
        ])
      }),
      expect.any(Object)
    );
  });
});
