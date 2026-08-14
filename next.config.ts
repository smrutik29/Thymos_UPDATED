import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      // The marketing site's homepage is a static export living in public/
      // (see public/*.dc.html). Rewriting "/" to it keeps the address bar
      // clean; since the destination file sits at the same public/ root
      // depth as "/", its relative asset paths (img/..., ./support.js)
      // resolve identically either way.
      { source: "/", destination: "/Thymos%20Homepage.dc.html" },
    ];
  },
};

export default nextConfig;
