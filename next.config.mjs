/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable strict mode to prevent double-firing of Three.js useEffect in dev
  reactStrictMode: false,

  // Allow the API routes to reach a longer-running Ollama instance
  // (relevant for self-hosted / VPS deployments)
  experimental: {
    serverComponentsExternalPackages: [],
  },

  // Headers to allow cross-origin requests in development
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};

export default nextConfig;
