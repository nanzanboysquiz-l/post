import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/map",
        destination: "/map/index.html",
      },
    ];
  },
};

export default nextConfig;
