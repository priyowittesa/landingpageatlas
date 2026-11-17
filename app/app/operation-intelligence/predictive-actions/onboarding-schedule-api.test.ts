import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getOnboardingSchedule, updateOnboardingSchedule, stopOnboardingSchedule,
  scheduleFieldErrors
} from "./onboarding-schedule-api";
import { INITIAL_SIGNAL_SCHEDULE, schedulePayload } from "./signal-schedule-data";
import { scheduleRecord } from "./schedule-test-fixtures";

const mocks = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), post: vi.fn() }));
vi.mock("@/lib/axios", () => ({ axiosConfig: () => mocks }));
vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "" } }));
const id = scheduleRecord.onboarding_id;

describe("onboarding schedule transport", () => {
  beforeEach(() => vi.resetAllMocks());

  it("loads the authenticated onboarding schedule and forwards read cancellation", async () => {
    mocks.get.mockResolvedValue({ data: { data: scheduleRecord } });
    const signal = new AbortController().signal;
    expect(await getOnboardingSchedule(id, signal)).toEqual(scheduleRecord);
    expect(mocks.get).toHaveBeenCalledWith(`/v1/ai-engine/onboardings/${id}/schedule`, { signal });
  });

  it("encodes the onboarding id in the endpoint", async () => {
    mocks.get.mockResolvedValue({ data: { data: { ...scheduleRecord, onboarding_id: "id/?" } } });
    await getOnboardingSchedule("id/?");
    expect(mocks.get.mock.lastCall![0]).toBe("/v1/ai-engine/onboardings/id%2F%3F/schedule");
  });

  it("treats only GET 404 as an unconfigured schedule", async () => {
    mocks.get.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getOnboardingSchedule(id)).resolves.toBeNull();
    for (const status of [401, 403, 422, 500]) {
      mocks.get.mockRejectedValueOnce({ response: { status } });
      await expect(getOnboardingSchedule(id)).rejects.toMatchObject({ response: { status } });
    }
  });

  it("creates or replaces using only writable fields and returns accepted server state", async () => {
    mocks.put.mockResolvedValue({ data: { data: { ...scheduleRecord, run_count: 0, last_run_at: null } } });
    const payload = schedulePayload(INITIAL_SIGNAL_SCHEDULE);
    const saved = await updateOnboardingSchedule(id, {
      ...payload, tenant_id: "never-send", status: "stopped", run_count: 99
    } as typeof payload);
    expect(mocks.put).toHaveBeenCalledWith(`/v1/ai-engine/onboardings/${id}/schedule`, payload);
    expect(saved.run_count).toBe(0);
    expect(saved.last_run_at).toBeNull();
  });

  it("stops without a body and retains the saved form values", async () => {
    const stopped = { ...scheduleRecord, status: "stopped", next_run_at: null };
    mocks.post.mockResolvedValue({ data: { data: stopped } });
    expect(await stopOnboardingSchedule(id)).toEqual(stopped);
    expect(mocks.post).toHaveBeenCalledWith(`/v1/ai-engine/onboardings/${id}/schedule/stop`);
  });

  it("does not hide write failures as a missing schedule or successful stop", async () => {
    const error = { response: { status: 404 } };
    mocks.put.mockRejectedValue(error);
    mocks.post.mockRejectedValue(error);
    await expect(updateOnboardingSchedule(id, schedulePayload(INITIAL_SIGNAL_SCHEDULE))).rejects.toBe(error);
    await expect(stopOnboardingSchedule(id)).rejects.toBe(error);
  });

  it("does not accept responses for a different onboarding", async () => {
    mocks.get.mockResolvedValue({ data: { data: { ...scheduleRecord, onboarding_id: "other" } } });
    await expect(getOnboardingSchedule(id)).rejects.toThrow("does not match");
  });

  it.each([
    { data: null },
    { data: { ...scheduleRecord, status: "unknown" } },
    { data: { ...scheduleRecord, trigger_minute: 60 } },
    { data: { ...scheduleRecord, timezone: "Not/AZone" } },
    { data: { ...scheduleRecord, end_type: "after_runs", end_after_runs: null } },
    { data: { ...scheduleRecord, schedule_type: "weekly", days_of_week: [] } }
  ])("rejects malformed data instead of inventing a schedule: %j", async (body) => {
    mocks.get.mockResolvedValue({ data: body });
    await expect(getOnboardingSchedule(id)).rejects.toThrow();
  });

  it("requires backend confirmation of each action", async () => {
    mocks.put.mockResolvedValue({ data: { data: { ...scheduleRecord, status: "stopped" } } });
    await expect(updateOnboardingSchedule(id, schedulePayload(INITIAL_SIGNAL_SCHEDULE))).rejects.toThrow("not confirmed");
    mocks.post.mockResolvedValue({ data: { data: scheduleRecord } });
    await expect(stopOnboardingSchedule(id)).rejects.toThrow("not confirmed");
  });

  it("preserves the server's field-specific validation errors", () => {
    expect(scheduleFieldErrors({
      response: { status: 422, data: { error: {
        code: "VALIDATION_FAILED", message: "validation failed",
        details: [
          { path: "interval", message: "must be between 1 and 23 for hourly" },
          { path: "end_date", message: "must not be in the past" }
        ]
      } } }
    })).toEqual({
      interval: "must be between 1 and 23 for hourly",
      end_date: "must not be in the past"
    });
  });
});
