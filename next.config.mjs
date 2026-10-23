/** @type {import('next').NextConfig} */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : 'localhost';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }]
  },
  // o Konva tem uma versão para Node que usa o pacote 'canvas'; o simulador só roda no navegador
  webpack: (config, { isServer }) => {
    if (isServer) config.externals = [...(config.externals || []), { canvas: 'commonjs canvas' }];
    return config;
  },
  experimental: {
    serverActions: { bodySizeLimit: '10mb' }
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' }
        ]
      },
      // câmera liberada só no simulador (e só para o próprio site)
      { source: '/((?!simulador).*)', headers: [{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }] },
      { source: '/simulador', headers: [{ key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' }] },
      { source: '/reserva/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Cache-Control', value: 'no-store' }] },
      { source: '/ficha/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Cache-Control', value: 'no-store' }] },
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }
    ];
  }
};

export default nextConfig;
