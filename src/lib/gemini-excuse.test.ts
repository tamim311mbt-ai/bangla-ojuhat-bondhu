import { afterEach, describe, expect, it, vi } from "vitest";
import { GeminiExcuseError, generateExcuseWithGemini } from "./gemini-excuse";

describe("generateExcuseWithGemini", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws MISSING_KEY when VITE_GEMINI_API_KEY is missing", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "");

    await expect(
      generateExcuseWithGemini({
        target: "boss",
        problem: "late",
        tone: "funny",
      }),
    ).rejects.toMatchObject({
      name: "GeminiExcuseError",
      code: "MISSING_KEY",
    } satisfies Partial<GeminiExcuseError>);
  });
});
