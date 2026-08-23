import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["10.0.0.140"],
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
