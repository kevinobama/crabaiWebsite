import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Proxy agent API calls to the FastAPI mini-service on port 8000.
  // This works for both local dev (Next.js on 3000 -> FastAPI on 8000) and
  // the preview URL (Caddy -> Next.js on 3000 -> FastAPI on 8000).
  async rewrites() {
    return [
      { source: "/api/rag/:path*", destination: "http://localhost:8000/api/rag/:path*" },
      { source: "/api/sql/:path*", destination: "http://localhost:8000/api/sql/:path*" },
      { source: "/api/combined/:path*", destination: "http://localhost:8000/api/combined/:path*" },
      { source: "/api/documents/:path*", destination: "http://localhost:8000/api/documents/:path*" },
      { source: "/api/health", destination: "http://localhost:8000/api/health" },
    ];
  },
};

export default nextConfig;
