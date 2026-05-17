// EXP Mobile — Service Worker v1.0
const CACHE = 'exp-mobile-v1';

const STATIC = [
  './index.html',
  './app.html',
  './gestao.html',
  './tarefas.html',
  './projetos.html',
  './projeto.html',
  './horas.html',
  './custos.html',
  './revisoes.html',
  './contatos.html',
  './chat.html',
  './calc.html',
  './assets/exp-mobile.css',
  './assets/exp-mobile-core.js',
  'https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800;900&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
];

// Install — cache all static assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(STATIC.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network-first for Supabase, cache-first for static
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Always network for Supabase API
  if (url.hostname.includes('supabase.co')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // Cache-first for everything else
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});

// Push notification received
self.addEventListener('push', (e) => {
  const data = e.data?.json() ?? {};
  const options = {
    body:    data.body    ?? 'Nova mensagem no EXP',
    icon:    './assets/icon-192.png',
    badge:   './assets/badge-72.png',
    tag:     data.tag     ?? 'exp',
    data:    { url: data.url ?? './chat.html' },
    vibrate: [200, 100, 200],
  };
  e.waitUntil(
    self.registration.showNotification(data.title ?? 'EXP', options)
  );
});

// Notification clicked — focus or open the target URL
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = e.notification.data?.url ?? './';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(target) && 'focus' in client) return client.focus();
      }
      return clients.openWindow(target);
    })
  );
});
