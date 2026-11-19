import { afterEach, describe, expect, it, vi } from "vitest";
import type { GenerateContentParameters } from "@google/genai";
import { PROBLEMS, formatCustomExcuseBadge } from "./excuses";
import {
  CUSTOM_SYSTEM_INSTRUCTION,
  GEMINI_MAX_OUTPUT_TOKENS,
  GEMINI_MODEL,
  GEMINI_THINKING_BUDGET,
  GEMINI_TIMEOUT_MS,
  buildPrompt,
  extractLiveExcuseText,
  generateExcuseWithGemini,
  resolveGeminiApiKey,
  resolveSystemInstruction,
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
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("uses gemini-2.5-flash, thinkingBudget: 0, maxOutputTokens: 250, and 5s timeout", () => {
    expect(GEMINI_MODEL).toBe("gemini-2.5-flash");
    expect(GEMINI_THINKING_BUDGET).toBe(0);
    expect(GEMINI_MAX_OUTPUT_TOKENS).toBe(250);
    expect(GEMINI_TIMEOUT_MS).toBe(5000);
  });

  it("falls back to process.env.GEMINI_API_KEY when VITE_GEMINI_API_KEY is unset", () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "AQ.fallback_test_key");

    expect(resolveGeminiApiKey()).toBe("AQ.fallback_test_key");
  });

  it("prefers VITE_GEMINI_API_KEY over process.env.GEMINI_API_KEY", () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "AQ.vite_test_key");
    vi.stubEnv("GEMINI_API_KEY", "AQ.node_test_key");

    expect(resolveGeminiApiKey()).toBe("AQ.vite_test_key");
  });

  it("prioritizes custom text in Gemini prompt with custom system instruction and ignores dropdowns", () => {
    const input = {
      target: "boss" as const,
      problem: "late" as const,
      tone: "real" as const,
      customText: "আপুর মোবাইল নষ্ট করে ফেলেছি",
    };
    const prompt = buildPrompt(input);
    const sys = resolveSystemInstruction(input);

    expect(prompt).toContain("আপুর মোবাইল নষ্ট করে ফেলেছি");
    expect(prompt).not.toContain("প্রাপক:");
    expect(prompt).not.toContain("সমস্যা:");
    expect(prompt).not.toContain("পৌঁছাতে দেরি হচ্ছে");
    expect(sys).toBe(CUSTOM_SYSTEM_INSTRUCTION);
    expect(sys).toContain(
      "Do NOT talk about traffic or being late unless the user asked about being late.",
    );
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

  it("silently falls back to relevant local Bengali excuse without pasting raw custom text", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");

    const customInput = "মিরপুরে বৃষ্টি আর জ্যাম তাই অফিসে দেরি হচ্ছে";
    const result = await generateExcuseWithGemini({
      target: "friend",
      problem: "avoid_treat",
      tone: "funny",
      customText: customInput,
    });

    expect(result.target).toBe("boss");
    expect(result.message).not.toContain(customInput);
    expect(result.message).not.toContain("এর কারণেই একটু আটকে গেছি");
    expect(result.customBadge).toBe(formatCustomExcuseBadge("funny"));
    expect(result.score).toBeGreaterThanOrEqual(1);
    expect(result.score).toBeLessThanOrEqual(99);
  });

  it("streams Bengali text word-by-word with thinkingBudget: 0 and maxOutputTokens: 250", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "AQ.test_key");
    const emitted: string[] = [];
    let capturedConfig: GenerateContentParameters["config"];

    const generateContentStream = vi.fn(async (params: GenerateContentParameters) => {
      capturedConfig = params.config;
      return makeTextStream([
        "বস, রাস্তায় ",
        "পানি জমে ",
        "রিকশা আটকে গেছে।",
        "\nSC",
        "ORE: 88\n",
        "TIP: একটু ভেজা চুলের সেলফি রেডি রাখুন!",
      ]);
    });

    const result = await generateExcuseWithGemini(
      { target: "boss", problem: "late", tone: "real" },
      {
        generateContentStream,
        onChunk: (partial) => emitted.push(partial),
      },
    );

    expect(capturedConfig).toMatchObject({
      maxOutputTokens: 250,
      thinkingConfig: { thinkingBudget: 0 },
    });
    expect(emitted).toEqual([
      "বস, রাস্তায় ",
      "বস, রাস্তায় পানি জমে ",
      "বস, রাস্তায় পানি জমে রিকশা আটকে গেছে।",
    ]);
    expect(result.message).toBe("বস, রাস্তায় পানি জমে রিকশা আটকে গেছে।");
    expect(result.score).toBe(88);
    expect(result.tip).toBe("একটু ভেজা চুলের সেলফি রেডি রাখুন!");
  });

  it("extractLiveExcuseText strips partial SCORE/TIP markers cleanly", () => {
    expect(extractLiveExcuseText("মামা, নেট চলে গেছে।\nSC")).toBe("মামা, নেট চলে গেছে।");
    expect(extractLiveExcuseText("মামা, নেট চলে গেছে।\nSCORE: 91\nTIP: চুপ থাকো।")).toBe(
      "মামা, নেট চলে গেছে।",
    );
  });

  it("silently falls back to local excuse dictionary on 503 without slow retries", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "AQ.test_key");
    const calls: string[] = [];

    const generateContentStream = vi.fn(async (params: GenerateContentParameters) => {
      calls.push(params.model);
      throw makeApiError(503, '{"error":{"code":503,"status":"UNAVAILABLE"}}');
    });

    const result = await generateExcuseWithGemini(
      {
        target: "friend",
        problem: "event",
        tone: "funny",
        customText: "বন্ধুকে পচানো",
      },
      { generateContentStream },
    );

    expect(calls).toEqual(["gemini-2.5-flash"]);
    expect(result.message.length).toBeGreaterThan(10);
    expect(result.customBadge).toBe(formatCustomExcuseBadge("funny"));
  });

  it("falls back to phone/gadget topic bank when custom situation is about breaking a phone", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");

    const result = await generateExcuseWithGemini({
      target: "boss",
      problem: "late",
      tone: "funny",
      customText: "আপুর মোবাইল নষ্ট করে ফেলেছি",
    });

    expect(result.target).toBe("parents");
    expect(result.message).toMatch(/আপডেট|চার্জ|ব্যাটারি|বিড়াল|স্ক্রিন|ডিসপ্লে|ডিভাইস|মোবাইল|গ্যাজেট/);
    expect(result.message).not.toMatch(/ডেলিভারি|রিকশা|ট্রাফিক জ্যাম/);
  });

  it("silently falls back to local excuse dictionary on 429 rate limit", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "AQ.test_key");

    const generateContentStream = vi.fn(async () => {
      throw makeApiError(429, "RESOURCE_EXHAUSTED");
    });

    const result = await generateExcuseWithGemini(
      { target: "partner", problem: "overslept", tone: "emotional" },
      { generateContentStream },
    );

    expect(generateContentStream).toHaveBeenCalledTimes(1);
    expect(result.target).toBe("partner");
    expect(result.tone).toBe("emotional");
    expect(result.message.length).toBeGreaterThan(10);
  });

  it("silently falls back to keyword-matched local excuse when Gemini times out", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "AQ.test_key");

    const generateContentStream = vi.fn(
      () =>
        new Promise<AsyncIterable<{ text?: string | undefined }>>(() => {
          // Never resolves to simulate stalled connection
        }),
    );

    const customInput = "অ্যাসাইনমেন্ট জমা দিতে পারিনি";
    const result = await generateExcuseWithGemini(
      { target: "boss", problem: "late", tone: "real", customText: customInput },
      { generateContentStream, timeoutMs: 30 },
    );

    expect(result.target).toBe("teacher");
    expect(result.message).not.toContain(customInput);
    expect(result.message).not.toContain("এর কারণেই একটু আটকে গেছি");
  });
});
