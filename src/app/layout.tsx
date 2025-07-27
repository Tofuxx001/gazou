// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Theme } from "@radix-ui/themes";
import Head from "next/head";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Proxyz | ボドゲ・TCGカード作成ツール",
  description:
    "Proxyz（プロキシーズ）は、ボードゲームやTCGカードのプロキシ（代替カード）を簡単に作成・保存・印刷できる無料ツールです。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <Head>
        {/* ✅ Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-J3TVTD15HP"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-J3TVTD15HP');
            `,
          }}
        />

        {/* ✅ Favicon */}
        <link rel="icon" type="image/png" href="./assets/proxy-logo.png" />

        {/* ✅ SEO & OGP */}
        <meta
          name="keywords"
          content="プロキシカード, TCG作成ツール, カード印刷, ボードゲーム, カードジェネレーター,PnP作成,Print & Play , Proxyz, SynapStudio"
        />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="SynapStudio" />

        <meta
          property="og:title"
          content="Proxyz | ボドゲ・TCGプロキシ作成ツール"
        />
        <meta
          property="og:description"
          content="ボードゲームやTCGカードのプロキシをWeb上で簡単に作成・保存・印刷できる無料ツール。"
        />
        <meta
          property="og:image"
          content="https://imagedelivery.net/bUOuWNOAYZjlTLdZkdBtXA/fbf01b41-687f-470f-3d2f-ce85d4440400/public"
        />
        <meta property="og:url" content="https://your-domain.example.com/" />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Proxyz | プロキシカード作成ツール"
        />
        <meta
          name="twitter:description"
          content="TCGやボードゲームの代替カードを手軽に作成・ダウンロード。A4出力対応。"
        />
        <meta
          name="twitter:image"
          content="https://imagedelivery.net/bUOuWNOAYZjlTLdZkdBtXA/fbf01b41-687f-470f-3d2f-ce85d4440400/public"
        />

        {/* ✅ Adobe Fonts (Typekit) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function (d) {
                var config = {
                  kitId: "ieu3znt",
                  scriptTimeout: 3000,
                  async: true
                },
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
                  f = true;
                  clearTimeout(t);
                  try { Typekit.load(config); } catch (e) {}
                };
                s.parentNode.insertBefore(tk, s);
              })(document);
            `,
          }}
        />

        {/* ✅ Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8503856461516107"
          crossOrigin="anonymous"></script>
      </Head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Theme>{children}</Theme>
      </body>
    </html>
  );
}
