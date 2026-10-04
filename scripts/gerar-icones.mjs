/* Gera os ícones PNG do checkselt.com a partir de icones-fonte/*.svg, com o Chrome instalado.
 * Uso: node scripts/gerar-icones.mjs  (depois suba a versão do app-config/sw para os ícones novos entrarem). */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdtempSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
if (!chrome) { console.error('Sem Chrome/Edge.'); process.exit(1); }
const SAIDAS = [
  ['icon-source.svg', 'icon-192.png', 192], ['icon-source.svg', 'icon-512.png', 512], ['icon-source.svg', 'apple-touch-icon.png', 180],
  ['icon-maskable-source.svg', 'icon-maskable-192.png', 192], ['icon-maskable-source.svg', 'icon-maskable-512.png', 512],
];
const tmp = mkdtempSync(join(tmpdir(), 'icones-'));
for (const [fonte, arquivo, lado] of SAIDAS) {
  const svg = readFileSync(join(raiz, 'icones-fonte', fonte), 'utf8');
  const html = join(tmp, arquivo + '.html');
  writeFileSync(html, `<!doctype html><html><head><style>html,body{margin:0;background:transparent}img{display:block;width:${lado}px;height:${lado}px}</style></head><body><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"></body></html>`);
  const png = join(tmp, arquivo);
  execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000', `--window-size=${lado},${lado}`, `--screenshot=${png}`, pathToFileURL(html).href], { stdio: 'ignore' });
  const b = readFileSync(png);
  const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
  if (w !== lado || h !== lado) { console.error(`${arquivo}: ${w}x${h}, esperado ${lado}`); process.exit(1); }
  copyFileSync(png, join(raiz, arquivo));
  console.log(`ok ${arquivo} ${w}x${h}`);
}
