import type { Metadata } from "next";
import AnimalFaceEngine from "../components/AnimalFaceEngine";

export const metadata: Metadata = {
  title: "AI 동물상 테스트 | pickmetype",
  description:
    "AI가 분석하는 나의 동물상! 사진 한 장이면 강아지, 고양이, 여우, 곰, 토끼... 나는 어떤 동물상일까?",
  openGraph: {
    title: "AI 동물상 테스트 🐾",
    description: "AI가 분석하는 나의 동물상!",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI 동물상 테스트 🐾",
    description: "AI가 분석하는 나의 동물상!",
    images: ["/opengraph-image"],
  },
};

export default function AnimalFacePage() {
  return <AnimalFaceEngine />;
}
