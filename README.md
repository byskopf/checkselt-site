# checkselt.com

Site do CHECK-SELT (GitHub Pages, domínio checkselt.com). O app de verdade roda no Apps Script, embutido em `/app/`.

## Publicar

```
node scripts/publicar.mjs "o que mudou"
```

Sobe a versão, gera as páginas dos modelos, roda todos os testes, faz commit e push, espera o site servir a versão
nova e avisa o IndexNow se a página inicial mudou. Para no primeiro erro, sem publicar.

- `--ensaio`: só gera e testa, sem publicar.
- `--sem-versao`: para mudanças internas (scripts, testes), sem forçar atualização nos celulares.
- `--versao 1.1.0`: escolhe a versão.

Só testar: `node scripts/testar.mjs`.

## Não editar à mão

`app/`, `app-teste/`, `instalar/` e `instalar-teste/` saem de `modelos/app.html` e `modelos/instalar.html`
(`node scripts/gerar.mjs`). O teste acusa se alguém editou a página gerada.

Ícones: edite `icones-fonte/*.svg` e rode `node scripts/gerar-icones.mjs`; troque o `?v=` dos ícones nas páginas.

`modelos/`, `testes/`, `scripts/` e `icones-fonte/` ficam fora do site publicado (`_config.yml`).
