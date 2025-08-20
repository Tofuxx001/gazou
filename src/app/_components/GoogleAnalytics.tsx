// src/app/_components/GoogleAnalytics.tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

type Props = { measurementId: string };

export default function GoogleAnalytics({ measurementId }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    // gtag.js がまだ読み込まれていない可能性に備える
    // @ts-ignore
    if (typeof window.gtag !== "function") return;

    // クエリ付きのフルパスを作る
    const url = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    // SPA ルーティング時の page_view
    // @ts-ignore
    window.gtag("config", measurementId, {
      page_path: url,
    });
  }, [pathname, searchParams, measurementId]);

  return null;
}
