import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) for a lean
  // production Docker image — see frontend/Dockerfile.
  output: "standalone",

  // Same-origin API. The browser calls a relative `/api` (see src/lib/api/*),
  // so NOTHING about the API URL is in the client bundle and the CI-built image
  // promotes staging -> prod unchanged.
  //
  // The rewrite below is a server-side proxy for `/api`. Next evaluates
  // rewrites() at BUILD time and bakes them into the manifest, so BACKEND_ORIGIN
  // is a build ARG, not a runtime env. It affects only server-side proxying, not
  // the client bundle. Two intended uses:
  //   - local / compose: build with BACKEND_ORIGIN=http://backend:3000 so
  //     `docker compose up` works same-origin with no ingress.
  //   - prod (CI): build WITHOUT the arg -> no rewrite -> the platform routes
  //     `/api` to the backend at the ingress, so large PDF/Excel downloads don't
  //     stream through this Node server.
  async rewrites() {
    const backend = process.env.BACKEND_ORIGIN;
    if (!backend) return [];
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;
