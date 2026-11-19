import { forwardRef } from "react";
import { Quote } from "lucide-react";
import { formatExcuseCardBadge, toBanglaNumber, type GeneratedExcuse } from "@/lib/excuses";

export type CardThemeId =
  | "sunset"
  | "midnight"
  | "royal"
  | "rosegold"
  | "emerald"
  | "cream"
  | "royal-gold"
  | "ocean-breeze"
  | "velvet-rose"
  | "midnight-forest"
  | "soft-pastel";

export interface CardThemeConfig {
  id: CardThemeId;
  label: string;
  swatchBackground: string;
  swatchBorder?: string;
  outerBackground: string;
  outerBorder?: string;
  glowTop: string;
  glowBottom: string;
  cardBackground: string;
  cardBorder: string;
  cardShadow: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  quoteIconBg: string;
  quoteIconColor: string;
  textColor: string;
  scoreBadgeBg: string;
  scoreBadgeBorder: string;
  scoreBadgeText: string;
  scoreValueColor: string;
  meterTrack: string;
  meterFill: string;
  footerColor: string;
  footerShadow: string;
}

export const CARD_THEMES: CardThemeConfig[] = [
  {
    id: "sunset",
    label: "Sunset Orange-Teal",
    swatchBackground: "linear-gradient(135deg, #ff6b3d 0%, #ff9f43 50%, #2096a8 100%)",
    outerBackground: "linear-gradient(135deg, #ff6b3d 0%, #ff9f43 48%, #2096a8 100%)",
    glowTop: "radial-gradient(circle, rgba(255,244,179,0.42) 0%, rgba(255,244,179,0) 70%)",
    glowBottom: "radial-gradient(circle, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 70%)",
    cardBackground: "rgba(255, 253, 249, 0.94)",
    cardBorder: "1.5px solid rgba(255, 255, 255, 0.9)",
    cardShadow: "0 24px 56px -14px rgba(45, 24, 16, 0.24)",
    badgeBg: "#fff1e6",
    badgeBorder: "1.5px solid #ffd5b8",
    badgeText: "#c94a1c",
    quoteIconBg: "#fff3db",
    quoteIconColor: "#e85d2a",
    textColor: "#2b1d14",
    scoreBadgeBg: "#eef9fa",
    scoreBadgeBorder: "1.5px solid #bce4e8",
    scoreBadgeText: "#156d7a",
    scoreValueColor: "#e85d2a",
    meterTrack: "#f0e7de",
    meterFill: "linear-gradient(90deg, #2096a8 0%, #2cb67d 55%, #f5b727 100%)",
    footerColor: "#ffffff",
    footerShadow: "0 1px 4px rgba(0, 0, 0, 0.22)",
  },
  {
    id: "midnight",
    label: "Midnight Dark Neon",
    swatchBackground: "linear-gradient(135deg, #0f172a 0%, #1e293b 65%, #f97316 100%)",
    swatchBorder: "#f97316",
    outerBackground: "linear-gradient(145deg, #0b1120 0%, #0f172a 55%, #1e293b 100%)",
    outerBorder: "4px solid #f97316",
    glowTop: "radial-gradient(circle, rgba(249,115,22,0.34) 0%, rgba(249,115,22,0) 70%)",
    glowBottom: "radial-gradient(circle, rgba(56,189,248,0.24) 0%, rgba(56,189,248,0) 70%)",
    cardBackground: "rgba(15, 23, 42, 0.88)",
    cardBorder: "2px solid rgba(249, 115, 22, 0.85)",
    cardShadow: "0 0 36px rgba(249, 115, 22, 0.35), 0 20px 44px -12px rgba(0, 0, 0, 0.65)",
    badgeBg: "rgba(249, 115, 22, 0.16)",
    badgeBorder: "1.5px solid rgba(251, 146, 60, 0.65)",
    badgeText: "#fdba74",
    quoteIconBg: "rgba(249, 115, 22, 0.18)",
    quoteIconColor: "#fb923c",
    textColor: "#f8fafc",
    scoreBadgeBg: "rgba(30, 41, 59, 0.9)",
    scoreBadgeBorder: "1.5px solid rgba(249, 115, 22, 0.5)",
    scoreBadgeText: "#cbd5e1",
    scoreValueColor: "#fb923c",
    meterTrack: "#334155",
    meterFill: "linear-gradient(90deg, #f97316 0%, #fb923c 55%, #facc15 100%)",
    footerColor: "#fdba74",
    footerShadow: "0 0 12px rgba(249, 115, 22, 0.55)",
  },
  {
    id: "royal",
    label: "Royal Purple-Blue",
    swatchBackground: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%)",
    outerBackground: "linear-gradient(135deg, #3730a3 0%, #7c3aed 50%, #2563eb 100%)",
    glowTop: "radial-gradient(circle, rgba(196,181,253,0.42) 0%, rgba(196,181,253,0) 70%)",
    glowBottom: "radial-gradient(circle, rgba(147,197,253,0.32) 0%, rgba(147,197,253,0) 70%)",
    cardBackground: "rgba(255, 255, 255, 0.95)",
    cardBorder: "1.5px solid rgba(255, 255, 255, 0.92)",
    cardShadow: "0 24px 56px -14px rgba(30, 27, 75, 0.36)",
    badgeBg: "#eef2ff",
    badgeBorder: "1.5px solid #c7d2fe",
    badgeText: "#4338ca",
    quoteIconBg: "#ede9fe",
    quoteIconColor: "#6d28d9",
    textColor: "#1e1b4b",
    scoreBadgeBg: "#eff6ff",
    scoreBadgeBorder: "1.5px solid #bfdbfe",
    scoreBadgeText: "#1d4ed8",
    scoreValueColor: "#6d28d9",
    meterTrack: "#e0e7ff",
    meterFill: "linear-gradient(90deg, #4f46e5 0%, #7c3aed 55%, #3b82f6 100%)",
    footerColor: "#ffffff",
    footerShadow: "0 1px 4px rgba(30, 27, 75, 0.35)",
  },
  {
    id: "rosegold",
    label: "Rose Gold & Pink",
    swatchBackground: "linear-gradient(135deg, #f43f5e 0%, #fb7185 50%, #f59e0b 100%)",
    outerBackground: "linear-gradient(135deg, #e11d48 0%, #fb7185 48%, #f4b183 100%)",
    glowTop: "radial-gradient(circle, rgba(255,228,230,0.48) 0%, rgba(255,228,230,0) 70%)",
    glowBottom: "radial-gradient(circle, rgba(254,243,199,0.35) 0%, rgba(254,243,199,0) 70%)",
    cardBackground: "rgba(255, 251, 252, 0.95)",
    cardBorder: "1.5px solid rgba(255, 255, 255, 0.92)",
    cardShadow: "0 24px 56px -14px rgba(136, 19, 55, 0.26)",
    badgeBg: "#fff1f2",
    badgeBorder: "1.5px solid #fecdd3",
    badgeText: "#be123c",
    quoteIconBg: "#ffe4e6",
    quoteIconColor: "#e11d48",
    textColor: "#3b1322",
    scoreBadgeBg: "#fff7ed",
    scoreBadgeBorder: "1.5px solid #fed7aa",
    scoreBadgeText: "#9a3412",
    scoreValueColor: "#e11d48",
    meterTrack: "#ffe4e6",
    meterFill: "linear-gradient(90deg, #e11d48 0%, #fb7185 55%, #f59e0b 100%)",
    footerColor: "#ffffff",
    footerShadow: "0 1px 4px rgba(136, 19, 55, 0.28)",
  },
  {
    id: "emerald",
    label: "Emerald Green & Mint",
    swatchBackground: "linear-gradient(135deg, #059669 0%, #10b981 50%, #5eead4 100%)",
    outerBackground: "linear-gradient(135deg, #047857 0%, #10b981 52%, #5eead4 100%)",
    glowTop: "radial-gradient(circle, rgba(209,250,229,0.45) 0%, rgba(209,250,229,0) 70%)",
    glowBottom: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)",
    cardBackground: "rgba(250, 255, 253, 0.95)",
    cardBorder: "1.5px solid rgba(255, 255, 255, 0.92)",
    cardShadow: "0 24px 56px -14px rgba(6, 78, 59, 0.28)",
    badgeBg: "#ecfdf5",
    badgeBorder: "1.5px solid #a7f3d0",
    badgeText: "#047857",
    quoteIconBg: "#d1fae5",
    quoteIconColor: "#059669",
    textColor: "#064e3b",
    scoreBadgeBg: "#f0fdfa",
    scoreBadgeBorder: "1.5px solid #99f6e4",
    scoreBadgeText: "#0f766e",
    scoreValueColor: "#059669",
    meterTrack: "#d1fae5",
    meterFill: "linear-gradient(90deg, #047857 0%, #10b981 55%, #2dd4bf 100%)",
    footerColor: "#ffffff",
    footerShadow: "0 1px 4px rgba(6, 78, 59, 0.28)",
  },
  {
    id: "cream",
    label: "Classic Minimal Cream & Gold",
    swatchBackground: "linear-gradient(135deg, #fdf8f0 0%, #f3dfba 55%, #d4a359 100%)",
    swatchBorder: "#d4a359",
    outerBackground: "linear-gradient(135deg, #fbf5ea 0%, #f3e3c6 52%, #e4c58e 100%)",
    outerBorder: "2px solid #d4a359",
    glowTop: "radial-gradient(circle, rgba(212,163,89,0.28) 0%, rgba(212,163,89,0) 70%)",
    glowBottom: "radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 70%)",
    cardBackground: "rgba(255, 253, 248, 0.96)",
    cardBorder: "1.5px solid rgba(212, 163, 89, 0.55)",
    cardShadow: "0 20px 44px -16px rgba(120, 84, 34, 0.2)",
    badgeBg: "#fdf6e7",
    badgeBorder: "1.5px solid #e6c78b",
    badgeText: "#8c5c19",
    quoteIconBg: "#f9edd4",
    quoteIconColor: "#b47b27",
    textColor: "#332414",
    scoreBadgeBg: "#fdf8ec",
    scoreBadgeBorder: "1.5px solid #e6c78b",
    scoreBadgeText: "#7c5218",
    scoreValueColor: "#b47b27",
    meterTrack: "#f0e3ca",
    meterFill: "linear-gradient(90deg, #b47b27 0%, #d4a359 60%, #e7c07b 100%)",
    footerColor: "#6e4714",
    footerShadow: "none",
  },
  {
    id: "royal-gold",
    label: "Royal Gold (রয়্যাল গোল্ড ও ব্ল্যাক)",
    swatchBackground: "linear-gradient(135deg, #09090b 0%, #451a03 52%, #f59e0b 100%)",
    swatchBorder: "#fbbf24",
    outerBackground: "linear-gradient(135deg, #09090b 0%, #1c1917 52%, #b45309 86%, #eab308 100%)",
    outerBorder: "3px solid rgba(251, 191, 36, 0.78)",
    glowTop: "radial-gradient(circle, rgba(250,204,21,0.36) 0%, rgba(250,204,21,0) 70%)",
    glowBottom: "radial-gradient(circle, rgba(217,119,6,0.28) 0%, rgba(217,119,6,0) 70%)",
    cardBackground: "rgba(12, 10, 9, 0.88)",
    cardBorder: "1.5px solid rgba(251, 191, 36, 0.68)",
    cardShadow: "0 0 32px rgba(245, 158, 11, 0.28), 0 22px 48px -12px rgba(0, 0, 0, 0.7)",
    badgeBg: "rgba(245, 158, 11, 0.16)",
    badgeBorder: "1.5px solid rgba(251, 191, 36, 0.65)",
    badgeText: "#fcd34d",
    quoteIconBg: "rgba(245, 158, 11, 0.18)",
    quoteIconColor: "#fbbf24",
    textColor: "#fefce8",
    scoreBadgeBg: "rgba(28, 25, 23, 0.92)",
    scoreBadgeBorder: "1.5px solid rgba(251, 191, 36, 0.55)",
    scoreBadgeText: "#fef3c7",
    scoreValueColor: "#fbbf24",
    meterTrack: "#292524",
    meterFill: "linear-gradient(90deg, #b45309 0%, #f59e0b 55%, #fde047 100%)",
    footerColor: "#fde68a",
    footerShadow: "0 1px 6px rgba(0, 0, 0, 0.65)",
  },
  {
    id: "ocean-breeze",
    label: "Ocean Breeze (ওশান ব্লু)",
    swatchBackground: "linear-gradient(135deg, #0c2d6b 0%, #0284c7 52%, #38bdf8 100%)",
    outerBackground: "linear-gradient(135deg, #0c2d6b 0%, #0369a1 48%, #22d3ee 100%)",
    glowTop: "radial-gradient(circle, rgba(165,243,252,0.4) 0%, rgba(165,243,252,0) 70%)",
    glowBottom: "radial-gradient(circle, rgba(56,189,248,0.32) 0%, rgba(56,189,248,0) 70%)",
    cardBackground: "rgba(7, 35, 79, 0.78)",
    cardBorder: "1.5px solid rgba(125, 211, 252, 0.48)",
    cardShadow: "0 24px 56px -14px rgba(8, 47, 73, 0.45)",
    badgeBg: "rgba(34, 211, 238, 0.16)",
    badgeBorder: "1.5px solid rgba(103, 232, 249, 0.55)",
    badgeText: "#e0f2fe",
    quoteIconBg: "rgba(56, 189, 248, 0.22)",
    quoteIconColor: "#7dd3fc",
    textColor: "#ffffff",
    scoreBadgeBg: "rgba(12, 74, 110, 0.78)",
    scoreBadgeBorder: "1.5px solid rgba(103, 232, 249, 0.52)",
    scoreBadgeText: "#e0f2fe",
    scoreValueColor: "#67e8f9",
    meterTrack: "rgba(14, 116, 144, 0.55)",
    meterFill: "linear-gradient(90deg, #38bdf8 0%, #22d3ee 55%, #a5f3fc 100%)",
    footerColor: "#ffffff",
    footerShadow: "0 1px 6px rgba(7, 35, 79, 0.55)",
  },
  {
    id: "velvet-rose",
    label: "Velvet Rose (রোজ পিঙ্ক ও পার্পল)",
    swatchBackground: "linear-gradient(135deg, #ec4899 0%, #a21caf 52%, #581c87 100%)",
    outerBackground: "linear-gradient(135deg, #e11d74 0%, #9d174d 45%, #581c87 100%)",
    glowTop: "radial-gradient(circle, rgba(251,207,232,0.4) 0%, rgba(251,207,232,0) 70%)",
    glowBottom: "radial-gradient(circle, rgba(216,180,254,0.32) 0%, rgba(216,180,254,0) 70%)",
    cardBackground: "rgba(68, 12, 62, 0.76)",
    cardBorder: "1.5px solid rgba(249, 168, 212, 0.48)",
    cardShadow: "0 24px 56px -14px rgba(59, 7, 100, 0.45)",
    badgeBg: "rgba(244, 114, 182, 0.18)",
    badgeBorder: "1.5px solid rgba(249, 168, 212, 0.55)",
    badgeText: "#fce7f3",
    quoteIconBg: "rgba(236, 72, 153, 0.22)",
    quoteIconColor: "#f9a8d4",
    textColor: "#ffffff",
    scoreBadgeBg: "rgba(88, 28, 135, 0.68)",
    scoreBadgeBorder: "1.5px solid rgba(249, 168, 212, 0.52)",
    scoreBadgeText: "#fce7f3",
    scoreValueColor: "#f9a8d4",
    meterTrack: "rgba(131, 24, 67, 0.55)",
    meterFill: "linear-gradient(90deg, #f472b6 0%, #e879f9 55%, #fbcfe8 100%)",
    footerColor: "#ffffff",
    footerShadow: "0 1px 6px rgba(59, 7, 100, 0.55)",
  },
  {
    id: "midnight-forest",
    label: "Midnight Forest (মিডনাইট এমারেল্ড)",
    swatchBackground: "linear-gradient(135deg, #022c22 0%, #059669 52%, #14b8a6 100%)",
    outerBackground: "linear-gradient(135deg, #022c22 0%, #065f46 50%, #0f766e 100%)",
    glowTop: "radial-gradient(circle, rgba(94,234,212,0.34) 0%, rgba(94,234,212,0) 70%)",
    glowBottom: "radial-gradient(circle, rgba(52,211,153,0.28) 0%, rgba(52,211,153,0) 70%)",
    cardBackground: "rgba(3, 44, 34, 0.80)",
    cardBorder: "1.5px solid rgba(94, 234, 212, 0.48)",
    cardShadow: "0 24px 56px -14px rgba(2, 44, 34, 0.52)",
    badgeBg: "rgba(16, 185, 129, 0.18)",
    badgeBorder: "1.5px solid rgba(110, 231, 183, 0.55)",
    badgeText: "#d1fae5",
    quoteIconBg: "rgba(20, 184, 166, 0.22)",
    quoteIconColor: "#5eead4",
    textColor: "#ffffff",
    scoreBadgeBg: "rgba(6, 78, 59, 0.78)",
    scoreBadgeBorder: "1.5px solid rgba(94, 234, 212, 0.52)",
    scoreBadgeText: "#d1fae5",
    scoreValueColor: "#5eead4",
    meterTrack: "rgba(6, 95, 70, 0.6)",
    meterFill: "linear-gradient(90deg, #10b981 0%, #2dd4bf 55%, #a7f3d0 100%)",
    footerColor: "#ffffff",
    footerShadow: "0 1px 6px rgba(2, 44, 34, 0.6)",
  },
  {
    id: "soft-pastel",
    label: "Soft Pastel (প্যাস্টেল ল্যাভেন্ডার)",
    swatchBackground: "linear-gradient(135deg, #d8b4fe 0%, #f3e8ff 48%, #fdba74 100%)",
    swatchBorder: "#c084fc",
    outerBackground: "linear-gradient(135deg, #e9d5ff 0%, #f3e8ff 42%, #fed7aa 100%)",
    outerBorder: "2px solid rgba(168, 85, 247, 0.3)",
    glowTop: "radial-gradient(circle, rgba(192,132,252,0.34) 0%, rgba(192,132,252,0) 70%)",
    glowBottom: "radial-gradient(circle, rgba(251,146,60,0.28) 0%, rgba(251,146,60,0) 70%)",
    cardBackground: "rgba(255, 252, 250, 0.90)",
    cardBorder: "1.5px solid rgba(192, 132, 252, 0.45)",
    cardShadow: "0 22px 48px -16px rgba(107, 33, 168, 0.18)",
    badgeBg: "#f5edff",
    badgeBorder: "1.5px solid #d8b4fe",
    badgeText: "#581c87",
    quoteIconBg: "#ffedd5",
    quoteIconColor: "#9a3412",
    textColor: "#291a14",
    scoreBadgeBg: "#fff7ed",
    scoreBadgeBorder: "1.5px solid #fdba74",
    scoreBadgeText: "#431407",
    scoreValueColor: "#7e22ce",
    meterTrack: "#ede9fe",
    meterFill: "linear-gradient(90deg, #9333ea 0%, #ec4899 55%, #f97316 100%)",
    footerColor: "#3b1d14",
    footerShadow: "none",
  },
];

