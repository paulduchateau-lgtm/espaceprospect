import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typescript: {
    // Playwright config causes type errors on Vercel (devDep absent).
    // Type checking is handled separately in CI / locally.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
