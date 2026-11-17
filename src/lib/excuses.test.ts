import { describe, expect, it } from "vitest";
import { EXCUSES, PROBLEMS, TARGETS, TONES, generateExcuse, getPool } from "./excuses";

describe("excuse database", () => {
  it("has more than 50 excuses", () => {
    expect(EXCUSES.length).toBeGreaterThan(50);
  });

  it("has at least two excuses for every person, problem and tone combination", () => {
    for (const t of TARGETS)
      for (const p of PROBLEMS)
        for (const tone of TONES)
          expect(getPool(t.value, p.value, tone.value).length, `${t.value}/${p.value}/${tone.value}`).toBeGreaterThanOrEqual(2);
  });

  it("never repeats the same excuse twice in a row", () => {
    let prev: string | undefined;
    for (let i = 0; i < 30; i++) {
      const r = generateExcuse({ target: "boss", problem: "late", tone: "real", previousId: prev });
      expect(r.id).not.toBe(prev);
      prev = r.id;
    }
  });

  it("keeps believability between 1 and 99 percent", () => {
    for (const e of EXCUSES) {
      const r = generateExcuse({ target: "friend", problem: e.problem, tone: e.tone, extra: "x" }, () => 0.999);
      expect(r.score).toBeGreaterThanOrEqual(1);
      expect(r.score).toBeLessThanOrEqual(99);
    }
  });
});
