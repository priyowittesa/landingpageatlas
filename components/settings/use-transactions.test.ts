import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  downloadTransactionReceipt,
  printTransactionReceipt,
} from "./use-transactions";

const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/lib/axios", () => ({ axiosConfig: () => ({ get: mocks.get }) }));
vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "" } }));

describe("transaction receipt printing", () => {
  const receipt = new Blob(["%PDF-1.7 invoice"], { type: "application/pdf" });
  let printWindow: EventTarget & { focus: ReturnType<typeof vi.fn>; print: ReturnType<typeof vi.fn> };
  let frame: {
    title: string;
    src: string;
    style: { cssText: string };
    contentWindow: typeof printWindow | null;
    onload: (() => void) | null;
    onerror: (() => void) | null;
    remove: ReturnType<typeof vi.fn>;
  };
  let link: { href: string; download: string; click: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> };
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let pagePrint: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mocks.get.mockResolvedValue({
      data: receipt,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": 'attachment; filename="invoice.pdf"',
      },
    });
    printWindow = Object.assign(new EventTarget(), { focus: vi.fn(), print: vi.fn() });
    frame = {
      title: "", src: "", style: { cssText: "" }, contentWindow: printWindow,
      onload: null, onerror: null, remove: vi.fn(),
    };
    link = { href: "", download: "", click: vi.fn(), remove: vi.fn() };
    createObjectURL = vi.fn(() => "blob:invoice");
    revokeObjectURL = vi.fn();
    pagePrint = vi.fn();
    vi.stubGlobal("window", {
      URL: { createObjectURL, revokeObjectURL },
      print: pagePrint,
    });
    vi.stubGlobal("document", {
      createElement: vi.fn((tag: string) => tag === "iframe" ? frame : link),
      body: { appendChild: vi.fn() },
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("prints the same PDF endpoint as download, only after the PDF loads", async () => {
    await downloadTransactionReceipt("transaction-1");
    expect(link.download).toBe("invoice.pdf");
    expect(link.click).toHaveBeenCalledOnce();
    expect(createObjectURL).toHaveBeenLastCalledWith(receipt);
    revokeObjectURL.mockClear();

    const printing = printTransactionReceipt("transaction-1");
    await Promise.resolve();

    expect(mocks.get.mock.calls).toEqual([
      ["/v1/portal/transactions/transaction-1/receipt", { responseType: "blob" }],
      ["/v1/portal/transactions/transaction-1/receipt", { responseType: "blob" }],
    ]);
    const printedPdf = createObjectURL.mock.lastCall![0] as Blob;
    expect(printedPdf.type).toBe("application/pdf");
    expect(await printedPdf.text()).toBe(await receipt.text());
    expect(frame.src).toBe("blob:invoice");
    expect(document.body.appendChild).toHaveBeenLastCalledWith(frame);
    expect(printWindow.print).not.toHaveBeenCalled();

    frame.onload!();
    await printing;
    expect(printWindow.focus).toHaveBeenCalledOnce();
    expect(printWindow.print).toHaveBeenCalledOnce();
    expect(pagePrint).not.toHaveBeenCalled();
    expect(revokeObjectURL).not.toHaveBeenCalled();
    expect(frame.remove).not.toHaveBeenCalled();

    printWindow.dispatchEvent(new Event("afterprint"));
    expect(frame.remove).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:invoice");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("uses a PDF MIME type even if the response is generic binary data", async () => {
    mocks.get.mockResolvedValue({ data: new Blob(["%PDF invoice"]), headers: {} });
    const printing = printTransactionReceipt("transaction-1");
    await Promise.resolve();
    expect(createObjectURL.mock.lastCall![0].type).toBe("application/pdf");
    frame.onload!();
    await printing;
  });

  it("does not print the page or create a frame when fetching the PDF fails", async () => {
    mocks.get.mockRejectedValueOnce(new Error("offline"));
    await expect(printTransactionReceipt("transaction-1")).rejects.toThrow("offline");
    expect(document.createElement).not.toHaveBeenCalled();
    expect(pagePrint).not.toHaveBeenCalled();
  });

  it("cleans up when the PDF fails to load", async () => {
    const printing = printTransactionReceipt("transaction-1");
    const rejection = expect(printing).rejects.toThrow("Could not load");
    await Promise.resolve();
    frame.onerror!();
    await rejection;
    expect(frame.remove).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:invoice");
    expect(printWindow.print).not.toHaveBeenCalled();
  });

  it("reports a load timeout instead of leaving printing pending forever", async () => {
    const printing = printTransactionReceipt("transaction-1");
    const rejection = expect(printing).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(30_000);
    await rejection;
    expect(frame.remove).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:invoice");
    expect(pagePrint).not.toHaveBeenCalled();
  });

  it.each(["missing window", "print exception"])("cleans up on %s", async (failure) => {
    const printing = printTransactionReceipt("transaction-1");
    const rejection = expect(printing).rejects.toThrow();
    await Promise.resolve();
    if (failure === "missing window") frame.contentWindow = null;
    else printWindow.print.mockImplementationOnce(() => { throw new Error("Printing blocked"); });
    frame.onload!();
    await rejection;
    expect(frame.remove).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:invoice");
    expect(pagePrint).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("eventually releases the PDF if the viewer does not fire afterprint", async () => {
    const printing = printTransactionReceipt("transaction-1");
    await Promise.resolve();
    frame.onload!();
    await printing;
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(frame.remove).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:invoice");
  });
});
