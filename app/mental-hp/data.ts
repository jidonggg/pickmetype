export interface StatModifier {
  hp?: number;
  mp?: number;
  grit?: number;
  reason?: number;
  emotion?: number;
  fatigue?: number;
  money?: number;
}

export interface MentalAnswer {
  text: string;
  stats: StatModifier;
  buff?: string;
  debuff?: string;
}

export interface MentalQuestion {
  question: string;
  answers: MentalAnswer[];
}

export interface GradeInfo {
  grade: string;
  emoji: string;
  color: string;
  title: string;
  status: string;
  statusDetail: string;
}

export const STAT_META: Record<
  string,
  { label: string; emoji: string; color: string }
> = {
  grit: { label: "근성", emoji: "💪", color: "#f97316" },
  reason: { label: "이성", emoji: "🧠", color: "#06b6d4" },
  emotion: { label: "감성", emoji: "❤️", color: "#ec4899" },
  fatigue: { label: "피로도", emoji: "😴", color: "#a855f7" },
  money: { label: "금전운", emoji: "💰", color: "#eab308" },
};

export const BASE_STATS: Record<string, number> = {
  hp: 60,
  mp: 55,
  grit: 50,
  reason: 50,
  emotion: 50,
  fatigue: 35,
  money: 50,
};

export const JOB_POOL = [
  "사축",
  "노예",
  "월급루팡",
  "존버러",
  "출근좀비",
  "야근마스터",
  "워라밸러",
  "인간화석",
  "희망퇴직러",
  "취준생",
  "백수지망생",
];

export const BUFF_POOL = [
  "주말 충전",
  "커피 도핑",
  "월급 입금",
  "퇴근 10분 전",
  "금요일 버프",
  "점심 맛집",
  "연차 승인",
  "재택 버프",
  "칭찬 버프",
];

export const DEBUFF_POOL = [
  "만성피로",
  "수면 부족",
  "잔고 부족",
  "월요병",
  "야근 지옥",
  "점심 선택장애",
  "회의 졸음",
  "SNS 중독",
  "번아웃",
  "현타",
];

export const RECOVERY_POOL = [
  "퇴근",
  "치킨",
  "여행",
  "연차",
  "이직",
  "로또",
  "쇼핑",
  "운동",
  "수면",
  "알콜(임시)",
  "고양이",
  "강아지",
];

export function getGradeInfo(hp: number): GradeInfo {
  if (hp >= 90)
    return {
      grade: "SSS",
      emoji: "💚",
      color: "#4ade80",
      title: "멘탈 불사신",
      status: "세상 무서울 게 없다",
      statusDetail: "풀피 + 버프 3개! 지금 무적 상태입니다",
    };
  if (hp >= 80)
    return {
      grade: "SS",
      emoji: "💚",
      color: "#22c55e",
      title: "강철 멘탈",
      status: "왠만해선 안 흔들림",
      statusDetail: "HP 거의 풀! 약간의 데미지는 버틸 수 있어요",
    };
  if (hp >= 70)
    return {
      grade: "S",
      emoji: "💛",
      color: "#facc15",
      title: "멘탈 양호",
      status: "아직 괜찮아요",
      statusDetail: "아직 여유 있어요. 유지만 잘하면 됩니다",
    };
  if (hp >= 60)
    return {
      grade: "A",
      emoji: "💛",
      color: "#eab308",
      title: "버티는 중",
      status: "하루하루 버팀",
      statusDetail: "조금씩 깎이는 중... 관리가 필요해요",
    };
  if (hp >= 50)
    return {
      grade: "B",
      emoji: "🧡",
      color: "#fb923c",
      title: "충전 필요",
      status: "쉬어야 할 때",
      statusDetail: "절반 왔다... 충전 좀 하세요",
    };
  if (hp >= 40)
    return {
      grade: "C",
      emoji: "🧡",
      color: "#f97316",
      title: "위험 신호",
      status: "긴급 휴식 권장",
      statusDetail: "위험해요! 보스 만나면 끝입니다",
    };
  if (hp >= 30)
    return {
      grade: "D",
      emoji: "❤️",
      color: "#f87171",
      title: "간당간당",
      status: "쓰러지기 직전",
      statusDetail: "HP가 빨간색이에요... 물약 필요",
    };
  if (hp >= 20)
    return {
      grade: "E",
      emoji: "❤️",
      color: "#ef4444",
      title: "HP 1 상태",
      status: "기적적으로 버티는 중",
      statusDetail: "HP 1로 버티는 중... 기적이에요",
    };
  if (hp >= 10)
    return {
      grade: "F",
      emoji: "🖤",
      color: "#a1a1aa",
      title: "전투 불능",
      status: "누워있는 게 일",
      statusDetail: "쓰러져있는 상태... 부활 대기",
    };
  return {
    grade: "X",
    emoji: "🖤",
    color: "#71717a",
    title: "리스폰 대기",
    status: "이미 쓰러짐...",
    statusDetail: "Game Over... 리스폰 중",
  };
}

