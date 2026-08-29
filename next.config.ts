import type { NextConfig } from "next";

// Applied to every response.
//
// The marketing pages (public/*.dc.html) run a client-side template runtime
// (public/support.js) that pulls React, ReactDOM and @babel/standalone UMD
// builds from unpkg.com at load time and JSX-transpiles inline page scripts
// via eval — hence 'unsafe-eval', 'unsafe-inline', and https://unpkg.com in
// script-src. Tightening this means vendoring those three libs locally and
// pre-compiling the page scripts (follow-up). Google Fonts + Cloudflare
// Turnstile are the only other third-party origins.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  "connect-src 'self' https://unpkg.com https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' mailto:",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // Don't advertise the framework/version.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
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
