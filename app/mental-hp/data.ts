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

export const STAT_META: Record<
  string,
  { label: string; emoji: string; color: string; bgColor: string }
> = {
  grit: { label: "근성", emoji: "💪", color: "#f97316", bgColor: "#431407" },
  reason: { label: "이성", emoji: "🧠", color: "#06b6d4", bgColor: "#083344" },
  emotion: {
    label: "감성",
    emoji: "❤️",
    color: "#ec4899",
    bgColor: "#500724",
  },
  fatigue: {
    label: "피로도",
    emoji: "😴",
    color: "#a855f7",
    bgColor: "#3b0764",
  },
  money: { label: "금전운", emoji: "💰", color: "#eab308", bgColor: "#422006" },
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

export const questions: MentalQuestion[] = [
  {
    question: "월요일 아침, 알람 소리를 들으면?",
    answers: [
      {
        text: "바로 일어남 ⏰",
        stats: { hp: 20, mp: 10, grit: 15, reason: 10, fatigue: -10 },
      },
      {
        text: "5분만... 10분만... 😴",
        stats: { hp: -10, emotion: 5, fatigue: 15 },
      },
      {
        text: "알람을 끄고 다시 잠 💤",
        stats: { hp: -20, fatigue: 20, grit: -10 },
      },
      {
        text: "이미 알람 전에 깨어있음 👁️",
        stats: { hp: -5, reason: 10, fatigue: 25 },
        debuff: "불면증",
      },
    ],
  },
  {
    question: "카톡 읽씹 당했을 때?",
    answers: [
      {
        text: "뭐 바쁘겠지~ 😌",
        stats: { hp: 10, mp: 5, reason: 15, grit: 5 },
      },
      {
        text: "왜...? 내가 뭐 잘못했나 😰",
        stats: { hp: -15, emotion: 20, reason: -5 },
      },
      {
        text: "읽씹은 일상 🫥",
        stats: { grit: 10 },
        buff: "무감각 버프",
      },
      {
        text: "바로 전화함 📞",
        stats: { hp: 5, grit: 20, emotion: 5 },
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
        stats: { hp: -20, emotion: 10, money: -20 },
      },
      {
        text: "잔고? 마이너스인데? 💸",
        stats: { hp: -30, mp: -10, money: -30, grit: 10 },
      },
      {
        text: "월급 들어올 때만 봄 💰",
        stats: { reason: 5 },
      },
    ],
  },
  {
    question: '갑자기 팀장/교수님이\n"잠깐 얘기 좀" 하면?',
    answers: [
      {
        text: "뭔데... 심장 쿵쾅 💓",
        stats: { hp: -25, emotion: 15, fatigue: 10 },
      },
      {
        text: "아 뭐 또? 😑",
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
        stats: { hp: -40, mp: -15, fatigue: 20, grit: -15 },
      },
    ],
  },
  {
    question: "밤에 잠들기 전 생각은?",
    answers: [
      {
        text: "오늘 하루도 수고했다 🌙",
        stats: { hp: 15, mp: 15, emotion: 10 },
      },
      {
        text: "내일 할 일... 📝",
        stats: { hp: -10, reason: 10, fatigue: 15 },
      },
      {
        text: "5년 전 흑역사 소환 😱",
        stats: { hp: -30, mp: -10, emotion: 15, fatigue: 20 },
        debuff: "흑역사 회귀",
      },
      {
        text: "생각 없이 바로 잠듦 😪",
        stats: { hp: 20, mp: 10, fatigue: -15 },
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
        text: "누가 공유해서 📱",
        stats: { hp: 5, emotion: 5 },
      },
      {
        text: "현실도피 중 🏃",
        stats: { hp: -20, mp: -10, fatigue: 15, emotion: 10 },
        debuff: "현실도피",
      },
    ],
  },
];
