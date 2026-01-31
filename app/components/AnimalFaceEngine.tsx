"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import AdBanner from "./AdBanner";
import { gtagEvent } from "./GoogleAnalytics";
import { animalTypes, quizQuestions } from "../animal-face/data";
import type { AnimalType } from "../animal-face/data";

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

type Phase = "intro" | "upload" | "quiz" | "analyzing" | "result";

interface AnalysisResult {
  animal: string;
  confidence: number;
  topMatches: { animal: string; percentage: number }[];
  analysis: string;
}

const ANALYSIS_STEPS = [
  "\uC5BC\uAD74 \uD615\uD0DC \uBD84\uC11D \uC911...",
  "\uB208/\uCF54/\uC785 \uD2B9\uC9D5 \uBD84\uC11D \uC911...",
  "\uB3D9\uBB3C\uC0C1 \uB9E4\uCE6D \uC911...",
  "\uC131\uACA9 \uBD84\uC11D \uC911...",
];

const OTHER_TESTS = [
  { emoji: "\uD83C\uDF6A", title: "\uB098\uB294 \uC5B4\uB5A4 \uB450\uCE00\uCFE0?", desc: "\uB450\uBC14\uC774 \uCE00\uB4DD \uCFE0\uD0A4 \uC131\uACA9 \uD14C\uC2A4\uD2B8", href: "/dubai-cookie" },
  { emoji: "\u2694\uFE0F", title: "\uB098\uC758 \uBA58\uD0C8 HP \uCE21\uC815\uAE30", desc: "RPG \uC2A4\uD0EF\uC73C\uB85C \uBCF4\uB294 \uB0B4 \uBA58\uD0C8!", href: "/mental-hp" },
  { emoji: "\uD83D\uDCB0", title: "\uB098\uC758 \uC2DC\uAC00\uCD1D\uC561 \uCE21\uC815\uAE30", desc: "\uB0B4\uAC00 \uD68C\uC0AC\uB77C\uBA74 \uC2DC\uAC00\uCD1D\uC561\uC740?", href: "/market-cap" },
];

