import { Eye, Sparkles } from "lucide-react";
import { formatBanglaCount } from "@/lib/stats";

interface StatsCardsProps {
  visitors: number;
  excusesCount: number;
}

export function StatsCards({ visitors, excusesCount }: StatsCardsProps) {
  return (
    <section aria-label="সাইট পরিসংখ্যান" className="grid grid-cols-2 gap-3 sm:gap-4">
      <div className="luxury-glass luxury-card-hover group flex flex-col justify-between rounded-3xl p-4 hover:border-teal/45 hover:shadow-md sm:p-5">
        <div className="flex size-10 items-center justify-center rounded-2xl border border-teal/20 bg-teal/12 text-teal transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 sm:size-11">
          <Eye className="size-5" aria-hidden="true" />
        </div>
        <div className="mt-3">
          <p className="text-xs font-bold leading-relaxed text-muted-foreground sm:text-sm">
            মোট ভিজিটর
          </p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
            {formatBanglaCount(visitors)}
          </p>
        </div>
      </div>

      <div className="luxury-glass luxury-card-hover group flex flex-col justify-between rounded-3xl p-4 hover:border-primary/45 hover:shadow-md sm:p-5">
        <div className="flex size-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/12 text-primary transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 sm:size-11">
          <Sparkles className="size-5" aria-hidden="true" />
        </div>
        <div className="mt-3">
          <p className="text-xs font-bold leading-relaxed text-muted-foreground sm:text-sm">
            মোট অজুহাত তৈরি
          </p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
            {formatBanglaCount(excusesCount)}
          </p>
        </div>
      </div>
    </section>
  );
}
