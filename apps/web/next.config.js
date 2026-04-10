import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Turbopack workspace root ──────────────────────────────────────────────
  // Explicitly set so Turbopack doesn't pick up a wrong lockfile higher up
  // the directory tree.
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },

  // ── Standalone output (recommended for Docker deployments) ──────────────
  output: 'standalone',

  // ── Server-side packages that should not be bundled by Next.js ──────────
  // serverExternalPackages: ['@repo/db', 'better-auth'],

  // ── API proxy rewrites (same-origin setup) ───────────────────────────────
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}/:path*`,
  //     },
  //   ];
  // },

  // ── Security headers ─────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
