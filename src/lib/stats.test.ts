import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BASE_EXCUSES,
  BASE_VISITORS,
  formatBanglaCount,
  getInitialStats,
  recordExcuseGenerated,
  recordPageVisit,
} from "./stats";

describe("stats counter service", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("formats numbers in Bangla with commas", () => {
    expect(formatBanglaCount(1250)).toBe("১,২৫০");
    expect(formatBanglaCount(3420)).toBe("৩,৪২০");
  });

  it("initializes with base counts and increments cleanly via localStorage fallback", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    expect(getInitialStats()).toEqual({
      visitors: BASE_VISITORS,
      excuses: BASE_EXCUSES,
    });

    const nextVisitors = await recordPageVisit();
    expect(nextVisitors).toBe(BASE_VISITORS + 1);

    const nextExcuses = await recordExcuseGenerated();
    expect(nextExcuses).toBe(BASE_EXCUSES + 1);

    expect(getInitialStats()).toEqual({
      visitors: BASE_VISITORS + 1,
      excuses: BASE_EXCUSES + 1,
    });
  });

  it("syncs with remote counter API values when online", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ value: "15" }),
      }),
    );

    const visitors = await recordPageVisit();
    expect(visitors).toBe(BASE_VISITORS + 15);
  });
});
