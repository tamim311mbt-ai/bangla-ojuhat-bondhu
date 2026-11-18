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

export type CustomTopicKey =
  | "gadget_broken"
  | "money"
  | "studies"
  | "event_plan"
  | "missed_call"
  | "office"
  | "family"
  | "late"
  | "general";

interface CustomContextMatch {
  target: Target;
  problem: Problem;
  topic: CustomTopicKey;
  personName?: string | undefined;
  scenario?: CustomScenarioKey;
  isRoast?: boolean;
}

const RELATION_ROLES: Array<{ pattern: RegExp; label: string; target: Target }> = [
  { pattern: /(?:^|\s)(আপু)(?:র|কে|রে|দের)?(?=\s|$|[।,!?])/, label: "আপু", target: "parents" },
  { pattern: /(?:^|\s)(আপা)(?:র|কে|রে|দের)?(?=\s|$|[।,!?])/, label: "আপা", target: "parents" },
  { pattern: /(?:^|\s)(আম্মু)(?:র|কে|রে)?(?=\s|$|[।,!?])/, label: "আম্মু", target: "parents" },
  { pattern: /(?:^|\s)(আব্বু)(?:র|কে|রে)?(?=\s|$|[।,!?])/, label: "আব্বু", target: "parents" },
  { pattern: /(?:^|\s)(বস)(?:ের|কে|রে)?(?=\s|$|[।,!?])/, label: "বস", target: "boss" },
  { pattern: /(?:^|\s)(স্যার)(?:ের|কে|রে)?(?=\s|$|[।,!?])/, label: "স্যার", target: "teacher" },
  { pattern: /(?:^|\s)(ম্যাম)(?:ের|কে|রে)?(?=\s|$|[।,!?])/, label: "ম্যাম", target: "teacher" },
  { pattern: /(?:^|\s)(ভাইয়া|ভাইয়া)(?:র|কে|রে)?(?=\s|$|[।,!?])/, label: "ভাইয়া", target: "friend" },
  { pattern: /(?:^|\s)(দোস্ত)(?:ের|কে|রে)?(?=\s|$|[।,!?])/, label: "দোস্ত", target: "friend" },
  { pattern: /(?:^|\s)(মামা)(?:র|কে|রে)?(?=\s|$|[।,!?])/, label: "মামা", target: "friend" },
  { pattern: /(?:^|\s)(জানু|জান)(?:র|কে|রে)?(?=\s|$|[।,!?])/, label: "জান", target: "partner" },
];

const NON_NAME_BENGALI_WORDS = new Set([
  "আমার",
  "আমাদের",
  "তোমার",
  "তোর",
  "তার",
  "ওর",
  "নিজের",
  "একটা",
  "একটি",
  "কোনো",
  "কোন",
  "সব",
  "অনেক",
  "খুব",
  "আজ",
  "আজকে",
  "কাল",
  "কালকে",
  "এখন",
  "হঠাৎ",
  "মোবাইল",
  "ফোন",
  "ল্যাপটপ",
  "কম্পিউটার",
  "পিসি",
  "টাকা",
  "ধার",
  "পকেট",
  "বিল",
  "বিকাশ",
  "নগদ",
  "পরীক্ষা",
  "পড়া",
  "পড়া",
  "ক্লাস",
  "অ্যাসাইনমেন্ট",
  "অফিস",
  "কাজ",
  "রিপোর্ট",
  "মিটিং",
  "বাসা",
  "বাড়ি",
  "বাড়ি",
  "বিয়ে",
  "বিয়ে",
  "দাওয়াত",
  "দাওয়াত",
  "ট্রিট",
  "পার্টি",
  "আড্ডা",
  "প্ল্যান",
  "রাস্তা",
  "জ্যাম",
  "বৃষ্টি",
  "সমস্যা",
  "কারণ",
  "কারণে",
  "জন্য",
  "বন্ধু",
  "বন্ধুদের",
  "গার্লফ্রেন্ড",
  "বয়ফ্রেন্ড",
  "বয়ফ্রেন্ড",
  "মানুষ",
  "কেউ",
  "কীভাবে",
  "কিভাবে",
  "কেন",
  "না",
  "নষ্ট",
  "ভেঙে",
  "করে",
  "ফেলেছি",
  "যেতে",
  "পারছি",
  "পারিনি",
  "দিতে",
  "ধরতে",
]);

