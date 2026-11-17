import { beforeEach, describe, expect, it, vi } from "vitest";
import { capacityBase, capacityError, capacityGet, capacityListAll, capacityWrite, downloadCapacityTemplate, enumLabel, formatNumber, uploadCapacityFile, uploadLimit, validateUpload } from "./api";
import { loadingGroups, loadingRows, productionPartStatus, thresholdLines } from "./analytics";
import type { LoadingCapacity } from "./api-types";

const client = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), request: vi.fn() }));
vi.mock("@/lib/axios", () => ({ axiosConfig: () => client }));
const envelope = (data: unknown) => ({ data: { status: true, code: 200, data } });

describe("capacity analytics transport", () => {
  beforeEach(() => vi.resetAllMocks());

  it("keeps warning production parts distinct from NG without calculating a status", () => {
    const part = { part_id: "part", part_number: "PN-1", line: { line_id: "line", line_code: "L01" } };
    expect(productionPartStatus({ ...part, line_status: "CAPACITY_STATUS_WARNING", bottleneck: true })).toEqual({ label: "Warning", color: "orange", alert: false });
    expect(productionPartStatus({ ...part, line_status: "CAPACITY_STATUS_NG", bottleneck: true })?.label).toBe("NG Bottleneck");
    expect(productionPartStatus({ ...part, line_status: "CAPACITY_STATUS_NG" })?.label).toBe("NG Overload");
    expect(productionPartStatus({ ...part, line_status: "CAPACITY_STATUS_NORMAL" })?.label).toBe("Normal");
    expect(productionPartStatus(part)).toBeUndefined();
  });

  it("unwraps objects and sends dotted analytics filters with cancellation", async () => {
    const signal = new AbortController().signal;
    const params = { year: 2026, month: 12, "filter.product_id": "product-1", plan: "prototype" };
    client.get.mockResolvedValue(envelope({ total_lines: 9 }));
    await expect(capacityGet("/capacity/dashboard", params, signal)).resolves.toEqual({ total_lines: 9 });
    expect(client.get).toHaveBeenCalledWith(`${capacityBase}/capacity/dashboard`, { params, signal });
    expect(params).not.toHaveProperty("tenant_id");
  });

  it("rejects malformed envelopes instead of displaying empty analytics", async () => {
    client.get.mockResolvedValue({ data: { items: [] } });
    await expect(capacityGet("/capacity/dashboard")).rejects.toThrow("invalid capacity response");
  });

  it("uses gateway cursor tokens until the final master-data page", async () => {
    client.get.mockResolvedValueOnce(envelope({ items: [{ id: "a" }], total_count: 2, next_page_token: "cursor-a" }))
      .mockResolvedValueOnce(envelope({ items: [{ id: "b" }], total_count: 2 }));
    await expect(capacityListAll("/production-lines", { search: "ASCC" })).resolves.toEqual([{ id: "a" }, { id: "b" }]);
    expect(client.get.mock.calls[1][1].params).toEqual({ search: "ASCC", page_size: 200, page_token: "cursor-a" });
  });

  it("rejects repeated page tokens rather than looping forever", async () => {
    client.get.mockResolvedValue(envelope({ items: [], next_page_token: "repeated" }));
    await expect(capacityListAll("/parts")).rejects.toThrow("repeated page token");
    expect(client.get).toHaveBeenCalledTimes(2);
  });

  it("does not swallow business validation errors", async () => {
    const error = { response: { status: 412, data: { error: { code: "FailedPrecondition", message: "Only 20000 pcs are left to move." } } } };
    client.request.mockRejectedValue(error);
    await expect(capacityWrite("/bridging-cases", { qty: 20001 })).rejects.toBe(error);
    expect(capacityError(error)).toBe("Only 20000 pcs are left to move.");
    expect(capacityError({ response: { status: 500, data: { error: { message: "private server detail" } } } })).not.toContain("private");
  });

  it("uploads the actual file as multipart, and preserves a FAILED result returned with HTTP 201", async () => {
    const file = new File(["example"], "marketing.xlsx");
    const result = { id: "upload-1", status: "DATA_UPLOAD_STATUS_FAILED", log: [{ level: "error", message: "Missing Part Number column" }] };
    client.post.mockResolvedValue(envelope(result));
    await expect(uploadCapacityFile("marketing-data", file)).resolves.toEqual(result);
    const [path, body, options] = client.post.mock.lastCall!;
    expect(path).toBe(`${capacityBase}/uploads/marketing-data`);
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("file").name).toBe("marketing.xlsx");
    expect(options.headers["Content-Type"]).toBeUndefined();
  });

  it("rejects non-xlsx and over-limit files before making a request", async () => {
    await expect(uploadCapacityFile("master-part", new File(["x"], "parts.csv"))).rejects.toThrow(".xlsx");
    expect(() => validateUpload({ name: "parts.xlsx", size: uploadLimit + 1 } as File)).toThrow("10 MB");
    expect(() => validateUpload({ name: "PARTS.XLSX", size: uploadLimit } as File)).not.toThrow();
    expect(client.post).not.toHaveBeenCalled();
  });

  it("downloads templates as binary files, not JSON", async () => {
    const blob = new Blob(["xlsx"]);
    client.get.mockResolvedValue({ data: blob });
    const click = vi.fn();
    const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:template");
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const link = { href: "", download: "", click };
    vi.stubGlobal("document", { createElement: () => link });
    try {
      await downloadCapacityTemplate("master-part");
      expect(client.get).toHaveBeenCalledWith(`${capacityBase}/uploads/templates/master-part`, { responseType: "blob" });
      expect(link.download).toBe("master-part-template.xlsx");
      expect(create).toHaveBeenCalledWith(blob);
      expect(click).toHaveBeenCalledOnce();
      expect(revoke).toHaveBeenCalledWith("blob:template");
    } finally { vi.unstubAllGlobals(); create.mockRestore(); revoke.mockRestore(); }
  });
});

