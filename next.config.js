/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.oss-cn-*.aliyuncs.com', // Alibaba OSS domain pattern
      },
    ],
  },
  // Trigger Next.js dev server reload after database schema migration
};

module.exports = nextConfig;
