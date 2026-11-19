import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Check, Download, Loader2, Palette, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  CARD_THEMES,
  ExcuseShareCard,
  type CardThemeId,
} from "@/components/ojuhat/ExcuseShareCard";
import type { GeneratedExcuse } from "@/lib/excuses";

interface CardCustomizerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: GeneratedExcuse;
}

export function CardCustomizerModal({ open, onOpenChange, result }: CardCustomizerModalProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);

  const [themeId, setThemeId] = useState<CardThemeId>("sunset");
  const [editedMessage, setEditedMessage] = useState(result.message);
  const [showCredibility, setShowCredibility] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.55);

  useEffect(() => {
    setEditedMessage(result.message);
  }, [result.id, result.message]);

  useEffect(() => {
    if (!open) return;

    const updateScale = () => {
      const containerWidth = previewWrapRef.current?.clientWidth ?? 340;
      const targetSize = Math.min(containerWidth, 380);
      setPreviewScale(targetSize / 600);
    };

    updateScale();
    const frame = requestAnimationFrame(updateScale);
    window.addEventListener("resize", updateScale);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScale);
    };
  }, [open]);

  const handleDownloadPng = async () => {
    if (!captureRef.current || isDownloading) return;
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
        dataUrl = await toPng(captureRef.current, captureOptions);
      } catch {
        dataUrl = await toPng(captureRef.current, { ...captureOptions, skipFonts: true });
      }

      const link = document.createElement("a");
      link.download = `ojuhat-card-${themeId}.png`;
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

  const previewPixelSize = Math.round(600 * previewScale);
  const hasEditedText = editedMessage.trim() !== result.message.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto rounded-3xl border border-slate-200/80 bg-white/95 p-4 backdrop-blur-2xl dark:border-white/12 dark:bg-[#0f172a]/95 sm:p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2 font-display text-lg font-bold sm:text-xl">
            <Palette className="size-5 text-primary" aria-hidden="true" />
            <span>অজুহাত কার্ড কাস্টমাইজ করুন</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            পছন্দের রঙ বেছে নিন, চাইলে লেখা এডিট করুন এবং হাই-রেজোলিউশন PNG ডাউনলোড করুন।
          </DialogDescription>
        </DialogHeader>

        {/* Live 1:1 Card Preview */}
        <div ref={previewWrapRef} className="mt-1 flex w-full justify-center">
          <div
            className="relative overflow-hidden rounded-2xl shadow-lg ring-1 ring-border/70"
            style={{ width: `${previewPixelSize}px`, height: `${previewPixelSize}px` }}
          >
            <div
              style={{
                width: "600px",
                height: "600px",
                transform: `scale(${previewScale})`,
                transformOrigin: "top left",
              }}
            >
              <ExcuseShareCard
                result={result}
                themeId={themeId}
                customMessage={editedMessage}
                showCredibility={showCredibility}
              />
            </div>
          </div>
        </div>

        {/* 6 Background Theme Swatches */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground sm:text-sm">
            কার্ডের থিম বেছে নিন
          </p>
          <div className="mx-auto grid w-fit grid-cols-6 justify-items-center gap-2.5 sm:mx-0 sm:gap-3">
            {CARD_THEMES.map((theme) => {
              const active = theme.id === themeId;
              const isLightSwatch = theme.id === "cream" || theme.id === "soft-pastel";
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setThemeId(theme.id)}
                  title={theme.label}
                  aria-label={theme.label}
                  aria-pressed={active}
                  className={`relative flex size-10 cursor-pointer items-center justify-center rounded-full transition-transform duration-150 hover:scale-110 focus:outline-none ${
                    active
                      ? "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-card"
                      : "ring-1 ring-border"
                  }`}
                  style={{
                    background: theme.swatchBackground,
                    border: theme.swatchBorder ? `2px solid ${theme.swatchBorder}` : undefined,
                  }}
                >
                  {active && (
                    <Check
                      className={`size-4 drop-shadow-sm ${
                        isLightSwatch ? "text-amber-950" : "text-white"
                      }`}
                      strokeWidth={3}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Text Edit & Credibility Toggle */}
        <div className="space-y-3 rounded-2xl border border-border/70 bg-secondary/40 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="card-custom-message" className="text-xs font-semibold text-foreground">
              লেখা এডিট করুন (ঐচ্ছিক)
            </label>
            {hasEditedText && (
              <button
                type="button"
                onClick={() => setEditedMessage(result.message)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <RotateCcw className="size-3" />
                <span>আগের লেখা</span>
              </button>
            )}
          </div>
          <Textarea
            id="card-custom-message"
            value={editedMessage}
            onChange={(e) => setEditedMessage(e.target.value)}
            rows={2}
            className="min-h-[68px] resize-none rounded-xl border-border bg-card text-sm leading-relaxed"
            placeholder="আপনার অজুহাত এখানে লিখুন..."
          />

          <div className="flex items-center justify-between gap-3 pt-1">
            <label
              htmlFor="toggle-credibility-badge"
              className="cursor-pointer text-xs font-semibold text-foreground sm:text-sm"
            >
              বিশ্বাসযোগ্যতার হার (Credibility Badge) দেখান
            </label>
            <Switch
              id="toggle-credibility-badge"
              checked={showCredibility}
              onCheckedChange={setShowCredibility}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <Button
            type="button"
            size="action"
            onClick={() => void handleDownloadPng()}
            disabled={isDownloading}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-gradient-cta text-sm font-bold text-white shadow-sm hover:brightness-105"
          >
            {isDownloading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                <span>ডাউনলোড হচ্ছে...</span>
              </>
            ) : (
              <>
                <Download className="size-4" aria-hidden="true" />
                <span>ছবি ডাউনলোড করুন (Download PNG)</span>
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="action"
            onClick={() => onOpenChange(false)}
            className="flex h-12 items-center justify-center gap-1.5 rounded-xl px-5 text-sm font-semibold"
          >
            <X className="size-4" aria-hidden="true" />
            <span>বন্ধ করুন (Close)</span>
          </Button>
        </div>

        {/* Dedicated full-resolution 600x600 off-screen node for crisp 2x PNG capture */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-[-9999px] top-0 z-[-1] opacity-100"
        >
          <ExcuseShareCard
            ref={captureRef}
            result={result}
            themeId={themeId}
            customMessage={editedMessage}
            showCredibility={showCredibility}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
