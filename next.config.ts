import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // The --webpack flag in package.json handles the engine selection.
  webpack: (config, { isServer }) => {
    // This fix defines 'config' as any implicitly within the function 
    // or you can use the internal Next.js types. 
    // For a quick production fix that clears the 'any' error:
    return config;
  },

  reactStrictMode: true,
  
  // If you are using images from external CDNs (like Leaflet markers)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'cdnjs.cloudflare.com',
      },
    ],
  },
};

export default nextConfig;