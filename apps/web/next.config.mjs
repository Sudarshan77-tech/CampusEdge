/** @type {import('next').NextConfig} */
function getConnectSources() {
  const sources = new Set(["'self'"]);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      const parsed = new URL(supabaseUrl);
      sources.add(parsed.origin);
      const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      sources.add(`${wsProtocol}//${parsed.host}`);
    } catch {
      // Invalid URL handled by env validator
    }
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  if (apiUrl) {
    try {
      const parsed = new URL(apiUrl);
      sources.add(parsed.origin);
    } catch {
      // Invalid URL handled by env validator
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    sources.add('http://localhost:3000');
    sources.add('ws://localhost:3000');
    sources.add('http://localhost:4000');
    sources.add('http://127.0.0.1:3000');
    sources.add('ws://127.0.0.1:3000');
    sources.add('http://127.0.0.1:4000');
    sources.add('http://127.0.0.1:54321');
    sources.add('ws://127.0.0.1:54321');
  }

  return Array.from(sources).join(' ');
}

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      `connect-src ${getConnectSources()}`,
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  transpilePackages: ['@campusedge/shared'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
