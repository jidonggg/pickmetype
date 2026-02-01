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
  "얼굴 형태 분석 중...",
  "눈/코/입 특징 분석 중...",
  "동물상 매칭 중...",
  "성격 분석 중...",
];

const OTHER_TESTS = [
  { emoji: "🍪", title: "나는 어떤 두쫀쿠?", desc: "두바이 쫀득 쿠키 성격 테스트", href: "/dubai-cookie" },
  { emoji: "⚔️", title: "나의 멘탈 HP 측정기", desc: "RPG 스탯으로 보는 내 멘탈!", href: "/mental-hp" },
  { emoji: "💰", title: "나의 시가총액 측정기", desc: "내가 회사라면 시가총액은?", href: "/market-cap" },
];

/* ==================== Floating Emojis ==================== */
function FloatingEmojis() {
  const emojis = ["🐶", "🐱", "🦊", "🐻", "🐰", "🦌", "🦕", "🐺", "🐧", "🦉", "🐹", "🐯", "🐬", "🦋", "🐿️", "🦥", "🐼", "🦜"];
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
  const [zoom, setZoom] = useState(1);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPanX: 0, startPanY: 0 });
  const imgContainerRef = useRef<HTMLDivElement>(null);

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
      setUploadError("이미지 파일만 업로드할 수 있어요.");
      return;
    }
    setUploadError(null);
    try {
      const resized = await resizeImage(file);
      setUploadPreview(resized);
      setZoom(1);
      setPanPos({ x: 0, y: 0 });
    } catch {
      setUploadError("이미지 처리에 실패했어요.");
    }
  };

  /* ---------- zoom/pan handlers ---------- */
  const getMaxPan = (z: number) => {
    const maxPx = ((z - 1) / 2) * (imgContainerRef.current?.offsetWidth || 300);
    return maxPx;
  };

  const clampPan = (x: number, y: number, z: number) => {
    const max = getMaxPan(z);
    return {
      x: Math.max(-max, Math.min(max, x)),
      y: Math.max(-max, Math.min(max, y)),
    };
  };

  const handlePanStart = (clientX: number, clientY: number) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragRef.current = { startX: clientX, startY: clientY, startPanX: panPos.x, startPanY: panPos.y };
  };

  const handlePanMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;
    setPanPos(clampPan(dragRef.current.startPanX + dx, dragRef.current.startPanY + dy, zoom));
  };

  const handlePanEnd = () => setIsDragging(false);

  const handleZoomChange = (newZoom: number) => {
    const z = Math.max(1, Math.min(3, newZoom));
    setZoom(z);
    setPanPos(clampPan(panPos.x, panPos.y, z));
  };

  /* ---------- crop visible area ---------- */
  const getCroppedImage = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!uploadPreview) return reject("No image");
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const outSize = 800;
        canvas.width = outSize;
        canvas.height = outSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas error");

        const iw = img.width;
        const ih = img.height;
        const containerSize = imgContainerRef.current?.offsetWidth || 300;

        // object-cover scale
        const coverScale = Math.max(containerSize / iw, containerSize / ih);
        const dispW = iw * coverScale;
        const dispH = ih * coverScale;

        // Visible center offset (in display coords)
        const cx = containerSize / 2 - panPos.x;
        const cy = containerSize / 2 - panPos.y;

        // Convert to pre-zoom display coords
        const srcCx = cx / zoom;
        const srcCy = cy / zoom;

        // Visible size in display coords (pre-zoom)
        const visW = containerSize / zoom;
        const visH = containerSize / zoom;

        // Convert to original image coords
        const offsetX = (dispW - containerSize) / 2;
        const offsetY = (dispH - containerSize) / 2;

        const imgSrcX = (srcCx - visW / 2 + offsetX) / coverScale;
        const imgSrcY = (srcCy - visH / 2 + offsetY) / coverScale;
        const imgSrcW = visW / coverScale;
        const imgSrcH = visH / coverScale;

        ctx.drawImage(img,
          Math.max(0, imgSrcX), Math.max(0, imgSrcY),
          Math.min(iw, imgSrcW), Math.min(ih, imgSrcH),
          0, 0, outSize, outSize
        );
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = uploadPreview;
    });
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
      const imageToSend = zoom > 1 ? await getCroppedImage() : uploadPreview;
      const res = await fetch("/api/analyze-animal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageToSend }),
      });

      clearInterval(stepInterval);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "분석 실패");
      }

      const data: AnalysisResult = await res.json();
      const animal = animalTypes[data.animal];
      if (!animal) throw new Error("알 수 없는 동물상");

      setAiAnalysis(data);
      setResultAnimal(animal);
      setTopMatches(data.topMatches);
      setPhase("result");
      window.scrollTo({ top: 0 });
      gtagEvent("quiz_complete", { quiz_id: "animal-face", result_type: data.animal });
    } catch (err) {
      clearInterval(stepInterval);
      const message = err instanceof Error ? err.message : "분석 중 오류가 발생했어요.";
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
    setZoom(1);
    setPanPos({ x: 0, y: 0 });
    window.scrollTo({ top: 0 });
  };

  /* ---------- share helpers ---------- */
  const shareUrl =
    typeof window !== "undefined" ? window.location.href.split("?")[0] : "";

  const getShareText = () => {
    if (!resultAnimal) return "";
    return `나의 동물상은 "${resultAnimal.name}" ${resultAnimal.emoji}\n${resultAnimal.shortDesc}\n\n너도 테스트 해봐!`;
  };

  const shareToKakao = () => {
    if (!resultAnimal) return;
    gtagEvent("share", { method: "kakao", quiz_id: "animal-face", result_type: resultAnimal.id });
    initKakao();
    try {
      if (window.Kakao && window.Kakao.isInitialized()) {
        window.Kakao.Share.sendDefault({
          objectType: "text",
          text: `${resultAnimal.emoji} 나의 동물상: ${resultAnimal.name}\n\n${resultAnimal.shortDesc}`,
          link: {
            mobileWebUrl: "https://pickmetype.vercel.app/animal-face",
            webUrl: "https://pickmetype.vercel.app/animal-face",
          },
          buttonTitle: "나도 테스트하기",
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
      toast("링크가 복사되었어요! 📋");
    } catch {
      toast("링크 복사에 실패했어요 😢");
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "AI 동물상 테스트",
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
        toast("이미지 저장 완료! 인스타 스토리에 올려보세요 📸");
      }
    } catch {
      el.style.cssText = orig;
      toast("이미지 생성에 실패했어요 😢");
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
              🐾
            </div>

            <h1
              className="text-[2.5rem] leading-tight mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              내 얼굴은
              <br />
              <span className="relative inline-block mt-1">
                <span className="relative z-10 bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                  무슨 동물상?
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-purple-200/60 -rotate-1 rounded" />
              </span>
            </h1>

            <p className="text-gray-600 text-[15px] mt-3 mb-6">
              사진 한 장이면 AI가 당신의 동물상을 분석해드려요!
            </p>

            {/* Feature Cards */}
            <div className="w-full grid grid-cols-3 gap-2 mb-5 px-1">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 text-center shadow-sm animate-scale-in" style={{ animationDelay: "0.1s" }}>
                <div className="text-2xl mb-1">🤖</div>
                <p className="text-[11px] font-bold text-gray-700">AI 얼굴 분석</p>
                <p className="text-[10px] text-gray-400">사진 한 장으로</p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 text-center shadow-sm animate-scale-in" style={{ animationDelay: "0.2s" }}>
                <div className="text-2xl mb-1">🎯</div>
                <p className="text-[11px] font-bold text-gray-700">18가지 결과</p>
                <p className="text-[10px] text-gray-400">다양한 동물상</p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 text-center shadow-sm animate-scale-in" style={{ animationDelay: "0.3s" }}>
                <div className="text-2xl mb-1">💕</div>
                <p className="text-[11px] font-bold text-gray-700">성격/연애/궁합</p>
                <p className="text-[10px] text-gray-400">상세 분석 결과</p>
              </div>
            </div>

            {/* How it works */}
            <div className="w-full bg-white/60 backdrop-blur-sm rounded-2xl p-4 mb-6 shadow-sm animate-scale-in" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="bg-purple-100 text-purple-600 px-3 py-1.5 rounded-full font-bold text-[12px]">📸 사진 업로드</span>
                <span className="text-gray-300">→</span>
                <span className="bg-purple-100 text-purple-600 px-3 py-1.5 rounded-full font-bold text-[12px]">🤖 AI 분석</span>
                <span className="text-gray-300">→</span>
                <span className="bg-purple-100 text-purple-600 px-3 py-1.5 rounded-full font-bold text-[12px]">🎉 결과 확인</span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePhotoMode}
            className="quiz-btn w-full max-w-xs py-4 px-8 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white text-xl font-bold rounded-2xl shadow-lg shadow-purple-200/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 animate-pulse-soft mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            📸 사진으로 분석하기
          </button>

          <p className="text-xs text-gray-400 mt-3 mb-6 pb-safe">
            결과는 재미로만 봐주세요 :)
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
            ← 뒤로가기
          </button>

          <h2
            className="text-2xl text-center mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            사진을 올려주세요 📸
          </h2>
          <p className="text-center text-gray-500 text-sm mb-6">
            얼굴이 잘 보이는 사진일수록 정확해요!
          </p>

          {/* Upload Area */}
          {uploadPreview ? (
            <>
              <div
                ref={imgContainerRef}
                className="w-full aspect-square max-w-sm mx-auto rounded-3xl border-2 border-purple-300 bg-black/5 overflow-hidden select-none"
                style={{ touchAction: "none", cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
                onMouseDown={(e) => { e.preventDefault(); handlePanStart(e.clientX, e.clientY); }}
                onMouseMove={(e) => handlePanMove(e.clientX, e.clientY)}
                onMouseUp={handlePanEnd}
                onMouseLeave={handlePanEnd}
                onTouchStart={(e) => { if (e.touches.length === 1) handlePanStart(e.touches[0].clientX, e.touches[0].clientY); }}
                onTouchMove={(e) => { if (e.touches.length === 1) handlePanMove(e.touches[0].clientX, e.touches[0].clientY); }}
                onTouchEnd={handlePanEnd}
              >
                <img
                  src={uploadPreview}
                  alt="Preview"
                  className="w-full h-full object-cover pointer-events-none"
                  style={{
                    transform: `scale(${zoom}) translate(${panPos.x / zoom}px, ${panPos.y / zoom}px)`,
                    transformOrigin: "center center",
                    transition: isDragging ? "none" : "transform 0.15s ease-out",
                  }}
                  draggable={false}
                />
              </div>

              {/* Zoom Controls */}
              <div className="w-full max-w-sm mx-auto mt-3 flex items-center gap-3 px-2">
                <button
                  onClick={() => handleZoomChange(zoom - 0.25)}
                  className="w-9 h-9 flex items-center justify-center bg-white/80 rounded-full shadow-sm border border-purple-200 text-purple-600 font-bold text-lg hover:bg-purple-50 transition-colors"
                >
                  −
                </button>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-purple-100 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <button
                  onClick={() => handleZoomChange(zoom + 0.25)}
                  className="w-9 h-9 flex items-center justify-center bg-white/80 rounded-full shadow-sm border border-purple-200 text-purple-600 font-bold text-lg hover:bg-purple-50 transition-colors"
                >
                  +
                </button>
                <span className="text-xs text-gray-400 w-10 text-right">{Math.round(zoom * 100)}%</span>
              </div>
              {zoom > 1 && (
                <p className="text-xs text-purple-400 text-center mt-1">드래그하여 위치를 조절하세요</p>
              )}
            </>
          ) : (
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
              <div className="text-6xl mb-4">📷</div>
              <p className="text-gray-500 font-medium mb-1">사진을 업로드하세요</p>
              <p className="text-gray-400 text-sm">클릭 또는 드래그 앤 드롭</p>
            </div>
          )}
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
                onClick={() => { setUploadPreview(null); setZoom(1); setPanPos({ x: 0, y: 0 }); fileInputRef.current?.click(); }}
                className="flex-1 py-3 bg-white/80 text-purple-600 font-bold rounded-2xl border-2 border-purple-200 hover:border-purple-400 transition-all text-sm"
              >
                다시 선택
              </button>
              <button
                onClick={handleAnalyzePhoto}
                className="flex-1 py-3 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all text-sm"
              >
                분석하기 ✨
              </button>
            </div>
          )}

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
            ← 처음으로
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
          <div className="text-7xl mb-8 animate-bounce-slow">🐾</div>

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
                  {i < analysisStep ? "✓" : i + 1}
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
            AI가 분석하고 있어요...
          </p>

          {mode === "photo" && (
            <button
              onClick={handleRestart}
              className="mt-6 text-sm text-gray-400 hover:text-gray-300 transition-colors underline py-1"
            >
              취소하고 처음으로
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
              나의 동물상은
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
                나도 테스트하기 → pickmetype.vercel.app
              </div>
              <p style={{ fontSize: 11, color: "#bbb" }}>
                AI 동물상 테스트
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto px-4 py-6 flex flex-col items-center">
          {/* header */}
          <div className="w-full text-center animate-fade-in">
            <p className="text-sm text-gray-500 mb-2 font-medium tracking-wide">
              당신의 동물상은...
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
                <span className="text-lg">🤖</span>
                <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
                  AI 분석 코멘트
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
              매칭 비율 📊
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
              성격 분석 🔍
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
              장점 & 단점 ⚖️
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-bold text-green-600 mb-1.5">👍 장점</p>
                <div className="flex flex-wrap gap-1.5">
                  {r.strengths.map((s, i) => (
                    <span key={i} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[13px] font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-red-500 mb-1.5">👎 단점</p>
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
              연애 스타일 💕
            </h3>
            <p className="text-[15px] leading-relaxed text-gray-700">{r.loveStyle}</p>
          </div>

          {/* compatibility */}
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg mb-4 animate-slide-up" style={{ animationDelay: "0.22s" }}>
            <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              궁합 보기 💞
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

          {/* celebrities */}
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg mb-4 animate-slide-up" style={{ animationDelay: "0.26s" }}>
            <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              닮은 연예인 ⭐
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
                onClick={saveResultImage}
                className="quiz-btn flex flex-col items-center gap-1.5 py-3 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white rounded-2xl font-bold text-[12px] transition-colors"
              >
                <span className="text-2xl">📸</span>
                이미지 저장
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
            className="quiz-btn w-full max-w-xs py-4 px-8 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white text-lg font-bold rounded-2xl shadow-lg shadow-purple-200/50 hover:shadow-xl transition-all duration-300 mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            다시 하기 🔄
          </button>

          {/* other tests */}
          <div className="w-full mb-6 animate-slide-up" style={{ animationDelay: "0.35s" }}>
            <h3 className="text-xl font-bold text-center mb-3" style={{ fontFamily: "var(--font-display)" }}>
              다른 테스트도 해볼래? 🧪
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
