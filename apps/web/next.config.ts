import type { NextConfig } from "next";

// Load the repo-wide .env (Next only reads env files from its own folder by default)
process.loadEnvFile("../../.env");

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@visualize/shared", "@visualize/db"],
};

export default nextConfig;
