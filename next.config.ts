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
  "frame-src 'self' https://challenges.cloudflare.com",
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

// employer-pitch.html embeds these as live same-origin iframe previews (both
// small in-slide snippets and the "view" modal). The general X-Frame-Options
// DENY / frame-ancestors 'none' above block ANY framing, including from our
// own pages, so these specific embeddable fragments need a same-origin-only
// override — narrower than allowing framing from anywhere.
const EMBEDDABLE_PAGE_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: CONTENT_SECURITY_POLICY.replace(
      "frame-ancestors 'none'",
      "frame-ancestors 'self'"
    ),
  },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];
const EMBEDDABLE_PAGES = [
  "roi-and-payback.html",
  "pbm-data-request.html",
  "member-lettering.html",
  "monthly-report.html",
];

// Unlisted patient legal documents the mobile app links to by exact URL
// (HIPAA Authorization, Research Participation Authorization, Informed
// Consents and Arbitration Agreement). They must stay private and out of
// search engines, so beyond the <meta name="robots"> in each file they get
// an X-Robots-Tag header (covers crawlers that honour headers over meta),
// no-referrer (the URL is not leaked to any site linked from the page) and
// a non-shared cache (Cloudflare never keeps an edge copy). They are also
// absent from sitemap.xml, site-search.js and every nav/footer. They are
// deliberately NOT listed in robots.txt: a Disallow there would publish the
// URLs in a world-readable file and stop crawlers from ever fetching the
// page, which is the only way they can see the noindex directive.
const PRIVATE_PAGES = [
  "hipaa-authorization.html",
  "research-participation-authorization.html",
  "informed-consents-and-arbitration-agreement.html",
];
const PRIVATE_PAGE_HEADERS = [
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Cache-Control", value: "private, no-cache" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // Don't advertise the framework/version.
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // Long-lived cache for immutable-ish media so navigating between the
      // marketing pages doesn't re-fetch the shared images/video/fonts every
      // time (Next serves public/ with max-age=0 by default).
      {
        source: "/:dir(img|images|video|fonts)/:file*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
      // The hand-written page scripts change occasionally. A flat 24h cache
      // meant a change could take up to a day to reach returning visitors
      // (no filename hash/version to bust it) regardless of how many times
      // we deploy or purge Cloudflare's edge cache — traced live 2026-09-13.
      // `no-cache` still lets browsers/Cloudflare cache the bytes, but forces
      // a conditional revalidation (cheap 304 if unchanged) on every request,
      // so a real change reaches everyone on their next load.
      {
        source: "/:file(support|site-search|waitlist-modal|video-autoplay-fix|testimonial-nav|turnstile-render-fix).js",
        headers: [{ key: "Cache-Control", value: "public, no-cache" }],
      },
      // Same-origin-framing override for the pages employer-pitch.html embeds
      // as iframes — placed after the general /:path* rule above so these
      // headers win for these specific paths.
      ...EMBEDDABLE_PAGES.map((name) => ({
        source: "/" + encodeURIComponent(name).replace(/%2F/g, "/"),
        headers: EMBEDDABLE_PAGE_HEADERS,
      })),
      // Private legal documents — after the general /:path* rule so these
      // headers win for these specific paths.
      ...PRIVATE_PAGES.map((name) => ({
        source: "/" + name,
        headers: PRIVATE_PAGE_HEADERS,
      })),
    ];
  },
  async rewrites() {
    return [
      // The marketing site's homepage is a static export living in public/
      // (see public/*.dc.html). Rewriting "/" to it keeps the address bar
      // clean; since the destination file sits at the same public/ root
      // depth as "/", its relative asset paths (img/..., ./support.js)
      // resolve identically either way.
      { source: "/", destination: "/thymos-homepage.dc.html" },
    ];
  },
  // NOTE: no host redirect. Only the apex `thymoshealth.com` is mapped to
  // this Cloud Run service; `www.thymoshealth.com` still resolves to the
  // OLD stack, so redirecting apex→www (attempted 2026-09-10, reverted
  // same day) sends live traffic to the old app. Canonical host is the
  // apex until someone maps `www` to this service (or Cloudflare 301s
  // www→apex).
};

export default nextConfig;
