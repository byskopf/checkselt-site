/* Confere o site ANTES de publicar. Sai com código 1 se algo falhar.
 *  1) sintaxe de todo JavaScript (sw.js, app-config.js e os <script> das páginas);
 *  2) a mesma versão em app-config.js, sw.js e em todo app-config.js?v= das páginas;
 *  3) as páginas geradas batem com os modelos (ninguém editou /app/ ou /instalar/ à mão);
 *  4) os testes de comportamento de testes/*.cjs (troca LT↔SE, marca de=, avisos, instalar);
 *  5) no Chrome, em tamanho de celular: o app ocupa a tela toda (já saiu 300x150 uma vez) e a
 *     página inicial não rola para o lado.
 * Uso: node scripts/testar.mjs   (--sem-chrome pula o item 5) */
import { readFileSync, readdirSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';
import { raiz, versaoAtual, gerar } from './gerar.mjs';

let falhas = 0;
const t = (rotulo, ok, extra) => { console.log((ok ? 'ok    ' : 'ERRO  ') + rotulo + (ok || !extra ? '' : ' — ' + extra)); if (!ok) falhas++; };
const ler = (a) => readFileSync(join(raiz, a), 'utf8');
const PAGINAS = ['index.html', '404.html', 'offline.html', 'app/index.html', 'app-teste/index.html', 'instalar/index.html', 'instalar-teste/index.html'];

/* 3 primeiro: gera de novo e vê se algo mudou (gerar() reescreve com o mesmo conteúdo se estiver em dia). */
const antes = Object.fromEntries(['app/index.html', 'app-teste/index.html', 'instalar/index.html', 'instalar-teste/index.html'].map(a => [a, ler(a)]));
gerar();
for (const [a, c] of Object.entries(antes)) t('gerada do modelo: ' + a, ler(a) === c, 'estava diferente do modelo; foi regenerada (confira se alguém editou à mão)');

/* 1 */
for (const a of ['sw.js', 'app-config.js']) { try { new vm.Script(ler(a)); t('sintaxe ' + a, true); } catch (e) { t('sintaxe ' + a, false, e.message); } }
for (const a of PAGINAS) {
  const h = ler(a);
  try { [...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach(m => new vm.Script(m[1])); t('sintaxe ' + a, true); }
  catch (e) { t('sintaxe ' + a, false, e.message); }
  t('acentos em UTF-8 ' + a, !h.includes('\uFFFD') && !/Ã[£§©¡³ª]/.test(h));
}
try { JSON.parse(ler('manifest.json')); t('manifest.json válido', true); } catch (e) { t('manifest.json válido', false, e.message); }

/* 2 */
const v = versaoAtual();
t('sw.js importa app-config.js?v=' + v, ler('sw.js').includes("importScripts('/app-config.js?v=" + v + "')"));
for (const a of PAGINAS) {
  const vs = [...ler(a).matchAll(/app-config\.js\?v=([0-9.]+)/g)].map(m => m[1]);
  if (vs.length) t('versão ' + v + ' em ' + a, vs.every(x => x === v), 'achei ' + vs.join(', '));
}

/* 4 */
for (const f of readdirSync(join(raiz, 'testes')).filter(f => f.endsWith('.cjs')).sort()) {
  const r = spawnSync(process.execPath, [join(raiz, 'testes', f)], { cwd: raiz, encoding: 'utf8' });
  const erros = (r.stdout || '').split('\n').filter(l => l.startsWith('ERRO'));
  t('testes/' + f, r.status === 0, erros.join(' | ') || (r.stderr || '').split('\n')[0]);
}

/* 5 */
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
if (process.argv.includes('--sem-chrome')) console.log('--    Chrome pulado (--sem-chrome)');
else if (!chrome) t('Chrome instalado para medir a tela', false);
else await medirNoChrome();

async function medirNoChrome() {
  const perfil = mkdtempSync(join(tmpdir(), 'site-teste-'));
  const porta = 9400 + Math.floor(Math.random() * 400);
  const p = spawn(chrome, ['--headless=new', '--remote-debugging-port=' + porta, '--user-data-dir=' + perfil, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  const espera = ms => new Promise(r => setTimeout(r, ms));
  try {
    let alvos;
    for (let i = 0; i < 60 && !alvos; i++) { try { alvos = await (await fetch('http://127.0.0.1:' + porta + '/json')).json(); } catch { await espera(250); } }
    const ws = new WebSocket(alvos.find(x => x.type === 'page').webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    let n = 0; const pend = new Map();
    ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
    const cdp = (method, params = {}) => new Promise(r => { const i = ++n; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const avaliar = async (expr) => (await cdp('Runtime.evaluate', { expression: expr, returnByValue: true })).result.result.value;
    const abrir = async (arq, w, h) => {
      await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
      await cdp('Page.navigate', { url: pathToFileURL(join(raiz, arq)).href });
      await espera(1200);
    };
    for (const [w, h] of [[360, 740], [390, 844], [1280, 800]]) {
      await abrir('app/index.html', w, h);
      const r = await avaliar("(()=>{const f=document.getElementById('app').getBoundingClientRect();return [Math.round(f.width),Math.round(f.height)]})()");
      t(`app ocupa a tela em ${w}x${h}`, r && r[0] === w && r[1] === h, 'iframe ' + (r ? r.join('x') : '?'));
      await abrir('index.html', w, h);
      const sw = await avaliar('document.documentElement.scrollWidth');
      t(`página inicial sem rolar para o lado em ${w}px`, sw <= w, 'largura ' + sw);
    }
    ws.close();
  } catch (e) { t('medição no Chrome', false, e.message); }
  finally { p.kill(); await espera(300); try { rmSync(perfil, { recursive: true, force: true }); } catch {} }
}

console.log(falhas ? '\n' + falhas + ' falha(s). NÃO publique.' : '\nTudo certo.');
process.exit(falhas ? 1 : 0);
