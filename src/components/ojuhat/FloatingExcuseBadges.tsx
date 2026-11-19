import { useEffect, useRef } from "react";

interface FloatingBadgeItem {
  text: string;
  positionClass: string;
  animClass: string;
  opacityClass: string;
  tintClass: string;
  depthScaleClass: string;
  speedY: number;
  speedX: number;
}

const FLOATING_BADGES: FloatingBadgeItem[] = [
  // Near layer (faster scroll parallax, ~60% opacity)
  {
    text: "🚗 জ্যামে আটকে গেছি",
    positionClass: "top-[12%] left-[2.5%] lg:left-[3%]",
    animClass: "animate-bg-float-a [animation-duration:15s] [animation-delay:-2s]",
    opacityClass: "opacity-60",
    depthScaleClass: "scale-100",
    tintClass: "bg-white/65 border-slate-200/80 dark:bg-slate-900/55 dark:border-white/12",
    speedY: -0.24,
    speedX: 0.05,
  },
  {
    text: "🔋 ফোনে চার্জ ছিল না",
    positionClass: "top-[14%] right-[2.5%] lg:right-[3%]",
    animClass: "animate-bg-float-b [animation-duration:17s] [animation-delay:-5s]",
    opacityClass: "opacity-60",
    depthScaleClass: "scale-100",
    tintClass: "bg-sky-50/60 border-sky-200/70 dark:bg-slate-900/55 dark:border-sky-400/15",
    speedY: -0.26,
    speedX: -0.05,
  },
  {
    text: "⏰ অ্যালার্ম বাজেনি",
    positionClass: "top-[58%] right-[2.5%] lg:right-[3.4%]",
    animClass: "animate-bg-float-c [animation-duration:15s] [animation-delay:-9s]",
    opacityClass: "opacity-55",
    depthScaleClass: "scale-100",
    tintClass: "bg-amber-50/55 border-amber-200/70 dark:bg-slate-900/55 dark:border-amber-400/15",
    speedY: -0.22,
    speedX: -0.045,
  },
  // Mid layer (moderate scroll parallax, ~50% opacity)
  {
    text: "🤒 হঠাৎ জ্বর এসেছে",
    positionClass: "top-[57%] left-[2%] lg:left-[3.2%]",
    animClass: "animate-bg-float-b [animation-duration:16s] [animation-delay:-4s]",
    opacityClass: "opacity-50",
    depthScaleClass: "scale-[0.97]",
    tintClass: "bg-rose-50/50 border-rose-200/65 dark:bg-slate-900/50 dark:border-rose-400/15",
    speedY: -0.15,
    speedX: 0.035,
  },
  {
    text: "🏥 ডাক্তারের সিরিয়াল",
    positionClass: "hidden sm:flex top-[79%] right-[2%] lg:right-[2.8%]",
    animClass: "animate-bg-float-a [animation-duration:17s] [animation-delay:-13s]",
    opacityClass: "opacity-50",
    depthScaleClass: "scale-[0.97]",
    tintClass: "bg-teal-50/55 border-teal-200/70 dark:bg-slate-900/50 dark:border-teal-400/15",
    speedY: -0.14,
    speedX: -0.035,
  },
  {
    text: "⚡ কারেন্ট চলে গেছে",
    positionClass: "hidden md:flex bottom-[6%] left-[8%] xl:left-[10%]",
    animClass: "animate-bg-float-b [animation-duration:21s] [animation-delay:-7s]",
    opacityClass: "opacity-45",
    depthScaleClass: "scale-[0.96]",
    tintClass: "bg-sky-50/55 border-sky-200/65 dark:bg-slate-900/45 dark:border-white/10",
    speedY: -0.16,
    speedX: 0.03,
  },
  // Deep background layer (slower scroll parallax, ~40-45% opacity)
  {
    text: "🌧️ প্রচণ্ড বৃষ্টি হচ্ছে",
    positionClass: "hidden lg:flex top-[35%] left-[1.8%] xl:left-[2.8%]",
    animClass: "animate-bg-float-c [animation-duration:19s] [animation-delay:-8s]",
    opacityClass: "opacity-45",
    depthScaleClass: "scale-[0.93]",
    tintClass:
      "bg-indigo-50/55 border-indigo-200/70 dark:bg-slate-900/50 dark:border-indigo-400/15",
    speedY: -0.07,
    speedX: -0.02,
  },
  {
    text: "📶 নেটওয়ার্ক চলে গিয়েছিল",
    positionClass: "hidden lg:flex top-[37%] right-[1.8%] xl:right-[2.6%]",
    animClass: "animate-bg-float-a [animation-duration:18s] [animation-delay:-11s]",
    opacityClass: "opacity-45",
    depthScaleClass: "scale-[0.93]",
    tintClass: "bg-white/60 border-slate-200/75 dark:bg-slate-900/50 dark:border-white/10",
    speedY: -0.08,
    speedX: 0.02,
  },
  {
    text: "🔧 বাইক নষ্ট হয়ে গেছে",
    positionClass: "hidden sm:flex top-[78%] left-[2%] lg:left-[2.6%]",
    animClass: "animate-bg-float-c [animation-duration:20s] [animation-delay:-6s]",
    opacityClass: "opacity-40",
    depthScaleClass: "scale-[0.92]",
    tintClass: "bg-white/60 border-slate-200/75 dark:bg-slate-900/50 dark:border-white/10",
    speedY: -0.06,
    speedX: 0.025,
  },
  {
    text: "🍲 বাসায় মেহমান এসেছে",
    positionClass: "hidden md:flex bottom-[7%] right-[8%] xl:right-[10%]",
    animClass: "animate-bg-float-c [animation-duration:18s] [animation-delay:-3s]",
    opacityClass: "opacity-40",
    depthScaleClass: "scale-[0.92]",
    tintClass: "bg-white/60 border-slate-200/70 dark:bg-slate-900/45 dark:border-white/10",
    speedY: -0.07,
    speedX: -0.02,
  },
];

