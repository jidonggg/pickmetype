import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white/60 backdrop-blur-sm border-t border-orange-100 mt-auto">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
          {/* brand */}
          <div>
            <p
              className="text-lg font-bold mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              pick
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-400 bg-clip-text text-transparent">
                me
              </span>
              type
            </p>
            <p className="text-gray-500 text-xs leading-relaxed">
              재미있는 심리 테스트와 유형 퀴즈로
              <br />
              나를 더 알아가는 공간
            </p>
          </div>

          {/* quick links */}
          <div>
            <p className="font-semibold text-gray-700 mb-3">바로가기</p>
            <ul className="space-y-2 text-gray-500">
              <li>
                <Link href="/" className="hover:text-orange-500 transition-colors">
                  테스트 목록
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-orange-500 transition-colors">
                  블로그
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-orange-500 transition-colors">
                  서비스 소개
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-orange-500 transition-colors">
                  문의하기
                </Link>
              </li>
            </ul>
          </div>

          {/* legal */}
          <div>
            <p className="font-semibold text-gray-700 mb-3">법적 고지</p>
            <ul className="space-y-2 text-gray-500">
              <li>
                <Link href="/privacy" className="hover:text-orange-500 transition-colors">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-orange-500 transition-colors">
                  이용약관
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-orange-100 text-center text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} pickmetype. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
