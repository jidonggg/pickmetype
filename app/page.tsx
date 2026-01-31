import Link from "next/link";
import type { Metadata } from "next";
import { blogPosts } from "./blog/data";
import BlogCard from "./components/BlogCard";

export const metadata: Metadata = {
  title: "pickmetype | 나의 유형 찾기",
  description: "재미있는 성격 테스트 모음! 나의 유형을 찾아보세요.",
  openGraph: {
    title: "pickmetype | 나의 유형 찾기",
    description: "재미있는 성격 테스트 모음! 나의 유형을 찾아보세요.",
  },
};

const tests = [
  {
    id: "animal-face",
    emoji: "🐾",
    title: "AI 동물상 테스트",
    subtitle: "사진 한 장으로 내 동물상 찾기!",
    available: true,
    gradient: "from-violet-500 via-purple-500 to-indigo-500",
  },
  {
    id: "dubai-cookie",
    emoji: "🍪",
    title: "나는 어떤 두쫀쿠?",
    subtitle: "리뉴얼 준비 중",
    available: false,
    gradient: "from-amber-500 via-orange-500 to-red-400",
  },
  {
    id: "mental-hp",
    emoji: "⚔️",
    title: "나의 멘탈 HP 측정기",
    subtitle: "RPG 스탯으로 보는 내 멘탈 상태",
    available: true,
    gradient: "from-emerald-500 via-green-500 to-teal-500",
  },
  {
    id: "love-value",
    emoji: "💕",
    title: "나의 연애 시장가 측정기",
    subtitle: "COMING SOON",
    available: false,
    gradient: "from-pink-400 via-rose-400 to-red-400",
  },
  {
    id: "market-cap",
    emoji: "💰",
    title: "나의 시가총액 측정기",
    subtitle: "내가 회사라면 시가총액은?",
    available: true,
    gradient: "from-green-500 via-emerald-500 to-teal-500",
  },
];

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md mx-auto">
        {/* brand */}
        <div className="text-center mb-10 animate-fade-in">
          <h1
            className="text-4xl mb-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            pick
            <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-400 bg-clip-text text-transparent">
              me
            </span>
            type
          </h1>
          <p className="text-gray-500 text-sm">나의 유형 찾기</p>
        </div>

        {/* test cards */}
        <div className="space-y-4">
          {tests.map((test) =>
            test.available ? (
              <Link key={test.id} href={`/${test.id}`} className="block">
                <div
                  className={`quiz-btn bg-gradient-to-r ${test.gradient} p-6 rounded-2xl shadow-lg text-white hover:shadow-xl hover:-translate-y-0.5 transition-all`}
                >
                  <span className="text-5xl block mb-3">{test.emoji}</span>
                  <h2
                    className="text-xl font-bold"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {test.title}
                  </h2>
                  <p className="text-white/80 text-sm mt-1">{test.subtitle}</p>
                  <div className="mt-3 inline-block bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium">
                    테스트 하러가기 →
                  </div>
                </div>
              </Link>
            ) : (
              <div
                key={test.id}
                className="bg-white/50 p-6 rounded-2xl shadow-sm"
              >
                <span className="text-5xl block mb-3 grayscale opacity-50">
                  {test.emoji}
                </span>
                <h2
                  className="text-xl font-bold text-gray-400"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {test.title}
                </h2>
                <p className="text-gray-400 text-sm mt-1">{test.subtitle}</p>
              </div>
            )
          )}
        </div>

        {/* blog preview */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-lg"
              style={{ fontFamily: "var(--font-display)" }}
            >
              최신 블로그
            </h2>
            <Link
              href="/blog"
              className="text-sm text-orange-500 hover:underline font-medium"
            >
              전체보기 →
            </Link>
          </div>
          <div className="space-y-3">
            {blogPosts.slice(0, 3).map((post) => (
              <BlogCard
                key={post.slug}
                slug={post.slug}
                title={post.title}
                description={post.description}
                category={post.category}
                publishedAt={post.publishedAt}
                readingTime={post.readingTime}
              />
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-8">
          pickmetype.vercel.app
        </p>
      </div>
    </div>
  );
}
