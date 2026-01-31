import type { Metadata } from "next";
import Link from "next/link";
import ReportForm from "../components/ReportForm";

export const metadata: Metadata = {
  title: "문의하기 | pickmetype",
  description: "pickmetype 오류 제보, 문의 및 자주 묻는 질문",
  openGraph: {
    title: "문의하기 | pickmetype",
    description: "pickmetype 오류 제보, 문의 및 자주 묻는 질문",
  },
};

const faqs = [
  {
    q: "테스트 결과가 정확한가요?",
    a: "pickmetype의 테스트는 심리학 이론을 참고하여 제작되었지만, 전문적인 심리 진단 도구가 아닌 오락 목적의 콘텐츠입니다. 재미로 즐겨주세요!",
  },
  {
    q: "테스트 결과를 저장할 수 있나요?",
    a: "결과 화면에서 이미지를 저장하거나 카카오톡, X(트위터) 등으로 공유할 수 있습니다. 별도의 회원가입이나 로그인은 필요하지 않습니다.",
  },
  {
    q: "개인정보가 수집되나요?",
    a: "별도의 개인정보를 직접 수집하지 않습니다. 광고 서비스(Google AdSense)를 통한 쿠키 수집에 대한 자세한 내용은 개인정보처리방침을 참고해 주세요.",
  },
  {
    q: "광고가 표시되는 이유는?",
    a: "pickmetype은 무료 서비스이며, 서비스 운영 및 콘텐츠 제작을 위해 Google AdSense 광고를 게재하고 있습니다.",
  },
  {
    q: "새로운 테스트는 언제 나오나요?",
    a: "정기적으로 새로운 테스트를 기획하고 있습니다. 블로그와 SNS를 통해 새 콘텐츠 소식을 확인하실 수 있습니다.",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-[60dvh] flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-lg mx-auto space-y-6">
        {/* Report Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 sm:p-8">
          <h1
            className="text-2xl mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            오류 제보 / 문의
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            오류, 오탈자, 개선 제안 등 무엇이든 알려주세요!
          </p>

          <ReportForm />
        </div>

        {/* Direct Email */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 sm:p-8">
          <h2
            className="text-xl mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            이메일 직접 문의
          </h2>
          <div className="bg-orange-50 rounded-xl p-4">
            <p className="font-semibold text-gray-800 mb-1">이메일</p>
            <a
              href="mailto:pickmetype@gmail.com"
              className="text-orange-500 hover:underline font-medium"
            >
              pickmetype@gmail.com
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 sm:p-8">
          <h2
            className="text-xl mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            자주 묻는 질문
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <p className="font-semibold text-sm text-gray-800 mb-1.5">
                  Q. {faq.q}
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* links */}
        <div className="text-center text-sm text-gray-500 space-x-4">
          <Link href="/privacy" className="hover:text-orange-500">
            개인정보처리방침
          </Link>
          <Link href="/terms" className="hover:text-orange-500">
            이용약관
          </Link>
        </div>
      </div>
    </div>
  );
}
