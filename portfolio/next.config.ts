import type { NextConfig } from 'next'

// The site is exported as static HTML (works on GitHub Pages, Netlify, Vercel, any CDN).
// Set NEXT_PUBLIC_BASE_PATH when it is served from a sub-folder, e.g. "/speaking-pretest/portfolio".
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

// Absolute site URL (canonical links, Open Graph). Netlify provides its own address in URL,
// Cloudflare Pages in CF_PAGES_URL; NEXT_PUBLIC_SITE_URL always wins when set.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || process.env.CF_PAGES_URL || ''

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { globalNotFound: true },
  env: { NEXT_PUBLIC_SITE_URL: siteUrl },
}

export default nextConfig