export const questions: MentalQuestion[] = [
  {
    question: "월요일 아침, 알람 소리를 들으면?",
    answers: [
      {
        text: "바로 일어남 ⏰",
        stats: { hp: 15, mp: 10, grit: 15, fatigue: -10 },
      },
      {
        text: "5분만... 😴",
        stats: { hp: -5, emotion: 5, fatigue: 10 },
      },
      {
        text: "10번 미룸 😵",
        stats: { hp: -15, fatigue: 20, grit: -10 },
      },
      {
        text: "알람 전에 깸 👁️",
        stats: { reason: 10, fatigue: 25 },
        debuff: "불면증",
      },
    ],
  },
  {
    question: "카톡 읽씹 당하면?",
    answers: [
      {
        text: "뭐 바쁘겠지~ 😌",
        stats: { hp: 10, mp: 5, reason: 15 },
      },
      {
        text: "왜...? 뭐 잘못했나 😰",
        stats: { hp: -10, emotion: 20, reason: -5 },
      },
      {
        text: "읽씹은 일상 🫥",
        stats: { grit: 10 },
        buff: "무감각 버프",
      },
      {
        text: "바로 전화함 📞",
        stats: { hp: 5, grit: 15, emotion: 5 },
      },
    ],
  },
  {
    question: "통장 잔고를 확인할 때?",
    answers: [
      {
        text: "매일 확인함 📊",
        stats: { hp: 5, mp: 10, reason: 15, money: 15 },
      },
      {
        text: "무서워서 안 봄 🙈",
        stats: { hp: -15, emotion: 10, money: -15 },
      },
      {
        text: "마이너스임 💸",
        stats: { hp: -25, mp: -10, money: -30, grit: 5 },
      },
      {
        text: "월급날만 봄 💰",
        stats: { reason: 5 },
      },
    ],
  },
  {
    question: '갑자기 팀장/교수님이\n"잠깐 얘기 좀" 하면?',
    answers: [
      {
        text: "심장 쿵쾅 💓",
        stats: { hp: -20, emotion: 15, fatigue: 10 },
      },
      {
        text: "아 뭐 또 😑",
        stats: { grit: 15 },
        buff: "무감각 버프",
      },
      {
        text: "칭찬이겠지^^ 😊",
        stats: { hp: 10, mp: 15, emotion: 5 },
        buff: "긍정의 힘",
      },
      {
        text: "퇴사/자퇴 각? 🚪",
        stats: { hp: -30, mp: -15, fatigue: 20, grit: -10 },
      },
    ],
  },
  {
    question: "밤에 잠들기 전 생각은?",
    answers: [
      {
        text: "오늘도 수고했다 🌙",
        stats: { hp: 15, mp: 15, emotion: 10 },
      },
      {
        text: "내일 할 일... 📝",
        stats: { hp: -10, reason: 10, fatigue: 15 },
      },
      {
        text: "5년 전 흑역사 소환 😱",
        stats: { hp: -25, mp: -10, emotion: 15, fatigue: 20 },
        debuff: "흑역사 회귀",
      },
      {
        text: "바로 잠듦 😪",
        stats: { hp: 20, mp: 10, fatigue: -15 },
      },
    ],
  },
  {
    question: "주말에 뭐 해?",
    answers: [
      {
        text: "밖에서 활동! 🏃",
        stats: { hp: 15, mp: 10, grit: 10, fatigue: -10 },
      },
      {
        text: "집에서 쉼 🏠",
        stats: { hp: 10, mp: 5, fatigue: -5, emotion: 5 },
      },
      {
        text: "밀린 일 처리 📚",
        stats: { hp: -10, reason: 10, fatigue: 10 },
      },
      {
        text: "주말도 일함 💻",
        stats: { hp: -20, fatigue: 20, grit: 5, mp: -10 },
        debuff: "워커홀릭",
      },
    ],
  },
  {
    question: "요즘 가장 큰 고민은?",
    answers: [
      {
        text: "없음! 행복함 😊",
        stats: { hp: 20, mp: 15, emotion: 10 },
      },
      {
        text: "돈... 💸",
        stats: { hp: -10, money: -15, reason: 5 },
      },
      {
        text: "미래가 불안 🔮",
        stats: { hp: -15, emotion: 10, reason: 5, fatigue: 10 },
      },
      {
        text: "전부 다 😭",
        stats: { hp: -25, mp: -10, fatigue: 15, emotion: 5 },
      },
    ],
  },
  {
    question: "지금 이 테스트 하는 이유?",
    answers: [
      {
        text: "심심해서 🎮",
        stats: { hp: 5, mp: 5 },
      },
      {
        text: "멘탈 상태 궁금 🔍",
        stats: { reason: 10 },
      },
      {
        text: "공유 타고 옴 📱",
        stats: { hp: 5, emotion: 5 },
      },
      {
        text: "현실도피 중 🏃",
        stats: { hp: -15, mp: -10, fatigue: 10, emotion: 10 },
        debuff: "현실도피",
      },
    ],
  },
];
