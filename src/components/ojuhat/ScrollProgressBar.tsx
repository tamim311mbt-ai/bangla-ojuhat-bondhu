import { useEffect, useRef } from "react";

/**
 * Ultra-thin luxury gradient scroll progress bar pinned to the top viewport edge.
 * Uses direct GPU `scaleX` updates inside `requestAnimationFrame` for zero React re-renders.
 */
export function ScrollProgressBar() {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let rafId: number | null = null;

    const updateProgress = () => {
      rafId = null;
      const el = fillRef.current;
      if (!el) return;

      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollTop = window.scrollY || window.pageYOffset || 0;
      const progress = docHeight > 0 ? Math.max(0, Math.min(1, scrollTop / docHeight)) : 0;

      el.style.transform = `scaleX(${progress.toFixed(4)})`;
    };

    const scheduleUpdate = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateProgress);
      }
    };

    updateProgress();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] bg-slate-200/35 dark:bg-white/5"
    >
      <div
        ref={fillRef}
        className="h-full w-full origin-left bg-gradient-to-r from-[#ff512f] via-[#f97316] to-[#38bdf8] shadow-[0_0_12px_rgba(249,115,22,0.55)] will-change-transform"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
