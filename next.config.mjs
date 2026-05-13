/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disabled — prevents Three.js useEffect double-firing on the visualization panel
  reactStrictMode: false,

  // Heavy document-parsing packages with native bindings — keep out of the
  // Edge/serverless bundle and load them as external Node.js modules instead
  serverExternalPackages: ['pdf-parse', 'mammoth'],

  async headers() {
    return [
      // CORS for all API routes — required for cross-origin LLM / data requests
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin',  value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
        ],
      },
      // Security baseline for all routes
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options',        value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