/**
 * Extracts a person's name or relationship address mentioned in Bengali custom text.
 * Examples: "আপুর মোবাইল নষ্ট..." -> "আপু", "রাহাতকে টাকা দিতে..." -> "রাহাত",
 * "সাকিবের বিয়েতে..." -> "সাকিব", "রাহাত ভাইকে..." -> "রাহাত ভাই".
 */
export function extractPersonName(text: string): string | undefined {
  const cleaned = text.trim();
  if (!cleaned) return undefined;

  // 1. Check for "<Name> ভাই/ভাইয়া/আপা/আপু/স্যার/ম্যাম"
  const honorificMatch = cleaned.match(
    /(?:^|\s)([\u0980-\u09FF]{2,})\s+(ভাইয়া|ভাইয়া|ভাই|আপা|আপু|স্যার|ম্যাম)(?:কে|ের|র|রে)?(?=\s|$|[।,!?])/,
  );
  if (honorificMatch?.[1] && honorificMatch[2] && !NON_NAME_BENGALI_WORDS.has(honorificMatch[1])) {
    return `${honorificMatch[1]} ${honorificMatch[2]}`;
  }

  // 2. Check for explicit Bengali name with case suffix (কে / এর / ের / র)
  const caseRegex = /(?:^|\s)([\u0980-\u09FF]{2,})(কে|ের|এর|র)(?=\s|$|[।,!?])/g;
  let match: RegExpExecArray | null;
  while ((match = caseRegex.exec(cleaned)) !== null) {
    const base = match[1];
    if (!base) continue;
    // If it matches a known relation role, return the clean role
    const roleHit = RELATION_ROLES.find((r) => r.label === base);
    if (roleHit) return roleHit.label;
    if (!NON_NAME_BENGALI_WORDS.has(base) && base.length >= 2) {
      return base;
    }
  }

  // 3. Check for standalone relationship/role words
  for (const role of RELATION_ROLES) {
    if (role.pattern.test(cleaned)) {
      return role.label;
    }
  }

  return undefined;
}

