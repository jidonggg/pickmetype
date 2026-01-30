"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import AdBanner from "./AdBanner";
import { gtagEvent } from "./GoogleAnalytics";
import {
  questions,
  BASE_STATS,
  STAT_META,
  JOB_POOL,
  BUFF_POOL,
  DEBUFF_POOL,
  RECOVERY_POOL,
  getGradeInfo,
} from "../mental-hp/data";

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

function clamp(v: number) {
  return Math.max(0, Math.min(100, v));
}

function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function pickFromPool(pool: string[], seed: number, exclude: string[] = []) {
  const filtered = pool.filter((item) => !exclude.includes(item));
  if (filtered.length === 0) return pool[0];
  return filtered[Math.floor(seededRandom(seed) * filtered.length)];
}

function getHPColor(hp: number) {
  if (hp >= 70) return "#4ade80";
  if (hp >= 50) return "#facc15";
  if (hp >= 30) return "#fb923c";
  if (hp >= 10) return "#f87171";
  return "#a1a1aa";
}

function getTitle(stats: Record<string, number>) {
  const { hp, fatigue, grit, emotion, reason } = stats;
  if (hp >= 90 && fatigue <= 30) return "인생 이지모드인";
  if (hp >= 80 && grit >= 70) return "멘탈 풀셋 장착한";
  if (hp >= 80) return "풀피의 여유를 가진";
  if (hp >= 70 && emotion >= 70) return "감성 충만한";
  if (hp >= 60 && reason >= 70) return "냉철한 판단력의";
  if (hp >= 60) return "출근만 해도 대단한";
  if (hp >= 50 && fatigue >= 70) return "만성피로와 싸우는";
  if (hp >= 40 && grit >= 60) return "근성으로 버티는";
  if (hp >= 40) return "하루하루 간신히 버티는";
  if (hp >= 30 && emotion >= 70) return "감정에 휘둘리는";
  if (hp >= 20) return "곧 쓰러질 것 같은";
  if (hp >= 10) return "바닥을 기는";
  if (fatigue >= 80) return "완전 방전된";
  return "리스폰 대기 중인";
}

