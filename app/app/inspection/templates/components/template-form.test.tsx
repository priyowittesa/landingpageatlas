import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TemplateCategory, TemplateDetail } from "../types";
import { TagListDialog } from "./tag-list-dialog";
import { TemplateForm } from "./template-form";

type ActionProps = {
  children?: ReactNode;
  onClick?: () => void;
  onSubmit?: (event: { preventDefault: () => void }) => void;
  "aria-label"?: string;
};
type SaveOptions = { onSuccess: (response: unknown) => Promise<void> };
const mocks = vi.hoisted(() => ({
  update: vi.fn<(payload: unknown, options: SaveOptions) => void>(),
  remove: vi.fn(),
  register: vi.fn(),
  uploadUrl: vi.fn(),
  upload: vi.fn(),
  push: vi.fn()
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
  useSearchParams: () => new URLSearchParams()
}));
vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ user: { id: "user-1", name: "Inspector" } })
}));
vi.mock("../use-products", () => ({
  useProductList: () => ({ data: { items: [] }, isLoading: false })
}));
vi.mock("./tag-list-dialog", () => ({ TagListDialog: () => null }));
vi.mock("../use-templates", () => ({
  useCreateAssetTemplate: () => ({ isPending: false }),
  useCreateQualityTemplate: () => ({ isPending: false }),
  useUpdateAssetTemplate: () => ({ mutate: mocks.update, isPending: false }),
  useUpdateQualityTemplate: () => ({ mutate: mocks.update, isPending: false }),
  useDeleteTemplateReference: () => ({ mutate: mocks.remove, isPending: false }),
  registerReference: mocks.register,
  getReferenceUploadUrl: mocks.uploadUrl,
  uploadReferenceToS3: mocks.upload
}));

function template(status = "INSPECTION_TEMPLATE_STATUS_PUBLISHED"): TemplateDetail {
  return {
    templateId: "revision-4", familyId: "family-1", name: "Quality check",
    status, version: 4, versionList: [1, 2, 3, 4],
    frequency: "daily", customDays: 0, isUsageTracking: false,
    equipmentId: "equipment-1", equipmentName: "Machine", equipmentCode: "M1",
    products: [{ productId: "product-1", partName: "Part", partNumber: "P1" }],
    sections: [{
      id: "section-1", name: "Checklist",
      items: [{
        id: "item-1", label: "Check finish", type: "pass_fail",
        minValue: "", maxValue: "", controlPoints: []
      }]
    }],
    references: [{
      id: "reference-4", storageKey: "references/drawing.pdf",
      url: "https://files.example/drawing.pdf", uploadedAt: ""
    }],
    createdBy: "Inspector", updatedBy: "Inspector", createdAt: "", publishedAt: ""
  };
}

function renderForm(
  category: TemplateCategory,
  initialData: TemplateDetail,
  editing = true
) {
  let tree: ReactNode;
  function CaptureForm() {
    tree = TemplateForm({ editing, category, initialData });
    return null;
  }
  renderToStaticMarkup(<CaptureForm />);
  return tree;
}

function findAction(
  node: ReactNode,
  match: (element: ReactElement<ActionProps>) => boolean
): ActionProps | undefined {
  for (const child of Children.toArray(node)) {
    if (!isValidElement<ActionProps>(child)) continue;
    if (match(child)) return child.props;
    const action = findAction(child.props.children, match);
    if (action) return action;
  }
}

function submit(tree: ReactNode, publish: boolean) {
  if (publish) {
    findAction(tree, (child) => child.type === "form")!.onSubmit!({ preventDefault: vi.fn() });
  } else {
    findAction(tree, (child) => Children.toArray(child.props.children).includes("Save draft"))!.onClick!();
  }
  expect(mocks.update).toHaveBeenCalledOnce();
  return mocks.update.mock.lastCall![1].onSuccess;
}

