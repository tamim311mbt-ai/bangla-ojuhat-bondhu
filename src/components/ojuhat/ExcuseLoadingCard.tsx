import { useEffect, useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";

const LOADING_MESSAGES = [
  "চিপায় পড়া পরিস্থিতি বিশ্লেষণ করা হচ্ছে... 🧠",
  "একদম খাঁটি ঢাকাইয়া অজুহাত রান্না হচ্ছে... 🍳",
  "বিশ্বাসযোগ্যতার লেভেল মাপা হচ্ছে... 🎯",
  "মজার পাঞ্চলাইন আর ফ্লেভার মেশানো হচ্ছে... ✨",
];

export function ExcuseLoadingCard() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1600);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section
      aria-live="polite"
      aria-busy="true"
      className="luxury-glass animate-pop overflow-hidden rounded-3xl"
    >
      <div className="flex items-center justify-between bg-gradient-cta px-4 py-3 text-white sm:px-5">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 animate-spin" aria-hidden="true" />
          <span>অজুহাত ফ্যাক্টরি AI তৈরি করছে...</span>
        </p>
      </div>

      <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/75 bg-slate-100/75 px-4 py-6 text-center dark:border-white/10 dark:bg-slate-800/55">
          <div className="relative flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Wand2 className="size-7 animate-bounce" aria-hidden="true" />
          </div>
          <p className="mt-3 text-sm font-bold text-foreground sm:text-base">
            {LOADING_MESSAGES[step]}
          </p>
          <div className="mt-2.5 flex items-center gap-1.5" aria-hidden="true">
            <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
            <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
            <span className="size-2 animate-bounce rounded-full bg-primary" />
          </div>
        </div>

        <div className="space-y-2.5" aria-hidden="true">
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 animate-pulse rounded-lg bg-muted" />
            <div className="h-5 w-24 animate-pulse rounded-lg bg-primary/15" />
          </div>
          <div className="h-3.5 w-full animate-pulse rounded-full bg-muted" />
        </div>

        <div
          className="space-y-2 rounded-2xl border border-dashed border-amber-300/70 bg-amber-50/70 p-4 dark:border-amber-400/25 dark:bg-amber-950/30"
          aria-hidden="true"
        >
          <div className="h-4 w-28 animate-pulse rounded-lg bg-amber-500/25" />
          <div className="h-3.5 w-full animate-pulse rounded-lg bg-amber-500/15" />
          <div className="h-3.5 w-4/5 animate-pulse rounded-lg bg-amber-500/15" />
        </div>
      </div>
    </section>
  );
}
