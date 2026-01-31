"use client";

import { useState } from "react";

const REPORT_TYPES = [
  { value: "bug", label: "오류 제보", emoji: "🐛" },
  { value: "typo", label: "오탈자 신고", emoji: "✏️" },
  { value: "suggest", label: "기능 제안", emoji: "💡" },
  { value: "other", label: "기타 문의", emoji: "💬" },
];

const TEST_OPTIONS = [
  { value: "", label: "선택 안함" },
  { value: "animal-face", label: "AI 동물상 테스트" },
  { value: "dubai-cookie", label: "두바이 쿠키 테스트" },
  { value: "mental-hp", label: "멘탈 HP 측정기" },
  { value: "market-cap", label: "시가총액 측정기" },
  { value: "homepage", label: "홈페이지" },
  { value: "blog", label: "블로그" },
  { value: "other", label: "기타" },
];

export default function ReportForm() {
  const [type, setType] = useState("bug");
  const [test, setTest] = useState("");
  const [desc, setDesc] = useState("");
  const [sent, setSent] = useState(false);

  const getDeviceInfo = () => {
    if (typeof navigator === "undefined") return "";
    const ua = navigator.userAgent;
    const isMobile = /Mobile|Android|iPhone/i.test(ua);
    const platform = isMobile ? "모바일" : "PC";
    let browser = "기타";
    if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg")) browser = "Edge";
    return `${platform} / ${browser}`;
  };

  const handleSubmit = () => {
    if (!desc.trim()) return;

    const typeLabel = REPORT_TYPES.find((t) => t.value === type)?.label || type;
    const testLabel = TEST_OPTIONS.find((t) => t.value === test)?.label || "";
    const device = getDeviceInfo();

    const subject = `[${typeLabel}] ${testLabel ? `${testLabel} - ` : ""}pickmetype 제보`;
    const body = [
      `유형: ${typeLabel}`,
      testLabel ? `관련 테스트: ${testLabel}` : "",
      `이용 환경: ${device}`,
      "",
      "내용:",
      desc,
      "",
      "---",
      `보낸 시간: ${new Date().toLocaleString("ko-KR")}`,
      `페이지: ${window.location.href}`,
    ]
      .filter(Boolean)
      .join("\n");

    window.location.href = `mailto:pickmetype@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  if (sent) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">✅</div>
        <p className="font-bold text-gray-800 mb-2">메일 앱이 열렸나요?</p>
        <p className="text-sm text-gray-500 mb-4">
          메일 앱에서 전송 버튼을 눌러주세요.<br />
          메일 앱이 안 열렸다면 직접 보내주세요.
        </p>
        <div className="bg-orange-50 rounded-xl p-3 mb-4">
          <a
            href="mailto:pickmetype@gmail.com"
            className="text-orange-500 hover:underline font-medium text-sm"
          >
            pickmetype@gmail.com
          </a>
        </div>
        <button
          onClick={() => { setSent(false); setDesc(""); }}
          className="text-sm text-gray-400 hover:text-gray-600 underline"
        >
          다시 작성하기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-2">제보 유형</label>
        <div className="grid grid-cols-2 gap-2">
          {REPORT_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                type === t.value
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Test selector */}
      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-2">관련 테스트</label>
        <select
          value={test}
          onChange={(e) => setTest(e.target.value)}
          className="w-full py-2.5 px-3 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
        >
          {TEST_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-2">내용</label>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder={
            type === "bug"
              ? "어떤 오류가 발생했는지 알려주세요.\n예) 사진 업로드 후 분석 버튼이 안 눌려요"
              : type === "typo"
              ? "어디서 오탈자를 발견했는지 알려주세요.\n예) 강아지상 설명에서 '충성스러움'이 '충성스러먐'으로 되어 있어요"
              : type === "suggest"
              ? "어떤 기능이 있으면 좋을지 알려주세요."
              : "문의 내용을 적어주세요."
          }
          rows={5}
          className="w-full py-3 px-4 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white resize-none focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 placeholder:text-gray-300"
        />
      </div>

      {/* Device info */}
      <div className="bg-gray-50 rounded-xl px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs text-gray-400">이용 환경 (자동 감지)</span>
        <span className="text-xs text-gray-600 font-medium">{getDeviceInfo()}</span>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!desc.trim()}
        className="w-full py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-red-400 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ fontFamily: "var(--font-display)" }}
      >
        📩 제보 보내기
      </button>

      <p className="text-[11px] text-gray-400 text-center">
        메일 앱이 열리며 내용이 자동으로 채워집니다
      </p>
    </div>
  );
}
