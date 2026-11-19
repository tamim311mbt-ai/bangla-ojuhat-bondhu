import { describe, expect, it } from "vitest";
import { segmentGraphemes } from "./use-typewriter";

describe("segmentGraphemes", () => {
  it("keeps Bengali conjuncts (যুক্তবর্ণ) and vowel signs intact per grapheme cluster", () => {
    const sample = "বৃষ্টিতে আটকা পড়েছি!";
    const clusters = segmentGraphemes(sample);

    expect(clusters.join("")).toBe(sample);
    // "বৃ" and "ষ্টি" and "তে" should stay intact rather than splitting matras/hasant
    expect(clusters[0]).toBe("বৃ");
    expect(clusters[1]).toBe("ষ্টি");
    expect(clusters[2]).toBe("তে");
  });

  it("handles empty strings safely", () => {
    expect(segmentGraphemes("")).toEqual([]);
  });
});