describe.each([false, true])("checklist tags (editing: %s)", (editing) => {
  function taggedTemplate(type: "pass_fail" | "number") {
    const initialData = template();
    initialData.sections[0].items[0].type = type;
    initialData.sections[0].items[0].controlPoints = [{
      control_point_id: "tag-1",
      label: "Witness",
      color: "#2563eb",
      value: "witness"
    }];
    return initialData;
  }

  it.each(["pass_fail", "number"] as const)(
    "hides tag controls and the tag dialog on asset %s items",
    (type) => {
      const tree = renderForm("asset", taggedTemplate(type), editing);
      expect(findAction(tree, (child) =>
        Children.toArray(child.props.children).includes("+ add tag")
      )).toBeUndefined();
      expect(findAction(tree, (child) =>
        child.props["aria-label"] === "Remove Witness tag"
      )).toBeUndefined();
      expect(findAction(tree, (child) => child.type === TagListDialog)).toBeUndefined();
    }
  );

  it.each(["pass_fail", "number"] as const)(
    "keeps tag controls and the tag dialog on quality %s items",
    (type) => {
      const tree = renderForm("quality", taggedTemplate(type), editing);
      expect(findAction(tree, (child) =>
        Children.toArray(child.props.children).includes("+ add tag")
      )?.onClick).toBeTypeOf("function");
      expect(findAction(tree, (child) =>
        child.props["aria-label"] === "Remove Witness tag"
      )?.onClick).toBeTypeOf("function");
      expect(findAction(tree, (child) => child.type === TagListDialog)).toBeDefined();
    }
  );
});

describe.each(["asset", "quality"] as const)("%s template reference preservation", (category) => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.register.mockResolvedValue(undefined);
  });

  it.each([false, true])(
    "carries existing references into a new revision (published: %s)",
    async (publish) => {
      const onSuccess = submit(renderForm(category, template()), publish);
      await onSuccess({ inspection_template: { id: "revision-5" } });

      expect(mocks.register).toHaveBeenCalledExactlyOnceWith("revision-5", {
        storage_key: "references/drawing.pdf", uploaded_by: "Inspector"
      });
      expect(mocks.remove).not.toHaveBeenCalled();
      expect(mocks.uploadUrl).not.toHaveBeenCalled();
      expect(mocks.upload).not.toHaveBeenCalled();
      expect(mocks.push).toHaveBeenCalledWith(`/app/inspection/templates?tab=${category}`);
    }
  );

  it.each([
    { data: { inspection_template: { id: "revision-5" } } },
    { id: "revision-5" },
    { data: { id: "revision-5" } }
  ])("uses the returned revision ID for supported response shapes: %j", async (response) => {
    const onSuccess = submit(renderForm(category, template()), false);
    await onSuccess(response);
    expect(mocks.register).toHaveBeenCalledWith("revision-5", expect.any(Object));
  });

  it("uses the new ID even when publishing a draft creates a revision", async () => {
    const onSuccess = submit(renderForm(category, template("Draft")), true);
    await onSuccess({ inspection_template: { id: "revision-5" } });
    expect(mocks.register).toHaveBeenCalledWith("revision-5", expect.any(Object));
  });

  it.each([false, true])(
    "does not duplicate references when saving the same draft (published: %s)",
    async (publish) => {
      const onSuccess = submit(renderForm(category, template("Draft")), publish);
      await onSuccess({ inspection_template: { id: "revision-4" } });
      expect(mocks.register).not.toHaveBeenCalled();
      expect(mocks.push).toHaveBeenCalled();
    }
  );

  it.each(["Published", "INSPECTION_TEMPLATE_STATUS_PUBLISHED", "Archived", "2", "3"])(
    "does not delete historical references when removing a file from a %s revision",
    (status) => {
      const initialData = template(status);
      const tree = renderForm(category, initialData);
      findAction(tree, (child) => child.props["aria-label"] === "Remove drawing.pdf")!.onClick!();
      expect(mocks.remove).not.toHaveBeenCalled();
      expect(initialData.references).toHaveLength(1);
    }
  );

  it.each(["Draft", "INSPECTION_TEMPLATE_STATUS_DRAFT", "1"])(
    "still deletes references belonging to an editable %s draft",
    (status) => {
      const tree = renderForm(category, template(status));
      findAction(tree, (child) => child.props["aria-label"] === "Remove drawing.pdf")!.onClick!();
      expect(mocks.remove).toHaveBeenCalledWith(
        { templateId: "revision-4", referenceId: "reference-4" },
        expect.any(Object)
      );
    }
  );
});
