import { GoogleGenAI, type GenerateContentConfig } from "@google/genai";
import { PROBLEMS, TARGETS, TONES, type Problem, type Target, type Tone } from "./excuses";

export interface ServerGeminiExcuseInput {
  target: Target;
  problem: Problem;
  tone: Tone;
  customText?: string | undefined;
  previousMessage?: string | undefined;
}

export const GEMINI_MODEL = "gemini-2.5-flash";
export const GEMINI_MAX_OUTPUT_TOKENS = 250;
export const GEMINI_THINKING_BUDGET = 0;

const CUSTOM_SYSTEM_INSTRUCTION = `You are a witty Bangladeshi Bengali excuse generator ("অজুহাত ফ্যাক্টরি").
Read the user's exact Bengali situation carefully.
Rules:
1. Write 100% natural Bangladeshi Bengali (স্বাভাবিক বাংলাদেশি মুখের বাংলা ভাষা). Avoid stiff textbook phrasing.
2. If a person's name or relationship is mentioned in the user's situation (e.g., রাহাত, সাকিব, আপু, আম্মু, বস, স্যার), include that exact name naturally in the response.
3. Generate a clever, realistic, and natural 2-3 sentence Bengali excuse or message tailored 100% to THIS exact situation so the user can escape blame or handle it smoothly.
4. Do NOT talk about traffic, delivery men, or being late unless the user specifically asked about being late or traffic. Never give a generic unrelated excuse.
5. Never awkwardly repeat or quote the user's prompt question back—write the actual ready-to-send message directly from the sender's perspective.
6. Match the requested tone carefully:
   - "একদম বিশ্বাসযোগ্য": Realistic, polite, convincing with specific relatable details (score 74–96).
   - "হাস্যকর ও উদ্ভট": Absurdly funny, creative, witty Bangladeshi humor (score 8–42).
   - "আবেগঘন": Emotional, heartwarming, sweet and dramatic (score 60–88).
7. Output format (follow this exact plain-text order with NO markdown, NO intro, and NO surrounding quotes):
<2 to 3 short sentences of the ready-to-send Bangladeshi Bengali message first>
SCORE: <integer from 1 to 99>
TIP: <1 short funny Bangladeshi Bengali delivery tip sentence>`;

const DROPDOWN_SYSTEM_INSTRUCTION = `You are "অজুহাত ফ্যাক্টরি" (Ojuhat Factory), Bangladesh's sharpest, funniest, and most relatable Bengali excuse & clever message writer.

Rules:
1. Write 100% natural Bangladeshi Bengali (স্বাভাবিক বাংলাদেশি/ঢাকাইয়া মুখের বাংলা ভাষা — e.g. মামা, বস, স্যার, আম্মু, দোস্ত, জান, রাস্তায় জ্যাম, লোডশেডিং, রিকশা, সিএনজি, বৃষ্টি, বিকাশ/নগদ, এমবি শেষ, কম্বল, চায়ের টং ইত্যাদি প্রাসঙ্গিকভাবে ব্যবহার করো). Avoid stiff textbook phrasing or West Bengal-specific dialect.
2. Keep the response super short, punchy, and within 2 to 3 crisp sentences (under 45 words), directly ready to copy-paste or send on WhatsApp/Messenger.
3. Match the requested tone carefully:
   - "একদম বিশ্বাসযোগ্য": Realistic, polite, convincing with specific relatable details (score 74–96).
   - "হাস্যকর ও উদ্ভট": Absurdly funny, creative, witty Bangladeshi humor / friendly roasting (score 8–42).
   - "আবেগঘন": Emotional, heartwarming, sweet and dramatic (score 60–88).
4. Output format (follow this exact plain-text order with NO markdown, NO intro, and NO surrounding quotes):
<2 to 3 short sentences of the ready-to-send Bangladeshi Bengali message first>
SCORE: <integer from 1 to 99>
TIP: <1 short funny Bangladeshi Bengali delivery tip sentence>`;

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

export function buildServerPrompt(input: ServerGeminiExcuseInput): string {
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

export async function handleGeminiExcuseRequest(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  const apiKey = process.env["GEMINI_API_KEY"]?.trim();
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }

  let input: ServerGeminiExcuseInput;
  try {
    input = (await request.json()) as ServerGeminiExcuseInput;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  const isCustom = Boolean(input.customText?.trim());
  const config: GenerateContentConfig = {
    systemInstruction: isCustom ? CUSTOM_SYSTEM_INSTRUCTION : DROPDOWN_SYSTEM_INSTRUCTION,
    maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
    thinkingConfig: { thinkingBudget: GEMINI_THINKING_BUDGET },
  };

  try {
    const geminiStream = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: buildServerPrompt(input),
      config,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of geminiStream) {
            const text = chunk.text ?? "";
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Gemini API error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate excuse" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}
