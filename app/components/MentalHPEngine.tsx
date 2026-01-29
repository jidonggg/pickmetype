"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import AdBanner from "./AdBanner";
import { questions, BASE_STATS, STAT_META } from "../mental-hp/data";

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

type Phase = "intro" | "quiz" | "calculating" | "result";

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function getHPColor(hp: number) {
  if (hp >= 80) return "#4ade80";
  if (hp >= 60) return "#facc15";
  if (hp >= 40) return "#fb923c";
  if (hp >= 20) return "#f87171";
  return "#a1a1aa";
}

function getGrade(hp: number) {
  if (hp >= 80)
    return {
      grade: "S",
      emoji: "💚",
      color: "#4ade80",
      status: "풀피 상태! 무적입니다",
      desc: "당신의 멘탈은 전설급 장비를 풀셋 맞춘 상태!\n어떤 보스가 와도 거뜬합니다.",
    };
  if (hp >= 60)
    return {
      grade: "A",
      emoji: "💛",
      color: "#facc15",
      status: "양호! 아직 버틸만해요",
      desc: "적당한 장비에 포션도 충분!\n던전 한두 개는 더 돌 수 있어요.",
    };
  if (hp >= 40)
    return {
      grade: "B",
      emoji: "🧡",
      color: "#fb923c",
      status: "주의! 충전이 필요해요",
      desc: "포션이 바닥나기 시작했어요.\n마을에 가서 휴식을 취하세요.",
    };
  if (hp >= 20)
    return {
      grade: "C",
      emoji: "❤️",
      color: "#f87171",
      status: "위험! 곧 쓰러질 수 있어요",
      desc: "HP가 깜빡이고 있어요!\n당장 세이브 포인트로 돌아가세요.",
    };
  return {
    grade: "D",
    emoji: "🖤",
    color: "#a1a1aa",
    status: "빈사 상태! 긴급 휴식 필요",
    desc: "화면이 흑백으로 변하고 있어요...\n리스폰 지점에서 다시 시작합시다.",
  };
}

function getTitle(stats: Record<string, number>) {
  const { hp, fatigue, grit, emotion, reason } = stats;
  if (hp >= 90 && fatigue <= 30) return "인생 이지모드인";
  if (hp >= 80 && grit >= 70) return "멘탈 강철의";
  if (hp >= 80) return "풀피의 여유를 가진";
  if (hp >= 70 && emotion >= 70) return "감성 충만한";
  if (hp >= 60 && reason >= 70) return "냉철한 판단력의";
  if (hp >= 60) return "출근만 해도 대단한";
  if (hp >= 50 && fatigue >= 70) return "만성피로와 싸우는";
  if (hp >= 40 && grit >= 60) return "근성으로 버티는";
  if (hp >= 40) return "하루하루 간신히 버티는";
  if (hp >= 30 && emotion >= 70) return "감정에 휘둘리는";
  if (hp >= 20) return "곧 쓰러질 것 같은";
  if (fatigue >= 80) return "완전 방전된";
  return "리스폰 대기 중인";
}

