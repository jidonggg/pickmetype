import type { Metadata } from "next";
import QuizEngine from "../components/QuizEngine";
import { quizConfig } from "./data";

export const metadata: Metadata = {
  title: "나는 어떤 두쫀쿠? | pickmetype",
  description:
    "요즘 핫한 두바이 쫀득 쿠키로 알아보는 내 성격! 오리지널, 쿠앤크, 딸기, 말차... 나는 어떤 두쫀쿠일까?",
  openGraph: {
    title: "나는 어떤 두쫀쿠? 🍪",
    description: "요즘 핫한 두바이 쫀득 쿠키로 알아보는 내 성격!",
  },
  twitter: {
    card: "summary",
    title: "나는 어떤 두쫀쿠? 🍪",
    description: "요즘 핫한 두바이 쫀득 쿠키로 알아보는 내 성격!",
  },
};

export default function DubaiCookiePage() {
  return <QuizEngine config={quizConfig} />;
}
