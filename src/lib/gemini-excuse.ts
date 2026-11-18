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
  fetchStream?:
    | ((
        input: GeminiExcuseInput,
        signal: AbortSignal,
      ) => Promise<AsyncIterable<{ text?: string | undefined }>>)
    | undefined;
  onChunk?: ((partialMessage: string) => void) | undefined;
  timeoutMs?: number | undefined;
}

interface GeminiExcusePayload {
  message?: unknown;
  score?: unknown;
  tip?: unknown;
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
    lines.push(`User's exact custom situation in Bengali: "${custom}"`);
    lines.push(`Requested tone: ${toneLabel}${toneHint ? ` (${toneHint})` : ""}`);
    lines.push(
      "Instruction: Read the user's exact Bengali situation carefully. If a person's name is mentioned, include that exact name naturally in the response. Write a witty, realistic, 2-3 sentence Bangladeshi Bengali excuse or message tailored 100% to THIS exact situation. Never give a generic unrelated excuse.",
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
export const GEMINI_TIMEOUT_MS = 5000;

async function* fetchServerExcuseStream(
  input: GeminiExcuseInput,
  signal: AbortSignal,
): AsyncIterable<{ text?: string | undefined }> {
  const response = await fetch("/api/gemini/excuse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Gemini server route failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        yield { text: chunk };
      }
    }
    const tail = decoder.decode();
    if (tail) {
      yield { text: tail };
    }
  } finally {
    reader.releaseLock();
  }
}

export async function generateExcuseWithGemini(
  input: GeminiExcuseInput,
  options?: GeminiExcuseOptions,
): Promise<GeneratedExcuse> {
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
    const stream = options?.fetchStream
      ? await options.fetchStream(input, controller.signal)
      : fetchServerExcuseStream(input, controller.signal);

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
    // Silently fall back to the topic-matched & name-aware Bangladeshi Bengali offline engine
    return generateSmartLocalExcuse(input);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}
