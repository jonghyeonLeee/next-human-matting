/** @type {import('next').NextConfig} */
const CopyPlugin = require('copy-webpack-plugin');

const nextConfig = {
  webpack: (config, {}) => {
    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: './node_modules/@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm-simd.wasm',
            to: 'static/chunks/app',
          },
        ],
      }),
    );
    return config;
  },
};

module.exports = nextConfig;
