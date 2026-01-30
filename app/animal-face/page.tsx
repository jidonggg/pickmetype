import type { Metadata } from "next";
import AnimalFaceEngine from "../components/AnimalFaceEngine";

export const metadata: Metadata = {
  title: "AI \uB2EE\uC740 \uB3D9\uBB3C\uC0C1 \uBD84\uC11D\uAE30 | pickmetype",
  description:
    "AI\uAC00 \uBD84\uC11D\uD558\uB294 \uB098\uC758 \uB2EE\uC740 \uB3D9\uBB3C\uC0C1! \uC0AC\uC9C4 \uC5C5\uB85C\uB4DC \uB610\uB294 \uD034\uC988\uB85C \uAC15\uC544\uC9C0, \uACE0\uC591\uC774, \uC5EC\uC6B0, \uACF0, \uD1A0\uB07C... \uB098\uB294 \uC5B4\uB5A4 \uB3D9\uBB3C\uC0C1\uC77C\uAE4C?",
  openGraph: {
    title: "AI \uB2EE\uC740 \uB3D9\uBB3C\uC0C1 \uBD84\uC11D\uAE30 \uD83D\uDC3E",
    description: "AI\uAC00 \uBD84\uC11D\uD558\uB294 \uB098\uC758 \uB2EE\uC740 \uB3D9\uBB3C\uC0C1!",
  },
  twitter: {
    card: "summary",
    title: "AI \uB2EE\uC740 \uB3D9\uBB3C\uC0C1 \uBD84\uC11D\uAE30 \uD83D\uDC3E",
    description: "AI\uAC00 \uBD84\uC11D\uD558\uB294 \uB098\uC758 \uB2EE\uC740 \uB3D9\uBB3C\uC0C1!",
  },
};

export default function AnimalFacePage() {
  return <AnimalFaceEngine />;
}
