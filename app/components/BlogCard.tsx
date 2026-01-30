import Link from "next/link";

interface BlogCardProps {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  readingTime: string;
}

export default function BlogCard({
  slug,
  title,
  description,
  category,
  publishedAt,
  readingTime,
}: BlogCardProps) {
  return (
    <Link href={`/blog/${slug}`} className="block group">
      <article className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium bg-orange-100 text-orange-600 px-2.5 py-0.5 rounded-full">
            {category}
          </span>
          <span className="text-xs text-gray-400">{readingTime}</span>
        </div>
        <h3 className="font-bold text-gray-800 mb-1.5 group-hover:text-orange-500 transition-colors leading-snug">
          {title}
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
          {description}
        </p>
        <p className="text-xs text-gray-400 mt-3">{publishedAt}</p>
      </article>
    </Link>
  );
}
