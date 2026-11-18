/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ship the seeded SQLite file inside every serverless bundle (built by
  // `npm run db:setup` in the build script); src/db/index.ts copies it to /tmp.
  outputFileTracingIncludes: {
    "/**/*": ["./data/kmr.db"],
  },
};

export default nextConfig;
