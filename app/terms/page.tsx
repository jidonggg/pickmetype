import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 | pickmetype",
  description: "pickmetype 이용약관",
  openGraph: {
    title: "이용약관 | pickmetype",
    description: "pickmetype 이용약관",
    images: ["/opengraph-image"],
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-[60dvh] flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 sm:p-8">
          <h1
            className="text-2xl mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            이용약관
          </h1>

          <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
            <section>
              <h2 className="font-bold text-base text-gray-900 mb-2">
                제1조 (목적)
              </h2>
              <p>
                본 약관은 pickmetype(이하 &quot;서비스&quot;)이 제공하는 온라인
                심리 테스트 및 콘텐츠 서비스의 이용 조건과 절차, 서비스 제공자와
                이용자 간의 권리·의무 사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-base text-gray-900 mb-2">
                제2조 (서비스의 내용)
              </h2>
              <p className="mb-2">서비스는 다음을 제공합니다:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>심리 테스트 및 유형 퀴즈</li>
                <li>테스트 결과 확인 및 공유</li>
                <li>심리학 관련 블로그 콘텐츠</li>
                <li>기타 부가 서비스</li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-base text-gray-900 mb-2">
                제3조 (이용 조건)
              </h2>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>
                  서비스는 회원가입 없이 누구나 무료로 이용할 수 있습니다.
                </li>
                <li>
                  서비스 이용 시 본 약관에 동의한 것으로 간주합니다.
                </li>
                <li>
                  만 14세 미만의 아동은 법정 대리인의 동의하에 서비스를 이용할 수
                  있습니다.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-base text-gray-900 mb-2">
                제4조 (콘텐츠의 성격)
              </h2>
              <p>
                본 서비스에서 제공하는 테스트 결과는 오락 목적으로 제작되었으며,
                전문적인 심리 상담이나 의학적 진단을 대체하지 않습니다. 테스트
                결과를 근거로 중요한 결정을 내리지 마시고, 전문가의 도움이
                필요한 경우 해당 전문가에게 상담을 받으시기 바랍니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-base text-gray-900 mb-2">
                제5조 (지적재산권)
              </h2>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>
                  서비스 내 모든 콘텐츠(테스트, 이미지, 텍스트 등)의
                  지적재산권은 서비스 운영자에게 있습니다.
                </li>
                <li>
                  이용자는 테스트 결과를 개인 SNS에 공유할 수 있으나, 상업적
                  목적으로 무단 복제·배포할 수 없습니다.
                </li>
                <li>
                  블로그 콘텐츠를 인용할 경우, 출처를 명시해야 합니다.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-base text-gray-900 mb-2">
                제6조 (광고)
              </h2>
              <p>
                서비스는 Google AdSense 등 제3자 광고 서비스를 통해 광고를
                게재합니다. 광고 수익은 서비스의 무료 운영 및 콘텐츠 제작에
                사용됩니다.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-base text-gray-900 mb-2">
                제7조 (이용자의 의무)
              </h2>
              <p>이용자는 다음 행위를 해서는 안 됩니다:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 mt-1">
                <li>서비스의 안정적 운영을 방해하는 행위</li>
                <li>타인의 권리를 침해하는 행위</li>
                <li>서비스를 이용한 영리 목적의 활동 (사전 동의 없이)</li>
                <li>자동화된 수단을 이용한 대량 접근</li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-base text-gray-900 mb-2">
                제8조 (면책)
              </h2>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>
                  서비스는 이용자의 테스트 결과에 대해 어떠한 보증도 하지
                  않습니다.
                </li>
                <li>
                  천재지변, 서버 장애 등 불가항력으로 인한 서비스 중단에 대해
                  책임지지 않습니다.
                </li>
                <li>
                  이용자가 서비스를 이용하여 기대하는 결과를 얻지 못한 것에 대해
                  책임지지 않습니다.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-base text-gray-900 mb-2">
                제9조 (약관 변경)
              </h2>
              <p>
                본 약관은 서비스 변경, 법령 개정 등의 사유로 수정될 수 있으며,
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
