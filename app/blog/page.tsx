import type { Metadata } from "next";
import { blogPosts } from "./data";
import BlogCard from "../components/BlogCard";

export const metadata: Metadata = {
  title: "블로그 | pickmetype",
  description:
    "심리 테스트, MBTI, 자기이해에 관한 유익한 글을 만나보세요.",
  openGraph: {
    title: "블로그 | pickmetype",
    description: "심리 테스트, MBTI, 자기이해에 관한 유익한 글",
  },
};

export default function BlogListPage() {
  const sorted = [...blogPosts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <div className="min-h-[60dvh] flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1
            className="text-2xl mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            블로그
          </h1>
          <p className="text-sm text-gray-500">
            심리학, MBTI, 트렌드에 관한 이야기
          </p>
        </div>

        <div className="space-y-4">
          {sorted.map((post) => (
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
    </div>
  );
}
