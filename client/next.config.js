/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Remove unrecognized turboMode key
  },
  // Add allowedDevOrigins to allow cross origin requests from local network IP
  allowedDevOrigins: ['http://192.168.1.177'],
  // ... other Next.js configurations
};

export default nextConfig;
