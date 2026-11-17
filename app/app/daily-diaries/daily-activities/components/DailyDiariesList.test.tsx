import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EMPTY_PROJECT } from "@/app/app/master-data/projects/types";
import { summarizeProjectDiaries } from "../project-diary-summary";
import { DailyDiariesList } from "./DailyDiariesList";
import { ProjectCard } from "./ProjectCard";
import { ProjectRow } from "./ProjectRow";

const mocks = vi.hoisted(() => ({
  projects: vi.fn(),
  diaries: vi.fn(),
  refetch: vi.fn()
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn() })
}));
vi.mock("@/app/app/master-data/projects/use-projects", () => ({
  useProjectList: mocks.projects
}));
vi.mock("../hooks/useProjectDiarySummaries", () => ({
  useProjectDiarySummaries: mocks.diaries
}));

const project = {
  ...EMPTY_PROJECT,
  id: "PROJECT-ID",
  code: "AP0834",
  title: "BHP Newman West Water",
  start_date: "2026-01-01",
  end_date: "2026-12-31"
};

describe("Daily Diaries main page", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.projects.mockReturnValue({
      data: { items: [project] },
      isLoading: false,
      isError: false,
      refetch: mocks.refetch
    });
    mocks.diaries.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      refetch: mocks.refetch
    });
  });

  it("renders the design's metadata and all five diary counts, not a project-status badge", () => {
    const html = renderToStaticMarkup(<DailyDiariesList />);
    for (const text of [
      "Daily Diaries", "AP0834", "BHP Newman West Water",
      "Start &amp; End Date:", "1 Jan 2026", "31 Dec 2026",
      "0 Approved", "0 Submitted", "0 Drafted", "0 Rejected",
      "365 Not Started", "Last Submitted:", "Not submitted yet"
    ]) {
      expect(html).toContain(text);
    }
    expect(html).toContain('aria-valuenow="0"');
    expect(html).toContain('aria-label="Search projects"');
    expect(html).toContain('aria-label="list view" aria-pressed="true"');
    expect(html).toContain("/app/daily-diaries/daily-activities/project-id");
    expect(html).not.toContain("Export");
  });

  it.each([ProjectRow, ProjectCard])(
    "keeps the same complete summary and purple progress in row and grid views",
    (Component) => {
      const summary = {
        ...summarizeProjectDiaries(project, []),
        approved: 120, submitted: 80, drafted: 45, rejected: 10,
        notStarted: 110, progress: 34, lastSubmitted: "2026-10-18"
      };
      const html = renderToStaticMarkup(<Component project={project} summary={summary} />);
      expect(html).toContain("120 Approved");
      expect(html).toContain("110 Not Started");
      expect(html).toContain("18 Oct 2026");
      expect(html).toContain('aria-valuenow="34"');
      expect(html).toContain('style="width:34%"');
      expect(html).toContain("bg-primary-500");
      expect(html).toContain("/images/daily-diaries/calendar.svg");
      expect(html).toContain("/images/daily-diaries/submitted.svg");
      expect(html).toContain("/images/daily-diaries/arrow-right.svg");
    }
  );

  it("waits for diary records instead of displaying misleading zero counts", () => {
    mocks.diaries.mockReturnValue({ isPending: true });
    const html = renderToStaticMarkup(<DailyDiariesList />);
    expect(html).toContain("Loading daily diaries");
    expect(html).not.toContain("0 Approved");
  });

  it.each(["projects", "diaries"] as const)(
    "provides an explicit retryable %s error rather than an empty page",
    (key) => {
      mocks[key].mockReturnValue({
        data: key === "projects" ? { items: [] } : undefined,
        isError: true,
        refetch: mocks.refetch
      });
      const html = renderToStaticMarkup(<DailyDiariesList />);
      expect(html).toContain('role="alert"');
      expect(html).toContain(key === "projects"
        ? "Unable to load projects" : "Unable to load diary summaries");
      expect(html).toContain("Try again");
      expect(html).not.toContain("No projects found");
    }
  );

  it("shows the empty search state without starting a diary query", () => {
    mocks.projects.mockReturnValue({ data: { items: [] } });
    const html = renderToStaticMarkup(<DailyDiariesList />);
    expect(html).toContain("No projects found");
    expect(mocks.diaries).toHaveBeenCalledWith(false);
  });
});
