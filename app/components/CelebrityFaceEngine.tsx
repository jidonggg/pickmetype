"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import AdBanner from "./AdBanner";
import { gtagEvent } from "./GoogleAnalytics";
import {
  celebrities,
  CELEBRITY_NAMES_CAROUSEL,
  LOADING_COMMENTS,
  ANALYSIS_STEPS,
} from "../celebrity-face/data";
import type { CelebrityAnalysisResult } from "../celebrity-face/data";

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

type Phase = "intro" | "upload" | "analyzing" | "result";

const OTHER_TESTS = [
  { emoji: "🐾", title: "AI 동물상 테스트", desc: "사진 한 장으로 내 동물상 찾기!", href: "/animal-face" },
  { emoji: "⚔️", title: "나의 멘탈 HP 측정기", desc: "RPG 스탯으로 보는 내 멘탈!", href: "/mental-hp" },
  { emoji: "💰", title: "나의 시가총액 측정기", desc: "내가 회사라면 시가총액은?", href: "/market-cap" },
];

/* ==================== Floating Emojis ==================== */
function FloatingEmojis() {
  const emojis = ["⭐", "🌟", "✨", "💫", "🏆", "💎", "🎬", "🎤", "👑", "🌠"];
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

/* ==================== Celebrity Face Engine ==================== */
export default function CelebrityFaceEngine() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [result, setResult] = useState<CelebrityAnalysisResult | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [analysisStep, setAnalysisStep] = useState(0);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [loadingComment, setLoadingComment] = useState(LOADING_COMMENTS[0]);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = useState(1);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPanX: 0, startPanY: 0 });
  const imgContainerRef = useRef<HTMLDivElement>(null);

  // Intro states
  const [participantCount, setParticipantCount] = useState(52847);
  const [trendingCelebs, setTrendingCelebs] = useState<string[]>([]);

  const initKakao = () => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_KEY);
    }
  };

  useEffect(() => {
    initKakao();
  }, []);

  // Participant count increment
  useEffect(() => {
    if (phase !== "intro") return;
    const interval = setInterval(() => {
      setParticipantCount((p) => p + Math.floor(Math.random() * 3) + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [phase]);

  // Trending celebs rotation
  useEffect(() => {
    if (phase !== "intro") return;
    const allNames = Object.values(celebrities).map((c) => `${c.imageEmoji} ${c.name}`);
    const pick3 = () => {
      const shuffled = [...allNames].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 3);
    };
    setTrendingCelebs(pick3());
    const interval = setInterval(() => setTrendingCelebs(pick3()), 3000);
    return () => clearInterval(interval);
  }, [phase]);

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
            if (w > h) { h = (h * MAX) / w; w = MAX; }
            else { w = (w * MAX) / h; h = MAX; }
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
  const handleStart = () => {
    setPhase("upload");
    window.scrollTo({ top: 0 });
    gtagEvent("quiz_start", { quiz_id: "celebrity-face", method: "photo" });
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
        const coverScale = Math.max(containerSize / iw, containerSize / ih);
        const dispW = iw * coverScale;
        const dispH = ih * coverScale;
        const cx = containerSize / 2 - panPos.x;
        const cy = containerSize / 2 - panPos.y;
        const srcCx = cx / zoom;
        const srcCy = cy / zoom;
        const visW = containerSize / zoom;
        const visH = containerSize / zoom;
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
    setLoadingComment(LOADING_COMMENTS[Math.floor(Math.random() * LOADING_COMMENTS.length)]);
    window.scrollTo({ top: 0 });

    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => {
        if (prev < ANALYSIS_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 1800);

    const commentInterval = setInterval(() => {
      setLoadingComment(LOADING_COMMENTS[Math.floor(Math.random() * LOADING_COMMENTS.length)]);
    }, 2000);

    try {
      const imageToSend = zoom > 1 ? await getCroppedImage() : uploadPreview;
      setUserPhoto(imageToSend);
      const res = await fetch("/api/analyze-celebrity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageToSend }),
      });

      clearInterval(stepInterval);
      clearInterval(commentInterval);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "분석 실패");
      }

      const data: CelebrityAnalysisResult = await res.json();
      setResult(data);
      setPhase("result");
      window.scrollTo({ top: 0 });
      gtagEvent("quiz_complete", { quiz_id: "celebrity-face", result_type: data.sameGenderTop5[0]?.celebrityId || "" });
    } catch (err) {
      clearInterval(stepInterval);
      clearInterval(commentInterval);
      const message = err instanceof Error ? err.message : "분석 중 오류가 발생했어요.";
      setUploadError(message);
      setPhase("upload");
    }
  };

  const handleRestart = () => {
    setPhase("intro");
    setResult(null);
    setUploadPreview(null);
    setUploadError(null);
    setUserPhoto(null);
    setZoom(1);
    setPanPos({ x: 0, y: 0 });
    window.scrollTo({ top: 0 });
  };

  /* ---------- share helpers ---------- */
  const shareUrl = typeof window !== "undefined" ? window.location.href.split("?")[0] : "";

  const getShareText = () => {
    if (!result) return "";
    const top1 = result.sameGenderTop5[0];
    const celeb = top1 ? celebrities[top1.celebrityId] : null;
    if (!celeb) return "";
    const matchText = result.sameGenderTop5.slice(0, 3)
      .map((m) => {
        const c = celebrities[m.celebrityId];
        return c ? `${c.imageEmoji}${c.name} ${m.percentage}%` : "";
      })
      .filter(Boolean)
      .join(" | ");
    return `⭐ 나의 닮은 연예인 1위: "${celeb.name}" (${celeb.group})\n${matchText}\n희귀도: ${result.uniqueRate}%\n\n너도 해봐! → pickmetype.vercel.app/celebrity-face`;
  };

  const generateShareImage = async (): Promise<File | null> => {
    const el = shareCardRef.current;
    if (!el) return null;
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
      if (!blob) return null;
      return new File([blob], "my-celebrity-face.png", { type: "image/png" });
    } catch {
      el.style.cssText = orig;
      return null;
    }
  };

  const shareWithImage = async (method: string) => {
    if (!result) return;
    gtagEvent("share", { method, quiz_id: "celebrity-face", result_type: result.sameGenderTop5[0]?.celebrityId || "" });
    toast("이미지 생성 중...");
    const file = await generateShareImage();
    if (file && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ text: getShareText(), files: [file] });
      } catch { /* user cancelled */ }
    } else if (file) {
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-celebrity-face.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast("이미지 저장 완료!");
    } else {
      toast("이미지 생성에 실패했어요");
    }
  };

  const shareToKakao = async () => {
    if (!result) return;
    gtagEvent("share", { method: "kakao", quiz_id: "celebrity-face", result_type: result.sameGenderTop5[0]?.celebrityId || "" });

    toast("이미지 생성 중...");
    const file = await generateShareImage();
    if (file && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ text: getShareText(), files: [file] });
        return;
      } catch { /* fall through */ }
    }

    initKakao();
    const top1 = result.sameGenderTop5[0];
    const celeb = top1 ? celebrities[top1.celebrityId] : null;
    try {
      if (window.Kakao && window.Kakao.isInitialized() && celeb) {
        window.Kakao.Share.sendDefault({
          objectType: "feed",
          content: {
            title: `⭐ 나의 닮은 연예인 1위: ${celeb.name} (${celeb.group})`,
            description: `희귀도 ${result.uniqueRate}% | ${result.overallVibe.join(", ")}`,
            imageUrl: "https://pickmetype.vercel.app/opengraph-image",
            link: {
              mobileWebUrl: "https://pickmetype.vercel.app/celebrity-face",
              webUrl: "https://pickmetype.vercel.app/celebrity-face",
            },
          },
          buttons: [
            {
              title: "나도 테스트하기",
              link: {
                mobileWebUrl: "https://pickmetype.vercel.app/celebrity-face",
                webUrl: "https://pickmetype.vercel.app/celebrity-face",
              },
            },
          ],
        });
      } else {
        await copyLink();
      }
    } catch {
      await copyLink();
    }
  };

  const shareToX = () => {
    gtagEvent("share", { method: "x", quiz_id: "celebrity-face", result_type: result?.sameGenderTop5[0]?.celebrityId || "" });
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const copyLink = async () => {
    gtagEvent("share", { method: "copy_link", quiz_id: "celebrity-face", result_type: result?.sameGenderTop5[0]?.celebrityId || "" });
    try {
      await navigator.clipboard.writeText(`${getShareText()}\n${shareUrl}`);
      toast("링크가 복사되었어요!");
    } catch {
      toast("링크 복사에 실패했어요");
    }
  };

  const saveResultImage = async () => {
    gtagEvent("share", { method: "save_image", quiz_id: "celebrity-face", result_type: result?.sameGenderTop5[0]?.celebrityId || "" });
    await shareWithImage("save_image");
  };

  const shareToInstagram = async () => {
    if (!result) return;
    gtagEvent("share", { method: "instagram", quiz_id: "celebrity-face", result_type: result.sameGenderTop5[0]?.celebrityId || "" });
    toast("이미지 생성 중...");
    const file = await generateShareImage();
    if (file && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
      } catch { /* user cancelled */ }
    } else if (file) {
      // Desktop: download image, user can upload to Instagram manually
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-celebrity-face.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast("이미지 저장 완료! 인스타에 업로드해주세요");
    } else {
      toast("이미지 생성에 실패했어요");
    }
  };

  // Helper: get uniqueRate label and color
  const getUniqueLabel = (rate: number) => {
    if (rate < 25) return { label: "흔함", color: "#9CA3AF" };
    if (rate < 50) return { label: "특별", color: "#3B82F6" };
    if (rate < 75) return { label: "레어", color: "#8B5CF6" };
    return { label: "전설급", color: "#F59E0B" };
  };

  // ========== INTRO ==========
  if (phase === "intro") {
    const row1 = CELEBRITY_NAMES_CAROUSEL.slice(0, Math.ceil(CELEBRITY_NAMES_CAROUSEL.length / 2));
    const row2 = CELEBRITY_NAMES_CAROUSEL.slice(Math.ceil(CELEBRITY_NAMES_CAROUSEL.length / 2));

    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center relative px-4 bg-gradient-to-b from-amber-50 via-yellow-50 to-orange-50">
        <FloatingEmojis />
        <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center">
          <AdBanner />

          <div className="w-full mt-2 mb-6 text-center animate-fade-in">
            <div className="text-7xl mb-5 animate-bounce-slow">⭐</div>

            <h1
              className="text-[2.5rem] leading-tight mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              AI 닮은
              <br />
              <span className="relative inline-block mt-1">
                <span className="relative z-10 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
                  연예인 찾기
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-amber-200/60 -rotate-1 rounded" />
              </span>
            </h1>

            <p className="text-gray-600 text-[15px] mt-3 mb-4">
              사진 한 장으로 닮은 연예인을 찾아드려요!
            </p>

            {/* Celebrity Name Carousel */}
            <div className="w-full overflow-hidden mb-5">
              <div className="flex gap-2 animate-scroll-left whitespace-nowrap mb-2">
                {[...row1, ...row1].map((name, i) => (
                  <span key={i} className="inline-block px-3 py-1 bg-amber-100/80 text-amber-700 rounded-full text-xs font-medium flex-shrink-0">
                    {name}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 animate-scroll-right whitespace-nowrap">
                {[...row2, ...row2].map((name, i) => (
                  <span key={i} className="inline-block px-3 py-1 bg-orange-100/80 text-orange-700 rounded-full text-xs font-medium flex-shrink-0">
                    {name}
                  </span>
                ))}
              </div>
            </div>

            {/* Trending Results */}
            <div className="w-full bg-white/60 backdrop-blur-sm rounded-2xl p-3 mb-4 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs font-bold text-amber-600">실시간 인기 결과</span>
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {trendingCelebs.map((name, i) => (
                  <span key={`${name}-${i}`} className="px-3 py-1 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-full text-xs font-medium text-gray-700 transition-all">
                    {name}
                  </span>
                ))}
              </div>
            </div>

            {/* Participant Count */}
            <p className="text-xs text-gray-500 mb-4">
              지금까지 <span className="font-bold text-amber-600">{participantCount.toLocaleString()}</span>명이 참여했어요!
            </p>

            {/* Feature Cards */}
            <div className="w-full grid grid-cols-3 gap-2 mb-5 px-1">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 text-center shadow-sm animate-scale-in" style={{ animationDelay: "0.1s" }}>
                <div className="text-2xl mb-1">🎬</div>
                <p className="text-[11px] font-bold text-gray-700">60+ 연예인 DB</p>
                <p className="text-[10px] text-gray-400">아이돌+배우</p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 text-center shadow-sm animate-scale-in" style={{ animationDelay: "0.2s" }}>
                <div className="text-2xl mb-1">🤖</div>
                <p className="text-[11px] font-bold text-gray-700">AI 얼굴 분석</p>
                <p className="text-[10px] text-gray-400">정밀 대조</p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 text-center shadow-sm animate-scale-in" style={{ animationDelay: "0.3s" }}>
                <div className="text-2xl mb-1">💎</div>
                <p className="text-[11px] font-bold text-gray-700">희귀도 측정</p>
                <p className="text-[10px] text-gray-400">0~100%</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="quiz-btn w-full max-w-xs py-4 px-8 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-white text-xl font-bold rounded-2xl shadow-lg shadow-amber-200/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 animate-pulse-soft mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ⭐ 내 닮은꼴 찾기
          </button>

          <p className="text-xs text-gray-400 mt-3 mb-6 pb-safe">
            결과는 재미로만 봐주세요 :)
          </p>
        </div>

        <style jsx>{`
          @keyframes scrollLeft {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes scrollRight {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
          .animate-scroll-left { animation: scrollLeft 20s linear infinite; }
          .animate-scroll-right { animation: scrollRight 20s linear infinite; }
        `}</style>
      </div>
    );
  }

  // ========== UPLOAD ==========
  if (phase === "upload") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center relative px-4 bg-gradient-to-b from-amber-50 via-yellow-50 to-orange-50">
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
            사진을 올려주세요 ⭐
          </h2>
          <p className="text-center text-gray-500 text-sm mb-4">
            얼굴이 잘 보이는 사진일수록 정확해요!
          </p>

          {/* Tips */}
          <div className="flex gap-2 justify-center mb-5">
            <span className="px-3 py-1 bg-amber-100/80 text-amber-700 rounded-full text-[11px] font-medium">정면 셀카</span>
            <span className="px-3 py-1 bg-amber-100/80 text-amber-700 rounded-full text-[11px] font-medium">자연스러운 표정</span>
            <span className="px-3 py-1 bg-amber-100/80 text-amber-700 rounded-full text-[11px] font-medium">얼굴 전체</span>
          </div>

          {/* Upload Area */}
          {uploadPreview ? (
            <>
              <div
                ref={imgContainerRef}
                className="w-full aspect-square max-w-sm mx-auto rounded-3xl border-2 border-amber-300 bg-black/5 overflow-hidden select-none"
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
                  className="w-9 h-9 flex items-center justify-center bg-white/80 rounded-full shadow-sm border border-amber-200 text-amber-600 font-bold text-lg hover:bg-amber-50 transition-colors"
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
                  className="flex-1 h-2 bg-amber-100 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <button
                  onClick={() => handleZoomChange(zoom + 0.25)}
                  className="w-9 h-9 flex items-center justify-center bg-white/80 rounded-full shadow-sm border border-amber-200 text-amber-600 font-bold text-lg hover:bg-amber-50 transition-colors"
                >
                  +
                </button>
                <span className="text-xs text-gray-400 w-10 text-right">{Math.round(zoom * 100)}%</span>
              </div>
              {zoom > 1 && (
                <p className="text-xs text-amber-400 text-center mt-1">드래그하여 위치를 조절하세요</p>
              )}
            </>
          ) : (
            <div
              className="w-full aspect-square max-w-sm mx-auto rounded-3xl border-2 border-dashed border-amber-300 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-white/80 transition-all overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files[0];
                if (file) handleFileSelect(file);
              }}
            >
              <div className="text-6xl mb-4">📸</div>
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
                className="flex-1 py-3 bg-white/80 text-amber-600 font-bold rounded-2xl border-2 border-amber-200 hover:border-amber-400 transition-all text-sm"
              >
                다시 선택
              </button>
              <button
                onClick={handleAnalyzePhoto}
                className="flex-1 py-3 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all text-sm"
              >
                분석하기 ⭐
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========== ANALYZING ==========
  if (phase === "analyzing") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center relative px-4 bg-gradient-to-b from-gray-900 via-amber-950 to-gray-900">
        <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center text-center">

          {/* Photo with scan line */}
          {uploadPreview && (
            <div className="relative w-40 h-40 rounded-2xl overflow-hidden mb-6 border-2 border-amber-500/50">
              <img src={uploadPreview} alt="Analyzing" className="w-full h-full object-cover" />
              <div className="scan-line" />
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent" />
            </div>
          )}

          <div className="space-y-3 mb-6 w-full max-w-xs">
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
                      ? "bg-amber-500 text-white"
                      : i === analysisStep
                      ? "bg-yellow-500 text-white animate-pulse"
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

          <div className="w-48 h-1 bg-gray-700 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-1000"
              style={{ width: `${((analysisStep + 1) / ANALYSIS_STEPS.length) * 100}%` }}
            />
          </div>

          <p className="text-amber-300 text-sm animate-pulse mb-2">
            {loadingComment}
          </p>

          <button
            onClick={handleRestart}
            className="mt-4 text-sm text-gray-400 hover:text-gray-300 transition-colors underline py-1"
          >
            취소하고 처음으로
          </button>

          <div className="mt-6">
            <AdBanner />
          </div>
        </div>
      </div>
    );
  }

  // ========== RESULT ==========
  if (phase === "result" && result) {
    const top1Match = result.sameGenderTop5[0];
    const top1Celeb = top1Match ? celebrities[top1Match.celebrityId] : null;
    const uniqueInfo = getUniqueLabel(result.uniqueRate);

    return (
      <div className="min-h-[100dvh] relative bg-gradient-to-b from-amber-50 via-white to-orange-50">

        {/* Hidden share card */}
        <div ref={shareCardRef} aria-hidden="true" style={{ position: "fixed", left: -9999, top: 0, width: 540, height: 720 }}>
          <div style={{ width: 540, height: 720, background: "linear-gradient(160deg, #FEF3C7 0%, #fff 50%, #FFEDD5 100%)", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 36px", position: "relative", fontFamily: "'Noto Sans KR', sans-serif" }}>
            <div style={{ width: "100%", textAlign: "center", paddingTop: 24, marginBottom: 12 }}>
              <p style={{ fontSize: 16, fontWeight: 900, fontFamily: "'Black Han Sans', sans-serif", color: "#333" }}>
                pick<span style={{ color: "#F59E0B" }}>me</span>type
              </p>
            </div>
            <p style={{ fontSize: 12, color: "#999", letterSpacing: 4, fontWeight: 500, marginBottom: 16 }}>나의 닮은 연예인은</p>
            <div style={{ position: "relative", marginBottom: 16 }}>
              {userPhoto ? (
                <div style={{ width: 160, height: 160, borderRadius: "50%", border: "4px solid #F59E0B", boxShadow: "0 8px 30px rgba(0,0,0,0.12)", backgroundImage: `url(${userPhoto})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              ) : (
                <div style={{ width: 160, height: 160, borderRadius: "50%", background: "linear-gradient(135deg, #FEF3C7, #FFEDD5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72, border: "4px solid #F59E0B" }}>⭐</div>
              )}
              {top1Celeb && (
                <div style={{ position: "absolute", bottom: -4, right: -4, fontSize: 48, lineHeight: 1, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.2))" }}>{top1Celeb.imageEmoji}</div>
              )}
            </div>
            {top1Celeb && (
              <>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: "#F59E0B", marginBottom: 2, fontFamily: "'Black Han Sans', sans-serif" }}>{top1Celeb.name}</h2>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#D97706", marginBottom: 14 }}>{top1Celeb.group}</p>
              </>
            )}
            <div style={{ width: "100%", marginBottom: 14 }}>
              {result.sameGenderTop5.slice(0, 5).map((m, i) => {
                const c = celebrities[m.celebrityId];
                if (!c) return null;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 13, width: 80, textAlign: "right" }}>{c.imageEmoji} {c.name}</span>
                    <div style={{ flex: 1, height: 12, background: "rgba(0,0,0,0.06)", borderRadius: 6, overflow: "hidden" }}>
                      <div style={{ width: `${m.percentage}%`, height: "100%", background: i === 0 ? "#F59E0B" : i === 1 ? "#FBBF24" : "#FCD34D", borderRadius: 6 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#D97706", width: 34, textAlign: "right" }}>{m.percentage}%</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, justifyContent: "center", marginBottom: 14 }}>
              {result.overallVibe.map((vibe, i) => (
                <span key={i} style={{ background: "#F59E0B", color: "#fff", padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 600 }}>#{vibe}</span>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "#999" }}>희귀도</span>
              <div style={{ width: 120, height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${result.uniqueRate}%`, height: "100%", background: `linear-gradient(90deg, #FBBF24, ${uniqueInfo.color})`, borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: uniqueInfo.color }}>{result.uniqueRate}% {uniqueInfo.label}</span>
            </div>
            <div style={{ position: "absolute", bottom: 20, width: "calc(100% - 72px)", textAlign: "center" }}>
              <div style={{ background: "linear-gradient(90deg, #F59E0B, #EAB308)", color: "#fff", borderRadius: 12, padding: "10px 0", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>나도 테스트하기 → pickmetype.vercel.app</div>
              <p style={{ fontSize: 11, color: "#bbb" }}>AI 닮은 연예인 찾기</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto px-4 py-6 flex flex-col items-center">

          {/* 1. VS Card */}
          <div className="w-full text-center animate-fade-in mb-4">
            <p className="text-sm text-gray-500 mb-3 font-medium tracking-wide">당신의 닮은 연예인은...</p>
            <div className="flex items-center justify-center gap-4 mb-4">
              {userPhoto ? (
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-300 shadow-lg">
                  <img src={userPhoto} alt="You" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-amber-100 flex items-center justify-center text-4xl border-2 border-amber-300">😊</div>
              )}
              <div className="text-2xl font-bold text-amber-500">=</div>
              {top1Celeb && (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex flex-col items-center justify-center border-2 border-amber-400 shadow-lg">
                  <span className="text-3xl mb-1">{top1Celeb.imageEmoji}</span>
                  <span className="text-[10px] font-bold text-amber-700">{top1Celeb.name}</span>
                </div>
              )}
            </div>
            {top1Celeb && (
              <>
                <h1 className="text-3xl mb-1" style={{ fontFamily: "var(--font-display)", color: "#D97706" }}>
                  {top1Celeb.imageEmoji} {top1Celeb.name}
                </h1>
                <p className="text-sm font-bold text-amber-600 mb-1">{top1Celeb.group}</p>
                <p className="text-lg font-bold text-amber-500">{top1Match.percentage}% 매칭!</p>
              </>
            )}
          </div>

          {/* 2. Same Gender TOP 5 */}
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg mb-4 animate-slide-up" style={{ animationDelay: "0.06s" }}>
            <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              {result.gender === "female" ? "여자" : "남자"} 연예인 TOP 5 ⭐
            </h3>
            <div className="space-y-3">
              {result.sameGenderTop5.map((m, i) => {
                const celeb = celebrities[m.celebrityId];
                if (!celeb) return null;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium flex items-center gap-1.5">
                        {i === 0 && <span className="text-amber-500">👑</span>}
                        <span className="text-gray-500 text-xs w-5">{i + 1}위</span>
                        {celeb.imageEmoji} {celeb.name}
                        <span className="text-[10px] text-gray-400">({celeb.group})</span>
                      </span>
                      <span className="text-sm font-bold text-amber-600">
                        {m.percentage}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${m.percentage}%`,
                          backgroundColor: i === 0 ? "#F59E0B" : i === 1 ? "#FBBF24" : i === 2 ? "#FCD34D" : "#FDE68A",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Opposite Gender TOP 2 */}
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg mb-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              {result.gender === "female" ? "남자" : "여자"} 연예인 닮은꼴 TOP 2 💕
            </h3>
            <div className="space-y-3">
              {result.oppositeGenderTop2.map((m, i) => {
                const celeb = celebrities[m.celebrityId];
                if (!celeb) return null;
                return (
                  <div key={i} className="bg-gradient-to-r from-pink-50 to-amber-50 rounded-2xl p-4 border border-amber-100">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{celeb.imageEmoji}</span>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{celeb.name} <span className="text-xs text-gray-400">({celeb.group})</span></p>
                        <p className="text-sm text-amber-600 font-medium">{m.percentage}% 매칭</p>
                      </div>
                    </div>
                    {m.appealPoint && (
                      <p className="text-xs text-gray-600 bg-white/60 rounded-lg px-3 py-1.5">{m.appealPoint}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Face Analysis */}
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg mb-4 animate-slide-up" style={{ animationDelay: "0.14s" }}>
            <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              얼굴 정밀 분석 🔍
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-violet-50 p-3 rounded-xl">
                <span className="text-lg mt-0.5">👁️</span>
                <div>
                  <p className="text-xs font-bold text-violet-600 mb-0.5">눈</p>
                  <p className="text-sm text-gray-700">{result.faceAnalysis.eyes}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-xl">
                <span className="text-lg mt-0.5">👃</span>
                <div>
                  <p className="text-xs font-bold text-blue-600 mb-0.5">코</p>
                  <p className="text-sm text-gray-700">{result.faceAnalysis.nose}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-rose-50 p-3 rounded-xl">
                <span className="text-lg mt-0.5">👄</span>
                <div>
                  <p className="text-xs font-bold text-rose-600 mb-0.5">입술</p>
                  <p className="text-sm text-gray-700">{result.faceAnalysis.lips}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-amber-50 p-3 rounded-xl">
                <span className="text-lg mt-0.5">🔲</span>
                <div>
                  <p className="text-xs font-bold text-amber-600 mb-0.5">얼굴형</p>
                  <p className="text-sm text-gray-700">{result.faceAnalysis.faceShape}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Overall Vibe */}
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg mb-4 animate-slide-up" style={{ animationDelay: "0.18s" }}>
            <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              전체 분위기 ✨
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.overallVibe.map((vibe, i) => (
                <span
                  key={i}
                  className="px-4 py-2 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: ["#F59E0B", "#EAB308", "#D97706", "#B45309", "#92400E"][i % 5] }}
                >
                  #{vibe}
                </span>
              ))}
            </div>
          </div>

          {/* 6. Style Recommendation */}
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg mb-4 animate-slide-up" style={{ animationDelay: "0.22s" }}>
            <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              스타일 추천 💄
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-pink-50 p-3 rounded-xl">
                <span className="text-lg">💄</span>
                <div>
                  <p className="text-xs font-bold text-pink-600 mb-0.5">메이크업</p>
                  <p className="text-sm text-gray-700">{result.styleRecommendation.makeup}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-purple-50 p-3 rounded-xl">
                <span className="text-lg">💇</span>
                <div>
                  <p className="text-xs font-bold text-purple-600 mb-0.5">헤어스타일</p>
                  <p className="text-sm text-gray-700">{result.styleRecommendation.hair}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-indigo-50 p-3 rounded-xl">
                <span className="text-lg">👗</span>
                <div>
                  <p className="text-xs font-bold text-indigo-600 mb-0.5">패션</p>
                  <p className="text-sm text-gray-700">{result.styleRecommendation.fashion}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 7. Unique Rate Meter */}
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg mb-4 animate-slide-up" style={{ animationDelay: "0.26s" }}>
            <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              희귀도 💎
            </h3>
            <div className="relative">
              <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${result.uniqueRate}%`,
                    background: `linear-gradient(90deg, #FCD34D, ${uniqueInfo.color})`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                <span>흔함</span>
                <span>특별</span>
                <span>레어</span>
                <span>전설급</span>
              </div>
              <div className="text-center mt-3">
                <span className="text-3xl font-bold" style={{ color: uniqueInfo.color }}>
                  {result.uniqueRate}%
                </span>
                <span className="ml-2 px-3 py-1 rounded-full text-sm font-bold text-white" style={{ backgroundColor: uniqueInfo.color }}>
                  {uniqueInfo.label}
                </span>
              </div>
            </div>
          </div>

          {/* 8. AI Comment */}
          <div className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 shadow-lg mb-4 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🤖</span>
              <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
                AI 코멘트
              </h3>
            </div>
            <div className="bg-white/70 rounded-2xl p-4 relative">
              <div className="absolute -top-2 left-6 w-4 h-4 bg-white/70 rotate-45" />
              <p className="text-[15px] leading-relaxed text-gray-700 relative z-10">
                {result.aiComment}
              </p>
            </div>
          </div>

          {/* 9. Share */}
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg mb-4 animate-slide-up" style={{ animationDelay: "0.34s" }}>
            <h3 className="text-lg font-bold mb-3 text-center" style={{ fontFamily: "var(--font-display)" }}>
              결과 공유하기 📤
            </h3>
            <button
              onClick={saveResultImage}
              className="quiz-btn w-full py-3 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-white rounded-2xl font-bold text-sm mb-3 transition-all hover:shadow-lg"
            >
              📸 이미지 저장하기
            </button>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={shareToKakao}
                className="quiz-btn flex flex-col items-center gap-1 py-2.5 bg-[#FEE500] hover:bg-[#FDD800] text-gray-900 rounded-2xl font-bold text-[11px] transition-colors"
              >
                <span className="text-xl">💬</span>
                카카오톡
              </button>
              <button
                onClick={shareToInstagram}
                className="quiz-btn flex flex-col items-center gap-1 py-2.5 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white rounded-2xl font-bold text-[11px] transition-colors"
              >
                <span className="text-xl">📷</span>
                인스타
              </button>
              <button
                onClick={shareToX}
                className="quiz-btn flex flex-col items-center gap-1 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-bold text-[11px] transition-colors"
              >
                <span className="text-xl">𝕏</span>
                트위터
              </button>
              <button
                onClick={copyLink}
                className="quiz-btn flex flex-col items-center gap-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-[11px] transition-colors"
              >
                <span className="text-xl">🔗</span>
                링크복사
              </button>
            </div>
          </div>

          <AdBanner />

          {/* 10. Restart + Other Tests */}
          <button
            onClick={handleRestart}
            className="quiz-btn w-full max-w-xs py-4 px-8 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-white text-lg font-bold rounded-2xl shadow-lg shadow-amber-200/50 hover:shadow-xl transition-all duration-300 mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            다시 하기 🔄
          </button>

          <div className="w-full mb-6 animate-slide-up" style={{ animationDelay: "0.38s" }}>
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
                    <p className="text-xs text-amber-500 font-bold">{t.desc}</p>
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
