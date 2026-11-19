import { useEffect } from "react";

function findScrollableAncestor(target: EventTarget | null): HTMLElement | null {
  let node = target instanceof HTMLElement ? target : null;
  while (node && node !== document.body && node !== document.documentElement) {
    const tag = node.tagName;
    if (tag === "TEXTAREA" || tag === "SELECT") {
      return node;
    }
    if (node.getAttribute("role") === "dialog") {
      return node;
    }
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight + 2
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

function normalizeWheelDelta(event: WheelEvent): number {
  let delta = event.deltaY;
  if (event.deltaMode === 1) {
    // Line mode (Firefox / discrete mouse wheel)
    delta *= 32;
  } else if (event.deltaMode === 2) {
    // Page mode
    delta *= window.innerHeight * 0.85;
  }
  return delta;
}

/**
 * Adds silky inertia/momentum easing to pointer mouse-wheel / trackpad scrolling
 * while deferring natively to touch devices, open modals, and inner scrollables.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia?.("(pointer: fine)").matches) return;

    let currentY = window.scrollY || window.pageYOffset || 0;
    let targetY = currentY;
    let rafId: number | null = null;
    let isAnimating = false;

    const getMaxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const clamp = (value: number) => Math.max(0, Math.min(getMaxScroll(), value));

    const step = () => {
      const diff = targetY - currentY;
      if (Math.abs(diff) < 0.45) {
        currentY = targetY;
        window.scrollTo({ top: currentY, behavior: "instant" as ScrollBehavior });
        isAnimating = false;
        rafId = null;
        return;
      }

      // Exponential inertia easing (~cubic-bezier smooth deceleration)
      currentY += diff * 0.115;
      window.scrollTo({ top: currentY, behavior: "instant" as ScrollBehavior });
      rafId = window.requestAnimationFrame(step);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      if (document.body.style.overflow === "hidden" || document.querySelector('[role="dialog"]')) {
        return;
      }
      if (findScrollableAncestor(event.target)) {
        return;
      }

      const maxScroll = getMaxScroll();
      if (maxScroll <= 0) return;

      const delta = normalizeWheelDelta(event);
      if (Math.abs(delta) < 0.5) return;

      event.preventDefault();

      if (!isAnimating) {
        currentY = window.scrollY || window.pageYOffset || 0;
        targetY = currentY;
      }

      targetY = clamp(targetY + delta * 1.05);

      if (!isAnimating) {
        isAnimating = true;
        rafId = window.requestAnimationFrame(step);
      }
    };

    const onNativeScroll = () => {
      const actualY = window.scrollY || window.pageYOffset || 0;
      if (!isAnimating || Math.abs(actualY - currentY) > 12) {
        currentY = actualY;
        targetY = actualY;
      }
    };

    const onResize = () => {
      targetY = clamp(targetY);
      currentY = clamp(currentY);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onNativeScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onNativeScroll);
      window.removeEventListener("resize", onResize);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);
}
