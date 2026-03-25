import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  sw: "sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withPWA({
  // This silences the Turbopack warning
  experimental: {
    turbopack: {},
  },
  reactStrictMode: true,
});