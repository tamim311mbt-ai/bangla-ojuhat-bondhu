import { Eye, Sparkles } from "lucide-react";
import { formatBanglaCount } from "@/lib/stats";

interface StatsCardsProps {
  visitors: number;
  excusesCount: number;
}

export function StatsCards({ visitors, excusesCount }: StatsCardsProps) {
  return (
    <section aria-label="সাইট পরিসংখ্যান" className="grid grid-cols-2 gap-3 sm:gap-4">
      <div className="flex flex-col justify-between rounded-3xl border border-border/70 bg-card p-4 shadow-card transition-transform hover:-translate-y-0.5 sm:p-5">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-teal/15 text-teal sm:size-11">
          <Eye className="size-5" aria-hidden="true" />
        </div>
        <div className="mt-3">
          <p className="text-xs font-bold text-muted-foreground sm:text-sm">মোট ভিজিটর</p>
          <p className="mt-1 font-sans text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
            {formatBanglaCount(visitors)}
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-3xl border border-border/70 bg-card p-4 shadow-card transition-transform hover:-translate-y-0.5 sm:p-5">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/15 text-primary sm:size-11">
          <Sparkles className="size-5" aria-hidden="true" />
        </div>
        <div className="mt-3">
          <p className="text-xs font-bold text-muted-foreground sm:text-sm">মোট অজুহাত তৈরি</p>
          <p className="mt-1 font-sans text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
            {formatBanglaCount(excusesCount)}
          </p>
        </div>
      </div>
    </section>
  );
}
