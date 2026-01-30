"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100">
      <div className="max-w-2xl mx-auto h-14 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-1">
          <span
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            pick
            <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-400 bg-clip-text text-transparent">
              me
            </span>
            type
          </span>
        </Link>

        {/* desktop nav */}
        <nav className="hidden sm:flex items-center gap-5 text-sm font-medium text-gray-600">
          <Link href="/" className="hover:text-orange-500 transition-colors">
            테스트
          </Link>
          <Link
            href="/blog"
            className="hover:text-orange-500 transition-colors"
          >
            블로그
          </Link>
          <Link
            href="/about"
            className="hover:text-orange-500 transition-colors"
          >
            소개
          </Link>
        </nav>

        {/* mobile hamburger */}
        <button
          className="sm:hidden p-2 text-gray-600"
          onClick={() => setOpen(!open)}
          aria-label="메뉴 열기"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {open ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* mobile menu */}
      {open && (
        <nav className="sm:hidden bg-white/95 backdrop-blur-md border-b border-orange-100 px-4 pb-4 space-y-3 text-sm font-medium text-gray-600">
          <Link
            href="/"
            className="block py-1 hover:text-orange-500"
            onClick={() => setOpen(false)}
          >
            테스트
          </Link>
          <Link
            href="/blog"
            className="block py-1 hover:text-orange-500"
            onClick={() => setOpen(false)}
          >
            블로그
          </Link>
          <Link
            href="/about"
            className="block py-1 hover:text-orange-500"
            onClick={() => setOpen(false)}
          >
            소개
          </Link>
        </nav>
      )}
    </header>
  );
}
