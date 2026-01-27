/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@medgo/shared-types'],
  experimental: {
    typedRoutes: true,
  },
}

module.exports = nextConfig