const CUSTOM_TOPIC_BANKS: Record<CustomTopicKey, Record<Tone, string[]>> = {
  gadget_broken: {
    real: [
      "{name}, বিশ্বাস করো আমি হাতও দেইনি—হঠাৎ অটো সফটওয়্যার আপডেট নিতে গিয়েই স্ক্রিনটা ফ্রিজ হয়ে গেল! এখন সার্ভিস সেন্টারে কথা বলেছি, বললো এটা নাকি এই মডেলের কমন বাগ, ঠিক হয়ে যাবে।",
      "{name}, চার্জে লাগানোর পর হঠাৎ ব্যাটারিটা অস্বাভাবিক গরম হয়ে শাটডাউন হয়ে গেছে! মনে হয় চার্জারের ভোল্টেজ ওঠানামা করেছিল, আমি এখনই ভালো টেকনিশিয়ানকে দেখাচ্ছি।",
      "{name}, আমি শুধু টেবিলের ওপর রেখেছিলাম, হঠাৎ বিড়ালটা লাফ দিয়ে এসে ধাক্কা লাগিয়ে দিলো! একদমই ইচ্ছে করে হয়নি, আমি নিজেই আজকে মার্কেটে নিয়ে ঠিক করিয়ে আনছি।",
    ],
    funny: [
      "{name}, আমি নির্দোষ—ডিভাইসটা নিজেই অতিরিক্ত কাজের চাপে অবসর নিয়ে নিয়েছে! মনে হচ্ছে সিস্টেম আপডেটের নামে ওটা এখন ধ্যানে বসে গেছে, একটু পরেই জাগানোর চেষ্টা করছি। 😅",
      "{name}, সত্যি বলতে ওটা আমার হাত থেকে পড়েনি, মাধ্যাকর্ষণ শক্তি হঠাৎ আজকে একটু বেশিই কাজ করছিল! প্লিজ বকা দিও না, আমি নিজের পকেট থেকে ঠিক করিয়ে দিচ্ছি। 🙏",
    ],
    emotional: [
      "{name}, আমার সত্যিই খুব খারাপ লাগছে—কখনো ভাবিনি আমার সামনেই এটা এভাবে নষ্ট হয়ে যাবে! প্লিজ রাগ কোরো না, আমি যেভাবেই হোক আজকের মধ্যেই এটা একদম আগের মতো ঠিক করে দেবো।",
      "{name}, বিশ্বাস করো আমার মনটা একদম ভেঙে গেছে এটা দেখে। ইচ্ছে করে কিছু করিনি, তুমি একটু শান্ত হও—আমি নিজের দায়িত্বে এটা ঠিক করিয়ে দিচ্ছি।",
    ],
  },
  money: {
    real: [
      "{name}, আজকে বিকাশ আর ব্যাংক অ্যাপ দুটোতেই সার্ভার মেইনটেন্যান্স চলছে, তাই ট্রান্সফারটা আটকে গেছে। কালকে সকালের মধ্যেই ক্লিয়ার করে দিচ্ছি, একটু সময় দাও প্লিজ।",
      "{name}, আমার এই মাসের পেমেন্টটা এখনো অ্যাকাউন্টে ঢোকেনি, অফিসে বিল প্রসেসিংয়ে আটকে আছে। ঢোকার সাথে সাথেই সবার আগে তোমারটা মিটিয়ে দেবো, নিশ্চিন্ত থাকো।",
      "{name}, বাসায় হঠাৎ একটা জরুরি মেডিকেল খরচ পড়ে যাওয়ায় হাতটা একটু টান পড়ে গেছে। আর দুইটা দিন সময় দাও, আমি একদম ঠিক সময়ে ম্যানেজ করে দিচ্ছি।",
    ],
    funny: [
      "{name}, আমার ব্যাংক অ্যাকাউন্টের ব্যালেন্স এখন এতটাই কম যে এটিএম মেশিনও আমাকে দেখে সান্ত্বনা দিচ্ছে! বেতনটা ঢুকলেই সবার আগে তোমার পাওনাটা স্যালুট দিয়ে ফেরত দেবো। 😅",
      "{name}, পকেটের অবস্থা এখন মরুভূমির মতো শুকনো—বিকাশ অ্যাপ খুললেই অ্যাপটা নিজেই আমাকে লোন অফার করছে! আর কয়টা দিন ধৈর্য ধরো, অবশ্যই দিচ্ছি।",
    ],
    emotional: [
      "{name}, তোমার কাছে আমার সত্যিই খুব লজ্জা লাগছে, কথা দিয়েও সময়মতো দিতে পারলাম না। একটু কঠিন সময়ের মধ্য দিয়ে যাচ্ছি, প্লিজ আমাকে একটু ভুল বুঝো না—খুব শিগগিরই শোধ করে দেবো।",
      "{name}, তুমি আমার জন্য কতটা করেছো আমি জানি, কিন্তু হঠাৎ বিপদে পড়ে যাওয়ায় আটকে গেছি। আর কয়েকটা দিন পাশে থাকো, আমি অবশ্যই সব মিটিয়ে দেবো।",
    ],
  },
  studies: {
    real: [
      "{name}, আমার রুটিনটা পুরোনো ভার্সন দেখেছিলাম বলে সময়টা গুলিয়ে গেছে, আর এদিকে ল্যাপটপে ফাইলটা সেভ করার সময় হঠাৎ করাপ্ট হয়ে গেল। আমি রিকভার করার চেষ্টা করছি, খুব দ্রুত জমা দিয়ে দেবো।",
      "{name}, গত রাত থেকে হঠাৎ জ্বর আর মাথাব্যথা শুরু হওয়ায় একদমই বসতে পারিনি। একটু সুস্থ হলেই পুরো পড়া আর অ্যাসাইনমেন্ট কমপ্লিট করে জমা দেবো।",
      "{name}, সাবমিট করার ঠিক আগ মুহূর্তে এলাকায় টানা লোডশেডিং আর নেট চলে যাওয়ায় আপলোডটা ফেইল হয়েছে। নেট ঠিক হতেই সাথে সাথে পাঠিয়ে দিচ্ছি।",
    ],
    funny: [
      "{name}, আমি পুরো রাত জেগে অ্যাসাইনমেন্ট বানালাম, কিন্তু সকালে উঠে দেখি ল্যাপটপটা আমাকে না জানিয়েই ফাইলটা উধাও করে দিয়েছে! মনে হচ্ছে পিসিটাও আমার রেজাল্টের বিরুদ্ধে ষড়যন্ত্র করছে। 😅",
      "{name}, বই খুলে বসতেই আমার মস্তিষ্ক অটো-স্লিপ মোডে চলে যাচ্ছে! এবারের মতো একটু ছাড় দাও, পরের বার একদম ফার্স্ট বয় হয়ে দেখাবো।",
    ],
    emotional: [
      "{name}, আমি সত্যিই অনেক চেষ্টা করেছিলাম সময়মতো শেষ করার, কিন্তু শরীর আর পরিস্থিতি কোনোটারই সাপোর্ট পেলাম না। প্লিজ এবারের মতো একটু সুযোগ দাও, আমি নিজেকে প্রমাণ করবো।",
      "{name}, খুব মন খারাপ লাগছে এটা বলতে, কিন্তু আমার হাতের বাইরে একটা ঝামেলা হয়ে যাওয়ায় পারিনি। আশা করি তুমি আমার চেষ্টাটা একটু বুঝবে।",
    ],
  },
  event_plan: {
    real: [
      "{name}, আমার খুব ইচ্ছা ছিল যাওয়ার, কিন্তু বাসায় হঠাৎ জরুরি মেহমান চলে আসায় বের হওয়া একদমই সম্ভব হচ্ছে না। প্লিজ কিছু মনে কোরো না, পরের বার অবশ্যই একসাথে যাবো।",
      "{name}, সব রেডি করেই বের হচ্ছিলাম, ঠিক তখনই বাসার একটা জরুরি কাজে আটকে গেলাম। আজকের প্ল্যানটা মিস করতে হচ্ছে বলে সত্যিই দুঃখিত, নেক্সট উইকে অবশ্যই দেখা হবে।",
    ],
    funny: [
      "{name}, আমি রেডি হয়ে দরজা পর্যন্ত গিয়েছিলাম, কিন্তু হঠাৎ আমার পকেট আর ভাগ্য দুটোই আমাকে ঘরের ভেতর টেনে আনলো! আজকের মতো আমাকে মাফ করে দাও, পরের বার ডাবল হাজিরা দেবো। 😅",
      "{name}, আজকে বের হলে নাকি আমার কপালে বড় কোনো বিপদ আছে—বাসার মুরব্বিরা একদম ঘরবন্দি করে ফেলেছে! পরের আড্ডায় অবশ্যই থাকছি।",
    ],
    emotional: [
      "{name}, তোমার এই প্ল্যানটা মিস করতে আমার নিজেরই খুব খারাপ লাগছে, মনটা ওখানেই পড়ে আছে। কিন্তু সত্যিই নিরুপায় হয়ে আটকে গেছি, প্লিজ অভিমান কোরো না।",
      "{name}, বিশ্বাস করো যেতে না পেরে আমার একদমই ভালো লাগছে না। সবকিছু সামলে নিয়ে খুব তাড়াতাড়ি শুধু তোমার সাথে আলাদা করে দেখা করবো।",
    ],
  },
  missed_call: {
    real: [
      "{name}, সরি! ফোনটা সাইলেন্ট মোডে রেখে আরেক রুমে চার্জে দিয়েছিলাম, তাই একদমই টের পাইনি। এখনই দেখে সাথে সাথে রিপ্লাই দিলাম, বলো কী খবর?",
      "{name}, একটা জরুরি কাজে ব্যস্ত থাকায় ফোনটা ডু নট ডিস্টার্ব মোডে ছিল, আর নেটও ছিল না। মেসেজটা দেখামাত্রই তোমাকে নক দিলাম, কিছু মনে কোরো না প্লিজ।",
    ],
    funny: [
      "{name}, আমার ফোনটা আজকে নিজেই সাইলেন্ট মোডে গিয়ে বিদ্রোহ ঘোষণা করেছে! রিং না বাজায় আমি একদমই বুঝতে পারিনি, প্লিজ আমাকে ব্লক কোরো না। 😅",
      "{name}, নেটওয়ার্কটা আজকে এতটাই স্লো ছিল যে তোমার কলটা আমার ফোনে পৌঁছাতে পৌঁছাতেই ক্লান্ত হয়ে গেছে! এখন ফ্রি আছি, বলো।",
    ],
    emotional: [
      "{name}, প্লিজ রাগ কোরো না—ইচ্ছে করে কখনোই তোমার কল বা মেসেজ ইগনোর করিনি। সত্যিই ফোনটা কাছে ছিল না, দেখেই সাথে সাথে ছুটে এসেছি রিপ্লাই দিতে।",
    ],
  },
  office: {
    real: [
      "{name}, হঠাৎ শারীরিক অসুস্থতা আর বাসার একটি জরুরি কাজের কারণে আজকে অফিসে/মিটিংয়ে থাকতে পারছি না। আমি রিমোটলি জরুরি কাজগুলো আপডেট করে দেবো, অনুগ্রহ করে বিষয়টি বিবেচনা করবেন।",
      "{name}, পিসির সিস্টেম ক্র্যাশ আর নেটওয়ার্ক সমস্যার কারণে রিপোর্টটা সময়মতো ফাইনাল করতে পারিনি। আমি ব্যাকআপ থেকে কাজ করছি, যত দ্রুত সম্ভব জমা দিয়ে দেবো।",
    ],
    funny: [
      "{name}, আজকে আমার ল্যাপটপ আর ব্রেন দুটোই একসাথে হ্যাং হয়ে গেছে—রিস্টার্ট দিয়েও কাজ হচ্ছে না! আজকের মতো একটু ছাড় দিলে কালকে ডাবল এনার্জি নিয়ে কাজ করবো। 😅",
    ],
    emotional: [
      "{name}, আমি সবসময় চেষ্টা করি সময়মতো সব দায়িত্ব পালন করতে, কিন্তু আজকের পরিস্থিতিটা সত্যিই আমার নিয়ন্ত্রণের বাইরে ছিল। আশা করি আপনি বিষয়টি সহানুভূতির সাথে দেখবেন।",
    ],
  },
  family: {
    real: [
      "{name}, বিশ্বাস করো এটা একদমই আমার ইচ্ছাকৃত ভুল ছিল না, হঠাৎ একটা ঝামেলায় পড়ে এমনটা হয়ে গেছে। আমি নিজেই সবকিছু ঠিকঠাক করে নিচ্ছি, একদম চিন্তা কোরো না।",
      "{name}, সত্যি বলতে আমি ব্যাপারটা সামলানোর অনেক চেষ্টা করেছিলাম, কিন্তু হঠাৎ পরিস্থিতি উল্টে গেল। একটু শান্ত হও, আমি এখনই এটার সমাধান করে দিচ্ছি।",
    ],
    funny: [
      "{name}, প্লিজ বকা দিও না—আমি তো ভালো মানুষ, মাঝেমধ্যে একটু-আধটু অ্যাক্সিডেন্ট হয়েই যায়! এবারের মতো মাফ করে দাও, পরের বার একদম সাবধানে থাকবো। 😅",
    ],
    emotional: [
      "{name}, তুমি রাগ করলে আমার সত্যিই খুব খারাপ লাগে। ভুলটা অনিচ্ছাকৃত ছিল, প্লিজ মন খারাপ কোরো না—আমি সব ঠিক করে দেবো।",
    ],
  },
  late: {
    real: [
      "{name}, রাস্তায় ভয়াবহ জ্যাম আর বৃষ্টির কারণে রিকশা/গাড়ি একদমই নড়ছে না। আমি রাস্তাতেই আছি, আর কিছুক্ষণের মধ্যেই পৌঁছে যাচ্ছি—দেরির জন্য সত্যিই দুঃখিত।",
    ],
    funny: [
      "{name}, ঢাকার জ্যামটা আজকে এতটাই রোমান্টিক হয়ে গেছে যে আমাকে ছাড়তেই চাইছে না! আর একটু ধৈর্য ধরো, আমি উড়ে আসার চেষ্টা করছি। 😅",
    ],
    emotional: [
      "{name}, তোমাকে এভাবে অপেক্ষা করাতে আমার নিজেরই খুব খারাপ লাগছে, কিন্তু রাস্তায় সত্যিই আটকে গেছি। প্লিজ রাগ কোরো না, আমি প্রায় চলে এসেছি।",
    ],
  },
  general: {
    real: [
      "সত্যি বলতে {name}, এমন এক অপ্রত্যাশিত ঝামেলায় পড়ে গেছি যে চাইলেও ব্যাপারটা আমার হাতে ছিল না। আমি এখনই এটা সমাধান করার চেষ্টা করছি, প্লিজ একটু সময় দাও।",
      "{name}, বিশ্বাস করো আমি একদমই ইচ্ছে করে এটা করিনি—হঠাৎ একটা জরুরি পরিস্থিতি তৈরি হওয়ায় সব উলটপালট হয়ে গেল। একটু শান্তভাবে দেখো, আমি সব ঠিক করে দিচ্ছি।",
    ],
    funny: [
      "সত্যি বলতে {name}, আমার কপালটা আজকে এতটাই খারাপ যে ভালো কিছু করতে গেলেও উল্টো ঝামেলা হয়ে যাচ্ছে! এবারের মতো হাসিমুখে মাফ করে দাও, পরের বার আর এমন হবে না। 😅",
      "{name}, আমি নির্দোষ—সব দোষ আজকের গ্রহের অবস্থানের! প্লিজ রেগে যেও না, আমি এখনই ড্যামেজ কন্ট্রোল করছি। 🙏",
    ],
    emotional: [
      "সত্যি বলতে {name}, ব্যাপারটা নিয়ে আমার নিজেরই খুব খারাপ লাগছে। কখনোই চাইনি তোমাকে এমন পরিস্থিতিতে ফেলতে—প্লিজ একটু বুঝো, আমি সবকিছু ঠিক করে দেবো।",
    ],
  },
};

