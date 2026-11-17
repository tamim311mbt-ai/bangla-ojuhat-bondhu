import { forwardRef } from "react";
import { Quote } from "lucide-react";
import { formatExcuseCardBadge, toBanglaNumber, type GeneratedExcuse } from "@/lib/excuses";

interface ExcuseShareCardProps {
  result: GeneratedExcuse;
}

function getMessageFontSize(length: number): string {
  if (length <= 120) return "23px";
  if (length <= 190) return "20px";
  if (length <= 260) return "18px";
  return "16px";
}

export const ExcuseShareCard = forwardRef<HTMLDivElement, ExcuseShareCardProps>(
  ({ result }, ref) => {
    const badgeLabel = formatExcuseCardBadge(result.target, result.tone);
    const fontSize = getMessageFontSize(result.message.length);

    return (
      <div
        ref={ref}
        style={{
          width: "600px",
          height: "600px",
          padding: "32px",
          background: "linear-gradient(135deg, #ff6b3d 0%, #ff9f43 48%, #2096a8 100%)",
          fontFamily: '"Hind Siliguri", "Noto Sans Bengali", system-ui, sans-serif',
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
            background:
              "radial-gradient(circle, rgba(255,244,179,0.42) 0%, rgba(255,244,179,0) 70%)",
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
            background:
              "radial-gradient(circle, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 70%)",
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
            backgroundColor: "rgba(255, 253, 249, 0.94)",
            borderRadius: "28px",
            border: "1.5px solid rgba(255, 255, 255, 0.9)",
            boxShadow: "0 24px 56px -14px rgba(45, 24, 16, 0.24)",
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
              backgroundColor: "#fff1e6",
              border: "1.5px solid #ffd5b8",
              color: "#c94a1c",
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
                backgroundColor: "#fff3db",
                color: "#e85d2a",
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
                color: "#2b1d14",
                wordBreak: "break-word",
              }}
            >
              “{result.message}”
            </p>
          </div>

          {/* Believability Score Badge */}
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
                backgroundColor: "#eef9fa",
                border: "1.5px solid #bce4e8",
                color: "#156d7a",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              <span>🎯 বিশ্বাসযোগ্যতার হার:</span>
              <span style={{ color: "#e85d2a", fontSize: "17px" }}>
                {toBanglaNumber(result.score)}%
              </span>
            </div>

            <div
              style={{
                width: "75%",
                height: "8px",
                borderRadius: "9999px",
                backgroundColor: "#f0e7de",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${result.score}%`,
                  height: "100%",
                  borderRadius: "9999px",
                  background: "linear-gradient(90deg, #2096a8 0%, #2cb67d 55%, #f5b727 100%)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Branding Watermark */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            paddingTop: "14px",
            textAlign: "center",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: 700,
            textShadow: "0 1px 4px rgba(0, 0, 0, 0.22)",
          }}
        >
          তৈরি করা হয়েছে: অজুহাত ফ্যাক্টরি দিয়ে 😎
        </div>
      </div>
    );
  },
);

ExcuseShareCard.displayName = "ExcuseShareCard";
