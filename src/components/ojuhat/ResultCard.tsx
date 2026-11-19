import { useState } from "react";
import { Copy, Download, Lightbulb, Loader2, MessageCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardCustomizerModal } from "@/components/ojuhat/CardCustomizerModal";
import { useTypewriter } from "@/hooks/use-typewriter";
import { scoreVerdict, toBanglaNumber, type GeneratedExcuse } from "@/lib/excuses";

interface Props {
  result: GeneratedExcuse;
  animationKey?: number;
  onCopy: () => void;
  onAnother: () => void;
  onWhatsApp: () => void;
}

export function ResultCard({ result, animationKey = 0, onCopy, onAnother, onWhatsApp }: Props) {
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const { displayedText, isTyping } = useTypewriter(result.message, animationKey);

  return (
    <>
      <section
        key={`result-${animationKey}`}
        aria-live="polite"
        className="luxury-glass luxury-card-hover animate-pop overflow-hidden rounded-3xl"
      >
        <div className="flex items-center justify-between gap-2 bg-gradient-cta px-4 py-3 text-white sm:px-5">
          <p className="text-sm font-bold tracking-tight">
            {isTyping ? "✍️ অজুহাত লেখা হচ্ছে..." : "🎁 আপনার অজুহাত প্রস্তুত!"}
          </p>
          {isTyping && (
            <Loader2 className="size-4 shrink-0 animate-spin opacity-90" aria-hidden="true" />
          )}
        </div>

        <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
          <blockquote className="relative min-h-[5.5rem] rounded-2xl border border-slate-200/80 bg-slate-100/75 p-4 text-base leading-[1.82] text-slate-800 backdrop-blur-sm dark:border-white/10 dark:bg-slate-800/55 dark:text-slate-100 sm:text-[17px]">
            <span
              aria-hidden
              className="absolute -top-3 left-3 font-display text-5xl font-bold leading-none text-primary"
            >
              “
            </span>
            <p className="break-words pt-2">
              {displayedText}
              {isTyping && (
                <span
                  aria-hidden="true"
                  className="ml-1 inline-block h-[1.1em] w-[2.5px] animate-pulse rounded-full bg-primary align-middle"
                />
              )}
            </p>
          </blockquote>

          <div>
            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
              <span className="text-sm font-semibold text-muted-foreground">বিশ্বাসযোগ্যতার হার</span>
              <span className="font-display text-xl font-bold tabular-nums text-primary sm:text-2xl">
                {toBanglaNumber(result.score)}% বিশ্বাসযোগ্য
              </span>
            </div>
            <div
              className="h-3.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800"
              role="progressbar"
              aria-valuenow={result.score}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="animate-bar-fill h-full origin-left rounded-full bg-gradient-score transition-[width] duration-700 ease-out"
                style={{ width: `${result.score}%` }}
              />
            </div>
            <p className="mt-2 text-sm leading-[1.7] text-muted-foreground">
              {scoreVerdict(result.score)}
            </p>
          </div>

          <div className="flex gap-3 rounded-2xl border border-amber-300/70 bg-amber-50/80 p-3.5 backdrop-blur-sm sm:p-4 dark:border-amber-400/25 dark:bg-amber-950/35">
            <Lightbulb className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-300" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">সতর্কতা / টিপস</p>
              <p className="mt-1 break-words text-sm leading-[1.75] text-slate-700 dark:text-slate-200 sm:text-[15px]">
                {result.tip}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Button
              variant="soft"
              size="action"
              onClick={onCopy}
              className="flex h-auto min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap px-4 py-3 text-sm"
            >
              <Copy aria-hidden="true" />
              <span>কপি করুন</span>
            </Button>
            <Button
              type="button"
              size="action"
              onClick={() => setIsCustomizerOpen(true)}
              className="flex h-auto min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/20 bg-gradient-cta px-4 py-3 text-sm font-bold text-white shadow-sm hover:brightness-105"
            >
              <Download aria-hidden="true" />
              <span>কার্ড ডাউনলোড করুন</span>
            </Button>
            <Button
              variant="whatsapp"
              size="action"
              onClick={onWhatsApp}
              className="flex h-auto min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap px-4 py-3 text-sm sm:col-span-2 lg:col-span-1"
            >
              <MessageCircle aria-hidden="true" />
              <span>হোয়াটসঅ্যাপে পাঠান</span>
            </Button>
            <Button
              variant="teal"
              size="action"
              onClick={onAnother}
              className="flex h-auto min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap px-4 py-3 text-sm sm:col-span-2 lg:col-span-1"
            >
              <RefreshCw aria-hidden="true" />
              <span>নতুন আরেকটি</span>
            </Button>
          </div>
        </div>
      </section>

      <CardCustomizerModal
        open={isCustomizerOpen}
        onOpenChange={setIsCustomizerOpen}
        result={result}
      />
    </>
  );
}