export default function MentalHPEngine() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showBars, setShowBars] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const shareCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_KEY);
    }
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  const displayName = nickname.trim() || "용사";
  const displayAge = age ? parseInt(age) : null;

  /* ---------- calculate results ---------- */
  const finalStats = (() => {
    const stats = { ...BASE_STATS };
    const buffs: string[] = [];
    const debuffs: string[] = [];

    answers.forEach((ansIdx, qIdx) => {
      if (qIdx >= questions.length) return;
      const answer = questions[qIdx].answers[ansIdx];
      if (!answer) return;
      Object.entries(answer.stats).forEach(([key, val]) => {
        stats[key] = (stats[key] || 0) + (val || 0);
      });
      if (answer.buff && !buffs.includes(answer.buff)) buffs.push(answer.buff);
      if (answer.debuff && !debuffs.includes(answer.debuff))
        debuffs.push(answer.debuff);
    });

    Object.keys(stats).forEach((key) => {
      stats[key] = clamp(stats[key], 0, 100);
    });

    if (stats.grit >= 70) buffs.push("강철 멘탈");
    if (stats.hp >= 80) buffs.push("무적 오라");
    if (stats.reason >= 70) buffs.push("냉철한 두뇌");
    if (stats.emotion >= 75 && stats.hp >= 50) buffs.push("공감 능력 MAX");
    if (stats.fatigue >= 60 && stats.fatigue < 70) buffs.push("커피 의존증");

    if (stats.fatigue >= 70) debuffs.push("만성피로");
    if (stats.reason <= 30) debuffs.push("결정장애");
    if (stats.money <= 25) debuffs.push("금전 고갈");
    if (stats.hp <= 25) debuffs.push("번아웃");
    if (stats.emotion >= 85 && stats.hp <= 40) debuffs.push("감정 과부하");

    return {
      stats,
      buffs: Array.from(new Set(buffs)),
      debuffs: Array.from(new Set(debuffs)),
    };
  })();

  const grade = getGrade(finalStats.stats.hp);
  const title = getTitle(finalStats.stats);

  /* ---------- handlers ---------- */
  const handleStart = () => {
    setPhase("quiz");
    setCurrentQ(0);
    setAnswers([]);
    setShowBars(false);
    window.scrollTo({ top: 0 });
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
          window.scrollTo({ top: 0 });
          setTimeout(() => setShowBars(true), 200);
        }, 2000);
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
    `⚔️ 나의 멘탈 HP: ${finalStats.stats.hp}/100 (${grade.grade}등급)\n${grade.emoji} ${grade.status}\n🏷️ "${title}" ${displayName}\n\n너도 측정해봐!`;

  const shareToKakao = () => {
    try {
      if (window.Kakao && window.Kakao.isInitialized()) {
        window.Kakao.Share.sendDefault({
          objectType: "text",
          text: `⚔️ ${displayName}의 멘탈 HP: ${finalStats.stats.hp}/100\n${grade.emoji} ${grade.status}\n🏷️ 칭호: "${title}"\n\n너도 측정해봐!`,
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
          buttonTitle: "나도 측정하기",
        });
      } else {
        shareNative();
      }
    } catch {
      shareNative();
    }
  };

  const shareToX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const copyLink = async () => {
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
          title: "나의 멘탈 HP 측정기",
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
          const file = new File([blob], "mental-hp-result.png", {
            type: "image/png",
          });
          if (navigator.share && navigator.canShare?.({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: "나의 멘탈 HP 측정기",
              text: getShareText(),
            });
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "mental-hp-result.png";
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

  /* ==================== INTRO ==================== */
  if (phase === "intro") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 bg-[#0f0f23]">
        <div className="w-full max-w-md mx-auto flex flex-col items-center">
          <AdBanner />

          <div className="w-full mt-2 mb-6 text-center animate-fade-in">
            <div className="text-7xl mb-5 animate-bounce-slow">⚔️</div>
            <h1
              className="text-[2.5rem] leading-tight mb-3 text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              나의 멘탈
              <br />
              <span className="relative inline-block mt-1">
                <span className="relative z-10 bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  HP 측정기
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-emerald-500/30 -rotate-1 rounded" />
              </span>
            </h1>
            <p className="text-gray-400 text-[15px] mt-3">
              당신의 멘탈, 게임 캐릭터라면?
            </p>
            <p className="text-gray-500 text-[15px] mb-5">
              RPG 스탯으로 보는 내 멘탈 상태!
            </p>
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-gray-400 mb-6 border border-white/10">
              <span>📝 {questions.length}문항</span>
              <span className="w-1 h-1 bg-gray-600 rounded-full" />
              <span>⚡ 1분 완성</span>
            </div>
          </div>

          <div className="w-full max-w-xs space-y-3 mb-6">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="용사"
                maxLength={10}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 text-center focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                나이 <span className="text-gray-600">(선택)</span>
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="LV 표시용"
                min={1}
                max={99}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 text-center focus:outline-none focus:border-emerald-500/50 transition-colors [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          <button
            onClick={handleStart}
            className="quiz-btn w-full max-w-xs py-4 px-8 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white text-xl font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 animate-pulse-soft"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ⚔️ 측정 시작
          </button>
          <p className="text-xs text-gray-600 mt-3 mb-6 pb-safe">
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
      <div className="min-h-[100dvh] flex flex-col items-center bg-[#0f0f23]">
        <div className="w-full max-w-md mx-auto px-4 py-5">
          <div className="w-full mb-2">
            <div className="flex justify-between text-sm text-gray-400 mb-1.5">
              <span className="font-medium">
                {currentQ + 1} / {questions.length}
              </span>
              <span>HP 측정 중...</span>
            </div>
            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
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
              className="text-[22px] text-center mb-7 leading-relaxed text-white whitespace-pre-line"
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
                  className="quiz-btn w-full min-h-[56px] py-4 px-5 bg-white/5 backdrop-blur-sm text-left rounded-2xl border border-white/10 hover:border-emerald-500/40 hover:bg-white/10 active:bg-emerald-500/10 transition-all duration-200 text-[15px] font-medium text-gray-200 animate-scale-in disabled:opacity-50"
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
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#0f0f23]">
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-6 animate-bounce-slow">⚔️</div>
          <p
            className="text-xl text-white font-bold mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            멘탈 HP 측정 중...
          </p>
          <p className="text-gray-400 text-sm">스탯을 분석하고 있어요</p>
          <div className="mt-6 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce"
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
    const { stats, buffs, debuffs } = finalStats;

    return (
      <div className="min-h-[100dvh] bg-[#0f0f23] relative">
        {/* Hidden share card for Instagram */}
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
              background:
                "linear-gradient(160deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)",
              display: "flex",
              flexDirection: "column",
              padding: "32px",
              fontFamily: "'Noto Sans KR', sans-serif",
              color: "#fff",
              position: "relative",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <p
                style={{
                  fontSize: 13,
                  color: "#666",
                  letterSpacing: 3,
                  marginBottom: 4,
                }}
              >
                MENTAL HP STATUS
              </p>
              <p
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  color: grade.color,
                  fontFamily: "'Black Han Sans', sans-serif",
                }}
              >
                {grade.grade}등급 {grade.emoji}
              </p>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: 16,
                padding: "20px",
                border: "1px solid rgba(255,255,255,0.1)",
                flex: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      fontFamily: "'Black Han Sans', sans-serif",
                    }}
                  >
                    {displayName}의 멘탈 상태
                  </p>
                  {displayAge && (
                    <p style={{ fontSize: 14, color: "#888" }}>
                      LV. {displayAge}
                    </p>
                  )}
                </div>
              </div>

              {/* HP/MP bars */}
              {[
                {
                  label: "HP",
                  val: stats.hp,
                  color: getHPColor(stats.hp),
                },
                { label: "MP", val: stats.mp, color: "#60a5fa" },
              ].map((bar) => (
                <div
                  key={bar.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      width: 28,
                      color: bar.color,
                    }}
                  >
                    {bar.label}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 14,
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: 7,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${bar.val}%`,
                        height: "100%",
                        background: bar.color,
                        borderRadius: 7,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      color: "#aaa",
                      width: 50,
                      textAlign: "right",
                    }}
                  >
                    {bar.val}/100
                  </span>
                </div>
              ))}

              <div
                style={{
                  height: 1,
                  background: "rgba(255,255,255,0.1)",
                  margin: "10px 0",
                }}
              />

              {/* Stat bars */}
              {Object.entries(STAT_META).map(([key, meta]) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 5,
                  }}
                >
                  <span style={{ fontSize: 12, width: 70, color: "#aaa" }}>
                    {meta.emoji} {meta.label}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 10,
                      background: "rgba(255,255,255,0.05)",
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
                      fontSize: 12,
                      color: "#888",
                      width: 30,
                      textAlign: "right",
                    }}
                  >
                    {stats[key]}
                  </span>
                </div>
              ))}

              <div
                style={{
                  height: 1,
                  background: "rgba(255,255,255,0.1)",
                  margin: "10px 0",
                }}
              />

              <div
                style={{ fontSize: 13, color: "#aaa", lineHeight: 1.8 }}
              >
                <p>
                  🏷️ 칭호:{" "}
                  <span style={{ color: grade.color, fontWeight: 700 }}>
                    &quot;{title}&quot;
                  </span>
                </p>
                <p>
                  ⚔️ 버프:{" "}
                  <span style={{ color: "#4ade80" }}>
                    {buffs.length > 0 ? buffs.join(", ") : "없음"}
                  </span>
                </p>
                <p>
                  💀 디버프:{" "}
                  <span style={{ color: "#f87171" }}>
                    {debuffs.length > 0 ? debuffs.join(", ") : "없음"}
                  </span>
                </p>
              </div>
            </div>
            <p
              style={{
                fontSize: 11,
                color: "#444",
                textAlign: "center",
                marginTop: 16,
              }}
            >
              pickmetype.vercel.app
            </p>
          </div>
        </div>

        {/* Visible result */}
        <div className="relative z-10 w-full max-w-md mx-auto px-4 py-6 flex flex-col items-center">
          {/* Grade badge */}
          <div className="w-full text-center animate-fade-in mb-4">
            <div
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full border mb-3"
              style={{
                borderColor: grade.color + "40",
                backgroundColor: grade.color + "10",
              }}
            >
              <span className="text-2xl">{grade.emoji}</span>
              <span
                className="text-3xl font-black"
                style={{
                  fontFamily: "var(--font-display)",
                  color: grade.color,
                }}
              >
                {grade.grade}등급
              </span>
            </div>
            <p
              className="text-xl font-bold text-white mb-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {grade.status}
            </p>
            <p className="text-sm text-gray-400 whitespace-pre-line">
              {grade.desc}
            </p>
          </div>

          {/* Stat window */}
          <div className="w-full bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 mb-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2
                  className="text-lg font-bold text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {displayName}의 멘탈 상태
                </h2>
                {displayAge && (
                  <p className="text-sm text-gray-500">LV. {displayAge}</p>
                )}
              </div>
              <div
                className="text-2xl font-black"
                style={{
                  fontFamily: "var(--font-display)",
                  color: grade.color,
                }}
              >
                {grade.grade}
              </div>
            </div>

            {/* HP */}
            <div className="mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-bold w-8"
                  style={{ color: getHPColor(stats.hp) }}
                >
                  HP
                </span>
                <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: showBars ? `${stats.hp}%` : "0%",
                      backgroundColor: getHPColor(stats.hp),
                    }}
                  />
                </div>
                <span className="text-sm text-gray-400 w-14 text-right">
                  {stats.hp}/100
                </span>
              </div>
            </div>

            {/* MP */}
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold w-8 text-blue-400">MP</span>
                <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: showBars ? `${stats.mp}%` : "0%",
                      backgroundColor: "#60a5fa",
                    }}
                  />
                </div>
                <span className="text-sm text-gray-400 w-14 text-right">
                  {stats.mp}/100
                </span>
              </div>
            </div>

            <div className="h-px bg-white/10 mb-4" />

            {/* Stats */}
            <div className="space-y-2.5">
              {Object.entries(STAT_META).map(([key, meta]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-sm w-20 text-gray-400">
                    {meta.emoji} {meta.label}
                  </span>
                  <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: showBars ? `${stats[key]}%` : "0%",
                        backgroundColor: meta.color,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8 text-right">
                    {stats[key]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Title + Buffs/Debuffs */}
          <div
            className="w-full bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 mb-4 animate-slide-up"
            style={{ animationDelay: "0.12s" }}
          >
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">🏷️ 칭호</span>
                <p
                  className="text-lg font-bold mt-0.5"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: grade.color,
                  }}
                >
                  &quot;{title}&quot; {displayName}
                </p>
              </div>
              <div className="h-px bg-white/10" />
              <div>
                <span className="text-sm text-gray-500">⚔️ 장착 버프</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {buffs.length > 0 ? (
                    buffs.map((b, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm"
                      >
                        {b}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-600">
                      없음 (레어템 필요)
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">💀 디버프</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {debuffs.length > 0 ? (
                    debuffs.map((d, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
                      >
                        {d}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-600">
                      없음 (축복받은 상태)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Share */}
          <div
            className="w-full bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 mb-4 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <h3
              className="text-lg font-bold mb-3 text-center text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
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
                className="quiz-btn flex flex-col items-center gap-1.5 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-2xl font-bold text-[12px] transition-colors"
              >
                <span className="text-2xl">𝕏</span>
                트위터
              </button>
              <button
                onClick={copyLink}
                className="quiz-btn flex flex-col items-center gap-1.5 py-3 bg-white/10 hover:bg-white/15 text-gray-300 rounded-2xl font-bold text-[12px] transition-colors"
              >
                <span className="text-2xl">🔗</span>
                링크복사
              </button>
            </div>
          </div>

          <AdBanner />

          <button
            onClick={handleRestart}
            className="quiz-btn w-full max-w-xs py-4 px-8 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white text-lg font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-xl transition-all duration-300 mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            다시 측정하기 🔄
          </button>

          {/* Other tests */}
          <div
            className="w-full mb-6 animate-slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            <h3
              className="text-xl font-bold text-center mb-3 text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              다른 테스트도 해볼래? 🧪
            </h3>
            <div className="space-y-2.5">
              <Link
                href="/dubai-cookie"
                className="w-full flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
              >
                <span className="text-3xl">🍪</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-200 text-[15px]">
                    나는 어떤 두쫀쿠?
                  </p>
                  <p className="text-xs text-emerald-400 font-bold">
                    두바이 쿠키 성격 테스트
                  </p>
                </div>
              </Link>
              {[
                { emoji: "🍡", title: "나는 어떤 탕후루?", desc: "COMING SOON" },
                {
                  emoji: "☕",
                  title: "나는 어떤 카페 음료?",
                  desc: "COMING SOON",
                },
              ].map((t, i) => (
                <div
                  key={i}
                  className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 opacity-50"
                >
                  <span className="text-3xl">{t.emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-gray-500 text-[15px]">
                      {t.title}
                    </p>
                    <p className="text-xs text-gray-600 font-bold">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-400 transition-colors mb-2"
          >
            ← 전체 테스트 목록
          </Link>
          <p className="text-xs text-gray-600 text-center mb-4 pb-safe">
            이 테스트는 재미로 만들어졌으며 과학적 근거는 없습니다 :)
          </p>
        </div>

        {showToast && <div className="toast">{toastMsg}</div>}
      </div>
    );
  }

  return null;
}
