import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OnboardingScanSchedule } from "./onboarding-schedule-api";
import type { SignalSchedule } from "./signal-schedule-data";
import { INITIAL_SIGNAL_SCHEDULE, schedulePayload } from "./signal-schedule-data";
import { scheduleRecord } from "./schedule-test-fixtures";
import { scheduleKey, useSignalSchedule } from "./use-signal-schedule";

type Variables = { scope: string; id: string } & (
  { action: "stop" } | { action: "update"; draft: SignalSchedule }
);
type QueryOptions = {
  queryKey: readonly unknown[]; enabled: boolean; retry: boolean;
  queryFn: (context: { signal: AbortSignal }) => Promise<unknown>;
  refetchInterval: (query: { state: { data?: OnboardingScanSchedule | null; error?: unknown } }) => number | false;
};
type MutationOptions = {
  mutationFn: (variables: Variables) => Promise<unknown>;
  onMutate: (variables: Variables) => Promise<void>;
  onSuccess: (data: OnboardingScanSchedule, variables: Variables) => void;
  onError: (error: unknown, variables: Variables) => Promise<void>;
  retry: boolean;
};
const mocks = vi.hoisted(() => ({
  query: vi.fn<(options: QueryOptions) => unknown>(),
  mutation: vi.fn<(options: MutationOptions) => unknown>(),
  setQueryData: vi.fn(), cancelQueries: vi.fn(), invalidateQueries: vi.fn(),
  mutateAsync: vi.fn(), reset: vi.fn(), refetch: vi.fn(),
  get: vi.fn(), put: vi.fn(), stop: vi.fn(),
  refs: [] as { current: unknown }[]
}));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useEffect: () => {},
  useRef: (current: unknown) => {
    const ref = { current };
    mocks.refs.push(ref);
    return ref;
  }
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: mocks.query, useMutation: mocks.mutation,
  useQueryClient: () => ({
    setQueryData: mocks.setQueryData, cancelQueries: mocks.cancelQueries,
    invalidateQueries: mocks.invalidateQueries
  })
}));
vi.mock("./onboarding-schedule-api", () => ({
  getOnboardingSchedule: mocks.get,
  updateOnboardingSchedule: mocks.put,
  stopOnboardingSchedule: mocks.stop
}));
vi.mock("@/lib/axios", () => ({ axiosConfig: () => ({}) }));
vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "" } }));

const scope = "user:tenant";
const id = scheduleRecord.onboarding_id;
const variables: Variables = { scope, id, action: "update", draft: INITIAL_SIGNAL_SCHEDULE };

