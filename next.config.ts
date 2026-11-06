import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/map/index.html",
        destination: "/map/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
