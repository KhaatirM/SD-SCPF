import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.rbxcdn.com" },
      { protocol: "https", hostname: "thumbnails.roblox.com" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
