import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "소개 | pickmetype",
  description:
    "pickmetype은 심리학 기반 성격 테스트와 유형 퀴즈를 제공하는 서비스입니다.",
  openGraph: {
    title: "소개 | pickmetype",
    description: "심리학 기반 성격 테스트와 유형 퀴즈 서비스",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-[60dvh] flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 sm:p-8">
          <h1
            className="text-2xl mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            pickmetype 소개
          </h1>

          <section className="space-y-6 text-sm text-gray-700 leading-relaxed">
            <div>
              <h2 className="font-bold text-base text-gray-900 mb-2">
                서비스 소개
              </h2>
              <p>
                <strong>pickmetype</strong>은 재미있고 공감 가는 심리 테스트와
                유형 퀴즈를 통해 자신을 더 깊이 이해할 수 있도록 돕는 웹
                서비스입니다. 일상 속 질문들을 통해 나만의 유형을 발견하고, 친구,
                연인, 가족과 결과를 공유하며 즐거운 대화를 나눌 수 있습니다.
              </p>
            </div>

            <div>
              <h2 className="font-bold text-base text-gray-900 mb-2">
                우리의 철학
              </h2>
              <p>
                모든 콘텐츠는 심리학적 이론과 최신 트렌드를 바탕으로 기획됩니다.
                바넘 효과, 성격 유형론, 색채 심리학 등 검증된 심리학 개념을
                재미있는 퀴즈 형식으로 풀어내어, 단순한 오락을 넘어 자기 탐색의
                기회를 제공합니다. 정확한 진단 도구가 아닌 &quot;즐기면서
                생각하는&quot; 콘텐츠를 지향합니다.
              </p>
            </div>

            <div>
              <h2 className="font-bold text-base text-gray-900 mb-2">
                콘텐츠 제작 원칙
              </h2>
              <ul className="list-disc list-inside space-y-1.5 text-gray-600">
                <li>
                  <strong>전문성(Expertise):</strong> 심리학 이론과 연구를 참고한
                  콘텐츠 기획
                </li>
                <li>
                  <strong>경험(Experience):</strong> 수천 명의 사용자 피드백 반영
                </li>
                <li>
                  <strong>권위(Authoritativeness):</strong> 신뢰할 수 있는 출처와
                  근거 기반
                </li>
                <li>
                  <strong>신뢰(Trustworthiness):</strong> 개인정보 보호, 투명한
                  운영
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-bold text-base text-gray-900 mb-2">
                제공 콘텐츠
              </h2>
              <ul className="list-disc list-inside space-y-1.5 text-gray-600">
                <li>성격 유형 테스트 (두바이 쿠키, 멘탈 HP 등)</li>
                <li>심리학 기반 블로그 글</li>
                <li>MBTI 관련 콘텐츠</li>
                <li>트렌드 분석 및 문화 콘텐츠</li>
              </ul>
            </div>

            <div>
              <h2 className="font-bold text-base text-gray-900 mb-2">
                운영 정보
              </h2>
              <ul className="text-gray-600 space-y-1">
                <li>
                  <strong>서비스명:</strong> pickmetype
                </li>
                <li>
                  <strong>운영:</strong> pickmetype 팀
                </li>
                <li>
                  <strong>문의:</strong>{" "}
                  <Link
                    href="/contact"
                    className="text-orange-500 hover:underline"
                  >
                    문의 페이지
                  </Link>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
