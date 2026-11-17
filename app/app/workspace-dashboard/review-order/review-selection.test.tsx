import { Children, isValidElement, type ComponentProps, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  states: [] as unknown[],
  cursor: 0,
  catalogLoading: false,
  replaceState: vi.fn()
}));
vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return {
    ...react,
    useState: (initial: unknown) => {
      const index = mocks.cursor++;
      if (!(index in mocks.states)) {
        mocks.states[index] = typeof initial === "function" ? initial() : initial;
      }
      return [mocks.states[index], (update: unknown) => {
        mocks.states[index] = typeof update === "function" ? update(mocks.states[index]) : update;
      }];
    },
    useEffect: (effect: () => void) => {
      effect();
      effect();
    }
  };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: null }) }));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() })
}));
vi.mock("@/components/layout/dasbhoard/ResponsiveSidebarProvider", () => ({
  useSidebar: () => ({ collapsed: false })
}));
vi.mock("@/hooks/useAuthMe", () => ({ useAuthMe: () => ({}) }));
vi.mock("@/hooks/useSyncUser", () => ({ useSyncUser: () => ({}) }));
vi.mock("../explore-module/use-packages", () => ({
  getIcon: vi.fn(),
  isCatalogAvailable: () => true,
  useCheckout: () => ({}),
  useGetModules: () => ({
    isLoading: mocks.catalogLoading,
    data: mocks.catalogLoading ? undefined : {
      items: ["addon-1", "addon-2"].map((id) => ({
        id, name: id, status: "active",
        monthly_price: 10, monthly_price_idr: 250000,
        yearly_price: 100, yearly_price_idr: 2500000
      }))
    }
  }),
  useGetPackages: () => ({
    isLoading: mocks.catalogLoading,
    data: mocks.catalogLoading ? undefined : {
      items: [{
        id: "package-1", name: "Package", status: "active",
        monthly_price: 10, monthly_price_idr: 250000,
        yearly_price: 100, yearly_price_idr: 2500000,
        module_ids: [], included_modules: []
      }]
    }
  }),
  useGetTransaction: vi.fn(),
  useResumeTransaction: vi.fn(),
  useDownloadTransactionReceipt: vi.fn()
}));

import ReviewOrderPage from "./page";
import { ReviewOrderClient } from "./review-order-client";

type ReviewProps = ComponentProps<typeof ReviewOrderClient>;
type SelectionProps = {
  children?: ReactNode;
  id?: string;
  billingCycle?: string;
  value?: string;
  onRemove?: () => void;
  onBillingCycleChange?: (cycle: "monthly" | "yearly") => void;
  onValueChange?: (cycle: string) => void;
};
const baseUrl = "http://localhost:3000/app/workspace-dashboard/review-order?billing_cycle=monthly&package=package-1&packages=package-1";
const initialProps: ReviewProps = {
  initialAddOns: ["addon-1", "addon-2"],
  initialAddOnBillingCycles: '{"addon-1":"yearly"}',
  initialBillingCycle: "monthly",
  packageIds: ["package-1"]
};

function renderReview(props = initialProps) {
  let tree: ReactNode;
  mocks.cursor = 0;
  function CaptureReview() {
    tree = ReviewOrderClient(props);
    return null;
  }
  renderToStaticMarkup(<CaptureReview />);
  return tree;
}

function findSelection(
  node: ReactNode,
  match: (props: SelectionProps) => boolean
): SelectionProps | undefined {
  for (const child of Children.toArray(node)) {
    if (!isValidElement<SelectionProps>(child)) continue;
    if (match(child.props)) return child.props;
    const found = findSelection(child.props.children, match);
    if (found) return found;
  }
}

function selectedItem(tree: ReactNode, id: string) {
  const result = findSelection(tree, (props) => props.id === id && Boolean(props.onRemove));
  if (!result) throw new Error(`Selected add-on not found: ${id}`);
  return result;
}

function params() {
  return new URL(window.location.href).searchParams;
}

async function refresh() {
  const page = await ReviewOrderPage({
    searchParams: Promise.resolve(Object.fromEntries(params()))
  });
  mocks.states = [];
  return page;
}

