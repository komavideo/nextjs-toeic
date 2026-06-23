import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    // 静的エクスポートではデフォルトの画像最適化が使えないため無効化する
    unoptimized: true,
  },
};

export default nextConfig;
