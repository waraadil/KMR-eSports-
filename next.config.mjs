/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Keep prefetched RSC payloads from masking live database changes. Pages
    // can still sit open in the background or return from browser bfcache;
    // RefreshOnResume in the root layout revalidates those on return.
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
};

export default nextConfig;
