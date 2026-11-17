import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LabourRosteringTab } from "./LabourRosteringTab";
import type { ProjectTimelineResponse } from "./use-dashboard";

const mocks = vi.hoisted(() => ({
  timeline: vi.fn()
}));

vi.mock("./use-dashboard", () => ({
  useProjectTimeline: mocks.timeline,
  useEmployeeOverlap: () => ({ data: { items: [] }, isLoading: false }),
  useShiftDistribution: () => ({ data: { items: [] }, isLoading: false })
}));

function timeline(): ProjectTimelineResponse {
  return {
    start_date: "2026-11-01",
    end_date: "2026-11-30",
    week_start_dates: [
      "2026-11-01", "2026-11-08", "2026-11-15", "2026-11-22", "2026-11-29"
    ],
    total_projects: 1,
    total_assignments: 1,
    projects: [{
      project_id: "project-1",
      project_name: "A project with a long name",
      project_status: "active",
      assignments: [{
        member_id: "member-1",
        labour_id: "labour-1",
        employee_name: "A worker with a long name",
        start_date: "2026-11-08",
        end_date: "2026-11-15",
        duration_days: 8,
        periods: [{
          start_date: "2026-11-08",
          end_date: "2026-11-15",
          scheduled_days: 8
        }]
      }]
    }]
  };
}

describe("Project Timeline responsive layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.timeline.mockReturnValue({ data: timeline(), isLoading: false });
  });

  it("contains a keyboard-scrollable calendar with a readable minimum width", () => {
    const html = renderToStaticMarkup(<LabourRosteringTab filter={{}} />);

    expect(html).toContain('role="region" aria-label="Project assignment timeline" tabindex="0"');
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain('style="min-width:570px"');
    expect(html).toContain("min-w-0 max-w-full p-4 sm:p-6");
    expect(html).toContain('title="A project with a long name"');
    expect(html).toContain('title="A worker with a long name"');
    expect(html.match(/sticky left-0 z-10/g)).toHaveLength(3);
    expect(html).toContain("max-w-20 shrink-0 truncate");
    expect(html).toContain("transform:translateX(-100%)");
    expect(html).toContain("Nov 8 - Nov 15");
    expect(html).toContain("8 days");
  });

  it("increases the calendar width for longer ranges instead of crowding dates", () => {
    const data = timeline();
    data.end_date = "2027-01-31";
    mocks.timeline.mockReturnValue({ data, isLoading: false });

    const html = renderToStaticMarkup(<LabourRosteringTab filter={{}} />);

    expect(html).toContain('style="min-width:1254px"');
  });

  it("keeps the no-assignments state without an empty scroll region", () => {
    mocks.timeline.mockReturnValue({
      data: { ...timeline(), projects: [] },
      isLoading: false
    });
    const html = renderToStaticMarkup(<LabourRosteringTab filter={{}} />);

    expect(html).toContain("No project assignments for the selected period");
    expect(html).not.toContain('aria-label="Project assignment timeline"');
  });

  it("keeps the loading state", () => {
    mocks.timeline.mockReturnValue({ isLoading: true });
    const html = renderToStaticMarkup(<LabourRosteringTab filter={{}} />);

    expect(html).toContain("Project Timeline");
    expect(html).toContain('role="status"');
    expect(html).not.toContain('aria-label="Project assignment timeline"');
  });
});
