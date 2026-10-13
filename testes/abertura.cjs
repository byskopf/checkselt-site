/* Tela "Abrindo o CHECK-SELT…": o visto animado (só CSS) entra no /app-teste/ e, na produção, só quando o gerador liberar. */
const fs = require('fs');
let falhas = 0;
const t = (r, ok, extra) => { console.log((ok ? 'ok    ' : 'ERRO  ') + r + (ok || extra === undefined ? '' : ' — ' + extra)); if (!ok) falhas++; };
const teste = fs.readFileSync('app-teste/index.html', 'utf8'), prod = fs.readFileSync('app/index.html', 'utf8');
const gerador = fs.readFileSync('scripts/gerar.mjs', 'utf8');
const naProducao = /ABERTURA_ANIMADA_NA_PRODUCAO = true/.test(gerador);
const animada = (h) => /class="visto"/.test(h) && /@keyframes checkselt-visto/.test(h);
t('/app-teste/: visto animado', animada(teste));
t('/app-teste/: "reduzir movimento" deixa o visto pronto', /prefers-reduced-motion:reduce\)\{#carregando \.visto\{animation:none;stroke-dashoffset:0\}/.test(teste));
t('/app/: ' + (naProducao ? 'visto animado (liberado)' : 'ainda sem a animação (só no teste até o "publicar")'), animada(prod) === naProducao);
for (const [nome, h] of [['/app-teste/', teste], ['/app/', prod]]) {
  t(nome + ': #carregando, #plano e #direto continuam (o script da página usa os três)', /id="carregando"/.test(h) && /id="plano" hidden/.test(h) && /id="direto"/.test(h));
  t(nome + ': sem JavaScript novo na animação', !/visto[^<]{0,200}\.(animate|style\.)/.test(h));
}
console.log(falhas ? '\n' + falhas + ' falha(s).' : '\nabertura ok.');
process.exit(falhas ? 1 : 0);
