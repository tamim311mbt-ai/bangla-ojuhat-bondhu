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
  onRetry?: ((retryAttempt: number) => void) | undefined;
  timeoutMs?: number | undefined;
  maxRetries?: number | undefined;
  retryDelayMs?: number | undefined;
}

export const GEMINI_BUSY_ERROR_MESSAGE = "সার্ভার এখন একটু ব্যস্ত, দয়া করে ৫ সেকেন্ড পর আবার চেষ্টা করুন!";

export class GeminiUnavailableError extends Error {
  readonly status?: number | undefined;

  constructor(message = GEMINI_BUSY_ERROR_MESSAGE, status?: number) {
    super(message);
    this.name = "GeminiUnavailableError";
    this.status = status;
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

export const SYSTEM_INSTRUCTION = `You are "অজুহাত ফ্যাক্টরি" (Ojuhat Factory), Bangladesh's sharpest, funniest, and most relatable Bengali excuse & clever message writer.

Rules:
1. Write 100% natural Bangladeshi Bengali (স্বাভাবিক বাংলাদেশি/ঢাকাইয়া মুখের বাংলা ভাষা — e.g. মামা, বস, স্যার, আম্মু, দোস্ত, জান, রাস্তায় জ্যাম, লোডশেডিং, রিকশা, সিএনজি, বৃষ্টি, বিকাশ/নগদ, এমবি শেষ, কম্বল, চায়ের টং ইত্যাদি প্রাসঙ্গিকভাবে ব্যবহার করো). Avoid stiff textbook phrasing or West Bengal-specific dialect.
2. Keep the response super short, punchy, and within 2 to 3 crisp sentences (under 45 words), directly ready to copy-paste or send on WhatsApp/Messenger.
3. Never awkwardly repeat or quote the user's prompt question back—write the actual ready-to-send message directly from the sender's perspective.
4. Match the requested tone carefully:
   - "একদম বিশ্বাসযোগ্য": Realistic, polite, convincing with specific relatable details (score 74–96).
   - "হাস্যকর ও উদ্ভট": Absurdly funny, creative, witty Bangladeshi humor / friendly roasting (score 8–42).
   - "আবেগঘন": Emotional, heartwarming, sweet and dramatic (score 60–88).
5. Output format (follow this exact plain-text order with NO markdown, NO intro, and NO surrounding quotes):
<2 to 3 short sentences of the ready-to-send Bangladeshi Bengali message first>
SCORE: <integer from 1 to 99>
TIP: <1 short funny Bangladeshi Bengali delivery tip sentence>`;

export const CUSTOM_SYSTEM_INSTRUCTION = `You are a witty Bangladeshi Bengali excuse generator ("অজুহাত ফ্যাক্টরি"). The user has written a custom situation or short keyword in Bengali inside the custom input box.

CRITICAL STRICT RULES:
1. 100% IGNORE ALL UPPER DROPDOWN PRESETS: Completely disregard any default recipient (boss, teacher, etc.) or default problem (traffic, late, etc.). Generate a 100% fresh excuse centered EXCLUSIVELY on the user's custom input text.
2. UNDERSTAND EVEN SHORT OR INCOMPLETE WORDS: If the user types only 1 or 2 short or incomplete Bengali words (such as "বাবার", "পরীক্ষা", "মোবাইল", "টাকা", "বৃষ্টি", "রাহাত"), immediately infer the most natural, relatable Bangladeshi real-life scenario around that exact word/person/topic and craft a complete, clever 2-3 sentence excuse or message tailored directly to it.
3. Do NOT talk about traffic or being late unless the user asked about being late. Never give a generic or unrelated excuse.
4. If any person's name or relationship (e.g. বাবা, আব্বু, আম্মু, আপু, রাহাত, সাকিব) is mentioned, naturally weave that exact person/relationship into the excuse.
5. Write 100% natural, everyday Bangladeshi Bengali (স্বাভাবিক মুখের বাংলাদেশি বাংলা) ready to copy-paste and send immediately. Keep it crisp (2 to 3 sentences, under 50 words). Never quote or repeat the user's input text mechanically.
6. Match the requested tone carefully:
   - "একদম বিশ্বাসযোগ্য": Clever, realistic, blame-escaping excuse specific to the user's situation (score 74–96).
   - "হাস্যকর ও উদ্ভট": Hilarious, witty Bangladeshi humor specific to the user's situation (score 8–42).
   - "আবেগঘন": Sincere, emotional, heartwarming excuse specific to the user's situation (score 60–88).
7. Output format (follow this exact plain-text order with NO markdown, NO intro, and NO surrounding quotes):
<2 to 3 short sentences of the tailored Bangladeshi Bengali excuse first>
SCORE: <integer from 1 to 99>
TIP: <1 short funny Bangladeshi Bengali delivery tip sentence>`;

export function resolveSystemInstruction(input: GeminiExcuseInput): string {
  return input.customText?.trim() ? CUSTOM_SYSTEM_INSTRUCTION : SYSTEM_INSTRUCTION;
}

const PROBLEM_CONTEXT_HINTS: Record<Problem, string> = {
  late: "রাস্তায় জ্যাম, রিকশা/সিএনজি নষ্ট, বৃষ্টি বা মেট্রোরেলে দেরি",
  work: "কাজ বা রিপোর্ট শেষ করতে না পারা, পিসি হ্যাং, নেট বা লোডশেডিং",
  event: "দাওয়াত, আড্ডা বা পার্টিতে যেতে না পারা",
  call: "ফোন ধরতে না পারা, সাইলেন্ট মোড বা ব্যস্ত থাকা",
  money: "টাকা ধার ফেরত দিতে দেরি বা বাজেট সংকট",
  loan_delay:
    "ধার নেওয়া টাকা ফেরত দিতে দেরি হচ্ছে (যেমন: বিকাশ/নগদ লিমিট বা সার্ভার সমস্যা, এটিএম বুথে ক্যাশ নেই, বেতন/বিল আটকে থাকা)",
  missed_reply:
    "ফোন ধরতে বা রিপ্লাই দিতে পারিনি (যেমন: ডু নট ডিস্টার্ব মোড, নামাজ/বাথরুম, রাস্তার শব্দ, ওয়াইফাই/এমবি না থাকা, মেসেজ ড্রাফটে থাকা)",
  avoid_treat:
    "দাওয়াত বা ট্রিট এড়াতে চাই (যেমন: পেটের গণ্ডগোল/গ্যাস্ট্রিক, ডায়েট, বাসায় হঠাৎ আত্মীয় আসা, পকেটের খরা, দাঁত ব্যথা)",
  assignment_missed:
    "কাজ বা অ্যাসাইনমেন্ট জমা দিতে পারিনি (যেমন: লোডশেডিং, ব্রডব্যান্ড কাটা, ফাইল করাপ্ট/অটো-রিস্টার্ট, সার্ভার এরর, জ্বর)",
  leave_request:
    "অফিসে বা ক্লাসে ছুটি নিতে চাই (যেমন: জ্বর/মাইগ্রেন, পরিবারের কারো হাসপাতাল চেকআপ, পাসপোর্ট/ব্যাংকের জরুরি কাজ, বাসার মিস্ত্রি)",
  cancel_plan:
    "হঠাৎ জরুরি কাজ পড়েছে তাই প্ল্যান ক্যানসেল (যেমন: বাসায় মেহমান/মুরব্বির অসুস্থতা, গ্যাস/পানির লিকেজ, অফিসের জরুরি কল, ঝড়-বৃষ্টি)",
  no_charge_net:
    "ফোনের চার্জ বা ইন্টারনেট ছিল না (যেমন: টানা লোডশেডিং, পাওয়ার ব্যাংক ফাঁকা, চার্জার নষ্ট, অপটিক্যাল ফাইবার তার কাটা, এমবি শেষ)",
  overslept:
    "সকালে ঘুম ভাঙতে দেরি হয়ে গেছে (যেমন: ভোররাতে কারেন্ট চলে যাওয়া, ফোনের চার্জ জিরো হয়ে অ্যালার্ম না বাজা, এএম/পিএম ভুল, গভীর ঘুম)",
};

export function buildPrompt(input: GeminiExcuseInput): string {
  const toneMeta = TONES.find((t) => t.value === input.tone);
  const toneLabel = toneMeta?.label ?? input.tone;
  const toneHint = toneMeta?.hint ?? "";
  const custom = input.customText?.trim();

  const lines: string[] = [];

  if (custom) {
    // Custom situation takes 100% priority — ignore upper dropdowns completely
    lines.push(
      "কড়া নির্দেশনা: ওপরের কোনো ড্রপডাউনের বিষয় (যেমন জ্যাম, দেরি বা ডিফল্ট প্রাপক) সম্পূর্ণ উপেক্ষা করো। শুধুমাত্র নিচের ব্যবহারকারীর লেখা পরিস্থিতি বা ছোট শব্দটিকে কেন্দ্র করেই ১০০% নতুন ও পূর্ণাঙ্গ একটি অজুহাত তৈরি করো।",
    );
    lines.push(`ব্যবহারকারীর পরিস্থিতি/শব্দ: "${custom}"`);
    lines.push(`পছন্দের টোন: ${toneLabel}${toneHint ? ` (${toneHint})` : ""}`);
    lines.push(
      "যদি ব্যবহারকারীর লেখা মাত্র ১-২টি অসম্পূর্ণ শব্দও হয়, তবুও ওই শব্দটির সাথে মিল রেখে সবচেয়ে বাস্তবসম্মত ও মজার বাংলাদেশি প্রেক্ষাপটে ২ থেকে ৩ বাক্যের পূর্ণাঙ্গ উত্তর দাও।",
    );
  } else {
    const targetMeta = TARGETS.find((t) => t.value === input.target);
    const problemMeta = PROBLEMS.find((p) => p.value === input.problem);
    const targetLabel = targetMeta?.label ?? input.target;
    const problemLabel = problemMeta?.label ?? input.problem;
    const contextHint = PROBLEM_CONTEXT_HINTS[input.problem];

    lines.push(`প্রাপক: ${targetLabel}`);
    lines.push(`সমস্যা: ${problemLabel}`);
    lines.push(`প্রাসঙ্গিক বাংলাদেশি প্রেক্ষাপট: ${contextHint}`);
    lines.push(`টোন: ${toneLabel}${toneHint ? ` (${toneHint})` : ""}`);
    lines.push(
      "নির্দেশনা: উপরের প্রাপক, সমস্যা ও টোন অনুযায়ী ২ থেকে ৩টি ছোট, ঝরঝরে বাক্যে একদম টাটকা, হাস্যকর ও স্বাভাবিক বাংলাদেশি বাংলায় সরাসরি পাঠানোর মতো একটি অজুহাত তৈরি করো।",
    );
  }

  if (input.previousMessage) {
    lines.push(`আগেরটি থেকে আলাদা সম্পূর্ণ নতুন কিছু দাও। আগেরটি: "${input.previousMessage}"`);
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

export const GEMINI_MODEL = "gemini-2.5-flash";
export const GEMINI_MAX_OUTPUT_TOKENS = 250;
export const GEMINI_THINKING_BUDGET = 0;
export const GEMINI_TIMEOUT_MS = 7000;
export const GEMINI_MAX_RETRIES = 2;
export const GEMINI_RETRY_BASE_DELAY_MS = 650;

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runSingleAttemptWithTimeout<T>(
  timeoutMs: number,
  task: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const err = new GeminiUnavailableError(GEMINI_BUSY_ERROR_MESSAGE, 504);
      controller.abort(err);
      reject(err);
    }, timeoutMs);
  });

