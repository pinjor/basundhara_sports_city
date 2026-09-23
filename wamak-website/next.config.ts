import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The app lives in a subfolder of a pnpm workspace; pin the root so
  // Turbopack does not infer the parent lockfile as the project root.
  turbopack: {
    root: path.join(__dirname),
  },
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    // Room for a 10MB specification file plus multipart overhead.
    // Note: Vercel functions accept at most 4.5MB; set NEXT_PUBLIC_MAX_UPLOAD_MB=4 there.
    serverActions: { bodySizeLimit: "11mb" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
  },
};

export default nextConfig;
