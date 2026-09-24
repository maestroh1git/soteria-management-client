import type { NextConfig } from "next";
import { MOVED_ROUTES } from "./src/lib/auth/route-manifest";

const nextConfig: NextConfig = {
  // Pages that moved in Wave 4 (ROADMAP-EXECUTION.md). Permanent, so browsers
  // and search engines learn the new address; query strings carry over.
  async redirects() {
    return Object.entries(MOVED_ROUTES).flatMap(([from, to]) => [
      { source: from, destination: to, permanent: true },
      { source: `${from}/:path*`, destination: `${to}/:path*`, permanent: true },
    ]);
  },
};

export default nextConfig;
