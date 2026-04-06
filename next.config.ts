const withPWAInit = require("@ducanh2912/next-pwa").default;

/** @type {import('next').NextConfig} */
const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  sw: "sw.js",
  // PWA is disabled in dev to speed up refresh times
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  // We removed the 'turbopack' key from here as it is no longer supported in v16.2.1
  // The --webpack flag in package.json handles the engine selection.
  webpack: (config) => {
    return config;
  },
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);