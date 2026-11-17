import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Onboarding, OnboardingResponse } from "./onboarding-api";
import { OnboardingStateChanged } from "./onboarding-api";
import { onboardingKeys, onboardingPollInterval, useOnboarding } from "./use-onboarding";

type Variables = { action: "create" | "regenerate" | "activate"; scope: string; id?: string; name: string };
type QueryOptions = { queryKey: readonly unknown[]; enabled?: boolean; retry?: boolean; queryFn: (context: { signal: AbortSignal }) => Promise<unknown> };
type MutationOptions = {
  onMutate: (variables: Variables) => Promise<void>;
  mutationFn: (variables: Variables) => Promise<OnboardingResponse>;
  onSuccess: (data: OnboardingResponse, variables: Variables) => void;
  onError: (error: unknown, variables: Variables) => Promise<void>;
  retry: boolean;
};
const mocks = vi.hoisted(() => ({
  auth: vi.fn(), useQuery: vi.fn<(options: QueryOptions) => unknown>(),
  useMutation: vi.fn<(options: MutationOptions) => unknown>(),
  setQueryData: vi.fn(), invalidateQueries: vi.fn(), cancelQueries: vi.fn(),
  latestRefetch: vi.fn(), detailRefetch: vi.fn(), authRefetch: vi.fn(),
  mutate: vi.fn(), get: vi.fn(), post: vi.fn(), put: vi.fn(),
  refs: [] as Array<{ current: string | null }>,
  latest: null as Onboarding | null, detail: undefined as Onboarding | undefined
}));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useEffect: () => {},
  useRef: (initial: string | null) => {
    const ref = { current: initial };
    mocks.refs.push(ref);
    return ref;
  }
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: mocks.useQuery, useMutation: mocks.useMutation,
  useQueryClient: () => ({ setQueryData: mocks.setQueryData, invalidateQueries: mocks.invalidateQueries, cancelQueries: mocks.cancelQueries })
}));
vi.mock("@/hooks/useAuthMe", () => ({ useAuthMe: mocks.auth }));
vi.mock("@/lib/axios", () => ({ axiosConfig: () => ({ get: mocks.get, post: mocks.post, put: mocks.put }) }));
vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "" } }));

const scope = "user-1:tenant-1";
const record: Onboarding = { id: "onboarding-1", status: "ready", version: 3, name: "Example Company" };
const variables: Variables = { action: "activate", scope, id: record.id, name: record.name! };
const backendError = (code: string, status: number) => ({ response: { status, data: { error: { code } } } });
function profile(level = "full_access") {
  return {
    data: {
      user_id: "user-1", tenant_id: "tenant-1", company: { company_name: "Example Company" },
      rbac: { modules: [{
        id: "parent", key: "operation-inteliggence", name: "Operation Intelligence", href: "operation-intelligence",
        sub_modules: [{ id: "child", key: "predictive-actions", name: "Predictive Actions", href: "predictive-actions", access_level: level }]
      }] }
    }, isError: false, error: null, isFetchedAfterMount: true, refetch: mocks.authRefetch
  };
}

