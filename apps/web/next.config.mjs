/** @type {import('next').NextConfig} */
import withSerwistInit from "@serwist/next";

const nextConfig = {
  transpilePackages: ["@lila/ui"],
  output: 'standalone',
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // Images are now optimized by default (Vercel) for better LCP
  // images: { unoptimized: true }, 
  cacheComponents: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '250mb',
    },
  },
  serverExternalPackages: ['got-scraping'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ]
  },
}

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const withBundleAnalyzer = (await import('@next/bundle-analyzer')).default({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(withSerwist(nextConfig));
