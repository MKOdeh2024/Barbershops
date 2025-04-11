// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public', // Destination directory for service worker files
  register: true, // Register the service worker
  skipWaiting: true, // Skip waiting phase for service worker updates
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development mode
  // Optional: configure runtime caching strategies here
  // runtimeCaching: [...]
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ... other Next.js configurations
};

module.exports = withPWA(nextConfig); // Wrap your config with withPWA