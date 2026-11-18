import { afterEach, describe, expect, it } from "vitest";
import {
  EXCUSES,
  PROBLEMS,
  TARGETS,
  TONES,
  clearSeenExcuses,
  formatCustomExcuseBadge,
  formatExcuseCardBadge,
  generateExcuse,
  generateSmartLocalExcuse,
  getPool,
  getSeenExcuseCount,
  getTotalUniqueVariationCount,
} from "./excuses";

describe("excuse database", () => {
  afterEach(() => {
    clearSeenExcuses();
  });

  it("provides at least 1167 distinct base excuses across all 13 categories", () => {
    expect(EXCUSES.length).toBeGreaterThanOrEqual(1167);
    const uniqueIds = new Set(EXCUSES.map((e) => e.id));
    const uniqueTexts = new Set(EXCUSES.map((e) => e.text));
    expect(uniqueIds.size).toBe(EXCUSES.length);
    expect(uniqueTexts.size).toBe(EXCUSES.length);
  });

  it("keeps all 5 original problem categories and includes all 8 new Bangladeshi categories", () => {
    expect(PROBLEMS.map((p) => p.value)).toEqual([
      "late",
      "work",
      "event",
      "call",
      "money",
      "loan_delay",
      "missed_reply",
      "avoid_treat",
      "assignment_missed",
      "leave_request",
      "cancel_plan",
      "no_charge_net",
      "overslept",
    ]);
  });

  it("provides over 1,000+ total unique excuse variations via base + combinator", () => {
    expect(getTotalUniqueVariationCount()).toBeGreaterThanOrEqual(1000);
  });

  it("has at least 25 distinct base excuses for every recipient, problem and tone combination", () => {
    for (const t of TARGETS) {
      for (const p of PROBLEMS) {
        for (const tone of TONES) {
          expect(
            getPool(t.value, p.value, tone.value).length,
            `${t.value}/${p.value}/${tone.value}`,
          ).toBeGreaterThanOrEqual(25);
        }
      }
    }
  });

  it("tracks seen excuses in sessionStorage and guarantees zero repetition", () => {
    clearSeenExcuses();
    const seenMessages = new Set<string>();

    for (let i = 0; i < 60; i++) {
      const r = generateSmartLocalExcuse({ target: "boss", problem: "late", tone: "real" });
      expect(seenMessages.has(r.message)).toBe(false);
      seenMessages.add(r.message);
    }

    expect(seenMessages.size).toBe(60);
    expect(getSeenExcuseCount()).toBeGreaterThanOrEqual(60);
  });

  it("never repeats the same excuse twice in a row in generateExcuse", () => {
    let prev: string | undefined;
    for (let i = 0; i < 30; i++) {
      const r = generateExcuse({ target: "boss", problem: "late", tone: "real", previousId: prev });
      expect(r.id).not.toBe(prev);
      prev = r.id;
    }
  });

  it("keeps believability between 1 and 99 percent", () => {
    for (const e of EXCUSES) {
      clearSeenExcuses();
      const r = generateExcuse(
        { target: "friend", problem: e.problem, tone: e.tone, extra: "x" },
        () => 0.999,
      );
      expect(r.score).toBeGreaterThanOrEqual(1);
      expect(r.score).toBeLessThanOrEqual(99);
    }
  });

  it("returns target, tone, and formatted card badge label", () => {
    const r = generateExcuse({ target: "boss", problem: "late", tone: "funny" });
    expect(r.target).toBe("boss");
    expect(r.tone).toBe("funny");
    expect(formatExcuseCardBadge(r.target, r.tone)).toBe("অফিসের বসের জন্য • হাস্যকর অজুহাত");
  });

  it("overrides dropdowns via custom text keywords without pasting raw user text", () => {
    const customInput = "বন্ধুর কাছে টাকা ধার চাইবো কীভাবে বলবো";
    const r = generateSmartLocalExcuse({
      target: "boss",
      problem: "late",
      tone: "real",
      customText: customInput,
    });
    expect(r.target).toBe("friend");
    expect(r.message).not.toContain(customInput);
    expect(r.message).not.toContain("এর কারণেই একটু আটকে গেছি");
    expect(r.message).toMatch(/টাকা|ধার|দোস্ত|মামা|ভাই/);
    expect(r.customBadge).toBe(formatCustomExcuseBadge("real"));
    expect(r.score).toBeGreaterThanOrEqual(1);
    expect(r.score).toBeLessThanOrEqual(99);
  });

  it("handles roast requests naturally without pasting the prompt text inside quotes", () => {
    const customInput = "বন্ধুকে পচানো যখন সে ট্রিট দেয় না";
    const r = generateSmartLocalExcuse({
      target: "boss",
      problem: "late",
      tone: "funny",
      customText: customInput,
    });
    expect(r.target).toBe("friend");
    expect(r.message).not.toContain(customInput);
    expect(r.message).toMatch(/ট্রিট|দোস্ত|মামা|ভাই/);
    expect(r.customBadge).toBe(formatCustomExcuseBadge("funny"));
  });
});
