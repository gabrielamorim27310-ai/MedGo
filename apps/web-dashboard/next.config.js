/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 'standalone' usa symlinks que o Windows bloqueia sem privilégio;
  // mantido para os builds de deploy (Linux/Railway).
  output: process.platform === 'win32' ? undefined : 'standalone',
  // Permite rodar `next build` sem corromper o .next do dev server:
  // NEXT_DIST_DIR=.next-prod pnpm build
  distDir: process.env.NEXT_DIST_DIR || '.next',
  transpilePackages: ['@acolhe/shared-types'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    typedRoutes: true,
  },
}

module.exports = nextConfig
