import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "pickmetype - 나의 유형 찾기";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "linear-gradient(135deg, #fffbeb 0%, #ffffff 40%, #fff7ed 70%, #fef2f2 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -60,
            width: 300,
            height: 300,
            borderRadius: 150,
            background: "linear-gradient(135deg, #f59e0b22, #ea580c11)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -40,
            width: 250,
            height: 250,
            borderRadius: 125,
            background: "linear-gradient(135deg, #ef444411, #f59e0b11)",
          }}
        />

        {/* logo */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontSize: 80,
              fontWeight: 900,
              color: "#1f2937",
              fontFamily: "system-ui, sans-serif",
              letterSpacing: -2,
            }}
          >
            pick
          </span>
          <span
            style={{
              fontSize: 80,
              fontWeight: 900,
              background: "linear-gradient(90deg, #f59e0b, #ea580c, #ef4444)",
              backgroundClip: "text",
              color: "transparent",
              fontFamily: "system-ui, sans-serif",
              letterSpacing: -2,
            }}
          >
            me
          </span>
          <span
            style={{
              fontSize: 80,
              fontWeight: 900,
              color: "#1f2937",
              fontFamily: "system-ui, sans-serif",
              letterSpacing: -2,
            }}
          >
            type
          </span>
        </div>

        {/* tagline */}
        <div
          style={{
            fontSize: 32,
            color: "#6b7280",
            fontFamily: "system-ui, sans-serif",
            fontWeight: 500,
            marginBottom: 40,
          }}
        >
          나의 유형 찾기
        </div>

        {/* test icons */}
        <div
          style={{
            display: "flex",
            gap: 24,
          }}
        >
          {["🐾 동물상", "🍪 두쫀쿠", "⚔️ 멘탈HP", "💰 시가총액"].map(
            (item) => (
              <div
                key={item}
                style={{
                  background: "rgba(255,255,255,0.8)",
                  border: "1px solid #f3f4f6",
                  borderRadius: 16,
                  padding: "12px 24px",
                  fontSize: 22,
                  color: "#374151",
                  fontWeight: 600,
                  fontFamily: "system-ui, sans-serif",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                {item}
              </div>
            )
          )}
        </div>

        {/* url */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            fontSize: 18,
            color: "#9ca3af",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          pickmetype.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
