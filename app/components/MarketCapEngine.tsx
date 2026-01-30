"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import AdBanner from "./AdBanner";
import { gtagEvent } from "./GoogleAnalytics";
import {
  questions,
  STAT_LABELS,
  RISK_POOL,
  SECTOR_POOL,
  THEME_POOL,
  getGradeInfo,
  calcMarketCap,
  calcStatsSeeded,
  seededRandom,
} from "../market-cap/data";

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (settings: Record<string, unknown>) => void;
      };
    };
  }
}

const KAKAO_KEY = "79b4c0e71a9520496fb0df7ac77c8804";
const BASE_VALUE = 50; // 기본 시가총액 50억

type Phase = "intro" | "quiz" | "calculating" | "result";

function pickFromPool(pool: string[], seed: number, count: number): string[] {
  const result: string[] = [];
  const used = new Set<number>();
  for (let i = 0; i < count; i++) {
    let idx: number;
    let attempt = 0;
    do {
      idx = Math.floor(seededRandom(seed + i * 7 + attempt) * pool.length);
      attempt++;
    } while (used.has(idx) && attempt < 20);
    used.add(idx);
    result.push(pool[idx]);
  }
  return result;
}

export default function MarketCapEngine() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [nickname, setNickname] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showBars, setShowBars] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const shareCardRef = useRef<HTMLDivElement>(null);

  const initKakao = () => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_KEY);
    }
  };

  useEffect(() => {
    initKakao();
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  const displayName = nickname.trim() || "익명 기업";

  /* ---------- calculate results ---------- */
  const seed = answers.reduce((sum, a, i) => sum + a * (i + 1) + 7, 42);

  const result = (() => {
    let totalValue = BASE_VALUE;
    answers.forEach((ansIdx, qIdx) => {
      if (qIdx >= questions.length) return;
      const answer = questions[qIdx].answers[ansIdx];
      if (!answer) return;
      totalValue += answer.value;
    });
    // 약간의 랜덤 변동 추가 (시드 기반)
    const fluctuation = seededRandom(seed + 100) * 10 - 5;
    totalValue = Math.max(0.1, totalValue + fluctuation);

    const marketCap = calcMarketCap(totalValue);
    const grade = getGradeInfo(totalValue);
    const stats = calcStatsSeeded(totalValue, seed);
    const risks = pickFromPool(RISK_POOL, seed + 200, 2);
    const sector = pickFromPool(SECTOR_POOL, seed + 300, 1)[0];
    const theme = pickFromPool(THEME_POOL, seed + 400, 1)[0];

    // 목표가 (현재 대비 +10~30%)
    const targetMultiple = 1 + seededRandom(seed + 500) * 0.2 + 0.1;
    const targetValue = totalValue * targetMultiple;
    const targetCap = calcMarketCap(targetValue);
    const targetPercent = Math.floor((targetMultiple - 1) * 100);

    // 어제 대비 등락 (-5% ~ +8%)
    const changePercent =
      Math.round((seededRandom(seed + 600) * 13 - 5) * 10) / 10;

    // 신용등급
    let creditGrade = "BBB";
    if (totalValue >= 500) creditGrade = "AAA";
    else if (totalValue >= 200) creditGrade = "AA+";
    else if (totalValue >= 100) creditGrade = "AA";
    else if (totalValue >= 50) creditGrade = "A+";
    else if (totalValue >= 30) creditGrade = "A";
    else if (totalValue >= 15) creditGrade = "BBB";
    else if (totalValue >= 5) creditGrade = "BB";
    else if (totalValue >= 1) creditGrade = "B";
    else creditGrade = "CCC";

    return {
      totalValue,
      marketCap,
      grade,
      stats,
      risks,
      sector,
      theme,
      targetCap,
      targetPercent,
      changePercent,
      creditGrade,
    };
  })();

  /* ---------- handlers ---------- */
  const handleStart = () => {
    setPhase("quiz");
    setCurrentQ(0);
    setAnswers([]);
    setShowBars(false);
    window.scrollTo({ top: 0 });
    gtagEvent("quiz_start", { quiz_id: "market-cap" });
  };

  const handleAnswer = (ansIdx: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    const newAnswers = [...answers, ansIdx];
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ((p) => p + 1);
        setIsAnimating(false);
      } else {
        setPhase("calculating");
        setIsAnimating(false);
        window.scrollTo({ top: 0 });
        setTimeout(() => {
          setPhase("result");
          gtagEvent("quiz_complete", { quiz_id: "market-cap" });
          window.scrollTo({ top: 0 });
          setTimeout(() => setShowBars(true), 200);
        }, 2500);
      }
    }, 350);
  };

  const handleRestart = () => {
    setPhase("intro");
    setCurrentQ(0);
    setAnswers([]);
    setShowBars(false);
    window.scrollTo({ top: 0 });
  };

  /* ---------- share ---------- */
  const shareUrl =
    typeof window !== "undefined" ? window.location.href.split("?")[0] : "";

  const getShareText = () =>
    `📊 ${displayName} 분석 리포트\n💰 시가총액: ${result.marketCap.display}\n${result.grade.emoji} ${result.grade.grade} | ${result.grade.opinion}\n📋 신용등급: ${result.creditGrade}\n\n내 시가총액 ${result.marketCap.display}이래ㅋㅋ 너는?`;

  const shareToKakao = () => {
    gtagEvent("share", { method: "kakao", quiz_id: "market-cap" });
    initKakao();
    try {
      if (window.Kakao && window.Kakao.isInitialized()) {
        window.Kakao.Share.sendDefault({
          objectType: "text",
          text: `📊 ${displayName} 분석 리포트\n💰 시가총액: ${result.marketCap.display}\n${result.grade.emoji} ${result.grade.grade}`,
          link: {
            mobileWebUrl: "https://pickmetype.vercel.app",
            webUrl: "https://pickmetype.vercel.app",
          },
          buttonTitle: "나도 측정하기",
        });
      } else {
        shareNative();
      }
    } catch (e) {
      alert("카카오 공유 오류: " + JSON.stringify(e));
      shareNative();
    }
  };

  const shareToX = () => {
    gtagEvent("share", { method: "x", quiz_id: "market-cap" });
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const copyLink = async () => {
    gtagEvent("share", { method: "copy_link", quiz_id: "market-cap" });
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast("링크가 복사되었어요!");
    } catch {
      toast("링크 복사에 실패했어요");
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "나의 시가총액 측정기",
          text: getShareText(),
          url: shareUrl,
        });
      } catch {
        /* cancelled */
      }
    } else {
      await copyLink();
    }
  };

  const saveResultImage = async () => {
    if (!shareCardRef.current) return;
    gtagEvent("share", { method: "save_image", quiz_id: "market-cap" });
    const el = shareCardRef.current;
    const orig = el.style.cssText;
    try {
      await document.fonts.ready;
      el.style.cssText = "position:fixed;left:0;top:0;width:540px;height:720px;z-index:-9999;pointer-events:none;";
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: 540,
        height: 720,
      });
      el.style.cssText = orig;
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "market-cap-result.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast("이미지 저장 완료! 인스타 스토리에 올려보세요");
    } catch {
      el.style.cssText = orig;
      toast("이미지 생성에 실패했어요");
    }
  };

  const today = new Date();
  const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;

  /* ==================== INTRO ==================== */
  if (phase === "intro") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 bg-[#f8f9fa]">
        <div className="w-full max-w-md mx-auto flex flex-col items-center">
          <AdBanner />
          <div className="w-full mt-2 mb-6 text-center animate-fade-in">
            <div className="text-7xl mb-5 animate-bounce-slow">💰</div>
            <h1
              className="text-[2.5rem] leading-tight mb-3 text-gray-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              나의
              <br />
              <span className="relative inline-block mt-1">
                <span className="relative z-10 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  시가총액
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-emerald-500/20 -rotate-1 rounded" />
              </span>{" "}
              측정기
            </h1>
            <p className="text-gray-500 text-[15px] mt-3">
              내가 회사라면, 시가총액은 얼마일까?
            </p>
            <p className="text-gray-400 text-[15px] mb-5">
              AI증권 애널리스트가 분석해드립니다
            </p>
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full text-sm text-gray-500 mb-6 border border-gray-200 shadow-sm">
              <span>📝 {questions.length}문항</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>📊 1분 분석</span>
            </div>
          </div>

          <div className="w-full max-w-xs space-y-3 mb-6">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">
                기업명 (닉네임)
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="주식회사 OOO"
                maxLength={10}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-center focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition-colors shadow-sm"
              />
            </div>
          </div>

          <button
            onClick={handleStart}
            className="quiz-btn w-full max-w-xs py-4 px-8 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white text-xl font-bold rounded-2xl shadow-lg shadow-green-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 animate-pulse-soft"
            style={{ fontFamily: "var(--font-display)" }}
          >
            📊 기업 분석 시작
          </button>
          <p className="text-xs text-gray-400 mt-3 mb-6 pb-safe">
            결과는 재미로만 봐주세요 :)
          </p>
        </div>
      </div>
    );
  }

  /* ==================== QUIZ ==================== */
  if (phase === "quiz") {
    const q = questions[currentQ];
    const progress = (currentQ / questions.length) * 100;

    return (
      <div className="min-h-[100dvh] flex flex-col items-center bg-[#f8f9fa]">
        <div className="w-full max-w-md mx-auto px-4 py-5">
          <div className="w-full mb-2">
            <div className="flex justify-between text-sm text-gray-500 mb-1.5">
              <span className="font-medium">
                {currentQ + 1} / {questions.length}
              </span>
              <span>기업 분석 중...</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="progress-fill h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div
            key={currentQ}
            className={`mt-8 transition-all duration-300 ${
              isAnimating
                ? "opacity-0 translate-x-8"
                : "opacity-100 translate-x-0 animate-slide-up"
            }`}
          >
            <h2
              className="text-[22px] text-center mb-7 leading-relaxed text-gray-900 whitespace-pre-line"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {q.question}
            </h2>
            <div className="space-y-2.5">
              {q.answers.map((a, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={isAnimating}
                  className="quiz-btn w-full min-h-[56px] py-4 px-5 bg-white text-left rounded-2xl border border-gray-200 hover:border-green-400 hover:bg-green-50 active:bg-green-100 transition-all duration-200 text-[15px] font-medium text-gray-700 animate-scale-in disabled:opacity-50 shadow-sm"
                  style={{ animationDelay: `${i * 0.07}s` }}
                >
                  {a.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ==================== CALCULATING ==================== */
  if (phase === "calculating") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#f8f9fa]">
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-6 animate-bounce-slow">📊</div>
          <p
            className="text-xl text-gray-900 font-bold mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            기업 가치 분석 중...
          </p>
          <p className="text-gray-500 text-sm">
            AI 애널리스트가 리포트를 작성하고 있어요
          </p>
          <div className="mt-6 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 bg-green-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ==================== RESULT ==================== */
  if (phase === "result") {
    const {
      marketCap,
      grade,
      stats,
      risks,
      sector,
      theme,
      targetCap,
      targetPercent,
      changePercent,
      creditGrade,
    } = result;

    return (
      <div className="min-h-[100dvh] bg-[#f8f9fa] relative">
        {/* Hidden share card */}
        <div
          ref={shareCardRef}
          aria-hidden="true"
          style={{
            position: "fixed",
            left: -9999,
            top: 0,
            width: 540,
            height: 720,
          }}
        >
          <div
            style={{
              width: 540,
              height: 720,
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              padding: "28px",
              fontFamily: "'Noto Sans KR', sans-serif",
              color: "#1f2937",
              position: "relative",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: "2px solid #e5e7eb",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                    letterSpacing: 2,
                    marginBottom: 2,
                  }}
                >
                  MARKET CAP REPORT
                </p>
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    fontFamily: "'Black Han Sans', sans-serif",
                  }}
                >
                  {displayName} 분석 리포트
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 10, color: "#9ca3af" }}>{dateStr}</p>
                <p style={{ fontSize: 10, color: "#9ca3af" }}>
                  AI증권 리서치센터
                </p>
              </div>
            </div>

            {/* Market Cap */}
            <div
              style={{
                background: "#f9fafb",
                borderRadius: 12,
                padding: "16px",
                marginBottom: 12,
                border: "1px solid #e5e7eb",
              }}
            >
              <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                시가총액
              </p>
              <p
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  fontFamily: "'Black Han Sans', sans-serif",
                  color: "#111827",
                }}
              >
                {marketCap.display}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: changePercent >= 0 ? "#ef4444" : "#3b82f6",
                  fontWeight: 700,
                }}
              >
                {changePercent >= 0 ? "▲" : "▼"}{" "}
                {Math.abs(changePercent).toFixed(1)}% (어제 대비)
              </p>
            </div>

            {/* Info Grid */}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  flex: 1,
                  background: "#f9fafb",
                  borderRadius: 10,
                  padding: "10px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <p style={{ fontSize: 10, color: "#9ca3af" }}>등급</p>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: grade.color,
                  }}
                >
                  {grade.emoji} {grade.grade}
                </p>
              </div>
              <div
                style={{
                  flex: 1,
                  background: "#f9fafb",
                  borderRadius: 10,
                  padding: "10px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <p style={{ fontSize: 10, color: "#9ca3af" }}>투자의견</p>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: grade.opinionColor,
                  }}
                >
                  {grade.opinion}
                </p>
              </div>
              <div
                style={{
                  flex: 1,
                  background: "#f9fafb",
                  borderRadius: 10,
                  padding: "10px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <p style={{ fontSize: 10, color: "#9ca3af" }}>신용등급</p>
                <p
                  style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}
                >
                  {creditGrade}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div
              style={{
                background: "#f9fafb",
                borderRadius: 12,
                padding: "12px",
                marginBottom: 12,
                border: "1px solid #e5e7eb",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                  marginBottom: 8,
                  fontWeight: 700,
                }}
              >
                핵심 지표
              </p>
              {Object.entries(STAT_LABELS).map(([key, meta]) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 5,
                  }}
                >
                  <span style={{ fontSize: 11, width: 60, color: "#6b7280" }}>
                    {meta.emoji} {meta.label}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 10,
                      background: "#e5e7eb",
                      borderRadius: 5,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${stats[key]}%`,
                        height: "100%",
                        background: meta.color,
                        borderRadius: 5,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                      width: 28,
                      textAlign: "right",
                      fontWeight: 700,
                    }}
                  >
                    {stats[key]}
                  </span>
                </div>
              ))}
            </div>

            {/* Analyst + Risk */}
            <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.8 }}>
              <p>
                💡{" "}
                <span style={{ fontWeight: 700, color: "#111827" }}>
                  &quot;{grade.analystComment}&quot;
                </span>
              </p>
              <p style={{ marginTop: 4 }}>
                ⚠️ 리스크: {risks.join(", ")}
              </p>
              <p>
                🏷️ 섹터: {sector} | 테마: {theme}
              </p>
            </div>

            <p
              style={{
                fontSize: 10,
                color: "#d1d5db",
                textAlign: "center",
                marginTop: "auto",
                paddingTop: 8,
              }}
            >
              pickmetype.vercel.app
            </p>
          </div>
        </div>

        {/* Visible result */}
        <div className="relative z-10 w-full max-w-md mx-auto px-4 py-6 flex flex-col items-center">
          {/* Report Header */}
          <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-3 animate-fade-in">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-400 tracking-widest">
                MARKET CAP REPORT
              </p>
              <p className="text-xs text-gray-400">{dateStr}</p>
            </div>
            <h2
              className="text-xl font-bold text-gray-900 mb-0.5"
              style={{ fontFamily: "var(--font-display)" }}
            >
              📊 {displayName} 분석 리포트
            </h2>
            <p className="text-xs text-gray-400">AI증권 리서치센터</p>
          </div>

          {/* Market Cap Card */}
          <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-3 animate-slide-up">
            <p className="text-sm text-gray-500 mb-1">시가총액</p>
            <p
              className="text-4xl font-black text-gray-900 mb-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {marketCap.display}
            </p>
            <p
              className="text-sm font-bold"
              style={{
                color: changePercent >= 0 ? "#ef4444" : "#3b82f6",
              }}
            >
              {changePercent >= 0 ? "▲" : "▼"}{" "}
              {Math.abs(changePercent).toFixed(1)}% (어제 대비)
            </p>
          </div>

          {/* Grade Badge */}
          <div
            className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-3 animate-slide-up"
            style={{ animationDelay: "0.05s" }}
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="text-4xl">{grade.emoji}</span>
              <span
                className="text-3xl font-black"
                style={{
                  fontFamily: "var(--font-display)",
                  color: grade.color,
                }}
              >
                {grade.grade}
              </span>
            </div>

            {/* Investment Points */}
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">투자의견</span>
                <span
                  className="font-bold"
                  style={{ color: grade.opinionColor }}
                >
                  {grade.opinion}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">목표가</span>
                <span className="font-bold text-gray-900">
                  {targetCap.display}{" "}
                  <span className="text-red-500 text-xs">
                    (+{targetPercent}%)
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-500">신용등급</span>
                <span className="font-bold text-gray-900">{creditGrade}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div
            className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-3 animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <h3
              className="text-base font-bold text-gray-900 mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              📈 핵심 지표
            </h3>
            <div className="space-y-3">
              {Object.entries(STAT_LABELS).map(([key, meta]) => (
                <div key={key} className="flex items-center gap-2.5">
                  <span className="text-sm w-20 text-gray-500">
                    {meta.emoji} {meta.label}
                  </span>
                  <div className="flex-1 h-3.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: showBars ? `${stats[key]}%` : "0%",
                        backgroundColor: meta.color,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-10 text-right font-bold">
                    {stats[key]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Analyst Comment */}
          <div
            className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-3 animate-slide-up"
            style={{ animationDelay: "0.15s" }}
          >
            <h3
              className="text-base font-bold text-gray-900 mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              💡 애널리스트 코멘트
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
              &quot;{grade.analystComment}&quot;
            </p>
          </div>

          {/* Risk + Tags */}
          <div
            className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-3 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <h3
              className="text-base font-bold text-gray-900 mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ⚠️ 리스크 요인
            </h3>
            <div className="space-y-1.5 mb-4">
              {risks.map((risk, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-gray-600"
                >
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0" />
                  {risk}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 pt-3 border-t border-gray-100">
              <span>🏷️ 섹터:</span>
              <span className="px-2 py-0.5 bg-gray-100 rounded-full text-gray-700 font-medium">
                {sector}
              </span>
              <span>테마:</span>
              <span className="px-2 py-0.5 bg-gray-100 rounded-full text-gray-700 font-medium">
                {theme}
              </span>
            </div>
          </div>

          {/* Share */}
          <div
            className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-3 animate-slide-up"
            style={{ animationDelay: "0.25s" }}
          >
            <h3
              className="text-lg font-bold mb-3 text-center text-gray-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              친구한테 공유하기
            </h3>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={shareToKakao}
                className="quiz-btn flex flex-col items-center gap-1.5 py-3 bg-[#FEE500] hover:bg-[#FDD800] text-gray-900 rounded-2xl font-bold text-[12px] transition-colors"
              >
                <span className="text-2xl">💬</span>
                카카오톡
              </button>
              <button
                onClick={saveResultImage}
                className="quiz-btn flex flex-col items-center gap-1.5 py-3 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white rounded-2xl font-bold text-[12px] transition-colors"
              >
                <span className="text-2xl">📸</span>
                이미지 저장
              </button>
              <button
                onClick={shareToX}
                className="quiz-btn flex flex-col items-center gap-1.5 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-2xl font-bold text-[12px] transition-colors"
              >
                <span className="text-2xl">𝕏</span>
                트위터
              </button>
              <button
                onClick={copyLink}
                className="quiz-btn flex flex-col items-center gap-1.5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-bold text-[12px] transition-colors"
              >
                <span className="text-2xl">🔗</span>
                링크복사
              </button>
            </div>
          </div>

          <AdBanner />

          <button
            onClick={handleRestart}
            className="quiz-btn w-full max-w-xs py-4 px-8 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white text-lg font-bold rounded-2xl shadow-lg shadow-green-500/20 hover:shadow-xl transition-all duration-300 mb-5 mt-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            다시 측정하기
          </button>

          {/* Other tests */}
          <div
            className="w-full mb-6 animate-slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            <h3
              className="text-xl font-bold text-center mb-3 text-gray-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              다른 테스트도 해볼래?
            </h3>
            <div className="space-y-2.5">
              <Link
                href="/mental-hp"
                className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <span className="text-3xl">⚔️</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-700 text-[15px]">
                    나의 멘탈 HP 측정기
                  </p>
                  <p className="text-xs text-green-500 font-bold">
                    RPG 스탯으로 보는 내 멘탈 상태
                  </p>
                </div>
              </Link>
              <Link
                href="/dubai-cookie"
                className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <span className="text-3xl">🍪</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-700 text-[15px]">
                    나는 어떤 두쫀쿠?
                  </p>
                  <p className="text-xs text-orange-500 font-bold">
                    두바이 쿠키 성격 테스트
                  </p>
                </div>
              </Link>
              {[
                {
                  emoji: "💕",
                  title: "나의 연애 시장가 측정기",
                  desc: "COMING SOON",
                },
              ].map((t, i) => (
                <div
                  key={i}
                  className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 opacity-50"
                >
                  <span className="text-3xl">{t.emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-gray-400 text-[15px]">
                      {t.title}
                    </p>
                    <p className="text-xs text-gray-400 font-bold">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-2"
          >
            &larr; 전체 테스트 목록
          </Link>
          <p className="text-xs text-gray-400 text-center mb-4 pb-safe">
            이 테스트는 재미로 만들어졌으며 실제 기업 분석과 무관합니다 :)
          </p>
        </div>

        {showToast && <div className="toast">{toastMsg}</div>}
      </div>
    );
  }

  return null;
}
