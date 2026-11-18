import { GoogleGenAI, Type, type GenerateContentParameters } from "@google/genai";
import {
  PROBLEMS,
  TARGETS,
  TONES,
  formatCustomExcuseBadge,
  type GeneratedExcuse,
  type Problem,
  type Target,
  type Tone,
} from "./excuses";

export interface GeminiExcuseInput {
  target: Target;
  problem: Problem;
  tone: Tone;
  customText?: string | undefined;
  previousMessage?: string | undefined;
}

export interface GeminiExcuseOptions {
  generateContent?:
    ((params: GenerateContentParameters) => Promise<{ text?: string | undefined }>) | undefined;
  retryDelayMs?: number | undefined;
}

export type GeminiExcuseErrorCode =
  "MISSING_KEY" | "INVALID_KEY" | "RATE_LIMIT" | "SERVER_BUSY" | "EMPTY_RESPONSE" | "API_ERROR";

export class GeminiExcuseError extends Error {
  code: GeminiExcuseErrorCode;
  rawDetail?: string | undefined;

  constructor(code: GeminiExcuseErrorCode, message: string, rawDetail?: string | undefined) {
    super(message);
    this.name = "GeminiExcuseError";
    this.code = code;
    this.rawDetail = rawDetail;
  }
}

export function resolveGeminiApiKey(): string | undefined {
  const viteKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (viteKey) return viteKey;
  if (typeof process !== "undefined" && process.env) {
    const nodeKey = process.env["GEMINI_API_KEY"]?.trim();
    if (nodeKey) return nodeKey;
  }
  return undefined;
}

interface GeminiExcusePayload {
  message?: unknown;
  score?: unknown;
  tip?: unknown;
}

const SYSTEM_INSTRUCTION = `You are "অজুহাত ফ্যাক্টরি" (Ojuhat Factory), Bangladesh's sharpest, funniest, and most relatable Bengali excuse & witty comeback writer.

Rules:
1. Write 100% natural Bangladeshi Bengali (স্বাভাবিক বাংলাদেশি/ঢাকাইয়া মুখের বাংলা ভাষা — e.g. মামা, বস, স্যার, আম্মু, দোস্ত, জানু/জান, রাস্তায় জ্যাম, লোডশেডিং, রিকশা, সিএনজি, বৃষ্টি, বাসার চাবি, নেট সমস্যা ইত্যাদি প্রাসঙ্গিকভাবে ব্যবহার করো). Avoid stiff textbook phrasing or West Bengal-specific dialect.
2. Keep the main excuse/response punchy, hilarious, and ready to copy-paste or send on WhatsApp (2 to 4 sentences).
3. Match the requested tone carefully:
   - "একদম বিশ্বাসযোগ্য": Serious, realistic, polite, and genuinely convincing with specific relatable details (score 74–96).
   - "হাস্যকর ও উদ্ভট": Absurdly funny, creative, witty, or playful Bangladeshi humor / friendly roasting (score 8–42).
   - "আবেগঘন": Emotional, heartwarming, guilt-tripping yet sweet and dramatic (score 60–88).
4. Always return valid JSON matching the schema with:
   - "message": the ready-to-send Bangladeshi Bengali text (no surrounding quotes)
   - "score": an integer from 1 to 99 representing believability percentage
   - "tip": a short, funny 1-sentence Bangladeshi Bengali delivery tip/warning.`;

