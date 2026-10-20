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

/* Tela "Abrindo o CHECK-SELT…": o visto do logo se desenha, segura e recomeça (só CSS, sem JavaScript; "reduzir movimento"
   deixa o visto pronto). Pedido do Luciano em 13/10/2026, igual à do app. Entra primeiro só no /app-teste/; a produção
   (/app/) passa a usar quando ele disser "publicar": troque ABERTURA_ANIMADA_NA_PRODUCAO para true. */
export const ABERTURA_ANIMADA_NA_PRODUCAO = true;
const ABERTURA_CSS = [
  '    #carregando .conteudo{display:flex;flex-direction:column;align-items:center;gap:14px}',
  '    #carregando svg{width:76px;height:76px;color:#0b2239}',
  '    #carregando .visto{stroke:#137a50;stroke-dasharray:34;stroke-dashoffset:34;animation:checkselt-visto 2s ease-in-out infinite}',
  '    @keyframes checkselt-visto{0%{stroke-dashoffset:34;opacity:1}40%{stroke-dashoffset:0;opacity:1}85%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}',
  '    @media (prefers-reduced-motion:reduce){#carregando .visto{animation:none;stroke-dashoffset:0}}',
  ''].join('\n');
const PLANO = 'checkselt.com<br><small id="plano" hidden>Se não abrir, <a id="direto" href="">tente de novo</a>.</small>';
const ABERTURA_ANIMADA = '  <div id="carregando" role="status"><div class="conteudo"><svg viewBox="0 0 48 48" aria-hidden="true" fill="none"><rect x="8" y="8" width="32" height="32" rx="8" stroke="currentColor" stroke-width="3"/><path class="visto" d="M16 25l6 6 11-13" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg><div>' + PLANO + '</div></div></div>';
const ABERTURA_SIMPLES = '  <div id="carregando" role="status"><div>' + PLANO + '</div></div>';

export function gerar() {
  const versao = versaoAtual();
  const app = ler('modelos/app.html');
  const inst = ler('modelos/instalar.html');
  const manifesto = '  <link rel="manifest" href="/manifest.json">\n  <meta name="mobile-web-app-capable" content="yes">\n'
    + '  <meta name="apple-mobile-web-app-capable" content="yes">\n  <meta name="apple-mobile-web-app-title" content="CHECK-SELT">\n';
  const troca = (s, mapa) => Object.entries(mapa).reduce((t, [k, v]) => t.split(k).join(v), s);
  const saidas = {
    'app/index.html': troca(app, { __AMBIENTE__: '', __TITULO__: 'CHECK-SELT', __VERSAO__: versao, __MANIFESTO__: manifesto,
      __ABERTURACSS__: ABERTURA_ANIMADA_NA_PRODUCAO ? ABERTURA_CSS : '', __ABERTURA__: ABERTURA_ANIMADA_NA_PRODUCAO ? ABERTURA_ANIMADA : ABERTURA_SIMPLES }),
    'app-teste/index.html': troca(app, { __AMBIENTE__: ' data-ambiente="teste"', __TITULO__: 'CHECK-SELT (TESTE)', __VERSAO__: versao, __MANIFESTO__: '',
      __ABERTURACSS__: ABERTURA_CSS, __ABERTURA__: ABERTURA_ANIMADA }),
    'instalar/index.html': troca(inst, { __APP__: '/app/', __SUFIXO__: '' }),
    'instalar-teste/index.html': troca(inst, { __APP__: '/app-teste/', __SUFIXO__: ' (TESTE)' }),
  };
  for (const [arq, html] of Object.entries(saidas)) {
    if (/__[A-Z]+__/.test(html) || html.includes('__ABERTURA')) throw new Error('marcador sem troca em ' + arq);
    writeFileSync(join(raiz, arq), html);
  }
  return Object.keys(saidas);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log('gerado (versão ' + versaoAtual() + '): ' + gerar().join(', '));
}