describe("API-owned analytics mapping", () => {
  const line = { line_id: "line-1", line_code: "ASCC 03" };
  const capacity = { line, capacity_pct: 253, loading_pcs: 28033, available_pcs: 11059, daily_capacity_pcs: 502, status: "CAPACITY_STATUS_WARNING" };
  const response: LoadingCapacity = {
    thresholds: { warning_pct: 225, ng_pct: 325 },
    lines: [{ line, points: [
      { offset: -1, label: "N-1", capacity: { line, problem: "No production calendar" } },
      { offset: 0, label: "N", before: { ...capacity, capacity_pct: 320, loading_pcs: 30000 }, capacity },
      { offset: 2, label: "N+2", before: { ...capacity, capacity_pct: 290 }, capacity: { ...capacity, capacity_pct: 0 } },
    ] }],
  };

  it("maps N Before/After and N+2 Before/After independently and omits unknown bars without hiding zero", () => {
    expect(loadingGroups(response)[0].bars.map((bar) => [bar.label, bar.value])).toEqual([
      ["N Before", 320], ["N After", 253], ["N+2", 290], ["N+2 After", 0],
    ]);
  });

  it("maps resume loading in pieces and both monthly/daily available capacity", () => {
    expect(loadingRows(response)[0]).toMatchObject({
      n: "30,000", nAfter: "28,033", maxCap: "11,059 CM / 502 CD", ct: "-", n1: "-",
    });
  });

  it("uses tenant thresholds verbatim instead of classifying capacity in the frontend", () => {
    expect(thresholdLines(response.thresholds).map((line) => line.pct)).toEqual([225, 325]);
    expect(thresholdLines()).toEqual([]);
    expect(enumLabel("CAPACITY_STATUS_WARNING")).toBe("Warning");
    expect(enumLabel("CAPACITY_STATUS_NG")).toBe("NG");
    expect(enumLabel("BRIDGING_STATUS_PENDING_REVIEW")).toBe("Pending Review");
    expect(enumLabel("CAPACITY_STATUS_UNSPECIFIED")).toBe("-");
    expect(formatNumber(undefined, "%")).toBe("-");
    expect(formatNumber(0, "%")).toBe("0%");
  });
});
