/* Service worker do site checkselt.com: guarda a página inicial e a moldura do app (/app/) e torna o site instalável.
   O app em si roda no Apps Script (script.google.com), dentro do /app/. Guardar o /app/ serve às redes que bloqueiam o
   checkselt.com mas liberam o Google (ex.: rede de empresa com filtro que ainda não classificou o domínio): o ícone
   abre pela cópia e o app carrega direto do Google, como o ícone antigo sempre fez. Sempre rede primeiro; a cópia só
   entra se a rede falhar ou devolver página de outro endereço (a página de bloqueio do filtro). O /app-teste/ não é
   guardado. */
importScripts('/app-config.js?v=1.0.17');
var VERSAO = (self.CHECKSELT_SITE_CONFIG && self.CHECKSELT_SITE_CONFIG.version) || '0';
var CACHE = 'checkselt-site-' + VERSAO;
var BASE = ['/', '/index.html', '/app/', '/app-config.js?v=' + VERSAO, '/manifest.json', '/offline.html', '/favicon.svg'+'?v=20261006',
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
    var ehTeste = /^\/app-teste(\/|$)/.test(u.pathname);
    var ehApp = /^\/app(\/|$)/.test(u.pathname);
    /* A cópia guardada de cada página: o /app/ é um só, qualquer que seja a consulta (?abrir=, ?app=se…). */
    var chave = ehApp ? '/app/' : r.url;
    var copia = function () {
      if (ehTeste) return caches.match('/offline.html');
      return caches.match(chave, { ignoreSearch: ehApp }).then(function (p) { return p || (ehApp ? null : caches.match('/index.html')); })
        .then(function (p) { return p || caches.match('/offline.html'); });
    };
    e.respondWith(fetch(r).then(function (resp) {
      /* Filtro de rede que desvia para a página de bloqueio: a resposta chega de outro endereço. Vale a cópia. */
      var doSite = resp && resp.ok && resp.type !== 'opaqueredirect' && (!resp.url || new URL(resp.url).origin === self.location.origin);
      if (!doSite) return copia().then(function (p) { return (p && p.url && /offline\.html$/.test(p.url) && resp) ? resp : (p || resp); });
      if (!ehTeste) { var c = resp.clone(); caches.open(CACHE).then(function (k) { k.put(chave, c); }); }
      return resp;
    }).catch(copia));
    return;
  }
  e.respondWith(caches.match(r).then(function (c) { return c || fetch(r); }));
});

/* ---- Avisos no celular. O aviso chega SEM conteúdo; o texto vem do app (GET <base>?push=<id>), com o id guardado
   pelo app embutido no IndexedDB do site. Sem texto, mostra um aviso genérico (o navegador exige mostrar algo). ---- */
function lerCfgPush() {
  return new Promise(function (ok) {
    var req = indexedDB.open('checkselt-push', 1);
    req.onupgradeneeded = function () { req.result.createObjectStore('cfg'); };
    req.onerror = function () { ok(null); };
    req.onsuccess = function () {
      try {
        var g = req.result.transaction('cfg', 'readonly').objectStore('cfg').get('atual');
        g.onsuccess = function () { ok(g.result || null); }; g.onerror = function () { ok(null); };
      } catch (x) { ok(null); }
    };
  });
}
self.addEventListener('push', function (e) {
  e.waitUntil(lerCfgPush().then(function (cfg) {
    if (!cfg || !cfg.id || !cfg.base) return {};
    return fetch(cfg.base + '?push=' + encodeURIComponent(cfg.id), { credentials: 'omit' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (j) { j = j || {}; j.caminho = cfg.caminho; return j; })
      .catch(function () { return { caminho: cfg.caminho }; });
  }).then(function (j) {
    var caminho = (j && /^\/app(-teste)?\/$/.test(j.caminho)) ? j.caminho : '/app/';
    var consulta = (j && typeof j.consulta === 'string' && /^(\?[^#]{0,3000})?$/.test(j.consulta)) ? j.consulta : '';
    var titulo = (j && typeof j.titulo === 'string' && j.titulo) ? j.titulo.slice(0, 80) : 'CHECK-SELT';
    var texto = (j && typeof j.texto === 'string' && j.texto) ? j.texto.slice(0, 200) : 'Você tem um aviso novo.';
    return self.registration.showNotification(titulo, {
      body: texto, icon: '/icon-192.png', badge: '/icon-192.png', tag: 'checkselt-aviso', data: { url: caminho + consulta }
    });
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/app/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (lista) {
    for (var i = 0; i < lista.length; i++) {
      var c = lista[i];
      if (new URL(c.url).pathname.indexOf('/app') === 0 && 'navigate' in c) return c.navigate(url).then(function (w) { return (w || c).focus(); });
    }
    return self.clients.openWindow(url);
  }));
});