function buildPrompt(input: GeminiExcuseInput): string {
  const targetMeta = TARGETS.find((t) => t.value === input.target);
  const problemMeta = PROBLEMS.find((p) => p.value === input.problem);
  const toneMeta = TONES.find((t) => t.value === input.tone);
  const targetLabel = targetMeta?.label ?? input.target;
  const problemLabel = problemMeta?.label ?? input.problem;
  const toneLabel = toneMeta?.label ?? input.tone;
  const toneHint = toneMeta?.hint ?? "";
  const custom = input.customText?.trim();

  const lines: string[] = [];

  if (custom) {
    lines.push(`ব্যবহারকারীর নিজের পরিস্থিতি / অনুরোধ: "${custom}"`);
    lines.push(
      `পছন্দের ধরন (টোন): ${toneLabel}${toneHint ? ` (${toneHint})` : ""}`,
      "নির্দেশনা: উপরের নিজের পরিস্থিতি অনুযায়ী একদম টাটকা, হাস্যকর ও স্বাভাবিক বাংলাদেশি বাংলায় অজুহাত বা মজার উত্তর তৈরি করো (যদি বন্ধুকে পচানো বা রোস্ট করার কথা থাকে, তবে বন্ধুসুলভ মজার রোস্ট/রিপ্লাই দাও)।",
    );
  } else {
    lines.push(`প্রাপক (যার জন্য অজুহাত): ${targetLabel}`);
    lines.push(`সমস্যা / পরিস্থিতি: ${problemLabel}`);
    lines.push(`অজুহাতের ধরন (টোন): ${toneLabel}${toneHint ? ` (${toneHint})` : ""}`);
    lines.push(
      "নির্দেশনা: এই প্রাপক, সমস্যা ও টোন অনুযায়ী একদম টাটকা, মজার ও স্বাভাবিক বাংলাদেশি বাংলায় একটি অজুহাত তৈরি করো।",
    );
  }

  if (input.previousMessage) {
    lines.push(
      `আগের উত্তরের থেকে সম্পূর্ণ আলাদা নতুন আইডিয়া ও গল্প দাও। আগেরটি ছিল: "${input.previousMessage}"`,
    );
  }

  return lines.join("\n");
}

function extractStatusCode(err: unknown): number | undefined {
  if (err && typeof err === "object") {
    const status = (err as { status?: unknown }).status;
    if (typeof status === "number" && Number.isFinite(status)) {
      return status;
    }
    const code = (err as { code?: unknown }).code;
    if (typeof code === "number" && Number.isFinite(code)) {
      return code;
    }
  }
  const msg = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const match = msg.match(/\b(401|403|404|429|500|502|503|504)\b/);
  return match ? Number(match[1]) : undefined;
}

function extractRawErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const status = extractStatusCode(err);
    const hasPrefix = typeof status === "number" && !err.message.includes(`[HTTP ${status}]`);
    const prefix = hasPrefix ? `[HTTP ${status}] ` : "";
    return `${prefix}${err.message || err.name}`;
  }
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export function isInvalidKeyError(err: unknown): boolean {
  const status = extractStatusCode(err);
  if (status === 401 || status === 403) return true;
  const normalized = extractRawErrorMessage(err).toLowerCase();
  return (
    normalized.includes("api_key_invalid") ||
    normalized.includes("api key not valid") ||
    normalized.includes("permission_denied")
  );
}

export function isTransientCapacityError(err: unknown): boolean {
  if (isInvalidKeyError(err)) return false;
  const status = extractStatusCode(err);
  if (status === 503 || status === 429 || status === 500 || status === 502 || status === 504) {
    return true;
  }
  const normalized = extractRawErrorMessage(err).toLowerCase();
  return (
    normalized.includes("503") ||
    normalized.includes("429") ||
    normalized.includes("unavailable") ||
    normalized.includes("high demand") ||
    normalized.includes("overloaded") ||
    normalized.includes("resource_exhausted") ||
    normalized.includes("too many requests") ||
    normalized.includes("try again later")
  );
}

export function isModelNotFoundError(err: unknown): boolean {
  if (isInvalidKeyError(err)) return false;
  const status = extractStatusCode(err);
  if (status === 404) return true;
  const normalized = extractRawErrorMessage(err).toLowerCase();
  return normalized.includes("not_found") || normalized.includes("model not found");
}

