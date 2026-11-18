import {
  ADDRESS,
  BASE_EXCUSES,
  PROBLEMS,
  ROAST_TEMPLATES,
  TARGETS,
  TARGET_TIPS,
  TONES,
  TONE_TIPS,
  clearSeenExcuses,
  getPool,
  getSeenExcuseCount,
  getTotalUniqueVariationCount,
  hasExcuseBeenSeen,
  isAllowed,
  markExcuseAsSeen,
  pickUnseenCombinatorVariation,
  type Excuse,
  type Problem,
  type Target,
  type Tone,
} from "../data/excusesDatabase";

export {
  ADDRESS,
  PROBLEMS,
  TARGETS,
  TONES,
  clearSeenExcuses,
  getPool,
  getSeenExcuseCount,
  getTotalUniqueVariationCount,
  hasExcuseBeenSeen,
  isAllowed,
  markExcuseAsSeen,
  type Excuse,
  type Problem,
  type Target,
  type Tone,
};

export const EXCUSES: Excuse[] = BASE_EXCUSES;

const CLOSING: Record<Target, Record<Tone, string>> = {
  boss: {
    real: "অসুবিধার জন্য আন্তরিকভাবে দুঃখিত।",
    funny: "আশা করি ব্যাপারটা হাসিমুখেই নেবেন। 🙏",
    emotional: "আশা করি বিষয়টা একটু বুঝবেন।",
  },
  teacher: {
    real: "দয়া করে এবারের মতো ক্ষমা করবেন।",
    funny: "এবারের মতো নম্বরটা কাটবেন না প্লিজ! 🙏",
    emotional: "আপনার কাছে একটু সহানুভূতি আশা করছি।",
  },
  parents: {
    real: "চিন্তা কোরো না, সব ঠিক আছে।",
    funny: "প্লিজ বকা দিও না! 😅",
    emotional: "রাগ কোরো না, প্লিজ।",
  },
  friend: {
    real: "প্লিজ একটু বোঝার চেষ্টা কর।",
    funny: "বিশ্বাস না হলে তোর সমস্যা! 😎",
    emotional: "মাফ করে দিস রে।",
  },
  partner: {
    real: "রাগ কোরো না প্লিজ।",
    funny: "হাসছো তো? তাহলে মাফ! 😘",
    emotional: "তুমি বুঝবে, আমি জানি। ❤️",
  },
};

export interface GeneratedExcuse {
  id: string;
  target: Target;
  tone: Tone;
  customBadge?: string | undefined;
  message: string;
  score: number;
  tip: string;
}

const CARD_TARGET_LABELS: Record<Target, string> = {
  boss: "অফিসের বসের জন্য",
  teacher: "শিক্ষকের জন্য",
  parents: "বাবা-মায়ের জন্য",
  friend: "বন্ধুর জন্য",
  partner: "ভালোবাসার মানুষের জন্য",
};

const CARD_TONE_LABELS: Record<Tone, string> = {
  real: "বিশ্বাসযোগ্য অজুহাত",
  funny: "হাস্যকর অজুহাত",
  emotional: "আবেগঘন অজুহাত",
};

export function formatExcuseCardBadge(target: Target, tone: Tone): string {
  return `${CARD_TARGET_LABELS[target]} • ${CARD_TONE_LABELS[tone]}`;
}

export function formatCustomExcuseBadge(tone: Tone): string {
  return `নিজস্ব পরিস্থিতি • ${CARD_TONE_LABELS[tone]}`;
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)] as T;
}

