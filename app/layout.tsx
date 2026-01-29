import type { Metadata, Viewport } from "next";
import { Black_Han_Sans, Noto_Sans_KR } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const displayFont = Black_Han_Sans({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const bodyFont = Noto_Sans_KR({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "나는 어떤 두쫀쿠? | 두바이 쫀득 쿠키 성격 테스트",
  description:
    "요즘 핫한 두바이 쫀득 쿠키로 알아보는 내 성격! 오리지널, 쿠앤크, 딸기, 말차... 나는 어떤 두쫀쿠일까?",
  keywords: [
    "두바이 쿠키",
    "두쫀쿠",
    "성격 테스트",
    "심리 테스트",
    "MBTI",
    "바이럴 퀴즈",
  ],
  openGraph: {
    title: "나는 어떤 두쫀쿠?",
    description: "요즘 핫한 두바이 쫀득 쿠키로 알아보는 내 성격!",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary",
    title: "나는 어떤 두쫀쿠?",
    description: "요즘 핫한 두바이 쫀득 쿠키로 알아보는 내 성격!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} antialiased`}
        style={{ fontFamily: "var(--font-body)" }}
      >
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7216959245416564"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
