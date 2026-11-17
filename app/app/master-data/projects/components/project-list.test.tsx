import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Table from "@/components/Table";
import { ProjectList } from "./project-list";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/hooks/useUrlState", () => ({
  useUrlState: (defaults: Record<string, unknown>) => ({
    values: defaults,
    set: vi.fn(),
    setMany: vi.fn(),
  }),
}));
vi.mock("../use-projects", () => ({
  useDeleteProject: () => ({ mutate: vi.fn(), isPending: false }),
  useProjectDashboardSummary: () => ({ isLoading: false }),
  useProjectEnums: () => ({ isLoading: false }),
  useProjectList: () => ({
    data: { items: [] },
    isLoading: false,
    isFetching: false,
    isError: false,
  }),
  useProjectTypes: () => ({ data: [], isLoading: false }),
}));
vi.mock("@/components/ConfirmationModal", () => ({ default: () => null }));
vi.mock("./project-filters", () => ({ ProjectFilters: () => null }));
vi.mock("./project-stats", () => ({ ProjectStats: () => null }));
vi.mock("./project-table", () => ({ ProjectTable: () => null }));

describe("Project empty state", () => {
  it.each([false, true])(
    "matches the inspection table illustration (activeOnly: %s)",
    (activeOnly) => {
      const html = renderToStaticMarkup(<ProjectList activeOnly={activeOnly} />);
      const inspectionTable = renderToStaticMarkup(
        <Table
          columns={[{ key: "id", header: "Asset" }]}
          data={[]}
          getRowId={(row: { id: string }) => row.id}
          name="asset"
        />,
      );
      const illustration = '<use href="/data-not-found.svg"></use>';

      expect(inspectionTable).toContain(illustration);
      expect(html).toContain(illustration);
      expect(html).toContain('class="mb-5 h-40 w-40"');
      expect(html).not.toContain("/images/empty-data.svg");
      expect(html).toContain('aria-label="No projects available"');
      expect(html).toContain("No projects found");
      expect(html).toContain("Add Project");
    },
  );
});
