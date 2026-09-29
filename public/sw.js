// Service worker do PWA (registrado só em produção, ver components/ServiceWorker.js).
//
// Estratégia "rede primeiro": busca sempre a versão nova no servidor e guarda uma cópia;
// sem internet, entrega a cópia guardada. Assim o app instalado abre offline e mostra o
// histórico, e nunca fica preso numa versão antiga. Responder continua precisando de rede.

const CACHE = 'chatbot-v1';

const PRECACHE = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Chamadas da API (e qualquer coisa que não seja GET do próprio site) passam direto.
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  event.respondWith(networkFirst(event));
});

async function networkFirst(event) {
  const { request } = event;
  const cache = await caches.open(CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) event.waitUntil(cache.put(request, response.clone()));
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const shell = await cache.match('/');
      if (shell) return shell;
    }
    throw err;
  }
}
