"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import AdBanner from "./AdBanner";
import { gtagEvent } from "./GoogleAnalytics";

/* ==================== Types ==================== */
export interface Answer {
  text: string;
  type: string;
}

export interface Question {
  question: string;
  answers: Answer[];
}

export interface QuizResult {
  emoji: string;
  name: string;
  color: string;
  bgClass: string;
  bgStart: string;
  bgEnd: string;
  title: string;
  description: string;
  shortDesc: string;
  tags: string[];
  bestMatch: string;
  funMatch: string;
}

export interface OtherTest {
  emoji: string;
  title: string;
  desc: string;
  href?: string;
}

export interface QuizConfig {
  id: string;
  emoji: string;
  mainTitle: string;
  highlight: string;
  subtitle: [string, string];
  questions: Question[];
  results: Record<string, QuizResult>;
  otherTests: OtherTest[];
}

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

type Phase = "intro" | "quiz" | "result";

/* ==================== Floating Emojis ==================== */
function FloatingEmojis({ emojis }: { emojis: string[] }) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {emojis.map((emoji, i) => (
        <span
          key={i}
          className="floating-emoji"
          style={{
            left: `${(i * 13 + 5) % 90}%`,
            top: `${(i * 17 + 10) % 80}%`,
            fontSize: `${1.2 + (i % 3) * 0.5}rem`,
            opacity: 0.12 + (i % 3) * 0.04,
            animation: `float ${5 + i * 0.7}s ease-in-out ${i * 0.5}s infinite`,
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
}

/* ==================== Quiz Engine ==================== */
export default function QuizEngine({ config }: { config: QuizConfig }) {
  const { questions, results, otherTests } = config;
  const allTypes = Object.keys(results);

  const makeScores = () => {
    const s: Record<string, number> = {};
    allTypes.forEach((k) => (s[k] = 0));
    return s;
  };

  const [phase, setPhase] = useState<Phase>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState(makeScores);
  const [result, setResult] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const shareCardRef = useRef<HTMLDivElement>(null);

  const initKakao = () => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_KEY);
    }
  };

  // Kakao SDK init
  useEffect(() => {
    initKakao();
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  /* ---------- handlers ---------- */
  const handleStart = () => {
    setPhase("quiz");
    setCurrentQ(0);
    setScores(makeScores());
    window.scrollTo({ top: 0 });
    gtagEvent("quiz_start", { quiz_id: config.id });
  };

  const handleAnswer = (type: string) => {
    if (isAnimating) return;
    setIsAnimating(true);

    const next = { ...scores, [type]: (scores[type] || 0) + 1 };
    setScores(next);

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ((p) => p + 1);
        setIsAnimating(false);
      } else {
        let max = 0;
        let winner = allTypes[0];
        for (const t of allTypes) {
          if (next[t] > max) {
            max = next[t];
            winner = t;
          }
        }
        setResult(winner);
        setPhase("result");
        setIsAnimating(false);
        window.scrollTo({ top: 0 });
        gtagEvent("quiz_complete", { quiz_id: config.id, result_type: winner });
      }
    }, 350);
  };

  const handleRestart = () => {
    setPhase("intro");
    setCurrentQ(0);
    setResult(null);
    setScores(makeScores());
    window.scrollTo({ top: 0 });
  };

  /* ---------- share helpers ---------- */
  const shareUrl =
    typeof window !== "undefined" ? window.location.href.split("?")[0] : "";

  const getShareText = () => {
    if (!result) return "";
    const r = results[result];
    return `나의 유형은 "${r.name}" ${r.emoji}\n${r.shortDesc}\n\n너도 테스트 해봐!`;
  };

  const shareToKakao = () => {
    if (!result) return;
    gtagEvent("share", { method: "kakao", quiz_id: config.id, result_type: result });
    initKakao();
    const r = results[result];
    try {
      if (window.Kakao && window.Kakao.isInitialized()) {
        window.Kakao.Share.sendDefault({
          objectType: "text",
          text: `${r.emoji} 나의 유형: ${r.name}\n\n${r.title}\n${r.shortDesc}`,
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
          buttonTitle: "나도 테스트하기",
        });
      } else {
        shareNative();
      }
    } catch {
      shareNative();
    }
  };

  const shareToX = () => {
    gtagEvent("share", { method: "x", quiz_id: config.id, result_type: result || "" });
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      getShareText()
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const copyLink = async () => {
    gtagEvent("share", { method: "copy_link", quiz_id: config.id, result_type: result || "" });
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast("링크가 복사되었어요! 📋");
    } catch {
      toast("링크 복사에 실패했어요 😢");
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: config.mainTitle + " " + config.highlight + "?",
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

  const shareToInstagram = async () => {
    if (!shareCardRef.current) return;
    gtagEvent("share", { method: "instagram", quiz_id: config.id, result_type: result || "" });
    try {
      await document.fonts.ready;
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      canvas.toBlob(
        async (blob) => {
          if (!blob) return;
          const file = new File([blob], "my-result.png", {
            type: "image/png",
          });
          if (navigator.share && navigator.canShare?.({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: config.mainTitle + " " + config.highlight,
              text: getShareText(),
            });
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "my-result.png";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast("이미지 저장 완료! 인스타에 공유해보세요 📸");
          }
        },
        "image/png"
      );
    } catch {
      toast("이미지 생성에 실패했어요 😢");
    }
  };

  const floatingEmojis = Object.values(results)
    .map((r) => r.emoji)
    .slice(0, 8);

  // ========== INTRO ==========
  if (phase === "intro") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center relative px-4">
        <FloatingEmojis emojis={floatingEmojis} />
        <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center">
          <AdBanner />

          <div className="w-full mt-2 mb-6 text-center animate-fade-in">
            <div className="text-7xl mb-5 animate-bounce-slow">
              {config.emoji}
            </div>

            <h1
              className="text-[2.5rem] leading-tight mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {config.mainTitle}
              <br />
              <span className="relative inline-block mt-1">
                <span className="relative z-10 bg-gradient-to-r from-amber-600 via-orange-500 to-red-400 bg-clip-text text-transparent">
                  {config.highlight}
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-amber-200/60 -rotate-1 rounded" />
              </span>
              ?
            </h1>

            <p className="text-gray-600 text-[15px] mt-3">
              {config.subtitle[0]}
            </p>
            <p className="text-gray-600 text-[15px] mb-5">
              {config.subtitle[1]}
            </p>

            <div className="flex flex-wrap justify-center gap-1.5 mb-6 px-1">
              {Object.values(results).map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 bg-white/70 backdrop-blur-sm px-2.5 py-1 rounded-full text-[13px] shadow-sm animate-scale-in"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  {c.emoji} {c.name.split(" ").slice(0, -1).join(" ") || c.name}
                </span>
              ))}
            </div>

            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-gray-500 mb-6 shadow-sm">
              <span>📝 {questions.length}문항</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>⚡ 1분 완성</span>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="quiz-btn w-full max-w-xs py-4 px-8 bg-gradient-to-r from-amber-500 via-orange-500 to-red-400 text-white text-xl font-bold rounded-2xl shadow-lg shadow-orange-200/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 animate-pulse-soft"
            style={{ fontFamily: "var(--font-display)" }}
          >
            테스트 시작하기 {config.emoji}
          </button>

          <p className="text-xs text-gray-400 mt-3 mb-6 pb-safe">
            결과는 재미로만 봐주세요 :)
          </p>
        </div>
      </div>
    );
  }

  // ========== QUIZ ==========
  if (phase === "quiz") {
    const q = questions[currentQ];
    const progress = (currentQ / questions.length) * 100;

    return (
      <div className="min-h-[100dvh] flex flex-col items-center relative">
        <FloatingEmojis emojis={floatingEmojis} />
        <div className="relative z-10 w-full max-w-md mx-auto px-4 py-5">
          <div className="w-full mb-2">
            <div className="flex justify-between text-sm text-gray-500 mb-1.5">
              <span className="font-medium">
                {currentQ + 1} / {questions.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-3 bg-white/50 rounded-full overflow-hidden shadow-inner">
              <div
                className="progress-fill h-full bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div
            key={currentQ}
            className={`mt-6 transition-all duration-300 ${
              isAnimating
                ? "opacity-0 translate-x-8"
                : "opacity-100 translate-x-0 animate-slide-up"
            }`}
          >
            <h2
              className="text-[22px] text-center mb-7 leading-relaxed"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {q.question}
            </h2>
            <div className="space-y-2.5">
              {q.answers.map((a, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(a.type)}
                  disabled={isAnimating}
                  className="quiz-btn w-full min-h-[56px] py-4 px-5 bg-white/80 backdrop-blur-sm text-left rounded-2xl shadow-md hover:shadow-lg border-2 border-transparent hover:border-orange-200 active:border-orange-300 active:bg-orange-50/50 transition-all duration-200 text-[15px] font-medium animate-scale-in disabled:opacity-50"
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

  // ========== RESULT ==========
  if (phase === "result" && result) {
    const r = results[result];

    return (
      <div className={`min-h-[100dvh] bg-gradient-to-b ${r.bgClass} relative`}>
        {/* Hidden share card for Instagram */}
        <div
          ref={shareCardRef}
          aria-hidden="true"
          style={{ position: "fixed", left: -9999, top: 0, width: 540, height: 720 }}
        >
          <div
            style={{
              width: 540,
              height: 720,
              background: `linear-gradient(160deg, ${r.bgStart} 0%, ${r.bgEnd} 100%)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 36px",
              position: "relative",
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            <div style={{ position: "absolute", top: 24, right: 28, opacity: 0.12, fontSize: 36 }}>
              {config.emoji}
            </div>
            <div style={{ position: "absolute", bottom: 24, left: 28, opacity: 0.12, fontSize: 36 }}>
              {config.emoji}
            </div>
            <p style={{ fontSize: 15, color: "#999", marginBottom: 20, letterSpacing: 3, fontWeight: 500 }}>
              나의 유형은
            </p>
            <div style={{ fontSize: 100, marginBottom: 16, lineHeight: 1 }}>{r.emoji}</div>
            <h2 style={{ fontSize: 34, fontWeight: 900, color: r.color, marginBottom: 8, fontFamily: "'Black Han Sans', sans-serif" }}>
              {r.name}
            </h2>
            <p style={{ fontSize: 18, fontWeight: 700, color: r.color, marginBottom: 28, textAlign: "center" }}>
              {r.title}
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "#666", textAlign: "center", marginBottom: 28 }}>
              {r.shortDesc}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {r.tags.map((tag, i) => (
                <span key={i} style={{ background: r.color, color: "#fff", padding: "6px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600 }}>
                  {tag}
                </span>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "#bbb", position: "absolute", bottom: 28 }}>
              pickmetype.vercel.app
            </p>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto px-4 py-6 flex flex-col items-center">
          {/* header */}
          <div className="w-full text-center animate-fade-in">
            <p className="text-sm text-gray-500 mb-2 font-medium tracking-wide">
              당신의 유형은...
            </p>
            <div className="text-8xl my-5 animate-bounce-slow">{r.emoji}</div>
            <h1 className="text-3xl mb-1.5" style={{ fontFamily: "var(--font-display)", color: r.color }}>
              {r.name}
            </h1>
            <p className="text-xl font-bold mb-5" style={{ color: r.color }}>
              {r.title}
            </p>
          </div>

          {/* description */}
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg mb-4 animate-slide-up">
            <p className="text-[15px] leading-relaxed whitespace-pre-line text-gray-700">
              {r.description}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-4">
              {r.tags.map((tag, i) => (
                <span key={i} className="px-3 py-1.5 rounded-full text-[13px] font-medium text-white" style={{ backgroundColor: r.color }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* compatibility */}
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg mb-4 animate-slide-up" style={{ animationDelay: "0.12s" }}>
            <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              궁합 보기 💕
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 bg-pink-50 p-3 rounded-xl">
                <span className="text-sm font-bold text-pink-500 whitespace-nowrap">찰떡궁합</span>
                <span className="text-[15px]">{r.bestMatch}</span>
              </div>
              <div className="flex items-center gap-3 bg-purple-50 p-3 rounded-xl">
                <span className="text-sm font-bold text-purple-500 whitespace-nowrap">환장조합</span>
                <span className="text-[15px]">{r.funMatch}</span>
              </div>
            </div>
          </div>

          {/* share */}
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg mb-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h3 className="text-lg font-bold mb-3 text-center" style={{ fontFamily: "var(--font-display)" }}>
              친구한테 공유하기 📢
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
                onClick={shareToInstagram}
                className="quiz-btn flex flex-col items-center gap-1.5 py-3 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white rounded-2xl font-bold text-[12px] transition-colors"
              >
                <span className="text-2xl">📸</span>
                인스타
              </button>
              <button
                onClick={shareToX}
                className="quiz-btn flex flex-col items-center gap-1.5 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-bold text-[12px] transition-colors"
              >
                <span className="text-2xl">𝕏</span>
                트위터
              </button>
              <button
                onClick={copyLink}
                className="quiz-btn flex flex-col items-center gap-1.5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-[12px] transition-colors"
              >
                <span className="text-2xl">🔗</span>
                링크복사
              </button>
            </div>
          </div>

          <AdBanner />

          <button
            onClick={handleRestart}
            className="quiz-btn w-full max-w-xs py-4 px-8 bg-gradient-to-r from-amber-500 via-orange-500 to-red-400 text-white text-lg font-bold rounded-2xl shadow-lg shadow-orange-200/50 hover:shadow-xl transition-all duration-300 mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            다시 하기 🔄
          </button>

          {/* other tests */}
          <div className="w-full mb-6 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <h3 className="text-xl font-bold text-center mb-3" style={{ fontFamily: "var(--font-display)" }}>
              다른 테스트도 해볼래? 🧪
            </h3>
            <div className="space-y-2.5">
              {otherTests.map((t, i) =>
                t.href ? (
                  <Link
                    key={i}
                    href={t.href}
                    className="w-full flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm hover:bg-white/80 transition-colors"
                  >
                    <span className="text-3xl">{t.emoji}</span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-[15px]">{t.title}</p>
                      <p className="text-xs text-orange-500 font-bold">{t.desc}</p>
                    </div>
                  </Link>
                ) : (
                  <div key={i} className="w-full flex items-center gap-4 p-4 bg-white/40 rounded-2xl opacity-60">
                    <span className="text-3xl">{t.emoji}</span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-500 text-[15px]">{t.title}</p>
                      <p className="text-xs text-gray-400 font-bold">{t.desc}</p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-2"
          >
            ← 전체 테스트 목록
          </Link>
          <p className="text-xs text-gray-400 text-center mb-4 pb-safe">
            이 테스트는 재미로 만들어졌으며 과학적 근거는 없습니다 :)
          </p>
        </div>

        {showToast && <div className="toast">{toastMsg}</div>}
      </div>
    );
  }

  return null;
}
