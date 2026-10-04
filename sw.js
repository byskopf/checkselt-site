/* Service worker do site checkselt.com: guarda a página inicial para abrir sem internet e torna o site
   instalável. O app em si roda no Apps Script, dentro de /app/; essas páginas NÃO vão para o cache (sem
   internet o app não funciona mesmo, e uma cópia velha montaria um endereço quebrado). */
importScripts('/app-config.js?v=1.0.3');
var VERSAO = (self.CHECKSELT_SITE_CONFIG && self.CHECKSELT_SITE_CONFIG.version) || '0';
var CACHE = 'checkselt-site-' + VERSAO;
var BASE = ['/', '/index.html', '/app-config.js?v=' + VERSAO, '/manifest.json', '/offline.html', '/favicon.svg',
  '/icon-192.png', '/icon-512.png', '/icon-maskable-192.png', '/icon-maskable-512.png', '/apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.allSettled(BASE.map(function (u) { return c.add(new Request(u, { cache: 'no-cache' })); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.map(function (k) { return k.indexOf('checkselt-site-') === 0 && k !== CACHE ? caches.delete(k) : null; }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u; try { u = new URL(r.url); } catch (x) { return; }
  if (u.origin !== self.location.origin) return;
  if (r.mode === 'navigate') {
    var ehApp = /^\/app(-teste)?(\/|$)/.test(u.pathname);
    e.respondWith(fetch(r).then(function (resp) {
      if (resp && resp.ok && !ehApp) { var c = resp.clone(); caches.open(CACHE).then(function (k) { k.put(r.url, c); }); }
      return resp;
    }).catch(function () {
      if (ehApp) return caches.match('/offline.html');
      return caches.match(r.url).then(function (p) { return p || caches.match('/index.html'); }).then(function (p) { return p || caches.match('/offline.html'); });
    }));
    return;
  }
  e.respondWith(caches.match(r).then(function (c) { return c || fetch(r); }));
});