export function getCardTheme(themeId: CardThemeId = "sunset"): CardThemeConfig {
  return CARD_THEMES.find((t) => t.id === themeId) ?? CARD_THEMES[0]!;
}

interface ExcuseShareCardProps {
  result: GeneratedExcuse;
  themeId?: CardThemeId;
  customMessage?: string;
  showCredibility?: boolean;
}

function getMessageFontSize(length: number): string {
  if (length <= 120) return "23px";
  if (length <= 190) return "20px";
  if (length <= 260) return "18px";
  return "16px";
}

export const ExcuseShareCard = forwardRef<HTMLDivElement, ExcuseShareCardProps>(
  ({ result, themeId = "sunset", customMessage, showCredibility = true }, ref) => {
    const theme = getCardTheme(themeId);
    const badgeLabel = result.customBadge ?? formatExcuseCardBadge(result.target, result.tone);
    const displayMessage = (customMessage ?? result.message).trim() || result.message;
    const fontSize = getMessageFontSize(displayMessage.length);

    return (
      <div
        ref={ref}
        style={{
          width: "600px",
          height: "600px",
          padding: "32px",
          background: theme.outerBackground,
          border: theme.outerBorder ?? "none",
          fontFamily: '"Hind Siliguri", "Montserrat", sans-serif',
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* Subtle decorative background glows */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "260px",
            height: "260px",
            borderRadius: "9999px",
            background: theme.glowTop,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-90px",
            left: "-70px",
            width: "280px",
            height: "280px",
            borderRadius: "9999px",
            background: theme.glowBottom,
            pointerEvents: "none",
          }}
        />

        {/* Glassmorphism Inner Card */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: theme.cardBackground,
            borderRadius: "28px",
            border: theme.cardBorder,
            boxShadow: theme.cardShadow,
            padding: "28px 32px 24px",
            boxSizing: "border-box",
          }}
        >
          {/* Top Recipient & Tone Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 18px",
              borderRadius: "9999px",
              backgroundColor: theme.badgeBg,
              border: theme.badgeBorder,
              color: theme.badgeText,
              fontSize: "14px",
              fontWeight: 700,
              lineHeight: 1.3,
              textAlign: "center",
            }}
          >
            {badgeLabel}
          </div>

          {/* Centered Quote & Bengali Excuse */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px 4px",
              width: "100%",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "9999px",
                backgroundColor: theme.quoteIconBg,
                color: theme.quoteIconColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "14px",
              }}
            >
              <Quote size={22} strokeWidth={2.4} />
            </div>

            <p
              style={{
                margin: 0,
                fontSize,
                fontWeight: 700,
                lineHeight: 1.65,
                color: theme.textColor,
                wordBreak: "break-word",
              }}
            >
              “{displayMessage}”
            </p>
          </div>

          {/* Optional Believability Score Badge */}
          {showCredibility && (
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 18px",
                  borderRadius: "9999px",
                  backgroundColor: theme.scoreBadgeBg,
                  border: theme.scoreBadgeBorder,
                  color: theme.scoreBadgeText,
                  fontSize: "15px",
                  fontWeight: 700,
                }}
              >
                <span>🎯 বিশ্বাসযোগ্যতার হার:</span>
                <span style={{ color: theme.scoreValueColor, fontSize: "17px" }}>
                  {toBanglaNumber(result.score)}%
                </span>
              </div>

              <div
                style={{
                  width: "75%",
                  height: "8px",
                  borderRadius: "9999px",
                  backgroundColor: theme.meterTrack,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${result.score}%`,
                    height: "100%",
                    borderRadius: "9999px",
                    background: theme.meterFill,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Branding Watermark */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            paddingTop: "10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "3px",
            textAlign: "center",
            color: theme.footerColor,
            textShadow: theme.footerShadow,
            lineHeight: 1.35,
          }}
        >
          <div style={{ fontSize: "14px", fontWeight: 700 }}>
            তৈরি করা হয়েছে: অজুহাত ফ্যাক্টরি দিয়ে 😎
          </div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              opacity: 0.95,
              letterSpacing: "0.01em",
            }}
          >
            ভিজিট করুন: ojuhat-factory.vercel.app
          </div>
        </div>
      </div>
    );
  },
);

ExcuseShareCard.displayName = "ExcuseShareCard";