describe("review order selection refresh", () => {
  beforeEach(() => {
    mocks.states = [];
    mocks.cursor = 0;
    mocks.catalogLoading = false;
    mocks.replaceState.mockReset();
    const location = { href: baseUrl };
    const history = { state: { __NA: true }, replaceState: mocks.replaceState };
    mocks.replaceState.mockImplementation((state, _, href: string) => {
      history.state = state;
      location.href = href;
    });
    vi.stubGlobal("window", { location, history });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("persists selected add-ons before checkout and restores them after refresh", async () => {
    renderReview();
    expect(params().get("addons")).toBe("addon-1,addon-2");
    expect(JSON.parse(params().get("addon_billing_cycles")!)).toEqual({
      "addon-1": "yearly", "addon-2": "monthly"
    });
    expect(params().has("transaction")).toBe(false);
    expect(mocks.replaceState).toHaveBeenCalledOnce();
    expect(mocks.replaceState.mock.lastCall![0]).toEqual({ __NA: true });

    const page = await refresh();
    const tree = renderReview(page.props);
    expect(selectedItem(tree, "addon-1").billingCycle).toBe("yearly");
    expect(selectedItem(tree, "addon-2").billingCycle).toBe("monthly");
  });

  it("persists add-on billing changes independently of the package billing cycle", async () => {
    selectedItem(renderReview(), "addon-2").onBillingCycleChange!("yearly");
    renderReview();
    expect(params().get("billing_cycle")).toBe("monthly");
    const page = await refresh();
    expect(selectedItem(renderReview(page.props), "addon-2").billingCycle).toBe("yearly");
  });

  it("persists package billing changes without changing add-on billing cycles", async () => {
    const tree = renderReview();
    findSelection(tree, (props) => Boolean(props.onValueChange))!.onValueChange!("yearly");
    renderReview();
    const page = await refresh();
    expect(page.props.initialBillingCycle).toBe("yearly");
    expect(selectedItem(renderReview(page.props), "addon-2").billingCycle).toBe("monthly");
  });

  it("does not restore an add-on removed from the review page", async () => {
    selectedItem(renderReview(), "addon-1").onRemove!();
    renderReview();
    expect(params().get("addons")).toBe("addon-2");
    expect(JSON.parse(params().get("addon_billing_cycles")!)).toEqual({ "addon-2": "monthly" });
    const page = await refresh();
    expect(page.props.initialAddOns).toEqual(["addon-2"]);
  });

  it("clears both add-on parameters when all add-ons are removed", async () => {
    const tree = renderReview();
    selectedItem(tree, "addon-1").onRemove!();
    selectedItem(tree, "addon-2").onRemove!();
    renderReview();
    expect(params().has("addons")).toBe(false);
    expect(params().has("addon_billing_cycles")).toBe(false);
    const page = await refresh();
    expect(page.props.initialAddOns).toEqual([]);
  });

  it("keeps the raw selection while catalog data reloads", async () => {
    mocks.catalogLoading = true;
    renderReview();
    expect(params().get("addons")).toBe("addon-1,addon-2");
    const page = await refresh();
    mocks.catalogLoading = false;
    const tree = renderReview(page.props);
    expect(selectedItem(tree, "addon-1").billingCycle).toBe("yearly");
    expect(selectedItem(tree, "addon-2").billingCycle).toBe("monthly");
  });

  it("remounts review state when navigating to a different URL selection", async () => {
    renderReview();
    const firstPage = await refresh();
    const secondPage = await ReviewOrderPage({
      searchParams: Promise.resolve({ packages: "package-1", addons: "addon-2" })
    });
    expect(secondPage.key).not.toBe(firstPage.key);
    expect(secondPage.props.initialAddOns).toEqual(["addon-2"]);
  });

  it("does not rewrite the selection for an existing transaction", () => {
    window.history.replaceState(null, "", `${baseUrl}&transaction=tx-1&addons=addon-2`);
    mocks.replaceState.mockClear();
    renderReview({ ...initialProps, initialTransactionId: "tx-1" });
    expect(mocks.replaceState).not.toHaveBeenCalled();
    expect(params().get("transaction")).toBe("tx-1");
    expect(params().get("addons")).toBe("addon-2");
  });
});
