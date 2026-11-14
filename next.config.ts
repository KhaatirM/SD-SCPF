import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep native/heavy DB packages out of the Next server bundle.
  // PGlite is only dynamic-imported for local/dev when DATABASE_URL is unset.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
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
