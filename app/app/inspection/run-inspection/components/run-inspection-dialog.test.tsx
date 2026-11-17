import {
  Children,
  isValidElement,
  type ComponentProps,
  type ReactNode
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  RunInspectionDialog,
  type ItemResult,
  type RunInspectionItem
} from "./run-inspection-dialog";

const mocks = vi.hoisted(() => ({ step: 0 }));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      const state = actual.useState(initial);
      return initial === 0
        ? [
            mocks.step,
            (update: number | ((previous: number) => number)) => {
              mocks.step =
                typeof update === "function" ? update(mocks.step) : update;
            }
          ]
        : state;
    }
  };
});
vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("../../templates/use-templates", () => ({
  useTemplateReferences: () => ({
    data: [{
      id: "reference-1",
      storageKey: "references/checklist.pdf",
      url: "https://files.example/checklist.pdf"
    }]
  })
}));
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
    open ? <>{children}</> : null,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>
}));

const items: RunInspectionItem[] = Array.from({ length: 10 }, (_, index) => ({
  id: `item-${index + 1}`,
  label: `Check item ${index + 1}`,
  type: "pass_fail",
  sectionId: index < 5 ? "section-1" : "section-2",
  sectionName: index < 5 ? "Preparation" : "Final checks"
}));
const initialResults = Object.fromEntries(
  items.map((item): [string, ItemResult] => [
    item.id,
    { passed: true, value: "", notes: "", file_names: [], files: [] }
  ])
);
type DialogProps = ComponentProps<typeof RunInspectionDialog>;
type ActionProps = {
  children?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
};

function findAction(node: ReactNode, label: string): ActionProps | undefined {
  for (const child of Children.toArray(node)) {
    if (!isValidElement<ActionProps>(child)) continue;
    if (Children.toArray(child.props.children).includes(label)) {
      return child.props;
    }
    const action = findAction(child.props.children, label);
    if (action) return action;
  }
}

function renderDialog(overrides: Partial<DialogProps> = {}) {
  let tree: ReactNode;
  function CaptureDialog() {
    tree = RunInspectionDialog({
      open: true,
      onOpenChange: vi.fn(),
      title: "Equipment inspection",
      items,
      initialResults,
      onSubmit: vi.fn(),
      ...overrides
    });
    return tree;
  }
  const markup = renderToStaticMarkup(<CaptureDialog />);
  return {
    markup,
    click(label: string) {
      const action = findAction(tree, label);
      expect(action, `${label} action`).toBeDefined();
      expect(action?.disabled).not.toBe(true);
      action!.onClick!();
    }
  };
}

describe("inspection checklist item numbering", () => {
  beforeEach(() => {
    mocks.step = 0;
  });

  it("shows each item's position and total in order across sections", () => {
    for (let index = 0; index < items.length; index += 1) {
      const dialog = renderDialog();
      expect(dialog.markup).toContain(
        `>${index + 1}/10 checklist items</p>`
      );
      expect(dialog.markup).toContain(`>${items[index].label}</h4>`);
      expect(dialog.markup).toContain(
        `Section ${index < 5 ? 1 : 2} of 2`
      );
      expect(dialog.markup).toContain('aria-live="polite"');
      if (index < items.length - 1) dialog.click("Next");
      else expect(dialog.markup).toContain(">Submit</button>");
    }
  });

  it("updates the position when navigating back", () => {
    renderDialog().click("Next");
    renderDialog().click("Next");
    renderDialog().click("Previous");
    expect(renderDialog().markup).toContain(">2/10 checklist items</p>");
  });

  it("uses section IDs for draft sections that share a name", () => {
    const draftItems = items.map((item) => ({
      ...item,
      sectionName: "Checklist"
    }));
    mocks.step = 5;
    const dialog = renderDialog({
      items: draftItems,
      sections: [
        { id: "section-1", name: "Checklist" },
        { id: "section-2", name: "Checklist" }
      ],
      initialResults: {
        "item-1": initialResults["item-1"]
      }
    });
    expect(dialog.markup).toContain(">Checklist</h3>");
    expect(dialog.markup).toContain("Section 2 of 2");
    expect(dialog.markup).toContain(">6/10 checklist items</p>");
  });

  it("shows the actual section name and count after a draft section transition", () => {
    const overrides: Partial<DialogProps> = {
      sections: [
        { id: "section-1", name: "Preparation" },
        { id: "section-2", name: "Final checks" }
      ]
    };
    mocks.step = 4;
    const preparation = renderDialog(overrides);
    expect(preparation.markup).toContain(">Preparation</h3>");
    expect(preparation.markup).toContain("Section 1 of 2");
    expect(preparation.markup).toContain(">5/10 checklist items</p>");
    preparation.click("Next");

    const finalChecks = renderDialog(overrides);
    expect(finalChecks.markup).toContain(">Final checks</h3>");
    expect(finalChecks.markup).toContain("Section 2 of 2");
    expect(finalChecks.markup).toContain(">6/10 checklist items</p>");
    finalChecks.click("Previous");
    expect(renderDialog(overrides).markup).toContain(">Preparation</h3>");
  });

  it("excludes the optional usage step from checklist numbering", () => {
    const overrides: Partial<DialogProps> = {
      initialCurrentUsage: "25",
      usageTracking: {
        canUpdate: true,
        currentUsage: "25",
        equipmentStatus: "active",
        isDateBased: false,
        previousUsage: "10",
        previousUsageRecordedAt: "",
        threshold: 100,
        unitName: "hours"
      }
    };
    const usage = renderDialog(overrides);
    expect(usage.markup).toContain(">Usage</h2>");
    expect(usage.markup).not.toContain("checklist items");
    usage.click("Next");

    expect(renderDialog(overrides).markup).toContain(">1/10 checklist items</p>");
    mocks.step = items.length;
    const last = renderDialog(overrides);
    expect(last.markup).toContain(">10/10 checklist items</p>");
    expect(last.markup).toContain(">Submit</button>");
  });

  it("handles a template with one checklist item", () => {
    const dialog = renderDialog({ items: items.slice(0, 1) });
    expect(dialog.markup).toContain(">1/1 checklist items</p>");
    expect(dialog.markup).toContain(">Submit</button>");
  });

  it.each([
    { isLoading: true },
    { items: [] }
  ])("does not show an invalid count while loading or empty: %j", (overrides) => {
    expect(renderDialog(overrides).markup).not.toContain("checklist items");
  });
});
