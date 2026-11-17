import { Copy, RefreshCw, Lightbulb, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scoreVerdict, toBanglaNumber, type GeneratedExcuse } from "@/lib/excuses";

interface Props {
  result: GeneratedExcuse;
  onCopy: () => void;
  onAnother: () => void;
  onWhatsApp: () => void;
}

export function ResultCard({ result, onCopy, onAnother, onWhatsApp }: Props) {
  return (
    <section
      key={result.id + result.score}
      aria-live="polite"
      className="animate-pop overflow-hidden rounded-3xl bg-card shadow-card"
    >
      <div className="bg-gradient-cta px-5 py-3 text-primary-foreground">
        <p className="text-sm font-semibold">🎁 আপনার অজুহাত প্রস্তুত!</p>
      </div>

      <div className="space-y-5 p-5">
        <blockquote className="relative rounded-2xl bg-secondary p-4 text-[17px] leading-relaxed text-secondary-foreground">
          <span aria-hidden className="absolute -top-3 left-3 font-display text-5xl leading-none text-primary">
            “
          </span>
          <p className="pt-2">{result.message}</p>
        </blockquote>

        <div>
          <div className="mb-2 flex items-end justify-between gap-2">
            <span className="text-sm font-semibold text-muted-foreground">বিশ্বাসযোগ্যতার হার</span>
            <span className="font-display text-2xl text-primary">
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
              className="h-full rounded-full bg-gradient-score transition-[width] duration-700 ease-out"
              style={{ width: `${result.score}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{scoreVerdict(result.score)}</p>
        </div>

        <div className="flex gap-3 rounded-2xl border-2 border-dashed border-sunny bg-sunny/15 p-4">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-sunny-foreground" />
          <div>
            <p className="text-sm font-bold text-sunny-foreground">সতর্কতা / টিপস</p>
            <p className="mt-1 text-[15px] leading-relaxed">{result.tip}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <Button variant="soft" size="action" onClick={onCopy}>
            <Copy /> কপি করুন 📋
          </Button>
          <Button variant="teal" size="action" onClick={onAnother}>
            <RefreshCw /> নতুন আরেকটি 🔄
          </Button>
          <Button variant="whatsapp" size="action" onClick={onWhatsApp} className="col-span-2 sm:col-span-1">
            <MessageCircle /> হোয়াটসঅ্যাপে পাঠান 📱
          </Button>
        </div>
      </div>
    </section>
  );
}