/* ==================== Floating Emojis ==================== */
function FloatingEmojis() {
  const emojis = ["\uD83D\uDC36", "\uD83D\uDC31", "\uD83E\uDD8A", "\uD83D\uDC3B", "\uD83D\uDC30", "\uD83E\uDD8C", "\uD83E\uDD95", "\uD83D\uDC3A", "\uD83D\uDC27", "\uD83E\uDD89", "\uD83D\uDC39", "\uD83D\uDC2F", "\uD83D\uDC2C", "\uD83E\uDD8B", "\uD83D\uDC3F\uFE0F", "\uD83E\uDDA5", "\uD83D\uDC3C", "\uD83E\uDD9C"];
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

/* ==================== Animal Face Engine ==================== */
export default function AnimalFaceEngine() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [resultAnimal, setResultAnimal] = useState<AnimalType | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AnalysisResult | null>(null);
  const [topMatches, setTopMatches] = useState<{ animal: string; percentage: number }[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [analysisStep, setAnalysisStep] = useState(0);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"photo" | "quiz" | null>(null);

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

  /* ---------- image resize ---------- */
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX = 800;
          let w = img.width;
          let h = img.height;
          if (w > MAX || h > MAX) {
            if (w > h) {
              h = (h * MAX) / w;
              w = MAX;
            } else {
              w = (w * MAX) / h;
              h = MAX;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Canvas error");
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /* ---------- handlers ---------- */
  const handlePhotoMode = () => {
    setMode("photo");
    setPhase("upload");
    window.scrollTo({ top: 0 });
    gtagEvent("quiz_start", { quiz_id: "animal-face", method: "photo" });
  };

  const handleQuizMode = () => {
    setMode("quiz");
    setPhase("quiz");
    setCurrentQ(0);
    setScores({});
    window.scrollTo({ top: 0 });
    gtagEvent("quiz_start", { quiz_id: "animal-face", method: "quiz" });
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("\uC774\uBBF8\uC9C0 \uD30C\uC77C\uB9CC \uC5C5\uB85C\uB4DC\uD560 \uC218 \uC788\uC5B4\uC694.");
      return;
    }
    setUploadError(null);
    try {
      const resized = await resizeImage(file);
      setUploadPreview(resized);
    } catch {
      setUploadError("\uC774\uBBF8\uC9C0 \uCC98\uB9AC\uC5D0 \uC2E4\uD328\uD588\uC5B4\uC694.");
    }
  };

  const handleAnalyzePhoto = async () => {
    if (!uploadPreview) return;
    setPhase("analyzing");
    setAnalysisStep(0);
    window.scrollTo({ top: 0 });

    // Step animation
    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => {
        if (prev < ANALYSIS_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 1500);

    try {
      const res = await fetch("/api/analyze-animal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: uploadPreview }),
      });

      clearInterval(stepInterval);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "\uBD84\uC11D \uC2E4\uD328");
      }

      const data: AnalysisResult = await res.json();
      const animal = animalTypes[data.animal];
      if (!animal) throw new Error("\uC54C \uC218 \uC5C6\uB294 \uB3D9\uBB3C\uC0C1");

      setAiAnalysis(data);
      setResultAnimal(animal);
      setTopMatches(data.topMatches);
      setPhase("result");
      window.scrollTo({ top: 0 });
      gtagEvent("quiz_complete", { quiz_id: "animal-face", result_type: data.animal });
    } catch (err) {
      clearInterval(stepInterval);
      const message = err instanceof Error ? err.message : "\uBD84\uC11D \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC5B4\uC694.";
      setUploadError(message);
      setPhase("upload");
    }
  };

  const handleQuizAnswer = (answerScores: Record<string, number>) => {
    if (isAnimating) return;
    setIsAnimating(true);

    const next = { ...scores };
    for (const [animal, score] of Object.entries(answerScores)) {
      next[animal] = (next[animal] || 0) + score;
    }
    setScores(next);

    setTimeout(() => {
      if (currentQ < quizQuestions.length - 1) {
        setCurrentQ((p) => p + 1);
        setIsAnimating(false);
      } else {
        // Calculate result
        setPhase("analyzing");
        setAnalysisStep(0);
        window.scrollTo({ top: 0 });

        const stepInterval = setInterval(() => {
          setAnalysisStep((prev) => {
            if (prev < ANALYSIS_STEPS.length - 1) return prev + 1;
            return prev;
          });
        }, 800);

        setTimeout(() => {
          clearInterval(stepInterval);

          // Find winner
          const sorted = Object.entries(next).sort(([, a], [, b]) => b - a);
          const winner = sorted[0]?.[0] || "dog";
          const total = sorted.reduce((sum, [, v]) => sum + v, 0) || 1;

          const top3 = sorted.slice(0, 3).map(([animal, score]) => ({
            animal,
            percentage: Math.round((score / total) * 100),
          }));
          // Normalize to 100
          const topTotal = top3.reduce((s, m) => s + m.percentage, 0);
          if (topTotal !== 100 && top3.length > 0) {
            top3[0].percentage += 100 - topTotal;
          }

          setResultAnimal(animalTypes[winner] || animalTypes.dog);
          setTopMatches(top3);
          setPhase("result");
          setIsAnimating(false);
          window.scrollTo({ top: 0 });
          gtagEvent("quiz_complete", { quiz_id: "animal-face", result_type: winner });
        }, 3500);
      }
    }, 350);
  };

  const handleRestart = () => {
    setPhase("intro");
    setCurrentQ(0);
    setScores({});
    setResultAnimal(null);
    setAiAnalysis(null);
    setTopMatches([]);
    setUploadPreview(null);
    setUploadError(null);
    setMode(null);
    window.scrollTo({ top: 0 });
  };

  /* ---------- share helpers ---------- */
  const shareUrl =
    typeof window !== "undefined" ? window.location.href.split("?")[0] : "";

  const getShareText = () => {
    if (!resultAnimal) return "";
    return `\uB098\uC758 \uB3D9\uBB3C\uC0C1\uC740 "${resultAnimal.name}" ${resultAnimal.emoji}\n${resultAnimal.shortDesc}\n\n\uB108\uB3C4 \uD14C\uC2A4\uD2B8 \uD574\uBD10!`;
  };

  const shareToKakao = () => {
    if (!resultAnimal) return;
    gtagEvent("share", { method: "kakao", quiz_id: "animal-face", result_type: resultAnimal.id });
    initKakao();
    try {
      if (window.Kakao && window.Kakao.isInitialized()) {
        window.Kakao.Share.sendDefault({
          objectType: "text",
          text: `${resultAnimal.emoji} \uB098\uC758 \uB3D9\uBB3C\uC0C1: ${resultAnimal.name}\n\n${resultAnimal.shortDesc}`,
          link: {
            mobileWebUrl: "https://pickmetype.vercel.app/animal-face",
            webUrl: "https://pickmetype.vercel.app/animal-face",
          },
          buttonTitle: "\uB098\uB3C4 \uD14C\uC2A4\uD2B8\uD558\uAE30",
        });
      } else {
        shareNative();
      }
    } catch (e) {
      alert("\uCE74\uCE74\uC624 \uACF5\uC720 \uC624\uB958: " + JSON.stringify(e));
      shareNative();
    }
  };

  const shareToX = () => {
    gtagEvent("share", { method: "x", quiz_id: "animal-face", result_type: resultAnimal?.id || "" });
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      getShareText()
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const copyLink = async () => {
    gtagEvent("share", { method: "copy_link", quiz_id: "animal-face", result_type: resultAnimal?.id || "" });
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast("\uB9C1\uD06C\uAC00 \uBCF5\uC0AC\uB418\uC5C8\uC5B4\uC694! \uD83D\uDCCB");
    } catch {
      toast("\uB9C1\uD06C \uBCF5\uC0AC\uC5D0 \uC2E4\uD328\uD588\uC5B4\uC694 \uD83D\uDE22");
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "AI \uB2EE\uC740 \uB3D9\uBB3C\uC0C1 \uBD84\uC11D\uAE30",
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
    gtagEvent("share", { method: "save_image", quiz_id: "animal-face", result_type: resultAnimal?.id || "" });
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
      const file = new File([blob], "my-animal-face.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "my-animal-face.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast("\uC774\uBBF8\uC9C0 \uC800\uC7A5 \uC644\uB8CC! \uC778\uC2A4\uD0C0 \uC2A4\uD1A0\uB9AC\uC5D0 \uC62C\uB824\uBCF4\uC138\uC694 \uD83D\uDCF8");
      }
    } catch {
      el.style.cssText = orig;
      toast("\uC774\uBBF8\uC9C0 \uC0DD\uC131\uC5D0 \uC2E4\uD328\uD588\uC5B4\uC694 \uD83D\uDE22");
    }
  };

  // ========== INTRO ==========
  if (phase === "intro") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center relative px-4 bg-gradient-to-b from-violet-50 via-purple-50 to-indigo-50">
        <FloatingEmojis />
        <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center">
          <AdBanner />

          <div className="w-full mt-2 mb-6 text-center animate-fade-in">
            <div className="text-7xl mb-5 animate-bounce-slow">
              \uD83D\uDC3E
            </div>

            <h1
              className="text-[2.5rem] leading-tight mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              AI \uB2EE\uC740
              <br />
              <span className="relative inline-block mt-1">
                <span className="relative z-10 bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                  \uB3D9\uBB3C\uC0C1 \uBD84\uC11D\uAE30
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-purple-200/60 -rotate-1 rounded" />
              </span>
            </h1>

            <p className="text-gray-600 text-[15px] mt-3">
              AI\uAC00 \uBD84\uC11D\uD558\uB294
            </p>
            <p className="text-gray-600 text-[15px] mb-5">
              \uB098\uC758 \uB2EE\uC740 \uB3D9\uBB3C\uC0C1\uC740?
            </p>

            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-gray-500 mb-6 shadow-sm">
              <span>\uD83D\uDCF8 \uC0AC\uC9C4 \uBD84\uC11D</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>\uD83D\uDCDD \uD034\uC988 15\uBB38\uD56D</span>
            </div>
          </div>

          <button
            onClick={handlePhotoMode}
            className="quiz-btn w-full max-w-xs py-4 px-8 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white text-xl font-bold rounded-2xl shadow-lg shadow-purple-200/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 animate-pulse-soft mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            \uD83D\uDCF8 \uC0AC\uC9C4\uC73C\uB85C \uBD84\uC11D\uD558\uAE30
          </button>

          <button
            onClick={handleQuizMode}
            className="quiz-btn w-full max-w-xs py-4 px-8 bg-white/80 backdrop-blur-sm text-purple-600 text-lg font-bold rounded-2xl shadow-md border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            style={{ fontFamily: "var(--font-display)" }}
          >
            \uD83D\uDCDD \uD034\uC988\uB85C \uBD84\uC11D\uD558\uAE30
          </button>

          <p className="text-xs text-gray-400 mt-3 mb-6 pb-safe">
            \uACB0\uACFC\uB294 \uC7AC\uBBF8\uB85C\uB9CC \uBD10\uC8FC\uC138\uC694 :)
          </p>
        </div>
      </div>
    );
  }

  // ========== UPLOAD ==========
  if (phase === "upload") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center relative px-4 bg-gradient-to-b from-violet-50 via-purple-50 to-indigo-50">
        <FloatingEmojis />
        <div className="relative z-10 w-full max-w-md mx-auto py-8">
          <button
            onClick={() => { setPhase("intro"); setUploadPreview(null); setUploadError(null); }}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4"
          >
            \u2190 \uB4A4\uB85C\uAC00\uAE30
          </button>

          <h2
            className="text-2xl text-center mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            \uC0AC\uC9C4\uC744 \uC62C\uB824\uC8FC\uC138\uC694 \uD83D\uDCF8
          </h2>
          <p className="text-center text-gray-500 text-sm mb-6">
            \uC5BC\uAD74\uC774 \uC798 \uBCF4\uC774\uB294 \uC0AC\uC9C4\uC77C\uC218\uB85D \uC815\uD655\uD574\uC694!
          </p>

          {/* Upload Area */}
          <div
            className="w-full aspect-square max-w-sm mx-auto rounded-3xl border-2 border-dashed border-purple-300 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-white/80 transition-all overflow-hidden"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const file = e.dataTransfer.files[0];
              if (file) handleFileSelect(file);
            }}
          >
            {uploadPreview ? (
              <img
                src={uploadPreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <div className="text-6xl mb-4">\uD83D\uDCF7</div>
                <p className="text-gray-500 font-medium mb-1">\uC0AC\uC9C4\uC744 \uC5C5\uB85C\uB4DC\uD558\uC138\uC694</p>
                <p className="text-gray-400 text-sm">\uD074\uB9AD \uB610\uB294 \uB4DC\uB798\uADF8 \uC575 \uB4DC\uB86D</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />

          {uploadError && (
            <p className="text-red-500 text-sm text-center mt-3">{uploadError}</p>
          )}

          {uploadPreview && (
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setUploadPreview(null); fileInputRef.current?.click(); }}
                className="flex-1 py-3 bg-white/80 text-purple-600 font-bold rounded-2xl border-2 border-purple-200 hover:border-purple-400 transition-all text-sm"
              >
                \uB2E4\uC2DC \uC120\uD0DD
              </button>
              <button
                onClick={handleAnalyzePhoto}
                className="flex-1 py-3 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all text-sm"
              >
                \uBD84\uC11D\uD558\uAE30 \u2728
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={handleQuizMode}
              className="text-sm text-purple-400 hover:text-purple-600 transition-colors underline"
            >
              \uD034\uC988\uB85C \uBD84\uC11D\uD558\uACE0 \uC2F6\uB2E4\uBA74?
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== QUIZ ==========
  if (phase === "quiz") {
    const q = quizQuestions[currentQ];
    const progress = (currentQ / quizQuestions.length) * 100;

    return (
      <div className="min-h-[100dvh] flex flex-col items-center relative bg-gradient-to-b from-violet-50 via-purple-50 to-indigo-50">
        <FloatingEmojis />
        <div className="relative z-10 w-full max-w-md mx-auto px-4 py-5">
          <button
            onClick={handleRestart}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-3 py-1"
          >
            \u2190 \uCC98\uC74C\uC73C\uB85C
          </button>
          <div className="w-full mb-2">
            <div className="flex justify-between text-sm text-gray-500 mb-1.5">
              <span className="font-medium">
                {currentQ + 1} / {quizQuestions.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-3 bg-white/50 rounded-full overflow-hidden shadow-inner">
              <div
                className="progress-fill h-full bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 rounded-full"
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
                  onClick={() => handleQuizAnswer(a.scores)}
                  disabled={isAnimating}
                  className="quiz-btn w-full min-h-[56px] py-4 px-5 bg-white/80 backdrop-blur-sm text-left rounded-2xl shadow-md hover:shadow-lg border-2 border-transparent hover:border-purple-200 active:border-purple-300 active:bg-purple-50/50 transition-all duration-200 text-[15px] font-medium animate-scale-in disabled:opacity-50"
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

  // ========== ANALYZING ==========
  if (phase === "analyzing") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center relative px-4 bg-gradient-to-b from-gray-900 via-purple-900 to-indigo-900">
        <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center text-center">
          <div className="text-7xl mb-8 animate-bounce-slow">\uD83D\uDC3E</div>

          <div className="space-y-4 mb-8 w-full max-w-xs">
            {ANALYSIS_STEPS.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 transition-all duration-500 ${
                  i <= analysisStep ? "opacity-100" : "opacity-30"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-500 ${
                    i < analysisStep
                      ? "bg-green-500 text-white"
                      : i === analysisStep
                      ? "bg-purple-500 text-white animate-pulse"
                      : "bg-gray-600 text-gray-400"
                  }`}
                >
                  {i < analysisStep ? "\u2713" : i + 1}
                </div>
                <span
                  className={`text-sm ${
                    i <= analysisStep ? "text-white" : "text-gray-500"
                  }`}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>

          <div className="w-48 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-1000"
              style={{ width: `${((analysisStep + 1) / ANALYSIS_STEPS.length) * 100}%` }}
            />
          </div>

          <p className="text-purple-300 text-sm mt-4 animate-pulse">
            AI\uAC00 \uBD84\uC11D\uD558\uACE0 \uC788\uC5B4\uC694...
          </p>

          {mode === "photo" && (
            <button
              onClick={handleRestart}
              className="mt-6 text-sm text-gray-400 hover:text-gray-300 transition-colors underline py-1"
            >
              \uCDE8\uC18C\uD558\uACE0 \uCC98\uC74C\uC73C\uB85C
            </button>
          )}

          <div className="mt-8">
            <AdBanner />
          </div>
        </div>
      </div>
    );
  }

  // ========== RESULT ==========
  if (phase === "result" && resultAnimal) {
    const r = resultAnimal;

    return (
      <div
        className="min-h-[100dvh] relative"
        style={{
          background: `linear-gradient(to bottom, ${r.bgStart}, #ffffff, ${r.bgEnd})`,
        }}
      >
        {/* Hidden share card */}
        <div
          ref={shareCardRef}
          aria-hidden="true"
          style={{ position: "fixed", left: -9999, top: 0, width: 540, height: 720 }}
        >
          <div
            style={{
              width: 540,
              height: 720,
              background: `linear-gradient(160deg, ${r.bgStart} 0%, #fff 50%, ${r.bgEnd} 100%)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "0 36px",
              position: "relative",
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            <div style={{ width: "100%", textAlign: "center", paddingTop: 28, marginBottom: 8 }}>
              <p style={{ fontSize: 16, fontWeight: 900, fontFamily: "'Black Han Sans', sans-serif", color: "#333" }}>
                pick<span style={{ color: r.color }}>me</span>type
              </p>
            </div>
            <div style={{ width: 60, height: 2, background: r.color, opacity: 0.3, borderRadius: 1, marginBottom: 24 }} />
            <p style={{ fontSize: 13, color: "#999", letterSpacing: 4, fontWeight: 500, marginBottom: 16 }}>
              \uB098\uC758 \uB3D9\uBB3C\uC0C1\uC740
            </p>
            <div style={{ fontSize: 88, marginBottom: 12, lineHeight: 1 }}>{r.emoji}</div>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: r.color, marginBottom: 6, fontFamily: "'Black Han Sans', sans-serif" }}>
              {r.name}
            </h2>
            <p style={{ fontSize: 16, fontWeight: 700, color: r.color, marginBottom: 24, textAlign: "center" }}>
              {r.shortDesc}
            </p>
            <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 16, padding: "16px 20px", marginBottom: 20, width: "100%", textAlign: "center" }}>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#555" }}>
                {r.personality.split("\n")[0]}
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 20 }}>
              {r.tags.map((tag, i) => (
                <span key={i} style={{ background: r.color, color: "#fff", padding: "6px 16px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                  {tag}
                </span>
              ))}
            </div>
            <div style={{ position: "absolute", bottom: 24, width: "calc(100% - 72px)", textAlign: "center" }}>
              <div style={{ background: r.color, color: "#fff", borderRadius: 12, padding: "10px 0", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                \uB098\uB3C4 \uD14C\uC2A4\uD2B8\uD558\uAE30 \u2192 pickmetype.vercel.app
              </div>
              <p style={{ fontSize: 11, color: "#bbb" }}>
                AI \uB2EE\uC740 \uB3D9\uBB3C\uC0C1 \uBD84\uC11D\uAE30
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto px-4 py-6 flex flex-col items-center">
          {/* header */}
          <div className="w-full text-center animate-fade-in">
            <p className="text-sm text-gray-500 mb-2 font-medium tracking-wide">
              \uB2F9\uC2E0\uC758 \uB3D9\uBB3C\uC0C1\uC740...
            </p>
            <div className="text-8xl my-5 animate-bounce-slow">{r.emoji}</div>
            <h1 className="text-3xl mb-1.5" style={{ fontFamily: "var(--font-display)", color: r.color }}>
              {r.name}
            </h1>
            <p className="text-lg font-bold mb-5" style={{ color: r.color }}>
              {r.shortDesc}
            </p>
          </div>

          {/* AI analysis comment (photo mode only) */}
          {aiAnalysis && (
            <div className="w-full bg-gradient-to-r from-violet-50 to-purple-50 border border-purple-200 rounded-3xl p-5 shadow-lg mb-4 animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">\uD83E\uDD16</span>
                <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
                  AI \uBD84\uC11D \uCF54\uBA58\uD2B8
                </h3>
              </div>
              <p className="text-[15px] leading-relaxed text-gray-700">
                {aiAnalysis.analysis}
              </p>
            </div>
          )}

          {/* Top 3 match bar chart */}
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg mb-4 animate-slide-up" style={{ animationDelay: "0.06s" }}>
            <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              \uB9E4\uCE6D \uBE44\uC728 \uD83D\uDCCA
            </h3>
            <div className="space-y-3">
              {topMatches.map((m, i) => {
                const animal = animalTypes[m.animal];
                if (!animal) return null;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {animal.emoji} {animal.name}
                      </span>
                      <span className="text-sm font-bold" style={{ color: animal.color }}>
                        {m.percentage}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${m.percentage}%`,
                          backgroundColor: animal.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* personality */}
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg mb-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              \uC131\uACA9 \uBD84\uC11D \uD83D\uDD0D
            </h3>
            <p className="text-[15px] leading-relaxed whitespace-pre-line text-gray-700">
              {r.personality}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-4">
              {r.tags.map((tag, i) => (
                <span key={i} className="px-3 py-1.5 rounded-full text-[13px] font-medium text-white" style={{ backgroundColor: r.color }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* strengths & weaknesses */}
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg mb-4 animate-slide-up" style={{ animationDelay: "0.14s" }}>
            <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              \uC7A5\uC810 & \uB2E8\uC810 \u2696\uFE0F
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-bold text-green-600 mb-1.5">\uD83D\uDC4D \uC7A5\uC810</p>
                <div className="flex flex-wrap gap-1.5">
                  {r.strengths.map((s, i) => (
                    <span key={i} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[13px] font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-red-500 mb-1.5">\uD83D\uDC4E \uB2E8\uC810</p>
                <div className="flex flex-wrap gap-1.5">
                  {r.weaknesses.map((w, i) => (
                    <span key={i} className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[13px] font-medium">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* love style */}
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg mb-4 animate-slide-up" style={{ animationDelay: "0.18s" }}>
            <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              \uC5F0\uC560 \uC2A4\uD0C0\uC77C \uD83D\uDC95
            </h3>
            <p className="text-[15px] leading-relaxed text-gray-700">{r.loveStyle}</p>
          </div>

          {/* compatibility */}
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg mb-4 animate-slide-up" style={{ animationDelay: "0.22s" }}>
            <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              \uAD81\uD569 \uBCF4\uAE30 \uD83D\uDC9E
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 bg-pink-50 p-3 rounded-xl">
                <span className="text-sm font-bold text-pink-500 whitespace-nowrap">\uCC30\uB5A1\uAD81\uD569</span>
                <span className="text-[15px]">{r.bestMatch}</span>
              </div>
              <div className="flex items-center gap-3 bg-purple-50 p-3 rounded-xl">
                <span className="text-sm font-bold text-purple-500 whitespace-nowrap">\uD658\uC7A5\uC870\uD569</span>
                <span className="text-[15px]">{r.funMatch}</span>
              </div>
            </div>
          </div>

          {/* celebrities */}
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg mb-4 animate-slide-up" style={{ animationDelay: "0.26s" }}>
            <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              \uB2EE\uC740 \uC5F0\uC608\uC778 \u2B50
            </h3>
            <div className="flex flex-wrap gap-2">
              {r.celebrities.map((c, i) => (
                <span key={i} className="px-3 py-1.5 bg-yellow-50 text-yellow-800 rounded-full text-[13px] font-medium border border-yellow-200">
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* share */}
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg mb-4 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <h3 className="text-lg font-bold mb-3 text-center" style={{ fontFamily: "var(--font-display)" }}>
              \uCE5C\uAD6C\uD55C\uD14C \uACF5\uC720\uD558\uAE30 \uD83D\uDCE2
            </h3>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={shareToKakao}
                className="quiz-btn flex flex-col items-center gap-1.5 py-3 bg-[#FEE500] hover:bg-[#FDD800] text-gray-900 rounded-2xl font-bold text-[12px] transition-colors"
              >
                <span className="text-2xl">\uD83D\uDCAC</span>
                \uCE74\uCE74\uC624\uD1A1
              </button>
              <button
                onClick={saveResultImage}
                className="quiz-btn flex flex-col items-center gap-1.5 py-3 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white rounded-2xl font-bold text-[12px] transition-colors"
              >
                <span className="text-2xl">\uD83D\uDCF8</span>
                \uC774\uBBF8\uC9C0 \uC800\uC7A5
              </button>
              <button
                onClick={shareToX}
                className="quiz-btn flex flex-col items-center gap-1.5 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-bold text-[12px] transition-colors"
              >
                <span className="text-2xl">\uD835\uDD4F</span>
                \uD2B8\uC704\uD130
              </button>
              <button
                onClick={copyLink}
                className="quiz-btn flex flex-col items-center gap-1.5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-[12px] transition-colors"
              >
                <span className="text-2xl">\uD83D\uDD17</span>
                \uB9C1\uD06C\uBCF5\uC0AC
              </button>
            </div>
          </div>

          <AdBanner />

          <button
            onClick={handleRestart}
            className="quiz-btn w-full max-w-xs py-4 px-8 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white text-lg font-bold rounded-2xl shadow-lg shadow-purple-200/50 hover:shadow-xl transition-all duration-300 mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            \uB2E4\uC2DC \uD558\uAE30 \uD83D\uDD04
          </button>

          {/* other tests */}
          <div className="w-full mb-6 animate-slide-up" style={{ animationDelay: "0.35s" }}>
            <h3 className="text-xl font-bold text-center mb-3" style={{ fontFamily: "var(--font-display)" }}>
              \uB2E4\uB978 \uD14C\uC2A4\uD2B8\uB3C4 \uD574\uBCFC\uB798? \uD83E\uDDEA
            </h3>
            <div className="space-y-2.5">
              {OTHER_TESTS.map((t, i) => (
                <Link
                  key={i}
                  href={t.href}
                  className="w-full flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm hover:bg-white/80 transition-colors"
                >
                  <span className="text-3xl">{t.emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-[15px]">{t.title}</p>
                    <p className="text-xs text-purple-500 font-bold">{t.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-2"
          >
            \u2190 \uC804\uCCB4 \uD14C\uC2A4\uD2B8 \uBAA9\uB85D
          </Link>
          <p className="text-xs text-gray-400 text-center mb-4 pb-safe">
            \uC774 \uD14C\uC2A4\uD2B8\uB294 \uC7AC\uBBF8\uB85C \uB9CC\uB4E4\uC5B4\uC84C\uC73C\uBA70 \uACFC\uD559\uC801 \uADFC\uAC70\uB294 \uC5C6\uC2B5\uB2C8\uB2E4 :)
          </p>
        </div>

        {showToast && <div className="toast">{toastMsg}</div>}
      </div>
    );
  }

  return null;
}
