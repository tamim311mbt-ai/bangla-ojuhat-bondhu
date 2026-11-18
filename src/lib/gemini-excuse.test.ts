import { afterEach, describe, expect, it, vi } from "vitest";
import { GeminiExcuseError, generateExcuseWithGemini, resolveGeminiApiKey } from "./gemini-excuse";

describe("generateExcuseWithGemini", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
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
});