describe("onboarding lifecycle and recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.refs = [];
    mocks.latest = null;
    mocks.detail = undefined;
    mocks.auth.mockReturnValue(profile());
    mocks.invalidateQueries.mockResolvedValue(undefined);
    mocks.useMutation.mockReturnValue({ reset: vi.fn(), mutate: mocks.mutate, isPending: false, error: null });
    mocks.useQuery.mockImplementation((options) => {
      const latest = options.queryKey.at(-1) === "latest";
      const pack = options.queryKey[2] === "industry-pack";
      return {
        data: pack ? undefined : latest ? mocks.latest : mocks.detail,
        isPending: !latest && !mocks.detail, error: null,
        refetch: latest ? mocks.latestRefetch : mocks.detailRefetch
      };
    });
  });

  it("scopes caches to the authenticated user and tenant and starts with the list", () => {
    const flow = useOnboarding();
    expect(flow.scope).toBe(scope);
    expect(mocks.useQuery.mock.calls[0][0]).toMatchObject({
      queryKey: onboardingKeys.latest(scope), enabled: true, retry: false
    });
    expect(mocks.useQuery.mock.calls[1][0].enabled).toBe(false);
    flow.generate();
    expect(mocks.mutate).toHaveBeenCalledWith({ action: "create", scope, id: undefined, name: "Example Company" });
  });

  it("uses the saved onboarding identifier for detail polling", () => {
    mocks.latest = { ...record, status: "generating" };
    useOnboarding();
    expect(mocks.useQuery.mock.calls[1][0]).toMatchObject({
      queryKey: onboardingKeys.detail(scope, record.id), enabled: true
    });
  });

  it.each(["no_access", "unknown"])("never requests onboarding data without a valid route grant: %s", (access) => {
    mocks.auth.mockReturnValue(profile(access));
    const flow = useOnboarding();
    expect(mocks.useQuery.mock.calls.every(([options]) => options.enabled === false)).toBe(true);
    flow.generate();
    expect(mocks.mutate).not.toHaveBeenCalled();
    expect(flow.refresh).toBe(mocks.authRefetch);
  });

  it("does not use a cached grant before auth/me has been refreshed", () => {
    mocks.auth.mockReturnValue({ ...profile(), isFetchedAfterMount: false });
    useOnboarding();
    expect(mocks.useQuery.mock.calls.every(([options]) => options.enabled === false)).toBe(true);
  });

  it("permits viewing but prevents writes with view-only access", async () => {
    mocks.auth.mockReturnValue(profile("view_only"));
    const flow = useOnboarding();
    expect(mocks.useQuery.mock.calls[0][0].enabled).toBe(true);
    expect(flow.canManage).toBe(false);
    flow.generate();
    expect(mocks.mutate).not.toHaveBeenCalled();
    await expect(mocks.useMutation.mock.lastCall![0].mutationFn(variables)).rejects.toThrow("permission");
  });

  it("publishes accepted server state without another automatic mutation retry", () => {
    useOnboarding();
    const options = mocks.useMutation.mock.lastCall![0];
    options.onSuccess({ record, warnings: [] }, variables);
    expect(options.retry).toBe(false);
    expect(mocks.setQueryData).toHaveBeenCalledWith(onboardingKeys.latest(scope), record);
    expect(mocks.setQueryData).toHaveBeenCalledWith(onboardingKeys.detail(scope, record.id), record);
  });

  it("cancels older reads before a write so a stale list cannot overwrite its result", async () => {
    useOnboarding();
    await mocks.useMutation.mock.lastCall![0].onMutate(variables);
    expect(mocks.cancelQueries).toHaveBeenCalledWith({ queryKey: ["ai-engine", scope, "onboardings"] });
  });

  it.each([
    { code: "DUPLICATE", status: 409, action: "create" as const },
    { code: "AI_ENGINE_UNAVAILABLE", status: 502, action: "create" as const },
    { code: "NotFound", status: 404, action: "regenerate" as const }
  ])("reloads the list after $code ($status) during $action", async ({ code, status, action }) => {
    useOnboarding();
    await mocks.useMutation.mock.lastCall![0].onError(backendError(code, status), { ...variables, action });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: onboardingKeys.latest(scope), exact: true });
  });

  it("moves an already-running generation to polling instead of retrying the POST", async () => {
    mocks.latest = { ...record, status: "failed", status_message: "Previous attempt failed" };
    useOnboarding();
    await mocks.useMutation.mock.lastCall![0].onError(backendError("GENERATION_RUNNING", 409), { ...variables, action: "regenerate" });
    expect(mocks.setQueryData).toHaveBeenCalledWith(
      onboardingKeys.detail(scope, record.id), expect.objectContaining({ status: "generating", status_message: null })
    );
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it("refreshes the full record on a version conflict without silently retrying activation", async () => {
    useOnboarding();
    await mocks.useMutation.mock.lastCall![0].onError(backendError("VERSION_CONFLICT", 409), variables);
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: onboardingKeys.detail(scope, record.id), exact: true });
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("loads changed server status when pre-activation validation discovers generation in progress", async () => {
    useOnboarding();
    const generating = { ...record, status: "generating" as const };
    await mocks.useMutation.mock.lastCall![0].onError(new OnboardingStateChanged(generating), variables);
    expect(mocks.setQueryData).toHaveBeenCalledWith(onboardingKeys.detail(scope, record.id), generating);
  });

  it("does not apply or recover a response after the authenticated tenant changes", async () => {
    useOnboarding();
    mocks.refs[0].current = "user-1:another-tenant";
    const options = mocks.useMutation.mock.lastCall![0];
    options.onSuccess({ record, warnings: [] }, variables);
    await options.onError(backendError("VERSION_CONFLICT", 409), variables);
    expect(mocks.setQueryData).not.toHaveBeenCalled();
    expect(mocks.invalidateQueries).not.toHaveBeenCalled();
    await expect(options.mutationFn(variables)).rejects.toThrow("permission");
  });
});

describe("server-driven polling", () => {
  it("polls every four seconds only while generation is running", () => {
    expect(onboardingPollInterval({ state: { data: { ...record, status: "generating" } } })).toBe(4000);
    for (const status of ["ready", "failed"] as const) {
      expect(onboardingPollInterval({ state: { data: { ...record, status } } })).toBe(false);
    }
    expect(onboardingPollInterval({ state: {} })).toBe(false);
    expect(onboardingPollInterval({ state: { data: { ...record, status: "generating" }, error: new Error("Offline") } })).toBe(false);
  });
});