export function generateExcuse(
  input: {
    target: Target;
    problem: Problem;
    tone: Tone;
    extra?: string | undefined;
    previousId?: string | undefined;
  },
  rand: () => number = Math.random,
): GeneratedExcuse {
  const pool = getPool(input.target, input.problem, input.tone);
  const unseenBase = pool.filter((e) => e.id !== input.previousId && !hasExcuseBeenSeen(e.id));
  const extra = input.extra?.trim().replace(/[।.!?]+$/, "");

  if (unseenBase.length > 0 && rand() < 0.7) {
    const excuse = pick(unseenBase, rand);
    const parts = [`${ADDRESS[input.target]}, ${excuse.text}`];
    if (extra) parts.push(`আরেকটা কথা—${extra}।`);
    parts.push(CLOSING[input.target][input.tone]);
    const message = parts.join(" ");

    if (!hasExcuseBeenSeen(message)) {
      markExcuseAsSeen(excuse.id);
      markExcuseAsSeen(message);
      const jitter = Math.round(rand() * 8) - 4;
      const score = Math.max(1, Math.min(99, excuse.score + jitter + (extra ? 3 : 0)));
      const tip = pick([...TONE_TIPS[input.tone], ...TARGET_TIPS[input.target]], rand);
      return { id: excuse.id, target: input.target, tone: input.tone, message, score, tip };
    }
  }

  // Pull an unseen variation from the 1,000+ Smart Natural Combinator pool
  const combo = pickUnseenCombinatorVariation(input.target, input.problem, input.tone, rand, extra);
  markExcuseAsSeen(combo.variationId);
  markExcuseAsSeen(combo.text);

  const jitter = Math.round(rand() * 8) - 4;
  const score = Math.max(1, Math.min(99, combo.score + jitter + (extra ? 3 : 0)));
  const tip = pick([...TONE_TIPS[input.tone], ...TARGET_TIPS[input.target]], rand);

  return {
    id: combo.variationId,
    target: input.target,
    tone: input.tone,
    message: combo.text,
    score,
    tip,
  };
}

function inferProblemFromCustomText(text: string, fallback: Problem): Problem {
  const normalized = text.toLowerCase();
  if (/দেরি|জ্যাম|রিকশা|বাস|ঘুম|অ্যালার্ম|late|traffic/i.test(normalized)) return "late";
  if (/কাজ|অ্যাসাইনমেন্ট|রিপোর্ট|প্রজেক্ট|ফাইল|হোমওয়ার্ক|work|assignment/i.test(normalized))
    return "work";
  if (/দাওয়াত|আড্ডা|পার্টি|বিয়ে|বেড়াতে|ট্রিপ|event|party/i.test(normalized)) return "event";
  if (/ফোন|কল|ধরতে|মিসড|রিপ্লাই|মেসেজ|call|phone/i.test(normalized)) return "call";
  if (/টাকা|ধার|বিল|বেতন|বিকাশ|ট্রিট|money|loan/i.test(normalized)) return "money";
  return fallback;
}

