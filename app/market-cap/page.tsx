import type { Metadata } from "next";
import MarketCapEngine from "../components/MarketCapEngine";

export const metadata: Metadata = {
  title: "나의 시가총액 측정기 | pickmetype",
  description:
    "내가 회사라면 시가총액은 얼마일까? AI 애널리스트가 분석하는 나의 기업 가치! 토스증권 스타일 결과를 확인해보세요.",
  openGraph: {
    title: "나의 시가총액 측정기 💰",
    description: "내가 회사라면 시가총액은 얼마일까?",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "나의 시가총액 측정기 💰",
    description: "내가 회사라면 시가총액은 얼마일까?",
    images: ["/opengraph-image"],
  },
};

export default function MarketCapPage() {
  return <MarketCapEngine />;
}
