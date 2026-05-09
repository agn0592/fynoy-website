import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",        // puur statische HTML output → Vercel / Netlify / CDN
  trailingSlash: true,     // /about/ → about/index.html (mooie URLs)
  images: {
    unoptimized: true,     // vereist voor static export
  },
};

export default nextConfig;
