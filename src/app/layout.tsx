// src/app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppThemeProvider } from "./_components/AppThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://proxyz.synapstudio.com";
const OG_IMAGE =
  "https://imagedelivery.net/bUOuWNOAYZjlTLdZkdBtXA/fbf01b41-687f-470f-3d2f-ce85d4440400/public";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Proxyz | ボドゲ・TCGカード作成ツール",
  description:
    "Proxyz（プロキシーズ）は、自作ボードゲーム・オリジナルTCGのカードをブラウザ上でデザイン・量産・書き出しできる無料ツールです。テキスト・画像レイヤー、回転、ドロップシャドウ、自動保存に対応。",
  keywords: [
    "プロキシカード",
    "TCG作成ツール",
    "カードデザイン",
    "自作TCG",
    "オリジナルTCG",
    "ボドゲ制作",
    "ボードゲーム",
    "カードジェネレーター",
    "Proxyz",
    "SynapStudio",
  ],
  authors: [{ name: "SynapStudio" }],
  robots: { index: true, follow: true },
  icons: { icon: "/proxy-logo.png" },
  openGraph: {
    title: "Proxyz | ボドゲ・TCGカード作成ツール",
    description:
      "自作ボードゲーム・オリジナルTCGのカードをブラウザでデザイン・量産。テキスト／画像レイヤー、回転、ドロップシャドウ、自動保存、PNG書き出し対応。",
    url: SITE_URL,
    siteName: "Proxyz",
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Proxyz | ボドゲ・TCGカード作成ツール",
    description:
      "自作ボードゲーム・オリジナルTCGのカードをブラウザでデザイン・量産。PNG書き出し対応の無料ツール。",
    images: [OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        {/*
          ページ描画前にテーマクラスを当てる。
          これが無いと、ダーク設定でも一瞬ライトが表示されてチラつく（FOUC）。
          React のハイドレーション前に実行する必要があるため
          next/script ではなく素の script を使っている。
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem("proxyz:theme:v1");
                  var isDark = saved === "dark" ||
                    ((!saved || saved === "system") &&
                      window.matchMedia("(prefers-color-scheme: dark)").matches);
                  if (isDark) {
                    document.documentElement.classList.add("dark");
                    document.documentElement.style.colorScheme = "dark";
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppThemeProvider>{children}</AppThemeProvider>

        {/* Google Analytics */}
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

        {/* Adobe Typekit */}
        <Script id="typekit-loader" strategy="afterInteractive">
          {`
            (function (d) {
              var config = { kitId: "ieu3znt", scriptTimeout: 3000, async: true },
                  h = d.documentElement,
                  t = setTimeout(function () {
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
          `}
        </Script>

        {/* Google AdSense */}
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8503856461516107"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}
