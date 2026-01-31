"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const ADMIN_PW = "Wlehdtjr45!";

export default function AdminButton() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("pmt_admin") === "1") return;
  }, []);

  const handleSubmit = () => {
    if (pw === ADMIN_PW) {
      sessionStorage.setItem("pmt_admin", "1");
      setShow(false);
      setPw("");
      setError(false);
      router.push("/admin");
    } else {
      setError(true);
      setPw("");
    }
  };

  // Already authed → show direct link
  const isAuthed = typeof window !== "undefined" && sessionStorage.getItem("pmt_admin") === "1";

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => {
          if (isAuthed) {
            router.push("/admin");
          } else {
            setShow(true);
            setError(false);
          }
        }}
        className="fixed bottom-5 right-5 z-50 w-10 h-10 rounded-full bg-gray-200/60 hover:bg-gray-300/80 backdrop-blur-sm flex items-center justify-center transition-all opacity-30 hover:opacity-100"
        aria-label="관리자"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Password modal */}
      {show && (
        <div
          className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center px-4"
          onClick={() => setShow(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800 mb-1">관리자 인증</h3>
            <p className="text-xs text-gray-400 mb-4">비밀번호를 입력하세요</p>
            <input
              type="password"
              value={pw}
              onChange={(e) => { setPw(e.target.value); setError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="비밀번호"
              autoFocus
              className={`w-full py-2.5 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                error
                  ? "border-red-300 focus:ring-red-400"
                  : "border-gray-200 focus:ring-orange-400"
              }`}
            />
            {error && (
              <p className="text-xs text-red-500 mt-1.5">비밀번호가 틀렸습니다</p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShow(false)}
                className="flex-1 py-2 text-sm text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2 text-sm text-white bg-gray-800 rounded-xl hover:bg-gray-900 transition-colors font-medium"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
