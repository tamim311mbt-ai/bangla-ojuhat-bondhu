import { useState } from "react";
import { Copy, Download, Lightbulb, Loader2, MessageCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardCustomizerModal } from "@/components/ojuhat/CardCustomizerModal";
import { scoreVerdict, toBanglaNumber, type GeneratedExcuse } from "@/lib/excuses";

function MessengerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4 shrink-0">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.145 2 11.259c0 2.913 1.454 5.512 3.726 7.21V22l3.405-1.869c.909.252 1.872.388 2.869.388 5.523 0 10-4.145 10-9.259C22 6.145 17.523 2 12 2zm.993 11.748l-2.548-2.718-4.97 2.718 5.468-5.805 2.61 2.718 4.908-2.718-5.468 5.805z"
      />
    </svg>
  );
}

interface Props {
  result: GeneratedExcuse;
  animationKey?: number;
  isGenerating?: boolean;
  isStreaming?: boolean;
  onCopy: () => void;
  onAnother: () => void;
  onWhatsApp: () => void;
  onMessenger: () => void;
}

export function ResultCard({
  result,
  animationKey = 0,
  isGenerating = false,
  isStreaming = false,
  onCopy,
  onAnother,
  onWhatsApp,
  onMessenger,
}: Props) {
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  return (
    <>
      <section
        key={`result-${animationKey}`}
        aria-live="polite"
        aria-busy={isStreaming}
        className="animate-pop overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card"
      >
        <div className="flex items-center justify-between gap-2 bg-gradient-cta px-4 py-3 text-primary-foreground sm:px-5">
          <p className="text-sm font-semibold">
            {isStreaming ? "⚡ AI লাইভ অজুহাত লিখছে..." : "🎁 আপনার অজুহাত প্রস্তুত!"}
          </p>
          {isStreaming && (
            <Loader2 className="size-4 shrink-0 animate-spin opacity-90" aria-hidden="true" />
          )}
        </div>

        <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
          <blockquote className="relative rounded-2xl bg-secondary p-4 text-base leading-relaxed text-secondary-foreground sm:text-[17px]">
            <span
              aria-hidden
              className="absolute -top-3 left-3 font-display text-5xl font-bold leading-none text-primary"
            >
              “
            </span>
            <p className="break-words pt-2">
              {result.message}
              {isStreaming && (
                <span
                  aria-hidden="true"
                  className="ml-1 inline-block h-[1.05em] w-[2.5px] animate-pulse rounded-full bg-primary align-middle"
                />
              )}
            </p>
          </blockquote>

          {isStreaming ? (
            <div className="space-y-3" aria-hidden="true">
              <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
              <div className="rounded-2xl border-2 border-dashed border-sunny/50 bg-sunny/10 p-3.5">
                <div className="h-3.5 w-32 animate-pulse rounded-md bg-sunny/25" />
                <div className="mt-2 h-3 w-5/6 animate-pulse rounded-md bg-sunny/20" />
              </div>
            </div>
          ) : (
            <>
              <div>
                <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
                  <span className="text-sm font-semibold text-muted-foreground">
                    বিশ্বাসযোগ্যতার হার
                  </span>
                  <span className="font-display text-xl font-bold text-primary sm:text-2xl">
                    {toBanglaNumber(result.score)}% বিশ্বাসযোগ্য
                  </span>
                </div>
                <div
                  className="h-3.5 w-full overflow-hidden rounded-full bg-muted"
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
                <p className="mt-2 text-sm text-muted-foreground">{scoreVerdict(result.score)}</p>
              </div>

              <div className="flex gap-3 rounded-2xl border-2 border-dashed border-sunny/75 bg-sunny/15 p-3.5 sm:p-4 dark:bg-sunny/10">
                <Lightbulb className="mt-0.5 size-5 shrink-0 text-sunny-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-sunny-foreground">সতর্কতা / টিপস</p>
                  <p className="mt-1 break-words text-sm leading-relaxed sm:text-[15px]">
                    {result.tip}
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Button
              variant="soft"
              size="action"
              onClick={onCopy}
              disabled={isStreaming}
              className="flex h-auto min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap px-4 py-3 text-sm"
            >
              <Copy aria-hidden="true" />
              <span>কপি করুন</span>
            </Button>
            <Button
              type="button"
              size="action"
              onClick={() => setIsCustomizerOpen(true)}
              disabled={isStreaming}
              className="flex h-auto min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-cta px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm hover:brightness-105"
            >
              <Download aria-hidden="true" />
              <span>কার্ড ডাউনলোড করুন</span>
            </Button>
            <Button
              variant="whatsapp"
              size="action"
              onClick={onWhatsApp}
              disabled={isStreaming}
              className="flex h-auto min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap px-4 py-3 text-sm"
            >
              <MessageCircle aria-hidden="true" />
              <span>হোয়াটসঅ্যাপে পাঠান</span>
            </Button>
            <Button
              type="button"
              size="action"
              onClick={onMessenger}
              disabled={isStreaming}
              className="flex h-auto min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-[#0084FF] to-[#A033FF] px-4 py-3 text-sm font-bold text-white shadow-sm hover:brightness-105"
            >
              <MessengerIcon />
              <span>মেসেঞ্জারে পাঠান</span>
            </Button>
            <Button
              variant="teal"
              size="action"
              onClick={onAnother}
              disabled={isGenerating || isStreaming}
              className="flex h-auto min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap px-4 py-3 text-sm sm:col-span-2 lg:col-span-1"
            >
              <RefreshCw className={isGenerating ? "animate-spin" : ""} aria-hidden="true" />
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
