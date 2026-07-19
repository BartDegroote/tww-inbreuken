import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Maakt een geïsoleerde buildcontrole mogelijk terwijl de lokale
  // ontwikkelserver zijn eigen .next-map gebruikt.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          {
            key: "Content-Security-Policy",
            value:
              `default-src 'self'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'${process.env.NODE_ENV === "production" ? "" : " ws:"}; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`,
          },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
