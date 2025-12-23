import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  // AdMax向け：eval と 外部読み込みを許可
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://adm.shinobi.jp https://*.shinobi.jp",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "connect-src 'self' https:",
  "frame-src 'self' https:",
  "font-src 'self' data: https:",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/", // ←広告を置いてるパスだけにするのが安全
        headers: [{ key: "Content-Security-Policy", value: csp }],
      },
    ];
  },
};

export default nextConfig;
