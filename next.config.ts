import type { NextConfig } from "next";

// Applied to every response. Kept deliberately strict but framework-safe:
// the marketing pages are self-contained (their own inline <style>/<script>
// plus Google Fonts and the Cloudflare Turnstile widget), and the quiz is a
// same-origin Next app, so no third-party script/style origins are needed
// beyond those two.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  // 'unsafe-inline' is required by the .dc.html pages (inline <script>/<style>)
  // and Next's inline bootstrap; 'unsafe-eval' by the .dc.html template runtime
  // in public/support.js. Scoped to script/style only.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
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
