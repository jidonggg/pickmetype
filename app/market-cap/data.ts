export interface MarketAnswer {
  text: string;
  value: number; // 억 단위
  tag?: string; // 짧은 태그 (성장주, 우량주 등)
}

export interface MarketQuestion {
  question: string;
  answers: MarketAnswer[];
}

export interface GradeInfo {
  grade: string;
  emoji: string;
  color: string;
  companyName: string;
  opinion: string;
  opinionColor: string;
  analystComment: string;
}

export const STAT_LABELS: Record<
  string,
  { label: string; emoji: string; color: string }
> = {
  growth: { label: "성장성", emoji: "🚀", color: "#22c55e" },
  stability: { label: "안정성", emoji: "🛡️", color: "#3b82f6" },
  profitability: { label: "수익성", emoji: "💰", color: "#eab308" },
  potential: { label: "잠재력", emoji: "✨", color: "#a855f7" },
};

export const RISK_POOL = [
  "카페인 과다 섭취",
  "월요일 실적 급락",
  "야근 시 효율 0%",
  "회의 시 졸음",
  "점심 후 집중력 저하",
  "금요일 조기 퇴근 욕구",
  "연차 소진 욕구",
  "SNS 중독",
  "퇴사 충동",
  "번아웃 위험",
  "월급 전 잔고 부족",
  "야식 유혹",
  "택시비 과다 지출",
  "충동 구매 리스크",
];

export const SECTOR_POOL = [
  "IT서비스",
  "바이오",
  "엔터",
  "금융",
  "제조",
  "유통",
  "건설",
  "식품",
  "교육",
  "헬스케어",
  "게임",
  "미디어",
];

export const THEME_POOL = [
  "MZ세대",
  "워라밸",
  "AI혁신",
  "ESG경영",
  "디지털전환",
  "구독경제",
  "1인가구",
  "자기계발",
  "건강관리",
  "재테크",
  "부업러",
  "N잡러",
];

export function getGradeInfo(totalValue: number): GradeInfo {
  if (totalValue >= 500)
    return {
      grade: "유니콘",
      emoji: "🦄",
      color: "#a855f7",
      companyName: "캐피탈",
      opinion: "즉시 매수",
      opinionColor: "#ef4444",
      analystComment:
        "IPO 대기 중, 공모주 청약 시 경쟁률 1000:1 예상. 이 종목을 놓치면 후회합니다.",
    };
  if (totalValue >= 200)
    return {
      grade: "대형성장주",
      emoji: "🚀",
      color: "#f97316",
      companyName: "그룹",
      opinion: "강력 매수",
      opinionColor: "#ef4444",
      analystComment:
        "업계 선두권 진입, 적극 매수 추천. 실적 성장세가 뚜렷합니다.",
    };
  if (totalValue >= 100)
    return {
      grade: "우량주",
      emoji: "💎",
      color: "#3b82f6",
      companyName: "홀딩스",
      opinion: "매수",
      opinionColor: "#f97316",
      analystComment:
        "안정적 실적, 장기 투자 적합. 꾸준한 배당도 기대할 수 있습니다.",
    };
  if (totalValue >= 50)
    return {
      grade: "성장주",
      emoji: "📈",
      color: "#22c55e",
      companyName: "파트너스",
      opinion: "매수 고려",
      opinionColor: "#22c55e",
      analystComment:
        "성장 잠재력 보유, 분할 매수 권장. 기다리면 빛을 볼 종목입니다.",
    };
  if (totalValue >= 30)
    return {
      grade: "일반주",
      emoji: "📊",
      color: "#6b7280",
      companyName: "상사",
      opinion: "중립",
      opinionColor: "#6b7280",
      analystComment:
        "무난한 실적, 배당이나 기대하세요. 큰 기대는 금물입니다.",
    };
  if (totalValue >= 15)
    return {
      grade: "소형주",
      emoji: "📉",
      color: "#eab308",
      companyName: "공업",
      opinion: "관망",
      opinionColor: "#eab308",
      analystComment:
        "변동성 큼, 단타만 추천. 장기 보유는 리스크가 큽니다.",
    };
  if (totalValue >= 5)
    return {
      grade: "테마주",
      emoji: "⚠️",
      color: "#f97316",
      companyName: "벤처",
      opinion: "주의",
      opinionColor: "#f97316",
      analystComment:
        "뉴스에 민감, 뇌동매매 주의. 소문에 사지 마세요.",
    };
  if (totalValue >= 1)
    return {
      grade: "관리종목",
      emoji: "🔻",
      color: "#ef4444",
      companyName: "산업",
      opinion: "매도",
      opinionColor: "#ef4444",
      analystComment:
        "실적 개선 시급, 구조조정 필요. 턴어라운드를 기다리기엔 리스크가 큽니다.",
    };
  if (totalValue >= 0.5)
    return {
      grade: "상폐위기",
      emoji: "💀",
      color: "#a1a1aa",
      companyName: "...",
      opinion: "손절",
      opinionColor: "#a1a1aa",
      analystComment:
        "생존 자체가 목표, 기적을 바라는 수준. 지금이라도 도망치세요.",
    };
  return {
    grade: "상폐",
    emoji: "🚮",
    color: "#71717a",
    companyName: "(거래정지)",
    opinion: "도망쳐",
    opinionColor: "#71717a",
    analystComment: "거래정지... 추모합니다. 다음 생에서 다시 상장하세요.",
  };
}

