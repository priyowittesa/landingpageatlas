import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTemplateDetail } from "./use-templates";

type QueryOptions = {
  queryKey: readonly unknown[];
  queryFn: () => Promise<unknown>;
  enabled: boolean;
};

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  query: vi.fn<(options: QueryOptions) => unknown>()
}));
vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.query }));
vi.mock("@/lib/axios", () => ({ axiosConfig: () => ({ get: mocks.get }) }));
vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "" } }));

const baseUrl = "/v1/manufacturing/inspection/templates";

function useDetailQuery(category: "asset" | "quality", version?: number) {
  useTemplateDetail("family-1", "revision-4", category, version);
  return mocks.query.mock.lastCall![0];
}

describe("template revision references", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.get.mockImplementation(async (url: string, config?: { params: { version?: string } }) => {
      if (url.endsWith("/reference")) {
        const templateId = url.split("/").at(-2);
        return {
          data: {
            data: {
              references: [{
                id: `reference-${templateId}`,
                storage_key: `references/${templateId}.pdf`,
                url: `https://files.example/${templateId}.pdf`
              }]
            }
          }
        };
      }
      const version = Number(config?.params.version ?? 4);
      return {
        data: {
          data: {
            inspection_template: { id: `revision-${version}`, family_id: "family-1", version },
            version_list: [1, 2, 3, 4]
          }
        }
      };
    });
  });

  describe.each(["asset", "quality"] as const)("%s revision history", (category) => {
    it.each([4, 3, 2, 1])(
      "loads revision %i's files rather than the revision in the URL",
      async (version) => {
        const query = useDetailQuery(category, version);
        expect(query.queryKey).toEqual([
          "inspection-templates", "detail", "family-1", "revision-4", category, version
        ]);
        await expect(query.queryFn()).resolves.toMatchObject({
          templateId: `revision-${version}`,
          version,
          references: [{
            id: `reference-revision-${version}`,
            storageKey: `references/revision-${version}.pdf`
          }]
        });
        expect(mocks.get).toHaveBeenLastCalledWith(`${baseUrl}/revision-${version}/reference`);
        expect(mocks.get).toHaveBeenCalledWith(
          `${baseUrl}/${category === "asset" ? "assets" : "quality"}/family-1`,
          { params: { version: String(version) } }
        );
      }
    );
  });

  it("uses the latest returned revision when the edit URL contains an older ID", async () => {
    useTemplateDetail("family-1", "revision-1", "quality");
    await expect(mocks.query.mock.lastCall![0].queryFn()).resolves.toMatchObject({
      templateId: "revision-4",
      references: [{ id: "reference-revision-4" }]
    });
    expect(mocks.get).toHaveBeenLastCalledWith(`${baseUrl}/revision-4/reference`);
  });

  it("does not turn a reference-loading failure into an empty, editable template", async () => {
    const get = mocks.get.getMockImplementation()!;
    mocks.get.mockImplementation((url: string, config) =>
      url.endsWith("/reference")
        ? Promise.reject(new Error("Reference service unavailable"))
        : get(url, config)
    );
    await expect(useDetailQuery("quality", 2).queryFn()).rejects.toThrow("Reference service unavailable");
  });

  it("still supports revisions that genuinely have no reference files", async () => {
    const get = mocks.get.getMockImplementation()!;
    mocks.get.mockImplementation((url: string, config) =>
      url.endsWith("/reference") ? Promise.resolve({ data: [] }) : get(url, config)
    );
    await expect(useDetailQuery("quality", 1).queryFn()).resolves.toMatchObject({
      templateId: "revision-1", references: []
    });
  });
});
