import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Copy, Download, Lightbulb, Loader2, MessageCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ExcuseShareCard } from "@/components/ojuhat/ExcuseShareCard";
import { scoreVerdict, toBanglaNumber, type GeneratedExcuse } from "@/lib/excuses";

interface Props {
  result: GeneratedExcuse;
  animationKey?: number;
  isGenerating?: boolean;
  onCopy: () => void;
  onAnother: () => void;
  onWhatsApp: () => void;
}

export function ResultCard({
  result,
  animationKey = 0,
  isGenerating = false,
  onCopy,
  onAnother,
  onWhatsApp,
}: Props) {
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadCard = async () => {
    if (!shareCardRef.current || isDownloading) return;
    setIsDownloading(true);

    try {
      if (typeof document !== "undefined" && "fonts" in document) {
        await document.fonts.ready;
      }

      const captureOptions = {
        pixelRatio: 2,
        width: 600,
        height: 600,
        cacheBust: true,
      };

      let dataUrl: string;
      try {
        dataUrl = await toPng(shareCardRef.current, captureOptions);
      } catch {
        dataUrl = await toPng(shareCardRef.current, { ...captureOptions, skipFonts: true });
      }

      const link = document.createElement("a");
      link.download = "my-ojuhat-card.png";
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("অজুহাত কার্ড ডাউনলোড হয়ে গেছে! 🖼️");
    } catch {
      toast.error("কার্ড তৈরি করতে সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <section
        key={`${result.id}-${result.score}-${animationKey}`}
        aria-live="polite"
        className="animate-pop overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card"
      >
        <div className="bg-gradient-cta px-4 py-3 text-primary-foreground sm:px-5">
          <p className="text-sm font-semibold">🎁 আপনার অজুহাত প্রস্তুত!</p>
        </div>

        <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
          <blockquote className="relative rounded-2xl bg-secondary p-4 text-base leading-relaxed text-secondary-foreground sm:text-[17px]">
            <span
              aria-hidden
              className="absolute -top-3 left-3 font-display text-5xl font-bold leading-none text-primary"
            >
              “
            </span>
            <p className="break-words pt-2">{result.message}</p>
          </blockquote>

          <div>
            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
              <span className="text-sm font-semibold text-muted-foreground">বিশ্বাসযোগ্যতার হার</span>
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

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Button
              variant="soft"
              size="action"
              onClick={onCopy}
              className="h-auto min-h-12 py-2.5"
            >
              <Copy /> কপি করুন 📋
            </Button>
            <Button
              variant="whatsapp"
              size="action"
              onClick={onWhatsApp}
              className="h-auto min-h-12 py-2.5"
            >
              <MessageCircle /> হোয়াটসঅ্যাপে পাঠান 📱
            </Button>
            <Button
              type="button"
              size="action"
              onClick={handleDownloadCard}
              disabled={isDownloading}
              className="h-auto min-h-12 rounded-xl bg-gradient-cta py-2.5 font-bold text-primary-foreground shadow-sm hover:brightness-105"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="animate-spin" /> কার্ড তৈরি হচ্ছে...
                </>
              ) : (
                <>
                  <Download /> কার্ড ডাউনলোড করুন 🖼️
                </>
              )}
            </Button>
            <Button
              variant="teal"
              size="action"
              onClick={onAnother}
              disabled={isGenerating}
              className="h-auto min-h-12 py-2.5"
            >
              <RefreshCw className={isGenerating ? "animate-spin" : ""} /> নতুন আরেকটি 🔄
            </Button>
          </div>
        </div>
      </section>

      {/* Off-screen 1:1 social media card container for high-res PNG capture */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[-9999px] top-0 z-[-1] opacity-100"
      >
        <ExcuseShareCard ref={shareCardRef} result={result} />
      </div>
    </>
  );
}
