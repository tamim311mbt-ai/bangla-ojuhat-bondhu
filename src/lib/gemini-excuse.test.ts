import { afterEach, describe, expect, it, vi } from "vitest";
import type { GenerateContentParameters } from "@google/genai";
import { formatCustomExcuseBadge } from "./excuses";
import {
  GEMINI_MAX_OUTPUT_TOKENS,
  GEMINI_MODEL,
  GEMINI_THINKING_BUDGET,
  GEMINI_TIMEOUT_MS,
  extractLiveExcuseText,
  generateExcuseWithGemini,
  resolveGeminiApiKey,
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

  it("uses gemini-3.8-flash, thinkingBudget: 0, maxOutputTokens: 250, and 5s timeout", () => {
    expect(GEMINI_MODEL).toBe("gemini-3.8-flash");
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

  it("silently falls back to smart local Bengali excuse when API key is missing", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");

    const result = await generateExcuseWithGemini({
      target: "boss",
      problem: "late",
      tone: "funny",
      customText: "মিরপুরে বৃষ্টি আর জ্যাম",
    });

    expect(result.message).toContain("মিরপুরে বৃষ্টি আর জ্যাম");
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

    expect(calls).toEqual(["gemini-3.8-flash"]);
    expect(result.message.length).toBeGreaterThan(10);
    expect(result.customBadge).toBe(formatCustomExcuseBadge("funny"));
  });

  it("silently falls back to local excuse dictionary on 429 rate limit", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "AQ.test_key");

    const generateContentStream = vi.fn(async () => {
      throw makeApiError(429, "RESOURCE_EXHAUSTED");
    });

    const result = await generateExcuseWithGemini(
      { target: "partner", problem: "call", tone: "emotional" },
      { generateContentStream },
    );

    expect(generateContentStream).toHaveBeenCalledTimes(1);
    expect(result.target).toBe("partner");
    expect(result.tone).toBe("emotional");
    expect(result.message.length).toBeGreaterThan(10);
  });

  it("silently falls back to local excuse dictionary when Gemini times out", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "AQ.test_key");

    const generateContentStream = vi.fn(
      () =>
        new Promise<AsyncIterable<{ text?: string | undefined }>>(() => {
          // Never resolves to simulate stalled connection
        }),
    );

    const result = await generateExcuseWithGemini(
      { target: "teacher", problem: "work", tone: "real", customText: "অ্যাসাইনমেন্ট বাকি" },
      { generateContentStream, timeoutMs: 30 },
    );

    expect(result.message).toContain("অ্যাসাইনমেন্ট বাকি");
    expect(result.target).toBe("teacher");
  });
});
