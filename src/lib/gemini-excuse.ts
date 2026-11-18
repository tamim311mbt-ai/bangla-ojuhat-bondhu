import {
  GoogleGenAI,
  type GenerateContentConfig,
  type GenerateContentParameters,
} from "@google/genai";
import {
  PROBLEMS,
  TARGETS,
  TONES,
  formatCustomExcuseBadge,
  generateSmartLocalExcuse,
  markExcuseAsSeen,
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
  generateContentStream?:
    | ((params: GenerateContentParameters) => Promise<AsyncIterable<{ text?: string | undefined }>>)
    | undefined;
  onChunk?: ((partialMessage: string) => void) | undefined;
  timeoutMs?: number | undefined;
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
1. Write 100% natural Bangladeshi Bengali (স্বাভাবিক বাংলাদেশি/ঢাকাইয়া মুখের বাংলা ভাষা — e.g. মামা, বস, স্যার, আম্মু, দোস্ত, জান, রাস্তায় জ্যাম, লোডশেডিং, রিকশা, সিএনজি, বৃষ্টি, বাসার চাবি, নেট সমস্যা ইত্যাদি প্রাসঙ্গিকভাবে ব্যবহার করো). Avoid stiff textbook phrasing or West Bengal-specific dialect.
2. Keep the excuse super short, punchy, and within 2 to 3 crisp sentences (under 45 words), ready to copy-paste or send on WhatsApp.
3. Match the requested tone carefully:
   - "একদম বিশ্বাসযোগ্য": Realistic, polite, convincing with specific relatable details (score 74–96).
   - "হাস্যকর ও উদ্ভট": Absurdly funny, creative, witty Bangladeshi humor / friendly roasting (score 8–42).
   - "আবেগঘন": Emotional, heartwarming, sweet and dramatic (score 60–88).
4. Output format (follow this exact plain-text order with NO markdown, NO intro, and NO surrounding quotes):
<2 to 3 short sentences of the Bangladeshi Bengali excuse first>
SCORE: <integer from 1 to 99>
TIP: <1 short funny Bangladeshi Bengali delivery tip sentence>`;

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
    lines.push(`পরিস্থিতি / অনুরোধ: "${custom}"`);
    lines.push(`টোন: ${toneLabel}${toneHint ? ` (${toneHint})` : ""}`);
    lines.push(
      "নির্দেশনা: নিজের পরিস্থিতি অনুযায়ী ২ থেকে ৩টি ছোট, ঝরঝরে বাক্যে টাটকা ও মজার বাংলাদেশি বাংলায় অজুহাত বা রোস্ট লিখে ফেলো।",
    );
  } else {
    lines.push(`প্রাপক: ${targetLabel}`);
    lines.push(`সমস্যা: ${problemLabel}`);
    lines.push(`টোন: ${toneLabel}${toneHint ? ` (${toneHint})` : ""}`);
    lines.push(
      "নির্দেশনা: ২ থেকে ৩টি ছোট, ঝরঝরে বাক্যে একদম টাটকা, হাস্যকর ও স্বাভাবিক বাংলাদেশি বাংলায় একটি অজুহাত তৈরি করো।",
    );
  }

  if (input.previousMessage) {
    lines.push(`আগেরটি থেকে আলাদা নতুন কিছু দাও। আগেরটি: "${input.previousMessage}"`);
  }

  return lines.join("\n");
}

function defaultScoreForTone(tone: Tone): number {
  return tone === "funny" ? 28 : tone === "emotional" ? 76 : 85;
}

/**
 * Extracts only the live Bengali excuse text from a partial or complete stream buffer,
 * hiding trailing `SCORE:` / `TIP:` metadata lines (or JSON wrapper keys if returned).
 */
export function extractLiveExcuseText(rawText: string): string {
  const trimmedStart = rawText.trimStart();
  if (!trimmedStart) return "";

  if (trimmedStart.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmedStart) as GeminiExcusePayload;
      if (typeof parsed.message === "string") {
        return parsed.message.trim();
      }
    } catch {
      const match = trimmedStart.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)/);
      if (match && typeof match[1] === "string") {
        return match[1]
          .replace(/\\n/g, " ")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\")
          .replace(/^["“]+/, "")
          .trimStart();
      }
      return "";
    }
  }

  const withoutMeta = rawText
    .replace(/(?:^|\n)\s*(?:SCORE|TIP)\s*:[\s\S]*$/i, "")
    .replace(/\n\s*(?:S(?:C(?:O(?:R(?:E)?)?)?)?|T(?:I(?:P)?)?)?$/i, "");

  return withoutMeta
    .replace(/^["“]+/, "")
    .replace(/["”]+$/, "")
    .trimStart();
}

function parseCompletedResponse(rawText: string, input: GeminiExcuseInput): GeneratedExcuse | null {
  const custom = input.customText?.trim();
  const fallbackScore = defaultScoreForTone(input.tone);
  const fallbackTip = "মেসেজটা পাঠানোর সময় একদম নিষ্পাপ চেহারা বানিয়ে রাখুন!";

  const trimmed = rawText.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as GeminiExcusePayload;
      const msg = typeof parsed.message === "string" ? parsed.message.trim() : "";
      if (!msg) return null;
      const parsedScore =
        typeof parsed.score === "number" && Number.isFinite(parsed.score)
          ? Math.round(parsed.score)
          : fallbackScore;
      const parsedTip =
        typeof parsed.tip === "string" && parsed.tip.trim() ? parsed.tip.trim() : fallbackTip;

      return {
        id: `gemini-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        target: input.target,
        tone: input.tone,
        ...(custom ? { customBadge: formatCustomExcuseBadge(input.tone) } : {}),
        message: msg,
        score: Math.max(1, Math.min(99, parsedScore)),
        tip: parsedTip,
      };
    } catch {
      // Fall through to plain-text parsing
    }
  }

  const message = extractLiveExcuseText(trimmed).trim();
  if (!message) return null;

  const scoreMatch = trimmed.match(/(?:^|\n)\s*SCORE\s*:\s*(\d{1,3})/i);
  const rawScore = scoreMatch?.[1] ? Number.parseInt(scoreMatch[1], 10) : fallbackScore;
  const score = Math.max(1, Math.min(99, Number.isFinite(rawScore) ? rawScore : fallbackScore));

  const tipMatch = trimmed.match(/(?:^|\n)\s*TIP\s*:\s*(.+)/i);
  const tip = tipMatch?.[1]?.trim() ? tipMatch[1].trim() : fallbackTip;

  return {
    id: `gemini-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    target: input.target,
    tone: input.tone,
    ...(custom ? { customBadge: formatCustomExcuseBadge(input.tone) } : {}),
    message,
    score,
    tip,
  };
}

export const GEMINI_MODEL = "gemini-3.8-flash";
export const GEMINI_MAX_OUTPUT_TOKENS = 250;
export const GEMINI_THINKING_BUDGET = 0;
export const GEMINI_TIMEOUT_MS = 5000;

export async function generateExcuseWithGemini(
  input: GeminiExcuseInput,
  options?: GeminiExcuseOptions,
): Promise<GeneratedExcuse> {
  const apiKey = resolveGeminiApiKey();

  if (!apiKey) {
    return generateSmartLocalExcuse(input);
  }

  const timeoutMs = options?.timeoutMs ?? GEMINI_TIMEOUT_MS;
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const err = new Error(`Gemini request timed out after ${timeoutMs}ms`);
      controller.abort(err);
      reject(err);
    }, timeoutMs);
  });

  const runGeminiCall = async (): Promise<GeneratedExcuse> => {
    const ai = options?.generateContentStream
      ? null
      : new GoogleGenAI({ apiKey, apiVersion: "v1beta" });

    const callStream =
      options?.generateContentStream ??
      ((params: GenerateContentParameters) => ai!.models.generateContentStream(params));

    const config: GenerateContentConfig = {
      systemInstruction: SYSTEM_INSTRUCTION,
      maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
      thinkingConfig: { thinkingBudget: GEMINI_THINKING_BUDGET },
      abortSignal: controller.signal,
    };

    const stream = await callStream({
      model: GEMINI_MODEL,
      contents: buildPrompt(input),
      config,
    });

    let fullText = "";
    let lastEmitted = "";

    for await (const chunk of stream) {
      if (controller.signal.aborted) {
        throw new Error("Gemini stream aborted on timeout");
      }
      const piece = chunk.text ?? "";
      if (!piece) continue;
      fullText += piece;

      if (options?.onChunk) {
        const liveText = extractLiveExcuseText(fullText);
        if (liveText && liveText !== lastEmitted) {
          lastEmitted = liveText;
          options.onChunk(liveText);
        }
      }
    }

    const parsed = parseCompletedResponse(fullText, input);
    if (!parsed) {
      return generateSmartLocalExcuse(input);
    }
    markExcuseAsSeen(parsed.message);
    return parsed;
  };

  try {
    return await Promise.race([runGeminiCall(), timeoutPromise]);
  } catch {
    // Silently fall back to the rich Bangladeshi Bengali dictionary on 503, 429, timeout, or any API error
    return generateSmartLocalExcuse(input);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}
