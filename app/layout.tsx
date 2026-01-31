import type { Metadata, Viewport } from "next";
import { Black_Han_Sans, Noto_Sans_KR } from "next/font/google";
import Script from "next/script";
import Header from "./components/Header";
import Footer from "./components/Footer";
import GoogleAnalyticsPageView from "./components/GoogleAnalytics";
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
  metadataBase: new URL("https://pickmetype.vercel.app"),
  title: "pickmetype | 나의 유형 찾기",
  description: "재미있는 성격 테스트 모음! 나의 유형을 찾아보세요.",
  keywords: ["성격 테스트", "심리 테스트", "MBTI", "바이럴 퀴즈", "유형 테스트"],
  openGraph: {
    title: "pickmetype | 나의 유형 찾기",
    description: "재미있는 성격 테스트 모음!",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-PK95F0LSPM" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-PK95F0LSPM');`,
          }}
        />
      </head>
      <body
        className={`${displayFont.variable} ${bodyFont.variable} antialiased flex flex-col min-h-[100dvh]`}
        style={{ fontFamily: "var(--font-body)" }}
      >
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7216959245416564"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script
          src="https://developers.kakao.com/sdk/js/kakao.min.js"
          strategy="afterInteractive"
        />
        <GoogleAnalyticsPageView />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
