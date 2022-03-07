/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "auto-grade-app-storage.s3.us-east-1.amazonaws.com"
    ]
  }
}

module.exports = nextConfig
