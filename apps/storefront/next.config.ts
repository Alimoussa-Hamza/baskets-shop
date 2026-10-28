import type { NextConfig } from "next"

const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
const mediaHost = process.env.NEXT_PUBLIC_MEDIA_HOST // ex : cdn.example.com (R2/S3)

const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      ...(mediaHost ? [{ protocol: "https" as const, hostname: mediaHost }] : []),
      ...(process.env.NODE_ENV !== "production" ? [{ protocol: "http" as const, hostname: "localhost", port: "9000" }] : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // CSP à durcir à l étape 4 (Stripe, Matomo, consentement). connect-src limité au backend.
          { key: "Content-Security-Policy-Report-Only", value: `default-src \x27self\x27; connect-src \x27self\x27 ${backend} https://api.stripe.com; frame-src https://js.stripe.com; img-src \x27self\x27 data: https:` },
        ],
      },
    ]
  },
}

export default config
