import { afterEach, describe, expect, it, vi } from "vitest";
import { PROBLEMS, formatCustomExcuseBadge } from "./excuses";
import {
  GEMINI_MAX_OUTPUT_TOKENS,
  GEMINI_MODEL,
  GEMINI_THINKING_BUDGET,
  GEMINI_TIMEOUT_MS,
  buildPrompt,
  extractLiveExcuseText,
  generateExcuseWithGemini,
} from "./gemini-excuse";

function makeApiError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

async function* makeTextStream(chunks: string[]) {
  for (const text of chunks) {
    yield { text };
  }
}

describe("generateExcuseWithGemini", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses gemini-2.5-flash, thinkingBudget: 0, maxOutputTokens: 250, and 5s timeout", () => {
    expect(GEMINI_MODEL).toBe("gemini-2.5-flash");
    expect(GEMINI_THINKING_BUDGET).toBe(0);
    expect(GEMINI_MAX_OUTPUT_TOKENS).toBe(250);
    expect(GEMINI_TIMEOUT_MS).toBe(5000);
  });

  it("prioritizes custom text in Gemini prompt and ignores upper dropdown selections", () => {
    const prompt = buildPrompt({
      target: "boss",
      problem: "late",
      tone: "real",
      customText: "আপুর মোবাইল নষ্ট করে ফেলেছি",
    });

    expect(prompt).toContain("আপুর মোবাইল নষ্ট করে ফেলেছি");
    expect(prompt).not.toContain("প্রাপক:");
    expect(prompt).not.toContain("সমস্যা:");
    expect(prompt).not.toContain("পৌঁছাতে দেরি হচ্ছে");
  });

  it("builds contextual Bangladeshi Gemini prompts for every dropdown problem category", () => {
    for (const p of PROBLEMS) {
      const prompt = buildPrompt({
        target: "friend",
        problem: p.value,
        tone: "funny",
      });
      expect(prompt).toContain(p.label);
      expect(prompt).toContain("প্রাসঙ্গিক বাংলাদেশি প্রেক্ষাপট:");
    }
  });

  it("streams Bengali text word-by-word from server stream", async () => {
    const emitted: string[] = [];

    const fetchStream = vi.fn(async () =>
      makeTextStream([
        "আপু, বিশ্বাস করো ",
        "সফটওয়্যার আপডেট ",
        "নিতে গিয়েই ফোনটা হ্যাং হয়ে গেছে।",
        "\nSC",
        "ORE: 88\n",
        "TIP: একদম নিষ্পাপ চেহারা রাখো!",
      ]),
    );

    const result = await generateExcuseWithGemini(
      { target: "boss", problem: "late", tone: "real", customText: "আপুর মোবাইল নষ্ট করে ফেলেছি" },
      {
        fetchStream,
        onChunk: (partial) => emitted.push(partial),
      },
    );

    expect(emitted).toEqual([
      "আপু, বিশ্বাস করো ",
      "আপু, বিশ্বাস করো সফটওয়্যার আপডেট ",
      "আপু, বিশ্বাস করো সফটওয়্যার আপডেট নিতে গিয়েই ফোনটা হ্যাং হয়ে গেছে।",
    ]);
    expect(result.message).toBe("আপু, বিশ্বাস করো সফটওয়্যার আপডেট নিতে গিয়েই ফোনটা হ্যাং হয়ে গেছে।");
    expect(result.score).toBe(88);
    expect(result.tip).toBe("একদম নিষ্পাপ চেহারা রাখো!");
  });

  it("extractLiveExcuseText strips partial SCORE/TIP markers cleanly", () => {
    expect(extractLiveExcuseText("মামা, নেট চলে গেছে।\nSC")).toBe("মামা, নেট চলে গেছে।");
    expect(extractLiveExcuseText("মামা, নেট চলে গেছে।\nSCORE: 91\nTIP: চুপ থাকো।")).toBe(
      "মামা, নেট চলে গেছে।",
    );
  });

  it("falls back to topic-matched & name-aware Bengali excuse on server error", async () => {
    const fetchStream = vi.fn(async () => {
      throw makeApiError(503, '{"error":{"code":503,"status":"UNAVAILABLE"}}');
    });

    const result = await generateExcuseWithGemini(
      {
        target: "boss",
        problem: "late",
        tone: "real",
        customText: "আপুর মোবাইল নষ্ট করে ফেলেছি",
      },
      { fetchStream },
    );

    expect(result.message).toContain("আপু");
    expect(result.message).not.toMatch(/জ্যাম|রিকশা|ডেলিভারি/);
    expect(result.customBadge).toBe(formatCustomExcuseBadge("real"));
  });

  it("falls back to keyword-matched local excuse when Gemini times out", async () => {
    const fetchStream = vi.fn(
      () =>
        new Promise<AsyncIterable<{ text?: string | undefined }>>(() => {
          // Never resolves to simulate stalled connection
        }),
    );

    const customInput = "রাহাতকে টাকা দিতে দেরি হচ্ছে";
    const result = await generateExcuseWithGemini(
      { target: "boss", problem: "late", tone: "real", customText: customInput },
      { fetchStream, timeoutMs: 30 },
    );

    expect(result.message).toContain("রাহাত");
    expect(result.message).not.toContain(customInput);
    expect(result.message).not.toMatch(/জ্যাম|রিকশা|ডেলিভারি/);
  });
});
