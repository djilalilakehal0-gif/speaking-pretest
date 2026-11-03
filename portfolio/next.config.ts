import type { NextConfig } from 'next'

// The site is exported as static HTML (works on GitHub Pages, Netlify, Vercel, any CDN).
// Set NEXT_PUBLIC_BASE_PATH when it is served from a sub-folder, e.g. "/speaking-pretest/portfolio".
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { globalNotFound: true },
}

export default nextConfig