export function calcMarketCap(baseValue: number): {
  billions: number;
  millions: number;
  display: string;
} {
  // baseValue는 질문 합산값 (억 단위)
  // 최소 0.1억, 최대 999억
  const clamped = Math.max(0.1, Math.min(999, baseValue));

  if (clamped >= 1) {
    const billions = Math.floor(clamped);
    const millions = Math.floor((clamped - billions) * 10000);
    const millionsDisplay =
      millions > 0
        ? ` ${millions.toLocaleString()}만`
        : "";
    return {
      billions,
      millions,
      display: `${billions}억${millionsDisplay}원`,
    };
  }
  // 1억 미만
  const millions = Math.floor(clamped * 10000);
  return {
    billions: 0,
    millions,
    display: `${millions.toLocaleString()}만원`,
  };
}

export function calcStats(totalValue: number): Record<string, number> {
  // 시가총액에 따라 스탯 분포 결정
  const ratio = Math.min(totalValue / 500, 1); // 0~1
  const base = Math.floor(ratio * 70) + 15; // 15~85 기본
  return {
    growth: Math.min(99, Math.max(5, base + Math.floor(Math.random() * 20 - 10))),
    stability: Math.min(99, Math.max(5, base + Math.floor(Math.random() * 20 - 10))),
    profitability: Math.min(99, Math.max(5, base + Math.floor(Math.random() * 20 - 10))),
    potential: Math.min(99, Math.max(5, base + Math.floor(Math.random() * 20 - 10))),
  };
}

export function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export function calcStatsSeeded(
  totalValue: number,
  seed: number
): Record<string, number> {
  const ratio = Math.min(totalValue / 500, 1);
  const base = Math.floor(ratio * 70) + 15;
  return {
    growth: Math.min(
      99,
      Math.max(5, base + Math.floor(seededRandom(seed + 1) * 20 - 10))
    ),
    stability: Math.min(
      99,
      Math.max(5, base + Math.floor(seededRandom(seed + 2) * 20 - 10))
    ),
    profitability: Math.min(
      99,
      Math.max(5, base + Math.floor(seededRandom(seed + 3) * 20 - 10))
    ),
    potential: Math.min(
      99,
      Math.max(5, base + Math.floor(seededRandom(seed + 4) * 20 - 10))
    ),
  };
}

export const questions: MarketQuestion[] = [
  {
    question: "아침 기상 스타일은?",
    answers: [
      { text: "알람 전에 스스로 기상 ⏰", value: 15, tag: "성장주" },
      { text: "알람에 맞춰 칼기상 😊", value: 5, tag: "안정주" },
      { text: "알람 5번은 미뤄야지 😴", value: -5 },
      { text: "지각은 나의 체질 🏃", value: -15 },
    ],
  },
  {
    question: "업무/공부 스타일은?",
    answers: [
      { text: "미리미리 완벽하게 📋", value: 20, tag: "우량주" },
      { text: "데드라인에 맞춰서 ✅", value: 5 },
      { text: "마감 직전 몰아서 🔥", value: -5, tag: "급등락" },
      { text: "일단 미루고 봄 😶", value: -15, tag: "관리종목" },
    ],
  },
  {
    question: "월급(용돈) 사용 패턴은?",
    answers: [
      { text: "저축/투자 먼저! 📊", value: 10, tag: "재무 AAA" },
      { text: "적당히 아끼는 편 💵", value: 3 },
      { text: "월급 = 0원 공식 💸", value: -8 },
      { text: "마이너스 통장이 본체 🕳️", value: -20 },
    ],
  },
  {
    question: "사회생활 스타일은?",
    answers: [
      { text: "누구와도 잘 지냄 🤝", value: 8, tag: "ESG 우수" },
      { text: "필요한 사람만 만남 🎯", value: 3 },
      { text: "혼자가 편한 편 🏠", value: -3 },
      { text: "사람... 싫어요 🫥", value: -10 },
    ],
  },
  {
    question: "자기계발은?",
    answers: [
      { text: "꾸준히 배우고 투자 중 📚", value: 15, tag: "R&D 투자" },
      { text: "가끔 생각날 때 🤔", value: 5 },
      { text: "넷플릭스가 자기계발 🍿", value: -5 },
      { text: "그게... 뭐죠? 😅", value: -12 },
    ],
  },
  {
    question: "스트레스 관리법은?",
    answers: [
      { text: "운동/취미로 건강하게 해소 💪", value: 10 },
      { text: "잠으로 해결한다 😪", value: 3 },
      { text: "술/폭식으로 푼다 🍺", value: -8 },
      { text: "스트레스가 일상이라... 🫠", value: -15 },
    ],
  },
  {
    question: "건강 관리는?",
    answers: [
      { text: "규칙적 운동 + 식단 관리 🥗", value: 12 },
      { text: "가끔 운동은 함 🚶", value: 5 },
      { text: "배달음식이 주식 🍕", value: -5 },
      { text: "건강? 나중에 생각할게... 💀", value: -10 },
    ],
  },
  {
    question: "5년 후 계획은?",
    answers: [
      { text: "명확한 로드맵이 있다 🗺️", value: 20, tag: "비전 제시" },
      { text: "대충 그려져 있음 🤷", value: 5 },
      { text: "1년 후도 모르겠는데 😶", value: -5 },
      { text: "오늘 살아남기도 벅차... 😵", value: -15 },
    ],
  },
];
