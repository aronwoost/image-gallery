/** @type {import('next').NextConfig} */

const commit = require('child_process')
  .execSync('git rev-parse --short HEAD')
  .toString()
  .trim();

const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    commit,
  },
};

module.exports = nextConfig;
