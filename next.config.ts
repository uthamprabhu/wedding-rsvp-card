import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve modern formats — Next.js negotiates AVIF/WebP automatically.
    formats: ["image/avif", "image/webp"],
    // Device widths covering every viewport the invitation targets.
    deviceSizes: [390, 430, 768, 1024, 1280, 1920],
    // Intermediate sizes for srcset — covers portrait thumbnails etc.
    imageSizes: [128, 256, 384],
  },
};

export default nextConfig;
