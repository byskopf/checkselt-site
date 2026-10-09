/* Clique no aviso push: reaproveita só a janela do MESMO caminho (/app/ não pode sequestrar /app-teste/). */
const fs = require('fs'), vm = require('vm');
let falhas = 0;
const t = (r, ok, extra) => { console.log((ok ? 'ok    ' : 'ERRO  ') + r + (ok || extra === undefined ? '' : ' — ' + extra)); if (!ok) falhas++; };

function cliqueCom(urlDoAviso, janelas) {
  const ouvintes = {}, abertas = [], navegadas = [];
  const self = {
    location: { origin: 'https://checkselt.com' }, addEventListener: (n, f) => { ouvintes[n] = f; }, skipWaiting() {},
    clients: {
      claim() {}, matchAll: () => Promise.resolve(janelas.map(u => ({ url: u, navigate(alvo) { navegadas.push([u, alvo]); return Promise.resolve(this); }, focus() { return Promise.resolve(this); } }))),
      openWindow: (u) => { abertas.push(u); return Promise.resolve({}); },
    },
    registration: {}, CHECKSELT_SITE_CONFIG: { version: '9.9.9' },
  };
  const ctx = { self, URL, Promise, console, caches: { open: () => Promise.resolve({}), keys: () => Promise.resolve([]) }, importScripts() {}, fetch: () => Promise.reject(new Error('sem rede')), Request: function (u) { this.url = u; }, indexedDB: undefined };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('sw.js', 'utf8'), ctx);
  let espera;
  ouvintes.notificationclick({ notification: { close() {}, data: urlDoAviso ? { url: urlDoAviso } : null }, waitUntil: (p) => { espera = p; } });
  return espera.then(() => ({ abertas, navegadas }));
}

(async () => {
  let r = await cliqueCom('/app/?abrir=x', ['https://checkselt.com/app-teste/']);
  t('janela do TESTE aberta: o aviso de produção abre uma janela nova e não toca na do teste', r.navegadas.length === 0 && r.abertas.length === 1 && r.abertas[0] === '/app/?abrir=x', JSON.stringify(r));
  r = await cliqueCom('/app/?abrir=x', ['https://checkselt.com/app/']);
  t('janela do /app/ aberta: reaproveita essa janela', r.navegadas.length === 1 && r.navegadas[0][0] === 'https://checkselt.com/app/' && r.abertas.length === 0, JSON.stringify(r));
  r = await cliqueCom('/app-teste/', ['https://checkselt.com/app/']);
  t('aviso do teste não toma a janela de produção', r.navegadas.length === 0 && r.abertas.length === 1, JSON.stringify(r));
  r = await cliqueCom(null, []);
  t('sem janela e sem dados: abre /app/', r.abertas.length === 1 && r.abertas[0] === '/app/', JSON.stringify(r));
  console.log(falhas ? '\n' + falhas + ' falha(s).' : '\nnotificacao ok.');
  process.exit(falhas ? 1 : 0);
})();
