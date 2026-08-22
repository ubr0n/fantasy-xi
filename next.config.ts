import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "resources.premierleague.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