describe("schedule query and mutation lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.refs = [];
    mocks.query.mockReturnValue({
      data: scheduleRecord, isPending: false, isError: false, error: null, refetch: mocks.refetch
    });
    mocks.mutation.mockReturnValue({
      mutateAsync: mocks.mutateAsync, reset: mocks.reset, isPending: false, error: null
    });
    mocks.mutateAsync.mockResolvedValue(scheduleRecord);
  });

  it("scopes reads to the current user, tenant and onboarding and forwards cancellation", async () => {
    useSignalSchedule(scope, id, true);
    const query = mocks.query.mock.lastCall![0];
    expect(query).toMatchObject({ queryKey: scheduleKey(scope, id), enabled: true, retry: false });
    const signal = new AbortController().signal;
    await query.queryFn({ signal });
    expect(mocks.get).toHaveBeenCalledWith(id, signal);
  });

  it("does not request a schedule without its onboarding or authenticated scope", () => {
    useSignalSchedule("", id, true);
    expect(mocks.query.mock.lastCall![0].enabled).toBe(false);
    useSignalSchedule(scope, "", true);
    expect(mocks.query.mock.lastCall![0].enabled).toBe(false);
  });

  it("allows read-only access but rejects mutations at both public and transport boundaries", async () => {
    const flow = useSignalSchedule(scope, id, false);
    expect(mocks.query.mock.lastCall![0].enabled).toBe(true);
    expect(await flow.update(INITIAL_SIGNAL_SCHEDULE)).toBe(false);
    expect(await flow.stop()).toBe(false);
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    expect(() => mocks.mutation.mock.lastCall![0].mutationFn(variables)).toThrow("permission");
  });

  it("sends updates and stops only through their documented endpoints without retries", async () => {
    const flow = useSignalSchedule(scope, id, true);
    expect(await flow.update(INITIAL_SIGNAL_SCHEDULE)).toBe(true);
    expect(mocks.mutateAsync).toHaveBeenCalledWith(variables);
    const options = mocks.mutation.mock.lastCall![0];
    await options.mutationFn(variables);
    expect(mocks.put).toHaveBeenCalledWith(id, schedulePayload(INITIAL_SIGNAL_SCHEDULE));
    await options.mutationFn({ scope, id, action: "stop" });
    expect(mocks.stop).toHaveBeenCalledWith(id);
    expect(options.retry).toBe(false);
  });

  it("cancels older reads before writing and publishes only accepted server state", async () => {
    useSignalSchedule(scope, id, true);
    const options = mocks.mutation.mock.lastCall![0];
    await options.onMutate(variables);
    expect(mocks.cancelQueries).toHaveBeenCalledWith({ queryKey: scheduleKey(scope, id), exact: true });
    options.onSuccess(scheduleRecord, variables);
    expect(mocks.setQueryData).toHaveBeenCalledWith(scheduleKey(scope, id), scheduleRecord);
  });

  it("ignores late responses and new writes after the current tenant or onboarding changes", async () => {
    const flow = useSignalSchedule(scope, id, true);
    mocks.refs[0].current = { scope: "user:another-tenant", id, canManage: true };
    const options = mocks.mutation.mock.lastCall![0];
    options.onSuccess(scheduleRecord, variables);
    await options.onError({ response: { status: 404 } }, variables);
    expect(mocks.setQueryData).not.toHaveBeenCalled();
    expect(mocks.invalidateQueries).not.toHaveBeenCalled();
    expect(await flow.update(INITIAL_SIGNAL_SCHEDULE)).toBe(false);
    expect(() => options.mutationFn(variables)).toThrow("permission");
  });

  it("prevents duplicate clicks before mutation state has rerendered", async () => {
    let finish!: (value: unknown) => void;
    mocks.mutateAsync.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const flow = useSignalSchedule(scope, id, true);
    const first = flow.update(INITIAL_SIGNAL_SCHEDULE);
    expect(await flow.update(INITIAL_SIGNAL_SCHEDULE)).toBe(false);
    expect(mocks.mutateAsync).toHaveBeenCalledTimes(1);
    finish(scheduleRecord);
    expect(await first).toBe(true);
  });

  it("preserves the current schedule when a write fails and permits an explicit retry", async () => {
    mocks.mutateAsync.mockRejectedValueOnce(new Error("Unavailable"));
    const flow = useSignalSchedule(scope, id, true);
    expect(await flow.update(INITIAL_SIGNAL_SCHEDULE)).toBe(false);
    expect(mocks.setQueryData).not.toHaveBeenCalled();
    expect(await flow.update(INITIAL_SIGNAL_SCHEDULE)).toBe(true);
  });

  it("reloads a missing schedule after a write returns 404", async () => {
    useSignalSchedule(scope, id, true);
    await mocks.mutation.mock.lastCall![0].onError({ response: { status: 404 } }, variables);
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: scheduleKey(scope, id), exact: true });
  });

  it("polls only active schedules so completion and next-run changes remain server driven", () => {
    useSignalSchedule(scope, id, true);
    const interval = mocks.query.mock.lastCall![0].refetchInterval;
    expect(interval({ state: { data: scheduleRecord } })).toBe(30_000);
    for (const data of [null, { ...scheduleRecord, status: "stopped" }, { ...scheduleRecord, status: "completed" }] as const) {
      expect(interval({ state: { data } })).toBe(false);
    }
    expect(interval({ state: { data: scheduleRecord, error: new Error("Offline") } })).toBe(false);
  });

  it.each([null, { ...scheduleRecord, status: "stopped" }, { ...scheduleRecord, status: "completed" }])(
    "cannot stop a missing or inactive schedule",
    async (data) => {
      mocks.query.mockReturnValue({
        data, isPending: false, isError: false, error: null, refetch: mocks.refetch
      });
      expect(await useSignalSchedule(scope, id, true).stop()).toBe(false);
      expect(mocks.mutateAsync).not.toHaveBeenCalled();
    }
  );
});
