import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Smaller runtime footprint on Render free (512MB).
  output: "standalone",
  // Keep native/heavy DB packages out of the Next server bundle.
  // PGlite is only dynamic-imported for local/dev when DATABASE_URL is unset.
  // xlsx is import-script only — never pull it into the web server graph.
  serverExternalPackages: ["@electric-sql/pglite", "pg", "xlsx"],
  // Never ship PGlite WASM / xlsx into the Render standalone tree (~19MB+ savings).
  outputFileTracingExcludes: {
    "*": [
      "node_modules/@electric-sql/pglite/**",
      "node_modules/xlsx/**",
      "data/spreadsheets/**",
    ],
  },
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