export function FloatingExcuseBadges() {
  const parallaxRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let targetScrollY = window.scrollY || window.pageYOffset || 0;
    let currentScrollY = targetScrollY;
    let rafId: number | null = null;

    const applyParallax = (scrollOffset: number) => {
      const mobileDampen = window.innerWidth < 768 ? 0.65 : 1;
      const clampedOffset = Math.min(scrollOffset, 1600) * mobileDampen;

      for (let i = 0; i < FLOATING_BADGES.length; i += 1) {
        const el = parallaxRefs.current[i];
        const badge = FLOATING_BADGES[i];
        if (!el || !badge) continue;

        const dx = (clampedOffset * badge.speedX).toFixed(2);
        const dy = (clampedOffset * badge.speedY).toFixed(2);
        el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      }
    };

    const tick = () => {
      const delta = targetScrollY - currentScrollY;
      if (Math.abs(delta) < 0.25) {
        currentScrollY = targetScrollY;
        applyParallax(currentScrollY);
        rafId = null;
        return;
      }

      currentScrollY += delta * 0.14;
      applyParallax(currentScrollY);
      rafId = window.requestAnimationFrame(tick);
    };

    const handleScroll = () => {
      targetScrollY = window.scrollY || window.pageYOffset || 0;
      if (rafId === null) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    // Sync initial scroll position on mount without triggering React re-renders
    applyParallax(currentScrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {FLOATING_BADGES.map((badge, index) => (
        <div
          key={badge.text}
          ref={(el) => {
            parallaxRefs.current[index] = el;
          }}
          className={`absolute will-change-transform ${badge.positionClass}`}
        >
          <div
            className={`flex items-center whitespace-nowrap rounded-2xl border px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-[0_10px_28px_-10px_rgba(15,23,42,0.12)] backdrop-blur-sm will-change-transform sm:px-4 sm:py-2.5 sm:text-[13px] dark:text-slate-200 dark:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.45)] ${badge.animClass} ${badge.opacityClass} ${badge.depthScaleClass} ${badge.tintClass}`}
          >
            {badge.text}
          </div>
        </div>
      ))}
    </div>
  );
}
