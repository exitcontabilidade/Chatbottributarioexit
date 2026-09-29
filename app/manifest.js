import { CONFIG } from '@/lib/config';

// Dados do PWA, servidos em /manifest.webmanifest.
export default function manifest() {
  return {
    name: CONFIG.botName,
    short_name: CONFIG.shortName,
    description: CONFIG.description,
    lang: 'pt-BR',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
