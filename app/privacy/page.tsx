import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 | pickmetype",
  description: "pickmetype 개인정보처리방침",
  openGraph: {
    title: "개인정보처리방침 | pickmetype",
    description: "pickmetype 개인정보처리방침",
    images: ["/opengraph-image"],
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-[60dvh] flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 sm:p-8">
          <h1
            className="text-2xl mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            개인정보처리방침
          </h1>

          <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
            <p>
              pickmetype(이하 &quot;서비스&quot;)은 이용자의 개인정보를 중요하게
              생각하며, 관련 법령을 준수합니다. 본 개인정보처리방침은 서비스가
              수집하는 정보와 그 이용 방법에 대해 설명합니다.
            </p>

            <section>
              <h2 className="font-bold text-base text-gray-900 mb-2">
                1. 수집하는 개인정보
              </h2>
              <p className="mb-2">
                본 서비스는 회원가입 없이 이용할 수 있으며, 별도의 개인정보를
                직접 수집하지 않습니다. 다만 다음의 정보가 자동으로 생성되거나
                제3자 서비스를 통해 처리될 수 있습니다:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>
                  방문 기록, 접속 환경 정보 (브라우저 종류, OS, 화면 해상도 등)
                </li>
                <li>서비스 이용 기록 (테스트 참여, 페이지 조회)</li>
                <li>쿠키(Cookie) 정보</li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-base text-gray-900 mb-2">
                2. 쿠키(Cookie) 사용
              </h2>
              <p className="mb-2">
                본 서비스는 다음 목적으로 쿠키를 사용합니다:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>
                  <strong>필수 쿠키:</strong> 서비스의 기본 기능 제공
                </li>
                <li>
                  <strong>분석 쿠키:</strong> 서비스 이용 통계 분석 (Google
                  Analytics 등)
                </li>
                <li>
                  <strong>광고 쿠키:</strong> Google AdSense를 통한 맞춤 광고
                  제공
                </li>
              </ul>
              <p className="mt-2">
                브라우저 설정에서 쿠키를 차단할 수 있으나, 일부 서비스 기능이
                제한될 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-base text-gray-900 mb-2">
                3. Google AdSense
              </h2>
              <p>
                본 서비스는 Google AdSense를 사용하여 광고를 게재합니다. Google은
                쿠키를 사용하여 이용자의 관심사에 기반한 광고를 표시할 수
                있습니다. Google의 광고 관련 개인정보 처리에 대한 자세한 내용은{" "}
                <a
                  href="https://policies.google.com/technologies/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:underline"
                >
                  Google 광고 정책
                </a>
                에서 확인하실 수 있습니다. 맞춤 광고를 원하지 않으시면{" "}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:underline"
                >
                  Google 광고 설정
                </a>
                에서 비활성화할 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-base text-gray-900 mb-2">
                4. Kakao SDK
              </h2>
              <p>
                테스트 결과 공유를 위해 Kakao SDK를 사용합니다. 카카오톡 공유
                기능을 이용할 경우 카카오의 개인정보처리방침이 적용됩니다.
                자세한 내용은{" "}
                <a
                  href="https://www.kakao.com/policy/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:underline"
                >
                  카카오 개인정보처리방침
                </a>
                을 참고하세요.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-base text-gray-900 mb-2">
                5. 개인정보의 보유 및 파기
              </h2>
              <p>
                본 서비스는 별도의 개인정보를 직접 저장하지 않습니다. 쿠키 정보는
                브라우저 설정을 통해 이용자가 직접 삭제할 수 있습니다. 제3자
                서비스(Google, Kakao)가 수집한 정보는 각 서비스의 정책에 따라
                처리됩니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-base text-gray-900 mb-2">
                6. 이용자의 권리
              </h2>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>브라우저 설정에서 쿠키 수집을 거부할 수 있습니다</li>
                <li>Google 맞춤 광고를 비활성화할 수 있습니다</li>
                <li>
                  개인정보 관련 문의는 문의 페이지를 통해 연락하실 수 있습니다
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-base text-gray-900 mb-2">
                7. 방침 변경
              </h2>
              <p>
                본 방침은 법령 변경이나 서비스 변경에 따라 수정될 수 있으며,
                변경 시 본 페이지에 공지합니다.
              </p>
            </section>

            <p className="text-xs text-gray-400 mt-4">
              시행일: 2025년 1월 1일
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
