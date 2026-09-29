'use client';

import { useEffect } from 'react';

// Registra o service worker (public/sw.js) só em produção (npm run build + npm start).
// Em desenvolvimento ele atrapalharia a atualização automática da tela, então é removido.
export default function ServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((reg) => reg.unregister()));
      return;
    }

    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch((err) => console.warn('Service worker não registrado:', err));
  }, []);

  return null;
}
