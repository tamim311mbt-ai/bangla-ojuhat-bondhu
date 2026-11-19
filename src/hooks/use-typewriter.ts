import { useEffect, useMemo, useState } from "react";

type GraphemeSegmenter = {
  segment: (input: string) => Iterable<{ segment: string }>;
};

let cachedSegmenter: GraphemeSegmenter | null | undefined;

function getBanglaGraphemeSegmenter(): GraphemeSegmenter | null {
  if (cachedSegmenter !== undefined) {
    return cachedSegmenter;
  }
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    try {
      const SegmenterCtor = (
        Intl as unknown as {
          Segmenter: new (locale: string, opts: { granularity: "grapheme" }) => GraphemeSegmenter;
        }
      ).Segmenter;
      cachedSegmenter = new SegmenterCtor("bn", { granularity: "grapheme" });
      return cachedSegmenter;
    } catch {
      cachedSegmenter = null;
      return null;
    }
  }
  cachedSegmenter = null;
  return null;
}

/**
 * Splits Bengali Unicode text into intact grapheme clusters so conjuncts (যুক্তবর্ণ)
 * and vowel signs (কার) never render half-broken during typewriter frames.
 */
export function segmentGraphemes(text: string): string[] {
  if (!text) return [];
  const segmenter = getBanglaGraphemeSegmenter();
  if (segmenter) {
    return Array.from(segmenter.segment(text), (item) => item.segment);
  }
  return Array.from(text);
}

interface UseTypewriterOptions {
  isStreaming?: boolean;
}

export function useTypewriter(
  targetText: string,
  triggerKey: string | number,
  options?: UseTypewriterOptions,
) {
  const isStreaming = options?.isStreaming ?? false;
  const graphemes = useMemo(() => segmentGraphemes(targetText), [targetText]);
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setRevealedCount(graphemes.length);
      return;
    }
    setRevealedCount(0);
    // Intentionally reset only when a brand-new excuse generation starts (triggerKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setRevealedCount(graphemes.length);
      return;
    }

    if (revealedCount >= graphemes.length) {
      return;
    }

    // Target ~0.85s - 1.15s total reveal duration so typing feels crisp and natural
    const step = graphemes.length > 150 ? 3 : graphemes.length > 85 ? 2 : 1;
    const intervalMs = graphemes.length > 85 ? 16 : 18;

    const timer = window.setTimeout(() => {
      setRevealedCount((prev) => Math.min(graphemes.length, prev + step));
    }, intervalMs);

    return () => window.clearTimeout(timer);
  }, [graphemes.length, revealedCount]);

  const isTyping = isStreaming || revealedCount < graphemes.length;
  const displayedText =
    revealedCount >= graphemes.length ? targetText : graphemes.slice(0, revealedCount).join("");

  return { displayedText, isTyping };
}
