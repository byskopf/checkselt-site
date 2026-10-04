/* Publica o checkselt.com de ponta a ponta. Para no primeiro problema, sem publicar nada.
 *   1) confere que o main local está em dia com o GitHub;
 *   2) sobe a versão (1.0.6 → 1.0.7) em app-config.js, sw.js e páginas — é o que faz o celular pegar a versão nova;
 *   3) gera /app/, /app-teste/, /instalar/ e /instalar-teste/ dos modelos;
 *   4) roda scripts/testar.mjs (sintaxe, versões, testes de comportamento, tela no Chrome);
 *   5) commit + push;
 *   6) espera o GitHub Pages servir a versão nova em https://checkselt.com e confere;
 *   7) se a página inicial mudou, avisa o Bing/IndexNow (o Google lê pelo sitemap).
 *
 * Uso:
 *   node scripts/publicar.mjs "o que mudou"                 (sobe o último número da versão)
 *   node scripts/publicar.mjs "o que mudou" --versao 1.1.0  (versão escolhida)
 *   node scripts/publicar.mjs "o que mudou" --sem-versao    (só ferramentas/arquivos internos; o celular não precisa atualizar)
 *   node scripts/publicar.mjs --ensaio "o que mudou"        (faz 1 a 4 e para antes do commit, desfazendo a versão) */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { raiz, versaoAtual, gerar } from './gerar.mjs';

const args = process.argv.slice(2);
const ensaio = args.includes('--ensaio');
const semVersao = args.includes('--sem-versao');
const iVersao = args.indexOf('--versao');
const versaoPedida = iVersao >= 0 ? args[iVersao + 1] : null;
const mensagem = args.filter((a, i) => !a.startsWith('--') && !(iVersao >= 0 && i === iVersao + 1)).join(' ').trim();
const SITE = 'https://checkselt.com';
const INDEXNOW = '22a5d224dc56b1099bcab224692794a7';

const parar = (msg) => { console.error('\nPAROU: ' + msg); process.exit(1); };
const git = (...a) => execFileSync('git', a, { cwd: raiz, encoding: 'utf8' }).trim();
const passo = (s) => console.log('\n== ' + s);

if (!mensagem) parar('falta dizer o que mudou. Ex.: node scripts/publicar.mjs "menu no celular"');
if (versaoPedida && !/^\d+\.\d+\.\d+$/.test(versaoPedida)) parar('--versao precisa ser como 1.2.3');

passo('1. GitHub em dia');
if (git('branch', '--show-current') !== 'main') parar('não está no main');
git('fetch', '--quiet', 'origin', 'main');
if (git('rev-list', '--count', 'HEAD..origin/main') !== '0') parar('o GitHub tem commits que não estão aqui (git pull antes)');
console.log('ok');

passo('2. Versão');
const anterior = versaoAtual();
let nova = anterior;
const tocados = ['app-config.js', 'sw.js', 'index.html', '404.html', 'offline.html'];
const originais = Object.fromEntries(tocados.map(a => [a, readFileSync(join(raiz, a), 'utf8')]));
if (!semVersao) {
  const [a, b, c] = anterior.split('.').map(Number);
  nova = versaoPedida || `${a}.${b}.${c + 1}`;
  if (nova === anterior) parar('a versão nova é igual à atual');
  for (const arq of tocados) {
    const s = originais[arq].split(`version: '${anterior}'`).join(`version: '${nova}'`)
      .split(`app-config.js?v=${anterior}`).join(`app-config.js?v=${nova}`);
    if (s !== originais[arq]) writeFileSync(join(raiz, arq), s);
  }
}
console.log(anterior === nova ? 'mantida ' + nova : anterior + ' → ' + nova);
const desfazerVersao = () => { for (const [a, c] of Object.entries(originais)) writeFileSync(join(raiz, a), c); gerar(); };

passo('3. Páginas geradas dos modelos');
console.log(gerar().join(', '));

/* Página inicial mudou desde o último commit? Então atualiza o sitemap e avisa o IndexNow no fim. */
const inicioMudou = git('status', '--porcelain', '--', 'index.html') !== '';
if (inicioMudou) {
  const hoje = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  const sm = readFileSync(join(raiz, 'sitemap.xml'), 'utf8');
  writeFileSync(join(raiz, 'sitemap.xml'), sm.replace(/<lastmod>[^<]+<\/lastmod>/, `<lastmod>${hoje}</lastmod>`));
}

passo('4. Testes');
const teste = spawnSync(process.execPath, [join(raiz, 'scripts', 'testar.mjs')], { cwd: raiz, stdio: 'inherit' });
if (teste.status !== 0) { if (!semVersao) desfazerVersao(); parar('testes falharam (versão devolvida para ' + anterior + ')'); }

if (ensaio) { if (!semVersao) desfazerVersao(); console.log('\nENSAIO ok: nada foi publicado; versão devolvida para ' + anterior + '.'); process.exit(0); }

passo('5. Commit e envio');
git('add', '-A');
if (git('status', '--porcelain') === '') parar('nada para publicar');
console.log(git('status', '--short'));
const titulo = semVersao ? 'Site: ' + mensagem : `Site ${nova}: ${mensagem}`;
git('commit', '--quiet', '-m', titulo + '\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>');
execFileSync('git', ['push', '--quiet', 'origin', 'main'], { cwd: raiz, stdio: 'inherit' });
console.log('enviado: ' + git('log', '-1', '--format=%h %s'));

passo('6. Esperando o checkselt.com servir a versão nova');
const espera = ms => new Promise(r => setTimeout(r, ms));
const commit = git('rev-parse', 'HEAD');
let noAr = false;
for (let i = 0; i < 40 && !noAr; i++) {
  await espera(15000);
  try {
    const b = await (await fetch(`https://api.github.com/repos/byskopf/checkselt-site/pages/builds/latest`, { headers: { 'User-Agent': 'checkselt-publicar' } })).json();
    const cfg = await (await fetch(`${SITE}/app-config.js?_=${Date.now()}`, { cache: 'no-store' })).text();
    const servida = (cfg.match(/version: '([^']+)'/) || [])[1];
    process.stdout.write(`  ${(i + 1) * 15}s: build ${b.status || '?'}${b.commit ? ' ' + b.commit.slice(0, 7) : ''}, site ${servida}\n`);
    if (b.status === 'errored') parar('o GitHub Pages falhou ao montar o site: ' + (b.error && b.error.message));
    noAr = servida === nova && (b.commit ? b.commit === commit && b.status === 'built' : true);
  } catch (e) { process.stdout.write('  (sem resposta: ' + e.message + ')\n'); }
}
if (!noAr) parar('passaram 10 minutos e o site ainda não mostra ' + nova + '. Confira em ' + SITE + '/app-config.js');
const naoPublicos = await Promise.all(['/modelos/app.html', '/testes/app.cjs', '/scripts/publicar.mjs'].map(async p => [p, (await fetch(SITE + p, { cache: 'no-store' })).status]));
for (const [p, s] of naoPublicos) if (s !== 404) console.log('  ATENÇÃO: ' + p + ' está público (HTTP ' + s + ')');
console.log('no ar: ' + nova);

passo('7. Buscadores');
if (inicioMudou) {
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: 'checkselt.com', key: INDEXNOW, keyLocation: `${SITE}/${INDEXNOW}.txt`, urlList: [SITE + '/'] }),
  });
  console.log('IndexNow: HTTP ' + r.status + (r.status === 200 || r.status === 202 ? ' (aceito)' : ''));
} else console.log('página inicial não mudou; nada a avisar');

console.log('\nPRONTO. ' + titulo);