function classifyGeminiError(err: unknown, attemptTrail?: string[]): GeminiExcuseError {
  if (err instanceof GeminiExcuseError) {
    if (attemptTrail && attemptTrail.length > 1 && err.rawDetail) {
      return new GeminiExcuseError(
        err.code,
        err.message,
        `${err.rawDetail} | Attempts: ${attemptTrail.join(" -> ")}`,
      );
    }
    return err;
  }

  const rawDetail = extractRawErrorMessage(err);
  const trailSuffix =
    attemptTrail && attemptTrail.length > 1 ? ` | Attempts: ${attemptTrail.join(" -> ")}` : "";
  const fullDetail = `${rawDetail}${trailSuffix}`;
  const normalized = rawDetail.toLowerCase();

  if (isInvalidKeyError(err)) {
    return new GeminiExcuseError(
      "INVALID_KEY",
      "Gemini API কী সঠিক নয় বা অনুমোদিত নয়। অনুগ্রহ করে VITE_GEMINI_API_KEY যাচাই করুন।",
      fullDetail,
    );
  }

  if (
    extractStatusCode(err) === 429 ||
    normalized.includes("429") ||
    normalized.includes("resource_exhausted")
  ) {
    return new GeminiExcuseError(
      "RATE_LIMIT",
      "অনেক বেশি অনুরোধ পাঠানো হয়েছে, একটু অপেক্ষা করে আবার চেষ্টা করুন।",
      fullDetail,
    );
  }

  if (
    extractStatusCode(err) === 503 ||
    normalized.includes("503") ||
    normalized.includes("unavailable") ||
    normalized.includes("high demand") ||
    normalized.includes("overloaded")
  ) {
    return new GeminiExcuseError(
      "SERVER_BUSY",
      "Gemini সার্ভারে সাময়িকভাবে প্রচুর চাপ চলছে। অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।",
      fullDetail,
    );
  }

  return new GeminiExcuseError(
    "API_ERROR",
    "Gemini AI থেকে উত্তর আনতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ বা API কী চেক করে আবার চেষ্টা করুন।",
    fullDetail,
  );
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const GEMINI_MODEL = "gemini-3.8-flash";
export const GEMINI_FALLBACK_MODELS = ["gemini-3.5-flash", "gemini-flash-latest"] as const;
export const GEMINI_MODEL_FALLBACK_CHAIN = [GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS] as const;

const DEFAULT_RETRY_DELAY_MS = 550;

export async function generateExcuseWithGemini(
  input: GeminiExcuseInput,
  options?: GeminiExcuseOptions,
): Promise<GeneratedExcuse> {
  const apiKey = resolveGeminiApiKey();

  if (!apiKey) {
    throw new GeminiExcuseError(
      "MISSING_KEY",
      "Gemini API কী (VITE_GEMINI_API_KEY) সেট করা নেই। অনুগ্রহ করে এনভায়রনমেন্ট ভ্যারিয়েবলে VITE_GEMINI_API_KEY যোগ করুন।",
      "Missing API key: import.meta.env.VITE_GEMINI_API_KEY and process.env.GEMINI_API_KEY are both empty.",
    );
  }

  const ai = options?.generateContent ? null : new GoogleGenAI({ apiKey, apiVersion: "v1beta" });
  const callGenerateContent =
    options?.generateContent ??
    ((params: GenerateContentParameters) => ai!.models.generateContent(params));
  const retryDelayMs = options?.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;

  const custom = input.customText?.trim();
  const prompt = buildPrompt(input);
  const config: GenerateContentParameters["config"] = {
    systemInstruction: SYSTEM_INSTRUCTION,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        message: {
          type: Type.STRING,
          description: "Natural Bangladeshi Bengali excuse or witty reply (2-4 sentences).",
        },
        score: {
          type: Type.INTEGER,
          description: "Believability percentage score from 1 to 99.",
        },
        tip: {
          type: Type.STRING,
          description: "Funny 1-sentence Bangladeshi Bengali delivery tip or warning.",
        },
      },
      required: ["message", "score", "tip"],
    },
  };

  // Execution plan:
  // 1. Try gemini-3.8-flash (and retry once on 503/429 transient errors)
  // 2. Fall back to gemini-3.5-flash
  // 3. Fall back to gemini-flash-latest
  const modelAttempts: Array<{ model: string; maxAttempts: number }> = [
    { model: GEMINI_MODEL, maxAttempts: 2 },
    ...GEMINI_FALLBACK_MODELS.map((model) => ({ model, maxAttempts: 1 })),
  ];

  const attemptTrail: string[] = [];
  let lastError: unknown;

  for (let mIdx = 0; mIdx < modelAttempts.length; mIdx++) {
    const entry = modelAttempts[mIdx];
    if (!entry) continue;

    const hasNextModel = mIdx < modelAttempts.length - 1;

    for (let attempt = 1; attempt <= entry.maxAttempts; attempt++) {
      try {
        const response = await callGenerateContent({
          model: entry.model,
          contents: prompt,
          config,
        });

        const rawText = (response.text ?? "").trim();
        if (!rawText) {
          throw new GeminiExcuseError(
            "EMPTY_RESPONSE",
            "AI কোনো উত্তর তৈরি করতে পারেনি, অনুগ্রহ করে আবার চেষ্টা করুন।",
            `Gemini (${entry.model}) returned an empty response.text payload.`,
          );
        }

        let parsed: GeminiExcusePayload;
        try {
          parsed = JSON.parse(rawText) as GeminiExcusePayload;
        } catch {
          return {
            id: `gemini-${Date.now()}`,
            target: input.target,
            tone: input.tone,
            ...(custom ? { customBadge: formatCustomExcuseBadge(input.tone) } : {}),
            message: rawText.replace(/^["“]+|["”]+$/g, ""),
            score: input.tone === "funny" ? 28 : input.tone === "emotional" ? 76 : 85,
            tip: "মেসেজটা পাঠানোর সময় মুখে একদম সিরিয়াস ভাব ধরে রাখুন!",
          };
        }

        const message = typeof parsed.message === "string" ? parsed.message.trim() : "";
        if (!message) {
          throw new GeminiExcuseError(
            "EMPTY_RESPONSE",
            "AI থেকে অজুহাত পাওয়া যায়নি, অনুগ্রহ করে আবার চেষ্টা করুন।",
            `Parsed JSON missing message field (${entry.model}): ${rawText.slice(0, 200)}`,
          );
        }

        const rawScore =
          typeof parsed.score === "number" && Number.isFinite(parsed.score)
            ? Math.round(parsed.score)
            : input.tone === "funny"
              ? 28
              : input.tone === "emotional"
                ? 76
                : 85;
        const score = Math.max(1, Math.min(99, rawScore));

        const tip =
          typeof parsed.tip === "string" && parsed.tip.trim()
            ? parsed.tip.trim()
            : "মেসেজটা পাঠানোর সময় একদম নিষ্পাপ চেহারা বানিয়ে রাখুন!";

        return {
          id: `gemini-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          target: input.target,
          tone: input.tone,
          ...(custom ? { customBadge: formatCustomExcuseBadge(input.tone) } : {}),
          message,
          score,
          tip,
        };
      } catch (err) {
        lastError = err;
        const status = extractStatusCode(err);
        attemptTrail.push(`${entry.model}#${attempt}${status ? `(${status})` : ""}`);

        // Never retry or fall back on invalid/unauthorized API keys
        if (isInvalidKeyError(err)) {
          throw classifyGeminiError(err, attemptTrail);
        }

        const canRetrySameModel = attempt < entry.maxAttempts && isTransientCapacityError(err);
        if (canRetrySameModel) {
          await sleep(retryDelayMs);
          continue;
        }

        const shouldFallbackToNextModel =
          hasNextModel &&
          (isTransientCapacityError(err) ||
            isModelNotFoundError(err) ||
            (err instanceof GeminiExcuseError && err.code === "EMPTY_RESPONSE"));

        if (shouldFallbackToNextModel) {
          await sleep(Math.min(retryDelayMs, 250));
          break;
        }

        throw classifyGeminiError(err, attemptTrail);
      }
    }
  }

  throw classifyGeminiError(lastError, attemptTrail);
}
