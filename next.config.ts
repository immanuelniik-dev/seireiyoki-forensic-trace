import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  sw: "sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  // We keep the webpack force here just to be safe
  webpack: (config: any) => {
    return config;
  },
  reactStrictMode: true,
};

export default withPWA(nextConfig);