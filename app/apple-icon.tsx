import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: "linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #ef4444 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 0,
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 48,
              fontWeight: 900,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: -2,
            }}
          >
            p
          </span>
          <span
            style={{
              color: "#ffffff",
              fontSize: 64,
              fontWeight: 900,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: -2,
            }}
          >
            me
          </span>
        </div>
        {/* small dot accent */}
        <div
          style={{
            position: "absolute",
            top: 22,
            right: 28,
            width: 18,
            height: 18,
            borderRadius: 9,
            background: "rgba(255,255,255,0.35)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
