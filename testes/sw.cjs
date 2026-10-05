/* Service worker: o ícone novo abre numa rede que bloqueia o checkselt.com (filtro de empresa), pela cópia do /app/. */
const fs = require('fs'), vm = require('vm');
const ORIGEM = 'https://checkselt.com';
function montar() {
  const ouvintes = {}, guardado = new Map();
  let rede = null;
  const resposta = (url, corpo, extra) => Object.assign({ ok: true, status: 200, type: 'basic', url, redirected: false, corpo, clone() { return Object.assign({}, this); } }, extra || {});
  const cache = {
    put: (k, v) => { guardado.set(String(k).startsWith('http') ? new URL(k).pathname + new URL(k).search : k, v); return Promise.resolve(); },
    add: (req) => { guardado.set(req.url || req, resposta(ORIGEM + (req.url || req), 'base ' + (req.url || req))); return Promise.resolve(); },
  };
  const caches = {
    open: () => Promise.resolve(cache),
    keys: () => Promise.resolve([]),
    match: (k, op) => {
      let chave = typeof k === 'string' && k.startsWith('http') ? new URL(k).pathname + new URL(k).search : (k.url || k);
      if (op && op.ignoreSearch) chave = chave.split('?')[0];
      return Promise.resolve(guardado.get(chave) || null);
    },
  };
  const self = {
    location: { origin: ORIGEM }, addEventListener: (t, f) => { ouvintes[t] = f; }, skipWaiting() {}, clients: { claim() {} },
  };
  const ctx = {
    self, caches, URL, Promise, console,
    Request: function (u) { this.url = u; },
    importScripts: () => { self.CHECKSELT_SITE_CONFIG = { version: '9.9.9' }; },
    fetch: (r) => rede(r),
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('sw.js', 'utf8'), ctx);
  const navegar = (caminho) => new Promise((ok, erro) => {
    const r = { method: 'GET', mode: 'navigate', url: ORIGEM + caminho };
    ouvintes.fetch({ request: r, respondWith: (p) => Promise.resolve(p).then(ok, erro) });
  });
  /* instalação: guarda a base (página inicial, /app/, offline…), como no aparelho */
  ouvintes.install({ waitUntil: () => {} });
  return { navegar, guardado, resposta, definirRede: (f) => { rede = f; } };
}
(async () => {
  let f = 0; const t = (r, v, extra) => { console.log((v ? 'ok   ' : 'ERRO ') + r + (v || extra === undefined ? '' : ' — ' + extra)); if (!v) f++; };
  const espera = () => new Promise(r => setTimeout(r, 5));
  const sw = montar(); await espera();
  /* com rede: serve da rede e guarda uma cópia do /app/ */
  sw.definirRede((r) => Promise.resolve(sw.resposta(r.url, 'rede ' + r.url)));
  let p = await sw.navegar('/app/?abrir=equipamento'); await espera();
  t('com rede: serve da rede', p.corpo === 'rede ' + ORIGEM + '/app/?abrir=equipamento');
  t('guarda a cópia do /app/ numa chave só', sw.guardado.has('/app/') && !sw.guardado.has('/app/?abrir=equipamento'));
  /* rede bloqueada (falha de conexão) */
  sw.definirRede(() => Promise.reject(new TypeError('Failed to fetch')));
  p = await sw.navegar('/app/?app=se');
  t('rede bloqueada (falha): abre o /app/ pela cópia', p.corpo === 'rede ' + ORIGEM + '/app/?abrir=equipamento', p.corpo);
  /* filtro que desvia para a página de bloqueio */
  sw.definirRede((r) => Promise.resolve(sw.resposta('https://block.sse.cisco.com/x', 'bloqueio', { redirected: true })));
  p = await sw.navegar('/app/');
  t('rede desviada para o bloqueio: abre o /app/ pela cópia', /^rede /.test(p.corpo), p.corpo);
  p = await sw.navegar('/');
  t('página inicial desviada: abre a cópia guardada', p.corpo === 'base /' || /^rede /.test(p.corpo), p.corpo);
  t('a página de bloqueio NÃO é guardada', ![...sw.guardado.values()].some(v => v.corpo === 'bloqueio'));
  /* /app-teste/ nunca vai para a cópia */
  sw.definirRede((r) => Promise.resolve(sw.resposta(r.url, 'rede ' + r.url)));
  await sw.navegar('/app-teste/'); await espera();
  t('/app-teste/ não é guardado', !sw.guardado.has('/app-teste/'));
  /* sem cópia nenhuma e sem rede: página "sem conexão" */
  const novo = montar(); await espera(); novo.guardado.delete('/app/');
  novo.definirRede(() => Promise.reject(new TypeError('x')));
  p = await novo.navegar('/app/');
  t('sem cópia e sem rede: mostra a página sem conexão', p && p.corpo === 'base /offline.html', p && p.corpo);
  process.exit(f ? 1 : 0);
})();
