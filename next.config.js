// `withSentryConfig` is only exported from the `@sentry/nextjs/config` entry
// point — not the package root. This is what actually loads the
// sentry.{client,server,edge}.config.ts files and uploads source maps; without
// it those config files are inert.
import { withSentryConfig } from '@sentry/nextjs/config';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.gitlab.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

// `withSentryConfig` is what actually loads sentry.{client,server,edge}.config.ts
// and uploads source maps. Without it the Sentry config files are inert.
export default withSentryConfig(nextConfig, {
  // Source maps let Sentry de-minify stack traces. Disable if uploads fail.
  silent: !process.env.SENTRY_AUTH_TOKEN,
  orgSlug: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
