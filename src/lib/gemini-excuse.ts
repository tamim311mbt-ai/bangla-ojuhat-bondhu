import { GoogleGenAI, Type } from "@google/genai";
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

export class GeminiExcuseError extends Error {
  code: "MISSING_KEY" | "INVALID_KEY" | "RATE_LIMIT" | "EMPTY_RESPONSE" | "API_ERROR";

  constructor(
    code: "MISSING_KEY" | "INVALID_KEY" | "RATE_LIMIT" | "EMPTY_RESPONSE" | "API_ERROR",
    message: string,
  ) {
    super(message);
    this.name = "GeminiExcuseError";
    this.code = code;
  }
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

function classifyGeminiError(err: unknown): GeminiExcuseError {
  if (err instanceof GeminiExcuseError) return err;

  const rawMsg = err instanceof Error ? err.message : String(err);
  const normalized = rawMsg.toLowerCase();

  if (
    normalized.includes("api_key_invalid") ||
    normalized.includes("api key not valid") ||
    normalized.includes("permission_denied") ||
    normalized.includes("403") ||
    normalized.includes("401")
  ) {
    return new GeminiExcuseError(
      "INVALID_KEY",
      "Gemini API কী সঠিক নয় বা অনুমোদিত নয়। অনুগ্রহ করে VITE_GEMINI_API_KEY যাচাই করুন।",
    );
  }

  if (normalized.includes("429") || normalized.includes("resource_exhausted")) {
    return new GeminiExcuseError(
      "RATE_LIMIT",
      "অনেক বেশি অনুরোধ পাঠানো হয়েছে, একটু অপেক্ষা করে আবার চেষ্টা করুন।",
    );
  }

  return new GeminiExcuseError(
    "API_ERROR",
    "Gemini AI থেকে উত্তর আনতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ বা API কী চেক করে আবার চেষ্টা করুন।",
  );
}

export async function generateExcuseWithGemini(input: GeminiExcuseInput): Promise<GeneratedExcuse> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new GeminiExcuseError(
      "MISSING_KEY",
      "Gemini API কী (VITE_GEMINI_API_KEY) সেট করা নেই। .env ফাইলে VITE_GEMINI_API_KEY যোগ করুন।",
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const custom = input.customText?.trim();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: buildPrompt(input),
      config: {
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
      },
    });

    const rawText = (response.text ?? "").trim();
    if (!rawText) {
      throw new GeminiExcuseError(
        "EMPTY_RESPONSE",
        "AI কোনো উত্তর তৈরি করতে পারেনি, অনুগ্রহ করে আবার চেষ্টা করুন।",
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
    throw classifyGeminiError(err);
  }
}
