import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Silence multi-lockfile warning: app lives in frontend/, not repo root.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
