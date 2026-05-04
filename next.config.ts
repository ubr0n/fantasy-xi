import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    domains: ["resources.premierleague.com"],
  },
};

export default nextConfig;
