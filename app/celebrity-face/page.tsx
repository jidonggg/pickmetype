import type { Metadata } from "next";
import CelebrityFaceEngine from "../components/CelebrityFaceEngine";

export const metadata: Metadata = {
  title: "AI 닮은 연예인 찾기 | pickmetype",
  description:
    "AI가 분석하는 나의 닮은 연예인! 사진 한 장이면 60+명의 한국 연예인 중 나와 가장 닮은 연예인을 찾아드려요.",
  openGraph: {
    title: "AI 닮은 연예인 찾기 ⭐",
    description: "AI가 분석하는 나의 닮은 연예인!",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI 닮은 연예인 찾기 ⭐",
    description: "AI가 분석하는 나의 닮은 연예인!",
    images: ["/opengraph-image"],
  },
};

export default function CelebrityFacePage() {
  return <CelebrityFaceEngine />;
}
