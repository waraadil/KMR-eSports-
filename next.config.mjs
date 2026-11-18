/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Data must never be stale: slot counts, wallet balances, results and
    // admin actions change server-side at any time. Disable the client-side
    // router cache so every navigation re-fetches fresh RSC payloads instead
    // of replaying a minutes-old prefetch.
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
};

export default nextConfig;