export function generateSmartLocalExcuse(
  input: {
    target: Target;
    problem: Problem;
    tone: Tone;
    customText?: string | undefined;
    previousMessage?: string | undefined;
  },
  rand: () => number = Math.random,
): GeneratedExcuse {
  const custom = input.customText?.trim().replace(/[।.!?]+$/, "");

  if (custom && /পচ|রোস্ট|roast|খোঁচা|মজা নে/i.test(custom)) {
    const cleanTopic =
      custom.replace(/^(বন্ধুকে পচানো|বন্ধুকে রোস্ট|রোস্ট)\s*(?::|ঃ|-)?\s*/i, "").trim() || custom;
    const roasts = ROAST_TEMPLATES.map((tpl) => tpl(cleanTopic));
    const unseenRoasts = roasts.filter(
      (msg) => msg !== input.previousMessage && !hasExcuseBeenSeen(msg),
    );
    const freshRoasts = roasts.filter((msg) => msg !== input.previousMessage);
    const message = pick(
      unseenRoasts.length ? unseenRoasts : freshRoasts.length ? freshRoasts : roasts,
      rand,
    );
    markExcuseAsSeen(message);
    return {
      id: `local-roast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      target: input.target,
      tone: input.tone,
      customBadge: formatCustomExcuseBadge(input.tone),
      message,
      score: 18 + Math.round(rand() * 14),
      tip: pick(TONE_TIPS.funny, rand),
    };
  }

  const inferredProblem = custom
    ? inferProblemFromCustomText(custom, input.problem)
    : input.problem;
  const pool = getPool(input.target, inferredProblem, input.tone);

  const unseenBasePool = pool.filter((e) => !hasExcuseBeenSeen(e.id));

  // Blend curated base excuses and Smart Natural Combinator variations while guaranteeing 0 repeats
  const useBase = unseenBasePool.length > 0 && rand() < 0.65;
  if (useBase) {
    const candidates = unseenBasePool.map((e) => {
      const addr = ADDRESS[input.target];
      const close = CLOSING[input.target][input.tone];
      let message: string;
      if (!custom) {
        message = `${addr}, ${e.text} ${close}`;
      } else if (input.tone === "funny") {
        message = `${addr}, "${custom}" নিয়ে যে কী বিপদে পড়েছি শুনলে বিশ্বাসই হবে না! ${e.text} ${close}`;
      } else if (input.tone === "emotional") {
        message = `${addr}, সত্যি বলছি—"${custom}" ব্যাপারটা নিয়ে ভীষণ চাপের মধ্যে আছি। ${e.text} ${close}`;
      } else {
        message = `${addr}, "${custom}" এর কারণেই একটু আটকে গেছি। ${e.text} ${close}`;
      }
      return { excuse: e, message };
    });

    const freshCandidates = candidates.filter(
      (c) => c.message !== input.previousMessage && !hasExcuseBeenSeen(c.message),
    );

    if (freshCandidates.length > 0) {
      const chosen = pick(freshCandidates, rand);
      markExcuseAsSeen(chosen.excuse.id);
      markExcuseAsSeen(chosen.message);

      const jitter = Math.round(rand() * 8) - 4;
      const score = Math.max(1, Math.min(99, chosen.excuse.score + jitter));
      const tip = pick([...TONE_TIPS[input.tone], ...TARGET_TIPS[input.target]], rand);

      return {
        id: `local-${chosen.excuse.id}-${Date.now()}`,
        target: input.target,
        tone: input.tone,
        ...(custom ? { customBadge: formatCustomExcuseBadge(input.tone) } : {}),
        message: chosen.message,
        score,
        tip,
      };
    }
  }

  // Pull guaranteed-unseen combinator variation from 1,000+ pool
  const combo = pickUnseenCombinatorVariation(
    input.target,
    inferredProblem,
    input.tone,
    rand,
    custom,
    input.previousMessage,
  );
  markExcuseAsSeen(combo.variationId);
  markExcuseAsSeen(combo.text);

  const jitter = Math.round(rand() * 8) - 4;
  const score = Math.max(1, Math.min(99, combo.score + jitter));
  const tip = pick([...TONE_TIPS[input.tone], ...TARGET_TIPS[input.target]], rand);

  return {
    id: combo.variationId,
    target: input.target,
    tone: input.tone,
    ...(custom ? { customBadge: formatCustomExcuseBadge(input.tone) } : {}),
    message: combo.text,
    score,
    tip,
  };
}

export function excuseOfTheDay(date: Date = new Date()): Excuse {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const day = Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start) / 86400000,
  );
  const general = BASE_EXCUSES.filter((e) => !e.only);
  return general[(day * 7 + date.getFullYear()) % general.length] as Excuse;
}

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
export const toBanglaNumber = (n: number | string) =>
  String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)] ?? d);

export function scoreVerdict(score: number) {
  if (score >= 80) return "একদম পাক্কা! কেউ ধরতে পারবে না 😎";
  if (score >= 60) return "চলবে মনে হয়, একটু অভিনয় লাগবে 🎭";
  if (score >= 30) return "ঝুঁকি আছে, সাবধানে প্রয়োগ করুন ⚠️";
  return "ধরা খাওয়া প্রায় নিশ্চিত, তবে হাসি গ্যারান্টেড 😂";
}
