"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const GA_PROPERTY_ID = "G-PK95F0LSPM";

const TESTS = [
  { id: "animal-face", name: "AI 동물상 테스트", emoji: "🐾", active: true },
  { id: "dubai-cookie", name: "두쫀쿠 테스트", emoji: "🍪", active: false },
  { id: "mental-hp", name: "멘탈 HP 측정기", emoji: "⚔️", active: true },
  { id: "market-cap", name: "시가총액 측정기", emoji: "💰", active: true },
];

const TRACKED_EVENTS = [
  { event: "page_view", desc: "페이지 조회", auto: true },
  { event: "quiz_start", desc: "테스트 시작", auto: false },
  { event: "quiz_complete", desc: "테스트 완료", auto: false },
  { event: "share", desc: "결과 공유 (카카오/X/링크/이미지)", auto: false },
];

interface SessionEvent {
  time: string;
  event: string;
  params: Record<string, unknown>;
}

export default function AdminPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [events, setEvents] = useState<SessionEvent[]>([]);

  useEffect(() => {
    if (sessionStorage.getItem("pmt_admin") !== "1") {
      router.replace("/");
      return;
    }
    setAuthed(true);

    // Intercept gtag calls to log events in real-time
    const origGtag = window.gtag;
    if (origGtag) {
      window.gtag = function (...args: unknown[]) {
        origGtag(...args);
        if (args[0] === "event" && typeof args[1] === "string") {
          const newEvent: SessionEvent = {
            time: new Date().toLocaleTimeString("ko-KR"),
            event: args[1],
            params: (args[2] as Record<string, unknown>) || {},
          };
          setEvents((prev) => [newEvent, ...prev].slice(0, 100));
        }
      };
    }

    return () => {
      if (origGtag) window.gtag = origGtag;
    };
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("pmt_admin");
    router.replace("/");
  };

  if (!authed) return null;

  const gaReportUrl = `https://analytics.google.com/analytics/web/#/p${GA_PROPERTY_ID.replace("G-", "")}/reports/reportinghub`;
  const gaRealtimeUrl = `https://analytics.google.com/analytics/web/#/p${GA_PROPERTY_ID.replace("G-", "")}/realtime/overview`;

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
              ← 사이트
            </Link>
            <h1 className="text-lg font-bold text-gray-800">관리자 대시보드</h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href={gaRealtimeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">📊</div>
            <p className="font-bold text-gray-800 text-sm">GA 실시간</p>
            <p className="text-xs text-gray-400">현재 접속자 확인</p>
          </a>
          <a
            href={gaReportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">📈</div>
            <p className="font-bold text-gray-800 text-sm">GA 리포트</p>
            <p className="text-xs text-gray-400">상세 분석 데이터</p>
          </a>
          <a
            href={`https://analytics.google.com/analytics/web/#/p${GA_PROPERTY_ID.replace("G-", "")}/reports/explorer?params=_u.dateOption%3Dlast7Days&r=events-overview`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">🎯</div>
            <p className="font-bold text-gray-800 text-sm">GA 이벤트</p>
            <p className="text-xs text-gray-400">이벤트별 통계</p>
          </a>
        </div>

        {/* Test Status */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🧪</span> 테스트 현황
          </h2>
          <div className="space-y-3">
            {TESTS.map((test) => (
              <div
                key={test.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{test.emoji}</span>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{test.name}</p>
                    <p className="text-xs text-gray-400">/{test.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      test.active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {test.active ? "활성" : "비활성"}
                  </span>
                  <a
                    href={`https://analytics.google.com/analytics/web/#/p${GA_PROPERTY_ID.replace("G-", "")}/reports/explorer?params=_u.dateOption%3Dlast7Days&r=events-overview&params=_r.4..selmet%3D%5B%22eventCount%22%5D&params=_r.4..seldim%3D%5B%22eventName%22%5D`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline"
                  >
                    GA →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tracked Events Reference */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📋</span> 추적 중인 이벤트
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-2 pr-4">이벤트명</th>
                  <th className="pb-2 pr-4">설명</th>
                  <th className="pb-2">파라미터</th>
                </tr>
              </thead>
              <tbody>
                {TRACKED_EVENTS.map((e) => (
                  <tr key={e.event} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 pr-4">
                      <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">
                        {e.event}
                      </code>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600">{e.desc}</td>
                    <td className="py-2.5 text-xs text-gray-400">
                      {e.auto ? "자동 수집" : "quiz_id, result_type, method"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* GA Info */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>⚙️</span> Google Analytics 설정
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-1.5">
              <span className="text-gray-500">측정 ID</span>
              <code className="bg-gray-100 px-3 py-1 rounded text-xs font-mono">{GA_PROPERTY_ID}</code>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-gray-500">페이지뷰 트래킹</span>
              <span className="text-green-600 font-medium text-xs">활성</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-gray-500">이벤트 트래킹</span>
              <span className="text-green-600 font-medium text-xs">활성 (4개 테스트)</span>
            </div>
          </div>
        </div>

        {/* Real-time Session Events */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
            <span>🔴</span> 실시간 이벤트 로그
          </h2>
          <p className="text-xs text-gray-400 mb-4">이 브라우저 세션에서 발생한 이벤트 (관리자 테스트용)</p>

          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-300">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm">아직 이벤트가 없습니다</p>
              <p className="text-xs mt-1">다른 탭에서 테스트를 진행하면 여기에 표시됩니다</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {events.map((e, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 py-2 px-3 bg-gray-50 rounded-lg text-xs"
                >
                  <span className="text-gray-400 font-mono whitespace-nowrap">{e.time}</span>
                  <code className="text-blue-600 font-mono font-bold whitespace-nowrap">{e.event}</code>
                  <span className="text-gray-500 truncate">
                    {Object.entries(e.params)
                      .map(([k, v]) => `${k}=${v}`)
                      .join(", ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Pages */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🔗</span> 사이트 바로가기
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { href: "/", label: "홈" },
              { href: "/animal-face", label: "동물상" },
              { href: "/mental-hp", label: "멘탈HP" },
              { href: "/market-cap", label: "시가총액" },
              { href: "/blog", label: "블로그" },
              { href: "/contact", label: "문의" },
              { href: "/about", label: "소개" },
              { href: "/sitemap.xml", label: "사이트맵" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-2 px-3 bg-gray-50 rounded-lg text-sm text-center text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-300 text-center pb-6">
          pickmetype admin dashboard
        </p>
      </div>
    </div>
  );
}
