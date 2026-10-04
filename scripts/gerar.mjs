/* Gera as páginas que saem de modelo: /app/, /app-teste/, /instalar/ e /instalar-teste/.
 * NUNCA edite essas quatro à mão: edite modelos/app.html ou modelos/instalar.html e rode este script
 * (o publicar.mjs já roda). A versão vem do app-config.js.
 * Uso: node scripts/gerar.mjs */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ler = (a) => readFileSync(join(raiz, a), 'utf8');

export function versaoAtual() {
  const m = ler('app-config.js').match(/version: '([0-9]+\.[0-9]+\.[0-9]+)'/);
  if (!m) throw new Error('versão não encontrada no app-config.js');
  return m[1];
}

export function gerar() {
  const versao = versaoAtual();
  const app = ler('modelos/app.html');
  const inst = ler('modelos/instalar.html');
  const manifesto = '  <link rel="manifest" href="/manifest.json">\n  <meta name="mobile-web-app-capable" content="yes">\n'
    + '  <meta name="apple-mobile-web-app-capable" content="yes">\n  <meta name="apple-mobile-web-app-title" content="CHECK-SELT">\n';
  const troca = (s, mapa) => Object.entries(mapa).reduce((t, [k, v]) => t.split(k).join(v), s);
  const saidas = {
    'app/index.html': troca(app, { __AMBIENTE__: '', __TITULO__: 'CHECK-SELT', __VERSAO__: versao, __MANIFESTO__: manifesto }),
    'app-teste/index.html': troca(app, { __AMBIENTE__: ' data-ambiente="teste"', __TITULO__: 'CHECK-SELT (TESTE)', __VERSAO__: versao, __MANIFESTO__: '' }),
    'instalar/index.html': troca(inst, { __APP__: '/app/', __SUFIXO__: '' }),
    'instalar-teste/index.html': troca(inst, { __APP__: '/app-teste/', __SUFIXO__: ' (TESTE)' }),
  };
  for (const [arq, html] of Object.entries(saidas)) {
    if (/__[A-Z]+__/.test(html)) throw new Error('marcador sem troca em ' + arq);
    writeFileSync(join(raiz, arq), html);
  }
  return Object.keys(saidas);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log('gerado (versão ' + versaoAtual() + '): ' + gerar().join(', '));
}