const DEFAULT_ADDRESS_FOR_TOPIC: Record<CustomTopicKey, string> = {
  gadget_broken: "আপু",
  money: "দোস্ত",
  studies: "স্যার",
  event_plan: "দোস্ত",
  missed_call: "দোস্ত",
  office: "বস",
  family: "আপু",
  late: "বস",
  general: "দোস্ত",
};

/**
 * Infers recipient, topic, person name, and specialized scenario strictly from custom text
 * keywords so upper dropdown selections NEVER conflict with what the user typed.
 */
export function inferCustomContext(text: string): CustomContextMatch {
  const t = text.toLowerCase();
  const personName = extractPersonName(text);

  let target: Target = "friend";
  if (/বস|ম্যানেজার|টিম লিড|অফিস|কোম্পানি|boss|office|manager/i.test(t)) {
    target = "boss";
  } else if (
    /স্যার|শিক্ষক|ম্যাম|ম্যাডাম|টিচার|পরীক্ষা|ভাইবা|ক্লাস|অ্যাসাইনমেন্ট|ক্যাম্পাস|ভার্সিটি|স্কুল|কলেজ|teacher|sir|exam|assignment|viva|class/i.test(
      t,
    )
  ) {
    target = "teacher";
  } else if (
    /আপু|আপা|আম্মু|আব্বু|মা|বাবা|বাসা|বাড়ি|বাড়ি|পরিবার|ফ্যামিলি|parents|mom|dad|family|sister/i.test(t)
  ) {
    target = "parents";
  } else if (
    /গার্লফ্রেন্ড|বয়ফ্রেন্ড|বয়ফ্রেন্ড|জানু|ভালোবাসা|বউ|স্বামী|প্রেম|ব্রেকআপ|partner|gf|bf|girlfriend|boyfriend/i.test(
      t,
    )
  ) {
    target = "partner";
  } else if (/বন্ধু|দোস্ত|মামা|ভাই|ট্রিট|পচ|রোস্ট|আড্ডা|friend|bro|treat|roast/i.test(t)) {
    target = "friend";
  }

  // 1. Phone / Gadget broken (highest priority when device + damage keywords appear)
  if (
    /(মোবাইল|ফোন|ল্যাপটপ|কম্পিউটার|পিসি|ট্যাব|স্ক্রিন|ডিসপ্লে|চার্জার|হেডফোন|গ্লাস|ক্যামেরা|phone|mobile|laptop).*(নষ্ট|ভেঙে|ভাঙ|পড়ে|পড়ে|পানি|হ্যাং|বন্ধ|খারাপ|broken|damaged)|(নষ্ট|ভেঙে|ভাঙ).*(মোবাইল|ফোন|ল্যাপটপ|কম্পিউটার|পিসি|স্ক্রিন|ডিসপ্লে|চার্জার|হেডফোন)/i.test(
      t,
    )
  ) {
    return { target, problem: "no_charge_net", topic: "gadget_broken", personName };
  }

  // 2. Specialized money / roast / partner intents
  const asksToBorrowMoney =
    /(টাকা|ধার|লোন|বিকাশ|ক্যাশ).*(চাই|লাগবে|দরকার|দিবি|দেবে|দাও|নেব|নেবো|ধার নিব|কীভাবে বল)|ধার চাই/i.test(
      t,
    ) && !/ফেরত দিতে|দিতে দেরি|শোধ করতে/i.test(t);
  if (asksToBorrowMoney) {
    return {
      target: target === "friend" ? "friend" : target,
      problem: "money",
      topic: "money",
      personName,
      scenario: "ask_friend_money",
    };
  }

  const asksForMoneyBack =
    /(পাওনা টাকা|আমার টাকা|ধার দেওয়া|ধার দেওয়া|টাকা ফেরত চাই|দিয়েছিলাম|দিয়েছিলাম).*(চাই|ফেরত|নেব|নেবো|কীভাবে|বলব)/i.test(
      t,
    );
  if (asksForMoneyBack) {
    return {
      target: "friend",
      problem: "money",
      topic: "money",
      personName,
      scenario: "ask_money_back",
    };
  }

  if (/পচ|রোস্ট|roast|খোঁচা|মজা নে/i.test(t)) {
    if (/ট্রিট|খাওয়|খাওয়|দাওয়াত|দাওয়াত|বিরিয়ানি|চা/i.test(t)) {
      return {
        target: "friend",
        problem: "event",
        topic: "event_plan",
        personName,
        scenario: "roast_treat",
        isRoast: true,
      };
    }
    return { target: "friend", problem: "event", topic: "event_plan", personName, isRoast: true };
  }

  if (
    target === "partner" &&
    /(রাগ|অভিমান|মান|সরি|ক্ষমা|মিল|বোঝা|সান্ত্বনা|ভুল|sorry|angry)/i.test(t)
  ) {
    return {
      target: "partner",
      problem: "cancel_plan",
      topic: "general",
      personName,
      scenario: "partner_makeup",
    };
  }

  // 3. Topic banks
  if (/টাকা|ধার|লোন|পকেট|বিল|বিকাশ|নগদ|বেতন|money|loan/i.test(t)) {
    return { target, problem: "loan_delay", topic: "money", personName };
  }

  if (
    /পরীক্ষা|পড়া|পড়া|ক্লাস|অ্যাসাইনমেন্ট|ভাইবা|হোমওয়ার্ক|প্রজেক্ট|রেজাল্ট|exam|viva|assignment|class/i.test(
      t,
    )
  ) {
    return {
      target: target === "friend" ? "teacher" : target,
      problem: "assignment_missed",
      topic: "studies",
      personName,
    };
  }

  if (
    /ফোন ধর|কল ধর|রিপ্লাই|মেসেজ|সিন|মিসড কল|ধরতে পারিনি|ধরতে পারি নাই|reply|missed call/i.test(t)
  ) {
    return { target, problem: "missed_reply", topic: "missed_call", personName };
  }

  if (
    /বিয়ে|বিয়ে|দাওয়াত|দাওয়াত|ট্রিট|পার্টি|আড্ডা|দেখা করা|দেখা করতে|প্ল্যান|ক্যানসেল|বেড়াতে|বেড়াতে|event|party|cancel/i.test(
      t,
    )
  ) {
    return { target, problem: "event", topic: "event_plan", personName };
  }

  if (/অফিস|বস|ম্যানেজার|রিপোর্ট|মিটিং|ছুটি|লিভ|office|boss|leave|report/i.test(t)) {
    return {
      target: target === "friend" ? "boss" : target,
      problem: "work",
      topic: "office",
      personName,
    };
  }

  if (/দেরি|জ্যাম|রিকশা|বাস|মেট্রো|রাস্তা|পৌঁছাতে|পৌঁছানো|late|traffic/i.test(t)) {
    return { target, problem: "late", topic: "late", personName };
  }

  if (/আপু|আপা|আম্মু|আব্বু|মা|বাবা|বাসা|বাড়ি|বাড়ি|পরিবার|ফ্যামিলি/i.test(t)) {
    return { target: "parents", problem: "cancel_plan", topic: "family", personName };
  }

  return { target, problem: "cancel_plan", topic: "general", personName };
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

  // When custom input exists, strictly ignore upper dropdowns and use topic-matched
  // dynamic Bengali templates that naturally incorporate any extracted person name.
  if (custom) {
    const ctx = inferCustomContext(custom);
    const displayName = ctx.personName ?? DEFAULT_ADDRESS_FOR_TOPIC[ctx.topic];

    if (ctx.scenario) {
      const scenarioMessages = CUSTOM_SCENARIO_MESSAGES[ctx.scenario][input.tone];
      const unseen = scenarioMessages.filter(
        (msg) => msg !== input.previousMessage && !hasExcuseBeenSeen(msg),
      );
      const fresh = scenarioMessages.filter((msg) => msg !== input.previousMessage);
      let message = pick(unseen.length ? unseen : fresh.length ? fresh : scenarioMessages, rand);
      if (ctx.personName && !message.includes(ctx.personName)) {
        message = `${ctx.personName}, ${message}`;
      }
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
      let message = pick(
        unseenRoasts.length ? unseenRoasts : freshRoasts.length ? freshRoasts : roasts,
        rand,
      );
      if (ctx.personName && !message.includes(ctx.personName)) {
        message = `${ctx.personName}, ${message}`;
      }
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

    const topicTemplates = CUSTOM_TOPIC_BANKS[ctx.topic][input.tone];
    const renderedTemplates = topicTemplates.map((tpl) => tpl.replace(/\{name\}/g, displayName));
    const unseen = renderedTemplates.filter(
      (msg) => msg !== input.previousMessage && !hasExcuseBeenSeen(msg),
    );
    const fresh = renderedTemplates.filter((msg) => msg !== input.previousMessage);
    const message = pick(unseen.length ? unseen : fresh.length ? fresh : renderedTemplates, rand);
    markExcuseAsSeen(message);

    const score =
      input.tone === "funny"
        ? 22 + Math.round(rand() * 16)
        : input.tone === "emotional"
          ? 70 + Math.round(rand() * 14)
          : 82 + Math.round(rand() * 12);
    const tip = pick([...TONE_TIPS[input.tone], ...TARGET_TIPS[ctx.target]], rand);

    return {
      id: `local-custom-${ctx.topic}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      target: ctx.target,
      tone: input.tone,
      customBadge: formatCustomExcuseBadge(input.tone),
      message,
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