function getSurvivalDays(hp: number, seed: number) {
  if (hp >= 90) return Math.floor(365 + seededRandom(seed + 50) * 365);
  if (hp >= 80) return Math.floor(180 + seededRandom(seed + 50) * 185);
  if (hp >= 70) return Math.floor(90 + seededRandom(seed + 50) * 90);
  if (hp >= 60) return Math.floor(60 + seededRandom(seed + 50) * 30);
  if (hp >= 50) return Math.floor(30 + seededRandom(seed + 50) * 30);
  if (hp >= 40) return Math.floor(14 + seededRandom(seed + 50) * 16);
  if (hp >= 30) return Math.floor(7 + seededRandom(seed + 50) * 7);
  if (hp >= 20) return Math.floor(3 + seededRandom(seed + 50) * 4);
  if (hp >= 10) return Math.floor(1 + seededRandom(seed + 50) * 2);
  return 0;
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
  const seed = answers.reduce((sum, a, i) => sum + a * (i + 1), 0);

  const finalStats = (() => {
    const stats = { ...BASE_STATS };
    const earnedBuffs: string[] = [];
    const earnedDebuffs: string[] = [];

    answers.forEach((ansIdx, qIdx) => {
      if (qIdx >= questions.length) return;
      const answer = questions[qIdx].answers[ansIdx];
      if (!answer) return;
      Object.entries(answer.stats).forEach(([key, val]) => {
        stats[key] = (stats[key] || 0) + (val || 0);
      });
      if (answer.buff && !earnedBuffs.includes(answer.buff))
        earnedBuffs.push(answer.buff);
      if (answer.debuff && !earnedDebuffs.includes(answer.debuff))
        earnedDebuffs.push(answer.debuff);
    });

    Object.keys(stats).forEach((key) => {
      stats[key] = clamp(stats[key]);
    });

    // Random pool picks
    const randomBuff1 = pickFromPool(BUFF_POOL, seed + 10, earnedBuffs);
    const randomBuff2 = pickFromPool(
      BUFF_POOL,
      seed + 20,
      earnedBuffs.concat(randomBuff1)
    );
    const randomDebuff1 = pickFromPool(DEBUFF_POOL, seed + 30, earnedDebuffs);
    const randomDebuff2 = pickFromPool(
      DEBUFF_POOL,
      seed + 40,
      earnedDebuffs.concat(randomDebuff1)
    );

    // More buffs if high HP, more debuffs if low HP
    const buffs = [...earnedBuffs, randomBuff1];
    const debuffs = [...earnedDebuffs, randomDebuff1];
    if (stats.hp >= 70) buffs.push(randomBuff2);
    if (stats.hp < 50) debuffs.push(randomDebuff2);

    const job = pickFromPool(JOB_POOL, seed + 60);
    const recovery = pickFromPool(RECOVERY_POOL, seed + 70);
    const survivalDays = getSurvivalDays(stats.hp, seed);

    return {
      stats,
      buffs: Array.from(new Set(buffs)),
      debuffs: Array.from(new Set(debuffs)),
      job,
      recovery,
      survivalDays,
    };
  })();

  const grade = getGradeInfo(finalStats.stats.hp);
  const titleText = getTitle(finalStats.stats);

  /* ---------- handlers ---------- */
  const handleStart = () => {
    setPhase("quiz");
    setCurrentQ(0);
    setAnswers([]);
    setShowBars(false);
    window.scrollTo({ top: 0 });
    gtagEvent("quiz_start", { quiz_id: "mental-hp" });
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
          gtagEvent("quiz_complete", { quiz_id: "mental-hp" });
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
    `⚔️ ${displayName}의 멘탈 HP: ${finalStats.stats.hp}/100\n${grade.emoji} ${grade.grade}등급 "${grade.title}"\n🏷️ 칭호: 『${titleText}』\n📍 예상 생존: ${finalStats.survivalDays}일\n\n너도 측정해봐!`;

  const shareToKakao = () => {
    gtagEvent("share", { method: "kakao", quiz_id: "mental-hp" });
    try {
      if (window.Kakao && window.Kakao.isInitialized()) {
        window.Kakao.Share.sendDefault({
          objectType: "text",
          text: `⚔️ ${displayName}의 멘탈 HP: ${finalStats.stats.hp}/100\n${grade.emoji} ${grade.grade}등급 - ${grade.title}\n📍 예상 생존: ${finalStats.survivalDays}일\n\n내 멘탈 HP ${finalStats.stats.hp}%야ㅋㅋ 너는?`,
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
    gtagEvent("share", { method: "x", quiz_id: "mental-hp" });
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const copyLink = async () => {
    gtagEvent("share", { method: "copy_link", quiz_id: "mental-hp" });
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
    gtagEvent("share", { method: "instagram", quiz_id: "mental-hp" });
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
    const { stats, buffs, debuffs, job, recovery, survivalDays } = finalStats;

    return (
      <div className="min-h-[100dvh] bg-[#0f0f23] relative">
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
              background:
                "linear-gradient(160deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)",
              display: "flex",
              flexDirection: "column",
              padding: "28px",
              fontFamily: "'Noto Sans KR', sans-serif",
              color: "#fff",
              position: "relative",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <p
                style={{
                  fontSize: 12,
                  color: "#666",
                  letterSpacing: 3,
                  marginBottom: 4,
                }}
              >
                MENTAL HP STATUS
              </p>
              <p
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: grade.color,
                  fontFamily: "'Black Han Sans', sans-serif",
                }}
              >
                {grade.grade}등급 {grade.emoji}
              </p>
              <p style={{ fontSize: 14, color: "#aaa" }}>{grade.title}</p>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: 14,
                padding: "16px",
                border: "1px solid rgba(255,255,255,0.1)",
                flex: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      fontFamily: "'Black Han Sans', sans-serif",
                    }}
                  >
                    ⚔️ {displayName}의 상태창
                  </p>
                  <p style={{ fontSize: 12, color: "#888" }}>
                    {displayAge ? `LV.${displayAge}` : "LV.??"} | 직업: {job}
                  </p>
                </div>
              </div>

              {[
                {
                  l: "HP",
                  v: stats.hp,
                  c: getHPColor(stats.hp),
                },
                { l: "MP", v: stats.mp, c: "#60a5fa" },
              ].map((bar) => (
                <div
                  key={bar.l}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      width: 24,
                      color: bar.c,
                    }}
                  >
                    {bar.l}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 12,
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: 6,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${bar.v}%`,
                        height: "100%",
                        background: bar.c,
                        borderRadius: 6,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#aaa",
                      width: 44,
                      textAlign: "right",
                    }}
                  >
                    {bar.v}/100
                  </span>
                </div>
              ))}

              <div
                style={{
                  height: 1,
                  background: "rgba(255,255,255,0.1)",
                  margin: "8px 0",
                }}
              />

              {Object.entries(STAT_META).map(([key, meta]) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 3,
                  }}
                >
                  <span style={{ fontSize: 11, width: 64, color: "#aaa" }}>
                    {meta.emoji} {meta.label}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${stats[key]}%`,
                        height: "100%",
                        background: meta.color,
                        borderRadius: 4,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#888",
                      width: 26,
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
                  margin: "8px 0",
                }}
              />

              <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.9 }}>
                <p>
                  🏷️ 칭호:{" "}
                  <span style={{ color: grade.color, fontWeight: 700 }}>
                    『{titleText}』
                  </span>
                </p>
                <p>
                  ✨ 버프:{" "}
                  <span style={{ color: "#4ade80" }}>{buffs.join(", ")}</span>
                </p>
                <p>
                  💀 디버프:{" "}
                  <span style={{ color: "#f87171" }}>{debuffs.join(", ")}</span>
                </p>
                <p>
                  📍 예상 생존:{" "}
                  <span style={{ color: "#facc15" }}>
                    {survivalDays > 0 ? `${survivalDays}일` : "Game Over"}
                  </span>
                </p>
                <p>
                  💊 추천 회복템:{" "}
                  <span style={{ color: "#60a5fa" }}>{recovery}</span>
                </p>
              </div>
            </div>

            <p
              style={{
                fontSize: 10,
                color: "#444",
                textAlign: "center",
                marginTop: 12,
              }}
            >
              pickmetype.vercel.app
            </p>
          </div>
        </div>

        {/* Visible result */}
        <div className="relative z-10 w-full max-w-md mx-auto px-4 py-6 flex flex-col items-center">
          {/* Grade */}
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
              {grade.title}
            </p>
            <p className="text-sm text-gray-400">{grade.statusDetail}</p>
          </div>

          {/* Stat window */}
          <div className="w-full bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 mb-4 animate-slide-up">
            <div className="flex items-center justify-between mb-1">
              <h2
                className="text-lg font-bold text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                ⚔️ {displayName}의 상태창
              </h2>
              <div
                className="text-xl font-black"
                style={{
                  fontFamily: "var(--font-display)",
                  color: grade.color,
                }}
              >
                {grade.grade}
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {displayAge ? `LV.${displayAge}` : "LV.??"} | 직업: {job}
            </p>

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

            <div className="h-px bg-white/10 mb-3">
              <span className="sr-only">구분선</span>
            </div>
            <p
              className="text-sm text-gray-500 mb-2.5"
              style={{ fontFamily: "var(--font-display)" }}
            >
              📊 스탯
            </p>

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
            style={{ animationDelay: "0.1s" }}
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
                  『{titleText}』 {displayName}
                </p>
              </div>
              <div className="h-px bg-white/10" />
              <div>
                <span className="text-sm text-gray-500">✨ 버프</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {buffs.map((b, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">💀 디버프</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {debuffs.map((d, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Survival + Recovery */}
          <div
            className="w-full bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 mb-4 animate-slide-up"
            style={{ animationDelay: "0.15s" }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">📍 예상 생존</p>
                <p
                  className="text-2xl font-bold"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: grade.color,
                  }}
                >
                  {survivalDays > 0 ? `${survivalDays}일` : "Game Over"}
                </p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">💊 추천 회복템</p>
                <p
                  className="text-2xl font-bold text-blue-400"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {recovery}
                </p>
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
                {
                  emoji: "💕",
                  title: "나의 연애 시장가 측정기",
                  desc: "COMING SOON",
                },
                {
                  emoji: "💰",
                  title: "나의 시가총액 측정기",
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
