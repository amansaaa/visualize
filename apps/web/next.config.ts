import type { NextConfig } from "next";

// Load the repo-wide .env (Next only reads env files from its own folder by default).
// Missing in CI/production, where env vars are provided directly.
try {
  process.loadEnvFile("../../.env");
} catch (err) {
  if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
}

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@visualize/shared", "@visualize/db"],
};

export default nextConfig;
