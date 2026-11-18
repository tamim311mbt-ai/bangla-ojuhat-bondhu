import {
  ADDRESS,
  BASE_EXCUSES,
  CUSTOM_SCENARIO_MESSAGES,
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
  type CustomScenarioKey,
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

  if (unseenBase.length > 0 && rand() < 0.7) {
    const excuse = pick(unseenBase, rand);
    const message = `${ADDRESS[input.target]}, ${excuse.text} ${CLOSING[input.target][input.tone]}`;

    if (!hasExcuseBeenSeen(message)) {
      markExcuseAsSeen(excuse.id);
      markExcuseAsSeen(message);
      const jitter = Math.round(rand() * 8) - 4;
      const score = Math.max(1, Math.min(99, excuse.score + jitter));
      const tip = pick([...TONE_TIPS[input.tone], ...TARGET_TIPS[input.target]], rand);
      return { id: excuse.id, target: input.target, tone: input.tone, message, score, tip };
    }
  }

  // Pull an unseen variation from the Smart Natural Combinator pool
  const combo = pickUnseenCombinatorVariation(input.target, input.problem, input.tone, rand);
  markExcuseAsSeen(combo.variationId);
  markExcuseAsSeen(combo.text);

  const jitter = Math.round(rand() * 8) - 4;
  const score = Math.max(1, Math.min(99, combo.score + jitter));
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

interface CustomContextMatch {
  target: Target;
  problem: Problem;
  scenario?: CustomScenarioKey;
  isRoast?: boolean;
}

/**
 * Infers recipient, problem category, and specialized scenario strictly from custom text
 * keywords so upper dropdown selections never conflict with what the user typed.
 */
export function inferCustomContext(text: string): CustomContextMatch {
  const t = text.toLowerCase();

  let target: Target = "friend";
  if (/বস|ম্যানেজার|টিম লিড|অফিস|কোম্পানি|boss|office|manager/i.test(t)) {
    target = "boss";
  } else if (
    /স্যার|শিক্ষক|ম্যাম|ম্যাডাম|টিচার|পরীক্ষা|ভাইবা|ক্লাস|অ্যাসাইনমেন্ট|ক্যাম্পাস|ভার্সিটি|স্কুল|কলেজ|teacher|sir|exam|assignment|viva|class/i.test(
      t,
    )
  ) {
    target = "teacher";
  } else if (/আম্মু|আব্বু|মা|বাবা|বাসা|বাড়ি|পরিবার|ফ্যামিলি|parents|mom|dad|family/i.test(t)) {
    target = "parents";
  } else if (
    /গার্লফ্রেন্ড|বয়ফ্রেন্ড|জানু|ভালোবাসা|বউ|স্বামী|প্রেম|ব্রেকআপ|partner|gf|bf|girlfriend|boyfriend/i.test(
      t,
    )
  ) {
    target = "partner";
  } else if (/বন্ধু|দোস্ত|মামা|ভাই|ট্রিট|পচ|রোস্ট|আড্ডা|friend|bro|treat|roast/i.test(t)) {
    target = "friend";
  }

  // Specialized intent detection first
  const asksToBorrowMoney =
    /(টাকা|ধার|লোন|বিকাশ|ক্যাশ).*(চাই|লাগবে|দরকার|দিবি|দেবে|দাও|নেব|নেবো|ধার নিব|কীভাবে বল)|ধার চাই/i.test(
      t,
    ) && !/ফেরত দিতে|দিতে দেরি|শোধ করতে/i.test(t);
  if (asksToBorrowMoney) {
    return {
      target: target === "friend" ? "friend" : target,
      problem: "money",
      scenario: "ask_friend_money",
    };
  }

  const asksForMoneyBack =
    /(পাওনা টাকা|আমার টাকা|ধার দেওয়া|ধার দেওয়া|টাকা ফেরত চাই|দিয়েছিলাম|দিয়েছিলাম).*(চাই|ফেরত|নেব|নেবো|কীভাবে|বলব)/i.test(
      t,
    );
  if (asksForMoneyBack) {
    return { target: "friend", problem: "money", scenario: "ask_money_back" };
  }

  if (/পচ|রোস্ট|roast|খোঁচা|মজা নে/i.test(t)) {
    if (/ট্রিট|খাওয়|খাওয়|দাওয়াত|দাওয়াত|বিরিয়ানি|চা/i.test(t)) {
      return { target: "friend", problem: "event", scenario: "roast_treat", isRoast: true };
    }
    return { target: "friend", problem: "event", isRoast: true };
  }

  if (
    target === "partner" &&
    /(রাগ|অভিমান|মান|সরি|ক্ষমা|মিল|বোঝা|সান্ত্বনা|ভুল|sorry|angry)/i.test(t)
  ) {
    return { target: "partner", problem: "cancel_plan", scenario: "partner_makeup" };
  }

  if (/পরীক্ষা|ভাইবা|এক্সাম|exam|viva/i.test(t)) {
    return {
      target: target === "friend" ? "teacher" : target,
      problem: "assignment_missed",
      scenario: "exam_viva",
    };
  }

  // Category detection across all 13 problem types
  if (/ঘুম ভাঙ|ঘুম থেকে|দেরি করে উঠ|সকালে ঘুম|অ্যালার্ম|কম্বল|overslept|alarm/i.test(t)) {
    return { target, problem: "overslept" };
  }
  if (
    /চার্জ|ব্যাটারি|পাওয়ার ব্যাংক|ইন্টারনেট|নেট|এমবি|ওয়াইফাই|ওয়াই-ফাই|লোডশেডিং|charge|battery|internet|wifi|mb/i.test(
      t,
    )
  ) {
    return { target, problem: "no_charge_net" };
  }
  if (/ছুটি|লিভ|অসুস্থ|জ্বর|ডাক্তার|হাসপাতাল|leave|sick|fever/i.test(t)) {
    const leaveTarget = target === "friend" && /অফিস|ক্লাস|বস|স্যার/i.test(t) ? "boss" : target;
    return { target: leaveTarget, problem: "leave_request" };
  }
  if (/প্ল্যান ক্যানসেল|প্ল্যান বাদ|ক্যানসেল|হঠাৎ জরুরি|প্ল্যান.*বাতিল|cancel.*plan/i.test(t)) {
    return { target, problem: "cancel_plan" };
  }
  if (
    /(দাওয়াত|দাওয়াত|ট্রিট).*(এড়া|এড়া|বাঁচ|না খাও|যাব না)|ট্রিট এড়|ট্রিট এড়া|দাওয়াত এড়|দাওয়াত এড়|avoid.*treat/i.test(
      t,
    )
  ) {
    return { target, problem: "avoid_treat" };
  }
  if (/(ধার|টাকা|পাওনা).*(ফেরত|শোধ|দিতে দেরি|দিতে পারছি না)/i.test(t)) {
    return { target, problem: "loan_delay" };
  }
  if (
    /রিপ্লাই|মেসেজ|সিন|হোয়াটসঅ্যাপ|ইনবক্স|ফোন ধর|কল ধর|মিসড কল|reply|seen|message|missed call/i.test(t)
  ) {
    return { target, problem: "missed_reply" };
  }
  if (/অ্যাসাইনমেন্ট|জমা দিতে|সাবমিট|প্রজেক্ট|হোমওয়ার্ক|assignment|submit/i.test(t)) {
    return {
      target: target === "friend" ? "teacher" : target,
      problem: "assignment_missed",
    };
  }
  if (/টাকা|ধার|বিল|বেতন|বিকাশ|নগদ|পকেট|money|loan/i.test(t)) {
    return { target, problem: "loan_delay" };
  }
  if (/ফোন|কল|call|phone/i.test(t)) {
    return { target, problem: "missed_reply" };
  }
  if (/দাওয়াত|দাওয়াত|আড্ডা|পার্টি|বিয়ে|বিয়ে|বেড়াতে|বেড়াতে|ট্রিপ|event|party/i.test(t)) {
    return { target, problem: "event" };
  }
  if (/কাজ|রিপোর্ট|ফাইল|মিটিং|work|report/i.test(t)) {
    return {
      target: target === "friend" ? "boss" : target,
      problem: "work",
    };
  }
  if (/দেরি|জ্যাম|রিকশা|বাস|মেট্রো|রাস্তা|পৌঁছাতে|পৌঁছানো|late|traffic/i.test(t)) {
    return { target, problem: "late" };
  }

  return { target, problem: "cancel_plan" };
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

  // Rule 1 & 3: When custom input exists, it takes top priority (overrides upper dropdowns)
  // and NEVER pastes raw user text into any awkward quote template.
  if (custom) {
    const ctx = inferCustomContext(custom);

    if (ctx.scenario) {
      const scenarioMessages = CUSTOM_SCENARIO_MESSAGES[ctx.scenario][input.tone];
      const unseen = scenarioMessages.filter(
        (msg) => msg !== input.previousMessage && !hasExcuseBeenSeen(msg),
      );
      const fresh = scenarioMessages.filter((msg) => msg !== input.previousMessage);
      const message = pick(unseen.length ? unseen : fresh.length ? fresh : scenarioMessages, rand);
      markExcuseAsSeen(message);
      return {
        id: `local-scenario-${ctx.scenario}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        target: ctx.target,
        tone: input.tone,
        customBadge: formatCustomExcuseBadge(input.tone),
        message,
        score:
          input.tone === "funny"
            ? 20 + Math.round(rand() * 14)
            : input.tone === "emotional"
              ? 72 + Math.round(rand() * 12)
              : 84 + Math.round(rand() * 10),
        tip: pick([...TONE_TIPS[input.tone], ...TARGET_TIPS[ctx.target]], rand),
      };
    }

    if (ctx.isRoast) {
      const roasts = ROAST_TEMPLATES[input.tone];
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
        target: ctx.target,
        tone: input.tone,
        customBadge: formatCustomExcuseBadge(input.tone),
        message,
        score: 18 + Math.round(rand() * 14),
        tip: pick(TONE_TIPS.funny, rand),
      };
    }

    const effectiveTarget = ctx.target;
    const effectiveProblem = ctx.problem;
    const pool = getPool(effectiveTarget, effectiveProblem, input.tone);
    const unseenBasePool = pool.filter((e) => !hasExcuseBeenSeen(e.id));

    if (unseenBasePool.length > 0 && rand() < 0.7) {
      const candidates = unseenBasePool.map((e) => ({
        excuse: e,
        message: `${ADDRESS[effectiveTarget]}, ${e.text} ${CLOSING[effectiveTarget][input.tone]}`,
      }));
      const freshCandidates = candidates.filter(
        (c) => c.message !== input.previousMessage && !hasExcuseBeenSeen(c.message),
      );
      if (freshCandidates.length > 0) {
        const chosen = pick(freshCandidates, rand);
        markExcuseAsSeen(chosen.excuse.id);
        markExcuseAsSeen(chosen.message);
        const jitter = Math.round(rand() * 8) - 4;
        const score = Math.max(1, Math.min(99, chosen.excuse.score + jitter));
        const tip = pick([...TONE_TIPS[input.tone], ...TARGET_TIPS[effectiveTarget]], rand);
        return {
          id: `local-${chosen.excuse.id}-${Date.now()}`,
          target: effectiveTarget,
          tone: input.tone,
          customBadge: formatCustomExcuseBadge(input.tone),
          message: chosen.message,
          score,
          tip,
        };
      }
    }

    const combo = pickUnseenCombinatorVariation(
      effectiveTarget,
      effectiveProblem,
      input.tone,
      rand,
      undefined,
      input.previousMessage,
    );
    markExcuseAsSeen(combo.variationId);
    markExcuseAsSeen(combo.text);

    const jitter = Math.round(rand() * 8) - 4;
    const score = Math.max(1, Math.min(99, combo.score + jitter));
    const tip = pick([...TONE_TIPS[input.tone], ...TARGET_TIPS[effectiveTarget]], rand);

    return {
      id: combo.variationId,
      target: effectiveTarget,
      tone: input.tone,
      customBadge: formatCustomExcuseBadge(input.tone),
      message: combo.text,
      score,
      tip,
    };
  }

  // Dropdown-based generation (no custom text entered)
  const pool = getPool(input.target, input.problem, input.tone);
  const unseenBasePool = pool.filter((e) => !hasExcuseBeenSeen(e.id));

  const useBase = unseenBasePool.length > 0 && rand() < 0.65;
  if (useBase) {
    const candidates = unseenBasePool.map((e) => ({
      excuse: e,
      message: `${ADDRESS[input.target]}, ${e.text} ${CLOSING[input.target][input.tone]}`,
    }));

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
        message: chosen.message,
        score,
        tip,
      };
    }
  }

  // Pull guaranteed-unseen combinator variation
  const combo = pickUnseenCombinatorVariation(
    input.target,
    input.problem,
    input.tone,
    rand,
    undefined,
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
