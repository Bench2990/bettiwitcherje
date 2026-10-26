import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  outputFileTracingRoot: process.cwd(),
  allowedDevOrigins: ['127.0.0.1', '192.168.*.*', '10.*.*.*'],
};

export default config;
