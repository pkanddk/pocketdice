import pwa from '@ducanh2912/next-pwa';

let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

// Extend PWA configuration with an offline document fallback so that users get a friendly
// message instead of the browser's generic "you're offline" screen when they navigate
// to a route that has not yet been cached.
//
// The page component that will be shown lives at /app/offline/page.tsx and will be
// prerendered & precached automatically by next-pwa on first load.
const withPWA = pwa({
  dest: 'public', // Destination directory for the service worker files
  register: true, // Register the service worker on the client
  skipWaiting: true, // Activate the SW immediately after install
  disable: process.env.NODE_ENV === 'development', // Keep dev mode un-affected
  // Graceful offline fallback (works for App Router as well)
  fallbacks: {
    document: '/offline',
  },
  cacheOnFrontendNav: true,
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^\/game\//,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'game-pages',
          expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      {
        urlPattern: /^\/_next\/data\/.*\.json$/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'next-data',
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default withPWA(nextConfig);