  try {
    return await Promise.race([task(controller.signal), timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

async function callServerProxyOnce(
  input: GeminiExcuseInput,
  signal: AbortSignal,
): Promise<GeneratedExcuse> {
  const response = await fetch("/api/excuse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });

  if (!response.ok) {
    throw new GeminiUnavailableError(GEMINI_BUSY_ERROR_MESSAGE, response.status);
  }

  const raw = (await response.json()) as { text?: unknown };
  if (typeof raw?.text !== "string" || !raw.text.trim()) {
    throw new GeminiUnavailableError(GEMINI_BUSY_ERROR_MESSAGE, 502);
  }

  const parsed = parseCompletedResponse(raw.text, input);
  if (!parsed) {
    throw new GeminiUnavailableError(GEMINI_BUSY_ERROR_MESSAGE, 502);
  }

  markExcuseAsSeen(parsed.message);
  return parsed;
}

export async function generateExcuseWithGemini(
  input: GeminiExcuseInput,
  options?: GeminiExcuseOptions,
): Promise<GeneratedExcuse> {
  const apiKey = resolveGeminiApiKey();
  const timeoutMs = options?.timeoutMs ?? GEMINI_TIMEOUT_MS;
  const maxRetries = options?.maxRetries ?? GEMINI_MAX_RETRIES;
  const retryDelayMs = options?.retryDelayMs ?? GEMINI_RETRY_BASE_DELAY_MS;
  const useServerProxy =
    !options?.generateContentStream &&
    !apiKey &&
    typeof window !== "undefined" &&
    !import.meta.env["VITEST"];

  if (!apiKey && !options?.generateContentStream && !useServerProxy) {
    throw new GeminiUnavailableError(GEMINI_BUSY_ERROR_MESSAGE, 503);
  }

  const runDirectStreamAttempt = async (signal: AbortSignal): Promise<GeneratedExcuse> => {
    const ai = options?.generateContentStream || !apiKey ? null : new GoogleGenAI({ apiKey });
    const callStream =
      options?.generateContentStream ??
      ((params: GenerateContentParameters) => ai!.models.generateContentStream(params));

    const config: GenerateContentConfig = {
      systemInstruction: resolveSystemInstruction(input),
      maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
      thinkingConfig: { thinkingBudget: GEMINI_THINKING_BUDGET },
      abortSignal: signal,
    };

    const stream = await callStream({
      model: GEMINI_MODEL,
      contents: buildPrompt(input),
      config,
    });

    let fullText = "";
    let lastEmitted = "";

    for await (const chunk of stream) {
      if (signal.aborted) {
        throw new GeminiUnavailableError(GEMINI_BUSY_ERROR_MESSAGE, 504);
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
      throw new GeminiUnavailableError(GEMINI_BUSY_ERROR_MESSAGE, 502);
    }
    markExcuseAsSeen(parsed.message);
    return parsed;
  };

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    if (attempt > 0) {
      options?.onRetry?.(attempt);
      await sleep(retryDelayMs * attempt);
    }

    try {
      return await runSingleAttemptWithTimeout(timeoutMs, (signal) =>
        useServerProxy ? callServerProxyOnce(input, signal) : runDirectStreamAttempt(signal),
      );
    } catch (error) {
      lastError = error;
    }
  }

  const status =
    typeof (lastError as { status?: unknown })?.status === "number"
      ? (lastError as { status: number }).status
      : undefined;
  throw new GeminiUnavailableError(GEMINI_BUSY_ERROR_MESSAGE, status);
}
