import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // AdMaxがevalを使う前提なら unsafe-eval が必要
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://adm.shinobi.jp",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "connect-src 'self' https:",
              "frame-src https:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
