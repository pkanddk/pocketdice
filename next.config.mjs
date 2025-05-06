import pwa from 'next-pwa';

let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

// Configure next-pwa - THIS BLOCK WAS MISSING/NEEDS TO BE CORRECTLY PLACED
const withPWA = pwa({
  dest: 'public', // Destination directory for the service worker files
  register: true, // Register the service worker
  skipWaiting: true, // Skip waiting for service worker activation
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development mode
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
