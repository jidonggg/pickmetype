"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ==================== Types ====================
type CookieType =
  | "original"
  | "cookies_cream"
  | "strawberry"
  | "matcha"
  | "nutella"
  | "lotus"
  | "heugimja"
  | "tiramisu";

type Phase = "intro" | "quiz" | "result";

interface Answer {
  text: string;
  type: CookieType;
}

interface Question {
  question: string;
  answers: Answer[];
}

interface CookieResult {
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

// ==================== Quiz Data ====================
const questions: Question[] = [
  {
    question: "주말에 나는 보통...",
    answers: [
      { text: "새로 뜬 핫플 탐방하기 🗺️", type: "matcha" },
      { text: "친구들이랑 왁자지껄 놀기 🎉", type: "strawberry" },
      { text: "넷플릭스 정주행 + 간식 폭격 🍿", type: "nutella" },
      { text: "조용한 카페에서 나만의 시간 ☕", type: "heugimja" },
    ],
  },
  {
    question: "친구들 사이에서 내 포지션은?",
    answers: [
      { text: "분위기 메이커! 내가 없으면 조용 🎤", type: "strawberry" },
      { text: "묵묵한 해결사, 다들 나한테 물어봄 🛠️", type: "original" },
      { text: "감성 담당, 추천은 나에게 맡겨 🎬", type: "tiramisu" },
      { text: "겉으론 조용한데 단톡방에선 드립왕 😎", type: "cookies_cream" },
    ],
  },
  {
    question: "내가 제일 좋아하는 음료는?",
    answers: [
      { text: "진~한 아메리카노 ☕", type: "heugimja" },
      { text: "달달한 카페라떼 🥛", type: "nutella" },
      { text: "상큼한 과일 스무디 🍹", type: "strawberry" },
      { text: "요즘 핫한 말차 라떼 🍵", type: "matcha" },
    ],
  },
  {
    question: "여행 간다면 내 스타일은?",
    answers: [
      { text: "분 단위 계획표 짜는 완벽주의자 📋", type: "original" },
      { text: "핫플·맛집 위주로 동선 짜기 📍", type: "matcha" },
      { text: "즉흥! 발길 닿는 대로~ 🌊", type: "lotus" },
      { text: "분위기 좋은 곳에서 여유롭게 ✨", type: "tiramisu" },
    ],
  },
  {
    question: "내가 듣고 싶은 칭찬은?",
    answers: [
      { text: '"너 진짜 멋있다" 😏', type: "cookies_cream" },
      { text: '"너 진짜 재밌어ㅋㅋ" 😂', type: "lotus" },
      { text: '"너 센스 뭐야" 🤩', type: "matcha" },
      { text: '"너 있으면 편해" 🤗', type: "nutella" },
    ],
  },
  {
    question: "내 옷장에 가장 많은 건?",
    answers: [
      { text: "올 블랙 컬렉션 🖤", type: "cookies_cream" },
      { text: "파스텔·화사한 컬러들 🌸", type: "strawberry" },
      { text: "베이지·크림 뉴트럴톤 🤎", type: "original" },
      { text: "다양한 컬러, 매일 다른 스타일 🌈", type: "lotus" },
    ],
  },
  {
    question: "스트레스 받으면 나는?",
    answers: [
      { text: "맛있는 거 먹으면서 해소! 🍰", type: "nutella" },
      { text: "쇼핑 or 새로운 거 시도 🛍️", type: "matcha" },
      { text: "혼자 조용히 충전 시간 🔋", type: "heugimja" },
      { text: "친구한테 전화해서 수다 폭발 📱", type: "strawberry" },
    ],
  },
  {
    question: "첫인상 vs 실제 나는?",
    answers: [
      { text: "거의 같음! 솔직한 게 내 매력 😊", type: "original" },
      { text: "차가워 보이지만 알면 따뜻 🧊→🔥", type: "cookies_cream" },
      { text: "조용해 보이지만 친해지면 미친텐션 🔥", type: "lotus" },
      { text: "밝아 보이지만 의외로 생각 깊음 🌙", type: "tiramisu" },
    ],
  },
  {
    question: "SNS에서 나는?",
    answers: [
      { text: "감성 피드 큐레이션 장인 📸", type: "tiramisu" },
      { text: "밈·드립 저장소, 남들 웃기는 게 낙 🤣", type: "lotus" },
      { text: "스토리 폭격기! 일상 공유 좋아 📱", type: "strawberry" },
      { text: "잠수 타다가 가끔 등장하는 미스터리 🕶️", type: "heugimja" },
    ],
  },
  {
    question: "나의 연애 스타일은?",
    answers: [
      { text: "밀당 같은 거 없이 진심으로 💝", type: "original" },
      { text: "츤데레... 좋아하는데 표현 못 함 💜", type: "cookies_cream" },
      { text: "다정다감 애정표현 폭발형 💗", type: "nutella" },
      { text: "분위기로 승부, 은은한 매력 어필 🌹", type: "tiramisu" },
    ],
  },
];

const cookieResults: Record<CookieType, CookieResult> = {
  original: {
    emoji: "🍫",
    name: "오리지널 두쫀쿠",
    color: "#B8860B",
    bgClass: "from-amber-100 via-orange-50 to-yellow-50",
    bgStart: "#FEF3C7",
    bgEnd: "#FEFCE8",
    title: "클래식은 이유가 있는 법 ✨",
    description:
      "피스타치오 크림에 바삭한 카다이프...\n정석이 정석인 이유, 바로 당신 같은 사람이 있기 때문!\n\n유행 타지 않는 변함없는 매력으로\n사람들이 결국 돌고 돌아 찾게 되는\n어디서든 믿고 보는 '인생 원픽' 같은 존재예요.",
    shortDesc: "변함없는 매력의 클래식 인간",
    tags: ["#원조가_원조인_이유", "#믿고보는_인간", "#돌고돌아_나"],
    bestMatch: "🍓 딸기 두쫀쿠",
    funMatch: "🖤 쿠앤크 두쫀쿠",
  },
  cookies_cream: {
    emoji: "🖤",
    name: "쿠앤크 두쫀쿠",
    color: "#2D2B55",
    bgClass: "from-slate-100 via-purple-50 to-indigo-50",
    bgStart: "#F1F5F9",
    bgEnd: "#EEF2FF",
    title: "겉쿨속진, 반전매력 치명적 💜",
    description:
      "겉은 쿨~하고 시크한데\n알고 보면 세상 다정하고 진한 사람!\n\n쉽게 속을 보여주지 않지만\n한번 마음 열면 누구보다 깊고 진해서\n상대를 홀려버리는 치명적인 타입.",
    shortDesc: "겉은 쿨, 속은 진한 반전 인간",
    tags: ["#겉쿨속진", "#반전매력_끝판왕", "#알면빠짐"],
    bestMatch: "🍫 오리지널 두쫀쿠",
    funMatch: "🍓 딸기 두쫀쿠",
  },
  strawberry: {
    emoji: "🍓",
    name: "딸기 두쫀쿠",
    color: "#E91E7B",
    bgClass: "from-pink-100 via-rose-50 to-red-50",
    bgStart: "#FCE7F3",
    bgEnd: "#FEF2F2",
    title: "어딜 가나 분위기 핑크빛 🌸",
    description:
      "당신이 있으면 분위기가 화사해지고\n당신이 없으면 뭔가 허전한,\n그런 사랑스러운 존재!\n\n밝은 에너지로 모두의 기분을\n업시켜주는 인기 만점 분위기 메이커.",
    shortDesc: "분위기를 핑크빛으로 물들이는 인간",
    tags: ["#무드메이커", "#인기쟁이", "#에너지_뿜뿜"],
    bestMatch: "🍫 오리지널 두쫀쿠",
    funMatch: "🍵 말차 두쫀쿠",
  },
  matcha: {
    emoji: "🍵",
    name: "말차 두쫀쿠",
    color: "#2E7D32",
    bgClass: "from-green-100 via-emerald-50 to-teal-50",
    bgStart: "#DCFCE7",
    bgEnd: "#F0FDFA",
    title: "트렌드는 내가 만든다 🌿",
    description:
      "핫플은 내가 먼저 가고\n유행은 내가 먼저 시작하는 사람!\n\n남들과 다른 독특한 취향과\n확실한 자기만의 감성으로\n주변 사람들의 워너비가 되는 힙스터.",
    shortDesc: "취향 확실한 트렌드세터 인간",
    tags: ["#힙스터", "#트렌드세터", "#취향_존중해"],
    bestMatch: "🧁 로투스 두쫀쿠",
    funMatch: "🍠 흑임자 두쫀쿠",
  },
  nutella: {
    emoji: "🥜",
    name: "누텔라 두쫀쿠",
    color: "#6D4C2E",
    bgClass: "from-orange-100 via-amber-50 to-yellow-50",
    bgStart: "#FFEDD5",
    bgEnd: "#FEFCE8",
    title: "한번 빠지면 못 나오는 중독성 🤎",
    description:
      "진하고 달콤한 매력으로\n한번 친해지면 절대 떠날 수 없게 만드는 사람!\n\n따뜻하고 다정한 성격에\n함께 있으면 마음이 포근해지는\n인간 핫초코 같은 존재.",
    shortDesc: "한번 빠지면 헤어나올 수 없는 인간",
    tags: ["#인간_핫초코", "#다정_폭발", "#중독주의보"],
    bestMatch: "🍠 흑임자 두쫀쿠",
    funMatch: "🌰 티라미수 두쫀쿠",
  },
  lotus: {
    emoji: "🧁",
    name: "로투스 두쫀쿠",
    color: "#C2703E",
    bgClass: "from-orange-100 via-yellow-50 to-amber-50",
    bgStart: "#FFEDD5",
    bgEnd: "#FFFBEB",
    title: "호불호 없는 만능 인기인 ⭐",
    description:
      "달콤하면서도 짭짤한 절묘한 매력!\n누구에게나 잘 맞는 팔방미인 타입.\n\n특유의 유머와 개성으로\n어떤 그룹에서든 자연스럽게 어울리며\n모두에게 사랑받는 인싸 중의 인싸!",
    shortDesc: "어디서든 사랑받는 만능 인간",
    tags: ["#팔방미인", "#인싸_중_인싸", "#호불호_제로"],
    bestMatch: "🍵 말차 두쫀쿠",
    funMatch: "🍫 오리지널 두쫀쿠",
  },
  heugimja: {
    emoji: "🍠",
    name: "흑임자 두쫀쿠",
    color: "#4A4A4A",
    bgClass: "from-stone-200 via-gray-100 to-neutral-50",
    bgStart: "#E7E5E4",
    bgEnd: "#FAFAFA",
    title: "알수록 빠져드는 깊은 매력 🌑",
    description:
      "고소하고 묵직한 매력의 소유자!\n처음엔 조용해 보이지만\n알면 알수록 빠져드는 깊이가 있는 사람.\n\n자기만의 세계가 확실하고\n혼자만의 시간을 즐길 줄 아는\n성숙하고 매력적인 어른.",
    shortDesc: "깊은 매력의 성숙한 인간",
    tags: ["#고소한_매력", "#어른의_깊이", "#알수록_빠짐"],
    bestMatch: "🥜 누텔라 두쫀쿠",
    funMatch: "🧁 로투스 두쫀쿠",
  },
  tiramisu: {
    emoji: "🌰",
    name: "티라미수 두쫀쿠",
    color: "#7B5B3A",
    bgClass: "from-amber-100 via-stone-50 to-orange-50",
    bgStart: "#FEF3C7",
    bgEnd: "#FFF7ED",
    title: "은은하게 취하게 만드는 무드 🍷",
    description:
      "고급지고 우아한 분위기를 풍기는 당신!\n과하지 않은 은은한 매력으로\n사람들을 자연스럽게 끌어당기는 타입.\n\n센스 있고 감성적인 성격으로\n함께 있으면 왠지 모르게 설레는\n분위기 장인.",
    shortDesc: "은은한 매력의 분위기 장인",
    tags: ["#분위기_장인", "#고급_감성", "#은은한_치명"],
    bestMatch: "🖤 쿠앤크 두쫀쿠",
    funMatch: "🥜 누텔라 두쫀쿠",
  },
};

const otherTests = [
  { emoji: "🍡", title: "나는 어떤 탕후루?", desc: "COMING SOON" },
  { emoji: "☕", title: "나는 어떤 카페 음료?", desc: "COMING SOON" },
  { emoji: "🍙", title: "나는 어떤 편의점 디저트?", desc: "COMING SOON" },
];

const ALL_TYPES = Object.keys(cookieResults) as CookieType[];

function makeInitialScores(): Record<CookieType, number> {
  const s: Partial<Record<CookieType, number>> = {};
  ALL_TYPES.forEach((k) => (s[k] = 0));
  return s as Record<CookieType, number>;
}

// ==================== Ad Component ====================
function AdBanner({ className }: { className?: string }) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    // DOM에 ins 태그가 렌더된 후 push
    const timer = setTimeout(() => {
      pushed.current = true;
      try {
        (
          (window as unknown as Record<string, unknown[]>).adsbygoogle =
            (window as unknown as Record<string, unknown[]>).adsbygoogle || []
        ).push({});
      } catch {
        /* noop */
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`w-full flex justify-center my-4 ${className ?? ""}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", maxWidth: 400, minHeight: 50 }}
        data-ad-client="ca-pub-7216959245416564"
        data-ad-slot="9023622451"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

// ==================== Floating Emojis ====================
function FloatingEmojis() {
  const emojis = ["🍪", "🍫", "🍓", "🍵", "🥜", "🧁", "🍠", "🌰"];
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

// ==================== Main Page ====================
export default function QuizPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState(makeInitialScores);
  const [result, setResult] = useState<CookieType | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const shareCardRef = useRef<HTMLDivElement>(null);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  /* ---------- handlers ---------- */
  const handleStart = () => {
    setPhase("quiz");
    setCurrentQ(0);
    setScores(makeInitialScores());
    window.scrollTo({ top: 0 });
  };

  const handleAnswer = (type: CookieType) => {
    if (isAnimating) return;
    setIsAnimating(true);

    const next = { ...scores, [type]: scores[type] + 1 };
    setScores(next);

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ((p) => p + 1);
        setIsAnimating(false);
      } else {
        let max = 0;
        let winner: CookieType = "original";
        for (const t of ALL_TYPES) {
          if (next[t] > max) {
            max = next[t];
            winner = t;
          }
        }
        setResult(winner);
        setPhase("result");
        setIsAnimating(false);
        window.scrollTo({ top: 0 });
      }
    }, 350);
  };

  const handleRestart = () => {
    setPhase("intro");
    setCurrentQ(0);
    setResult(null);
    setScores(makeInitialScores());
    window.scrollTo({ top: 0 });
  };

  /* ---------- share helpers ---------- */
  const shareUrl =
    typeof window !== "undefined" ? window.location.href.split("?")[0] : "";

  const getShareText = () => {
    if (!result) return "";
    const r = cookieResults[result];
    return `나의 두쫀쿠 유형은 "${r.name}" ${r.emoji}\n${r.shortDesc}\n\n너도 테스트 해봐! 🍪`;
  };

  const shareToX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      getShareText()
    )}&url=${encodeURIComponent(shareUrl)}`;
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
          title: "나는 어떤 두쫀쿠?",
          text: getShareText(),
          url: shareUrl,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      await copyLink();
    }
  };

  const shareToInstagram = async () => {
    if (!shareCardRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      canvas.toBlob(
        async (blob) => {
          if (!blob) return;
          const file = new File([blob], "my-dujjonku.png", {
            type: "image/png",
          });
          if (
            navigator.share &&
            navigator.canShare?.({ files: [file] })
          ) {
            await navigator.share({
              files: [file],
              title: "나는 어떤 두쫀쿠?",
              text: getShareText(),
            });
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "my-dujjonku.png";
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

  // ========== INTRO ==========
  if (phase === "intro") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center relative px-4">
        <FloatingEmojis />
        <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center">
          <AdBanner />

          <div className="w-full mt-2 mb-6 text-center animate-fade-in">
            <div className="text-7xl mb-5 animate-bounce-slow">🍪</div>

            <h1
              className="text-[2.5rem] leading-tight mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              나는 어떤
              <br />
              <span className="relative inline-block mt-1">
                <span className="relative z-10 bg-gradient-to-r from-amber-600 via-orange-500 to-red-400 bg-clip-text text-transparent">
                  두쫀쿠
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-amber-200/60 -rotate-1 rounded" />
              </span>
              ?
            </h1>

            <p className="text-gray-600 text-[15px] mt-3">
              요즘 핫한 두바이 쫀득 쿠키로
            </p>
            <p className="text-gray-600 text-[15px] mb-5">
              알아보는 내 성격 테스트!
            </p>

            {/* cookie type preview */}
            <div className="flex flex-wrap justify-center gap-1.5 mb-6 px-1">
              {Object.values(cookieResults).map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 bg-white/70 backdrop-blur-sm px-2.5 py-1 rounded-full text-[13px] shadow-sm animate-scale-in"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  {c.emoji} {c.name.replace(" 두쫀쿠", "")}
                </span>
              ))}
            </div>

            {/* info badge */}
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-gray-500 mb-6 shadow-sm">
              <span>📝 10문항</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>⚡ 1분 완성</span>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="quiz-btn w-full max-w-xs py-4 px-8 bg-gradient-to-r from-amber-500 via-orange-500 to-red-400 text-white text-xl font-bold rounded-2xl shadow-lg shadow-orange-200/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 animate-pulse-soft"
            style={{ fontFamily: "var(--font-display)" }}
          >
            테스트 시작하기 🍪
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
        <FloatingEmojis />

        <div className="relative z-10 w-full max-w-md mx-auto px-4 py-5">
          {/* progress */}
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

          {/* question card */}
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
    const r = cookieResults[result];

    return (
      <div
        className={`min-h-[100dvh] bg-gradient-to-b ${r.bgClass} relative`}
      >
        {/* Hidden share card for Instagram image capture */}
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
              background: `linear-gradient(160deg, ${r.bgStart} 0%, ${r.bgEnd} 100%)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 36px",
              position: "relative",
              fontFamily: "var(--font-body)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 24,
                right: 28,
                opacity: 0.12,
                fontSize: 36,
              }}
            >
              🍪
            </div>
            <div
              style={{
                position: "absolute",
                bottom: 24,
                left: 28,
                opacity: 0.12,
                fontSize: 36,
              }}
            >
              🍪
            </div>
            <p
              style={{
                fontSize: 15,
                color: "#999",
                marginBottom: 20,
                letterSpacing: 3,
                fontWeight: 500,
              }}
            >
              나의 두쫀쿠 유형
            </p>
            <div style={{ fontSize: 100, marginBottom: 16, lineHeight: 1 }}>
              {r.emoji}
            </div>
            <h2
              style={{
                fontSize: 34,
                fontWeight: 900,
                color: r.color,
                marginBottom: 8,
                fontFamily: "var(--font-display)",
              }}
            >
              {r.name}
            </h2>
            <p
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: r.color,
                marginBottom: 28,
                textAlign: "center",
              }}
            >
              {r.title}
            </p>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: "#666",
                textAlign: "center",
                marginBottom: 28,
              }}
            >
              {r.shortDesc}
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "center",
              }}
            >
              {r.tags.map((tag, i) => (
                <span
                  key={i}
                  style={{
                    background: r.color,
                    color: "#fff",
                    padding: "6px 16px",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <p
              style={{
                fontSize: 12,
                color: "#bbb",
                position: "absolute",
                bottom: 28,
              }}
            >
              나는 어떤 두쫀쿠? 🍪 테스트 하러가기!
            </p>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto px-4 py-6 flex flex-col items-center">
          {/* header */}
          <div className="w-full text-center animate-fade-in">
            <p className="text-sm text-gray-500 mb-2 font-medium tracking-wide">
              당신의 두쫀쿠 유형은...
            </p>
            <div className="text-8xl my-5 animate-bounce-slow">{r.emoji}</div>
            <h1
              className="text-3xl mb-1.5"
              style={{ fontFamily: "var(--font-display)", color: r.color }}
            >
              {r.name}
            </h1>
            <p
              className="text-xl font-bold mb-5"
              style={{ color: r.color }}
            >
              {r.title}
            </p>
          </div>

          {/* description card */}
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg mb-4 animate-slide-up">
            <p className="text-[15px] leading-relaxed whitespace-pre-line text-gray-700">
              {r.description}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-4">
              {r.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full text-[13px] font-medium text-white"
                  style={{ backgroundColor: r.color }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* compatibility */}
          <div
            className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg mb-4 animate-slide-up"
            style={{ animationDelay: "0.12s" }}
          >
            <h3
              className="text-lg font-bold mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              궁합 보기 💕
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 bg-pink-50 p-3 rounded-xl">
                <span className="text-sm font-bold text-pink-500 whitespace-nowrap">
                  찰떡궁합
                </span>
                <span className="text-[15px]">{r.bestMatch}</span>
              </div>
              <div className="flex items-center gap-3 bg-purple-50 p-3 rounded-xl">
                <span className="text-sm font-bold text-purple-500 whitespace-nowrap">
                  환장조합
                </span>
                <span className="text-[15px]">{r.funMatch}</span>
              </div>
            </div>
          </div>

          {/* share */}
          <div
            className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-lg mb-4 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <h3
              className="text-lg font-bold mb-3 text-center"
              style={{ fontFamily: "var(--font-display)" }}
            >
              친구한테 공유하기 📢
            </h3>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={shareNative}
                className="quiz-btn flex flex-col items-center gap-1.5 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-2xl font-bold text-[12px] transition-colors"
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

          {/* ad */}
          <AdBanner />

          {/* restart */}
          <button
            onClick={handleRestart}
            className="quiz-btn w-full max-w-xs py-4 px-8 bg-gradient-to-r from-amber-500 via-orange-500 to-red-400 text-white text-lg font-bold rounded-2xl shadow-lg shadow-orange-200/50 hover:shadow-xl transition-all duration-300 mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            다시 하기 🔄
          </button>

          {/* other tests */}
          <div
            className="w-full mb-6 animate-slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            <h3
              className="text-xl font-bold text-center mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              다른 테스트도 해볼래? 🧪
            </h3>
            <div className="space-y-2.5">
              {otherTests.map((t, i) => (
                <div
                  key={i}
                  className="w-full flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm"
                >
                  <span className="text-3xl">{t.emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-[15px]">
                      {t.title}
                    </p>
                    <p className="text-xs text-orange-500 font-bold">
                      {t.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center mb-4 pb-safe">
            이 테스트는 재미로 만들어졌으며 과학적 근거는 없습니다 :)
          </p>
        </div>

        {/* toast */}
        {showToast && <div className="toast">{toastMsg}</div>}
      </div>
    );
  }

  return null;
}
