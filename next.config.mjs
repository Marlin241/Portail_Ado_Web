/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // epubjs utilise des dépendances CJS qui nécessitent une transpilation explicite
  transpilePackages: ["epubjs"],
}

export default nextConfig
