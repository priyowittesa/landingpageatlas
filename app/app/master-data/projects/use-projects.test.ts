import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProjectList } from "./use-projects";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  get: vi.fn()
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: mocks.query,
  useMutation: vi.fn(),
  useQueryClient: vi.fn()
}));
vi.mock("@/lib/axios", () => ({
  axiosConfig: () => ({ get: mocks.get })
}));

function ProjectQuery() {
  useProjectList();
  return null;
}

describe("project progress normalization", () => {
  beforeEach(() => vi.resetAllMocks());

  it.each([0, 34, 100])("preserves the API's overall progress (%s)", async (progress) => {
    mocks.get.mockResolvedValue({ data: { items: [{ id: "project", progress }] } });
    renderToStaticMarkup(createElement(ProjectQuery));
    const result = await mocks.query.mock.lastCall![0].queryFn();
    expect(result.items[0].progress).toBe(progress);
  });

  it.each([undefined, "invalid", Number.NaN, Number.POSITIVE_INFINITY])(
    "does not manufacture numeric progress from invalid data (%s)",
    async (progress) => {
      mocks.get.mockResolvedValue({ data: { items: [{ id: "project", progress }] } });
      renderToStaticMarkup(createElement(ProjectQuery));
      const result = await mocks.query.mock.lastCall![0].queryFn();
      expect(result.items[0].progress).toBeUndefined();
    }
  );
});
