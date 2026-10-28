import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPortalSnapshot, savePortal } from "@/lib/portal-store";
import { initialPortalData } from "@/lib/portal-data";

describe("BABC demo storage", () => {
  let storage: Map<string, string>;
  beforeEach(() => {
    storage = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });
    vi.stubGlobal("window", { dispatchEvent: vi.fn() });
    getPortalSnapshot();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("preserves zero marks and isolates scores by subject assignment", () => {
    savePortal({ ...initialPortalData, scores: { "a1:0": { ca: 0, exam: 0 }, "a2:0": { ca: 40, exam: 60 } } });
    expect(getPortalSnapshot().scores["a1:0"]).toEqual({ ca: 0, exam: 0 });
    expect(getPortalSnapshot().scores["a2:0"]).toEqual({ ca: 40, exam: 60 });
  });
  it.each([{ ca: 41, exam: 20 }, { ca: -1, exam: 20 }, { ca: 20, exam: 61 }, { ca: 20, exam: NaN }])("rejects invalid marks without overwriting saved records: %o", score => {
    savePortal(initialPortalData);
    expect(() => savePortal({ ...initialPortalData, scores: { "a1:0": score } })).toThrow();
    expect(getPortalSnapshot().scores).toEqual({});
  });
  it("recovers safely from malformed or outdated browser data", () => {
    storage.set("babc-portal-demo-v1", "{broken");
    expect(getPortalSnapshot()).toEqual(initialPortalData);
    storage.set("babc-portal-demo-v1", JSON.stringify({ assignments: [] }));
    expect(getPortalSnapshot()).toEqual(initialPortalData);
  });
  it("keeps review decisions and meeting minutes on subsequent reads", () => {
    const data = structuredClone(initialPortalData);
    data.reviews[0].status = "Approved";
    data.reviews[0].comments.push({ author: "Academic lead", text: "Approved with feedback." });
    data.meetings[0].minutes = "Teachers agreed to coordinate assessment dates.";
    savePortal(data);
    expect(getPortalSnapshot().reviews[0].status).toBe("Approved");
    expect(getPortalSnapshot().reviews[0].comments.at(-1)?.text).toBe("Approved with feedback.");
    expect(getPortalSnapshot().meetings[0].minutes).toContain("assessment dates");
    expect(window.dispatchEvent).toHaveBeenCalledOnce();
  });
  it("reports unavailable storage instead of pretending that saving worked", () => {
    vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => { throw new Error("Quota exceeded"); } });
    expect(() => savePortal(initialPortalData)).toThrow("Quota exceeded");
    expect(window.dispatchEvent).not.toHaveBeenCalled();
  });
});
