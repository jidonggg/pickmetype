import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "../data";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: `${post.title} | pickmetype 블로그`,
    description: post.description,
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: post.tags,
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <div className="min-h-[60dvh] flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-lg mx-auto">
        <article className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 sm:p-8">
          {/* meta */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-medium bg-orange-100 text-orange-600 px-2.5 py-0.5 rounded-full">
              {post.category}
            </span>
            <span className="text-xs text-gray-400">{post.readingTime}</span>
            <span className="text-xs text-gray-400">{post.publishedAt}</span>
          </div>

          <h1
            className="text-2xl mb-2 leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {post.title}
          </h1>
          <p className="text-sm text-gray-500 mb-6">{post.description}</p>

          {/* body */}
          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* tags */}
          <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-100">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* author */}
          <p className="text-xs text-gray-400 mt-4">
            작성자: {post.author}
          </p>
        </article>

        {/* navigation */}
        <div className="flex justify-between mt-6 text-sm">
          <Link
            href="/blog"
            className="text-orange-500 hover:underline font-medium"
          >
            ← 블로그 목록
          </Link>
          <Link href="/" className="text-gray-500 hover:text-orange-500">
            테스트 하러가기
          </Link>
        </div>
      </div>
    </div>
  );
}
