import { afterEach, describe, expect, it, vi } from "vitest";
import type { GenerateContentParameters } from "@google/genai";
import { PROBLEMS, formatCustomExcuseBadge } from "./excuses";
import {
  CUSTOM_SYSTEM_INSTRUCTION,
  GEMINI_BUSY_ERROR_MESSAGE,
  GEMINI_MAX_OUTPUT_TOKENS,
  GEMINI_MAX_RETRIES,
  GEMINI_MODEL,
  GEMINI_THINKING_BUDGET,
  GEMINI_TIMEOUT_MS,
  GeminiUnavailableError,
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

  it("uses gemini-2.5-flash, thinkingBudget: 0, maxOutputTokens: 250, 7s timeout, and 2 max retries", () => {
    expect(GEMINI_MODEL).toBe("gemini-2.5-flash");
    expect(GEMINI_THINKING_BUDGET).toBe(0);
    expect(GEMINI_MAX_OUTPUT_TOKENS).toBe(250);
    expect(GEMINI_TIMEOUT_MS).toBe(7000);
    expect(GEMINI_MAX_RETRIES).toBe(2);
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
    expect(prompt).toContain("সম্পূর্ণ উপেক্ষা করো");
    expect(prompt).not.toContain("প্রাপক:");
    expect(prompt).not.toContain("সমস্যা:");
    expect(prompt).not.toContain("পৌঁছাতে দেরি হচ্ছে");
    expect(sys).toBe(CUSTOM_SYSTEM_INSTRUCTION);
    expect(sys).toContain("100% IGNORE ALL UPPER DROPDOWN PRESETS");
    expect(sys).toContain(
      "Do NOT talk about traffic or being late unless the user asked about being late.",
    );
  });

  it("instructs Gemini to infer full context even from 1-2 short or incomplete Bengali words", () => {
    for (const shortWord of ["বাবার", "পরীক্ষা"]) {
      const input = {
        target: "boss" as const,
        problem: "late" as const,
        tone: "funny" as const,
        customText: shortWord,
      };
      const prompt = buildPrompt(input);
      const sys = resolveSystemInstruction(input);

      expect(prompt).toContain(shortWord);
      expect(prompt).toContain("১-২টি অসম্পূর্ণ শব্দও হয়");
      expect(prompt).not.toContain("প্রাপক:");
      expect(sys).toContain("UNDERSTAND EVEN SHORT OR INCOMPLETE WORDS");
    }
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

  it("throws GeminiUnavailableError instead of falling back to local excuses when API key is missing", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");

    const promise = generateExcuseWithGemini({
      target: "friend",
      problem: "avoid_treat",
      tone: "funny",
      customText: "বাবার",
    });

    await expect(promise).rejects.toBeInstanceOf(GeminiUnavailableError);
    await expect(promise).rejects.toThrow(GEMINI_BUSY_ERROR_MESSAGE);
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

  it("auto-retries up to 2 times on transient failures and succeeds if the 3rd attempt returns valid Bengali text", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "AQ.test_key");
    const retryEvents: number[] = [];

    const generateContentStream = vi
      .fn()
      .mockRejectedValueOnce(makeApiError(503, '{"error":{"code":503,"status":"UNAVAILABLE"}}'))
      .mockRejectedValueOnce(new Error("Temporary network error"))
      .mockResolvedValueOnce(
        makeTextStream([
          "বাবার চশমা খুঁজতে গিয়ে পুরোনো ড্রয়ারে আটকে গেছি, বের হতে একটু দেরি হচ্ছে।",
          "\nSCORE: 82\nTIP: চেহারায় একটু সিরিয়াস ভাব রাখুন!",
        ]),
      );

    const result = await generateExcuseWithGemini(
      {
        target: "boss",
        problem: "late",
        tone: "funny",
        customText: "বাবার",
      },
      {
        generateContentStream,
        retryDelayMs: 0,
        onRetry: (attempt) => retryEvents.push(attempt),
      },
    );

    expect(generateContentStream).toHaveBeenCalledTimes(3);
    expect(retryEvents).toEqual([1, 2]);
    expect(result.message).toContain("বাবার চশমা");
    expect(result.customBadge).toBe(formatCustomExcuseBadge("funny"));
  });

  it("throws GeminiUnavailableError with busy message after 2 retries fail on 503", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "AQ.test_key");
    const retryEvents: number[] = [];

    const generateContentStream = vi.fn(async () => {
      throw makeApiError(503, '{"error":{"code":503,"status":"UNAVAILABLE"}}');
    });

    await expect(
      generateExcuseWithGemini(
        {
          target: "friend",
          problem: "event",
          tone: "funny",
          customText: "পরীক্ষা",
        },
        {
          generateContentStream,
          retryDelayMs: 0,
          onRetry: (attempt) => retryEvents.push(attempt),
        },
      ),
    ).rejects.toThrow(GEMINI_BUSY_ERROR_MESSAGE);

    expect(generateContentStream).toHaveBeenCalledTimes(3);
    expect(retryEvents).toEqual([1, 2]);
  });

  it("throws GeminiUnavailableError with busy message after retries fail on 429 rate limit", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "AQ.test_key");

    const generateContentStream = vi.fn(async () => {
      throw makeApiError(429, "RESOURCE_EXHAUSTED");
    });

    await expect(
      generateExcuseWithGemini(
        { target: "partner", problem: "overslept", tone: "emotional" },
        { generateContentStream, retryDelayMs: 0 },
      ),
    ).rejects.toThrow(GEMINI_BUSY_ERROR_MESSAGE);

    expect(generateContentStream).toHaveBeenCalledTimes(3);
  });

  it("throws GeminiUnavailableError after retries time out instead of falling back to memorized excuses", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "AQ.test_key");

    const generateContentStream = vi.fn(
      () =>
        new Promise<AsyncIterable<{ text?: string | undefined }>>(() => {
          // Never resolves to simulate stalled connection
        }),
    );

    await expect(
      generateExcuseWithGemini(
        { target: "boss", problem: "late", tone: "real", customText: "অ্যাসাইনমেন্ট" },
        { generateContentStream, timeoutMs: 25, retryDelayMs: 0 },
      ),
    ).rejects.toThrow(GEMINI_BUSY_ERROR_MESSAGE);

    expect(generateContentStream).toHaveBeenCalledTimes(3);
  });
});
