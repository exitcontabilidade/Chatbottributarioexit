// Cabeçalhos de segurança aplicados a todas as respostas.
// A CSP completa (scripts só com nonce) fica para antes de abrir aos clientes: ver README.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'same-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,

  // As perguntas são lidas do disco em tempo de execução: garante que a pasta vá junto no deploy.
  outputFileTracingIncludes: {
    '/': ['./Perguntas/**/*.json'],
    '/api/chat': ['./Perguntas/**/*.json'],
  },

  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
      // API: nunca guardar em cache.
      { source: '/api/(.*)', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
      // Service worker: o navegador precisa sempre buscar a versão nova.
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
