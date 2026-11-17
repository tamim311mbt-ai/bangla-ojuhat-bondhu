import confetti from "canvas-confetti";

const FESTIVE_COLORS = ["#E85D2A", "#F59E0B", "#14B8A6", "#22C55E", "#FB7185", "#FBBF24"];

/**
 * Fires a lightweight, vibrant confetti burst when generating an excuse.
 * Safely no-ops during SSR or when the user prefers reduced motion.
 */
export function fireExcuseConfetti(): void {
  if (typeof window === "undefined") return;

  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) return;

  try {
    void confetti({
      particleCount: 48,
      spread: 66,
      startVelocity: 32,
      ticks: 160,
      decay: 0.92,
      scalar: 0.95,
      origin: { x: 0.5, y: 0.65 },
      colors: FESTIVE_COLORS,
      disableForReducedMotion: true,
    });

    window.setTimeout(() => {
      try {
        void confetti({
          particleCount: 24,
          angle: 60,
          spread: 50,
          startVelocity: 26,
          ticks: 130,
          scalar: 0.85,
          origin: { x: 0.25, y: 0.7 },
          colors: FESTIVE_COLORS,
          disableForReducedMotion: true,
        });
        void confetti({
          particleCount: 24,
          angle: 120,
          spread: 50,
          startVelocity: 26,
          ticks: 130,
          scalar: 0.85,
          origin: { x: 0.75, y: 0.7 },
          colors: FESTIVE_COLORS,
          disableForReducedMotion: true,
        });
      } catch {
        // Ignore secondary canvas errors on restricted browsers.
      }
    }, 110);
  } catch {
    // Ignore canvas initialization issues on unsupported environments.
  }
}
