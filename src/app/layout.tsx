// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Theme } from "@radix-ui/themes";
import Script from "next/script";
import GoogleAnalytics from "./_components/GoogleAnalytics";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://proxyz.synapstudio.com"), // ←本番ドメインに直す
  title: "Proxyz | ボドゲ・TCGカード作成ツール",
  description:
    "Proxyz（プロキシーズ）は、ボードゲームやTCGカードのプロキシ（代替カード）を簡単に作成・保存・印刷できる無料ツールです。",
  keywords: [
    "プロキシカード",
    "TCG作成ツール",
    "カード印刷",
    "ボードゲーム",
    "カードジェネレーター",
    "PnP作成",
    "Print & Play",
    "Proxyz",
    "SynapStudio",
  ],
  authors: [{ name: "SynapStudio" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/",
    title: "Proxyz | ボドゲ・TCGプロキシ作成ツール",
    description:
      "ボードゲームやTCGカードのプロキシをWeb上で簡単に作成・保存・印刷できる無料ツール。",
    images: [
      "https://imagedelivery.net/bUOuWNOAYZjlTLdZkdBtXA/fbf01b41-687f-470f-3d2f-ce85d4440400/public",
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Proxyz | プロキシカード作成ツール",
    description:
      "TCGやボードゲームの代替カードを手軽に作成・ダウンロード。A4出力対応。",
    images: [
      "https://imagedelivery.net/bUOuWNOAYZjlTLdZkdBtXA/fbf01b41-687f-470f-3d2f-ce85d4440400/public",
    ],
  },
  icons: {
    icon: "/assets/proxy-logo.png", // ←public/assets/proxy-logo.png に置く
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* GA 本体（gtag.js を遅延ではなく afterInteractive で） */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-J3TVTD15HP"
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-J3TVTD15HP');
          `}
        </Script>

        {/* Adobe Fonts (Typekit) */}
        <Script id="adobe-typekit" strategy="afterInteractive">
          {`
            (function (d) {
              var config = { kitId: "ieu3znt", scriptTimeout: 3000, async: true },
                  h = d.documentElement, t = setTimeout(function () {
                    h.className = h.className.replace(/\\bwf-loading\\b/g, "") + " wf-inactive";
                  }, config.scriptTimeout),
                  tk = d.createElement("script"), f = false,
                  s = d.getElementsByTagName("script")[0], a;
              h.className += " wf-loading";
              tk.src = "https://use.typekit.net/" + config.kitId + ".js";
              tk.async = true;
              tk.onload = tk.onreadystatechange = function () {
                a = this.readyState;
                if (f || (a && a != "complete" && a != "loaded")) return;
                f = true; clearTimeout(t);
                try { Typekit.load(config); } catch (e) {}
              };
              s.parentNode.insertBefore(tk, s);
            })(document);
          `}
        </Script>

        {/* Google AdSense（承認済みサイト & 広告ユニットがある前提） */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8503856461516107"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {/* ルート遷移の page_view を送るクライアントコンポーネント */}
        <GoogleAnalytics measurementId="G-J3TVTD15HP" />

        <Theme>{children}</Theme>
      </body>
    </html>
  );
}
