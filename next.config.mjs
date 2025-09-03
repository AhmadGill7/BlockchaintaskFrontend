/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Ensure proper handling of client-side routing
  trailingSlash: false,
  // Enable static optimization where possible
  output: 'standalone',
}

export default nextConfig
