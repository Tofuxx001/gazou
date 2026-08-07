import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true }, // next/image の最適化はサーバーを要求するため
};

export default nextConfig;