"use client";

import { useEffect, useRef } from "react";

export default function AdBanner() {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    const timer = setTimeout(() => {
      pushed.current = true;
      try {
        (
          (window as unknown as Record<string, unknown[]>).adsbygoogle =
            (window as unknown as Record<string, unknown[]>).adsbygoogle || []
        ).push({});
      } catch {
        /* noop */
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full flex justify-center my-4">
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", maxWidth: 400, minHeight: 50 }}
        data-ad-client="ca-pub-7216959245416564"
        data-ad-slot="9023622451"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
