import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GEMINI_FALLBACK_MODELS,
  GEMINI_MODEL,
  GEMINI_MODEL_FALLBACK_CHAIN,
  GeminiExcuseError,
  generateExcuseWithGemini,
  resolveGeminiApiKey,
} from "./gemini-excuse";

function makeApiError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

describe("generateExcuseWithGemini", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("uses gemini-3.8-flash primary model and defines fallback chain", () => {
    expect(GEMINI_MODEL).toBe("gemini-3.8-flash");
    expect(GEMINI_FALLBACK_MODELS).toEqual(["gemini-3.5-flash", "gemini-flash-latest"]);
    expect(GEMINI_MODEL_FALLBACK_CHAIN).toEqual([
      "gemini-3.8-flash",
      "gemini-3.5-flash",
      "gemini-flash-latest",
    ]);
  });

  it("throws MISSING_KEY with rawDetail when both VITE_GEMINI_API_KEY and GEMINI_API_KEY are missing", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");

    await expect(
      generateExcuseWithGemini({
        target: "boss",
        problem: "late",
        tone: "funny",
      }),
    ).rejects.toMatchObject({
      name: "GeminiExcuseError",
      code: "MISSING_KEY",
      rawDetail: expect.stringContaining("VITE_GEMINI_API_KEY"),
    } satisfies Partial<GeminiExcuseError>);
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

  it("retries gemini-3.8-flash once on 503 and succeeds without hitting fallback", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "AQ.test_key");
    const calls: string[] = [];

    const generateContent = vi.fn(async ({ model }: { model?: string }) => {
      calls.push(model ?? "");
      if (calls.length === 1) {
        throw makeApiError(503, '{"error":{"code":503,"status":"UNAVAILABLE"}}');
      }
      return {
        text: JSON.stringify({
          message: "বস, রাস্তায় পানি জমে রিকশা আটকে গেছে।",
          score: 88,
          tip: "একটু ভেজা চুলের সেলফি রেডি রাখুন!",
        }),
      };
    });

    const result = await generateExcuseWithGemini(
      { target: "boss", problem: "late", tone: "real" },
      { generateContent, retryDelayMs: 0 },
    );

    expect(calls).toEqual(["gemini-3.8-flash", "gemini-3.8-flash"]);
    expect(result.message).toContain("বস");
    expect(result.score).toBe(88);
  });

  it("falls back from gemini-3.8-flash to gemini-3.5-flash on persistent 503", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "AQ.test_key");
    const calls: string[] = [];

    const generateContent = vi.fn(async ({ model }: { model?: string }) => {
      calls.push(model ?? "");
      if (model === "gemini-3.8-flash") {
        throw makeApiError(503, "High demand temporary error");
      }
      return {
        text: JSON.stringify({
          message: "মামা, জ্যামে পড়ে জীবন শেষ হয়ে যাচ্ছে!",
          score: 79,
          tip: "গলার স্বর একটু ক্লান্ত শোনান!",
        }),
      };
    });

    const result = await generateExcuseWithGemini(
      { target: "friend", problem: "late", tone: "real" },
      { generateContent, retryDelayMs: 0 },
    );

    expect(calls).toEqual(["gemini-3.8-flash", "gemini-3.8-flash", "gemini-3.5-flash"]);
    expect(result.message).toContain("মামা");
  });

  it("falls back through gemini-3.5-flash to gemini-flash-latest on 429 and 503", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "AQ.test_key");
    const calls: string[] = [];

    const generateContent = vi.fn(async ({ model }: { model?: string }) => {
      calls.push(model ?? "");
      if (model === "gemini-3.8-flash") {
        throw makeApiError(429, "RESOURCE_EXHAUSTED");
      }
      if (model === "gemini-3.5-flash") {
        throw makeApiError(503, "UNAVAILABLE");
      }
      return {
        text: JSON.stringify({
          message: "আম্মু, কোচিংয়ের স্যার আটকে রেখেছিলেন!",
          score: 84,
          tip: "বাড়ি ঢুকে সরাসরি পড়ার টেবিলে বসুন!",
        }),
      };
    });

    const result = await generateExcuseWithGemini(
      { target: "parents", problem: "late", tone: "real" },
      { generateContent, retryDelayMs: 0 },
    );

    expect(calls).toEqual([
      "gemini-3.8-flash",
      "gemini-3.8-flash",
      "gemini-3.5-flash",
      "gemini-flash-latest",
    ]);
    expect(result.message).toContain("আম্মু");
  });

  it("does not retry or fall back on 401/403 invalid API key errors", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "AQ.bad_key");
    const calls: string[] = [];

    const generateContent = vi.fn(async ({ model }: { model?: string }) => {
      calls.push(model ?? "");
      throw makeApiError(403, "API_KEY_INVALID");
    });

    await expect(
      generateExcuseWithGemini(
        { target: "boss", problem: "late", tone: "funny" },
        { generateContent, retryDelayMs: 0 },
      ),
    ).rejects.toMatchObject({
      name: "GeminiExcuseError",
      code: "INVALID_KEY",
    });

    expect(calls).toEqual(["gemini-3.8-flash"]);
  });

  it("throws SERVER_BUSY with attempt trail when all fallback models return 503", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "AQ.test_key");

    const generateContent = vi.fn(async () => {
      throw makeApiError(503, "This model is currently experiencing high demand");
    });

    await expect(
      generateExcuseWithGemini(
        { target: "boss", problem: "late", tone: "funny" },
        { generateContent, retryDelayMs: 0 },
      ),
    ).rejects.toMatchObject({
      name: "GeminiExcuseError",
      code: "SERVER_BUSY",
      rawDetail: expect.stringContaining(
        "gemini-3.8-flash#1(503) -> gemini-3.8-flash#2(503) -> gemini-3.5-flash#1(503) -> gemini-flash-latest#1(503)",
      ),
    });
  });
});
