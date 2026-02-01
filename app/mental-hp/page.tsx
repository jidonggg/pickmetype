import type { Metadata } from "next";
import MentalHPEngine from "../components/MentalHPEngine";

export const metadata: Metadata = {
  title: "나의 멘탈 HP 측정기 | pickmetype",
  description:
    "RPG 게임처럼 내 멘탈 상태를 HP/MP/스탯으로 측정해보세요! 당신의 멘탈, 게임 캐릭터라면?",
  openGraph: {
    title: "나의 멘탈 HP 측정기 ⚔️",
    description: "RPG 스탯으로 보는 내 멘탈 상태!",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "나의 멘탈 HP 측정기 ⚔️",
    description: "RPG 스탯으로 보는 내 멘탈 상태!",
    images: ["/opengraph-image"],
  },
};

export default function MentalHPPage() {
  return <MentalHPEngine />;
}
