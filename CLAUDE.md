# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Site estático do CHECK-SELT (GitHub Pages, domínio `checkselt.com`, repo `byskopf/checkselt-site`). Responda ao Luciano sempre em português. O app de verdade roda no Apps Script (outra sessão, "CHECK-SELT") e aqui só é embutido num iframe em `/app/`. Nunca edite o projeto do app; peça por SendMessage.

## Comandos

```
node scripts/testar.mjs                         # regenera as páginas, confere tudo e roda testes/*.cjs
node testes/sw.cjs                              # um teste só (também app, de, instalar, push)
node scripts/publicar.mjs --ensaio              # gera e testa, sem commit nem push
node scripts/publicar.mjs "o que mudou"         # sobe a versão, testa, commit, push, espera o Pages, IndexNow
node scripts/publicar.mjs "texto" --sem-versao  # mudança interna (scripts, testes), sem forçar atualização nos celulares
node scripts/gerar-icones.mjs                   # depois de editar icones-fonte/*.svg; troque o ?v= dos ícones nas páginas
```

`publicar.mjs` publica em produção: só rode com o "pode publicar" do Luciano na conversa desta sessão. Ele para no primeiro erro e confirma que `/modelos`, `/testes` e `/scripts` dão 404 no ar. Não há build nem lint além disso.

## Arquitetura (o que exige ler vários arquivos)

- **Páginas geradas.** `app/`, `app-teste/`, `instalar/` e `instalar-teste/` saem de `modelos/app.html` e `modelos/instalar.html` por `scripts/gerar.mjs` (placeholders `__AMBIENTE__`, `__TITULO__`, `__VERSAO__`, `__MANIFESTO__`, `__APP__`, `__SUFIXO__`). Edite só o modelo; o teste acusa página gerada alterada à mão. `index.html` é escrita à mão.
- **Versão em vários lugares.** `app-config.js` (`version`), `importScripts('/app-config.js?v=X')` em `sw.js`, e o `?v=` nos HTML (`index.html`, 404, offline, páginas geradas). `publicar.mjs` troca todos juntos; sem isso o celular que instalou fica com a página velha.
- **`appUrl` duplicado.** O endereço `/exec` do app está em `app-config.js` e também no `lt/app-config.js` do portal antigo (`byskopf/check-selt`) e no `abrir/index.html` do repo `byskopf/CHECK-SE`. Quando a sessão do app trocar, os três mudam juntos.
- **Iframe do app.** `#moldura` com `iframe#app` a 100% da tela (iframe com largura/altura automáticas vira 300x150; o `testar.mjs` mede isso no Chrome headless em 360, 390 e 1280 px). O atributo `allow` já libera geolocalização, microfone, câmera, área de transferência e web-share. `/app-teste/` embute o TESTE do app, tem `noindex` e nunca entra no cache. O app roda em armazenamento separado do site, por isso login e fila offline do app não "passam" entre o site e os portais antigos (por isso o parâmetro `de=pwa-antigo`, que `/app/` descarta).
- **Manifesto e escopo.** `manifest.json` tem `id: "/"`, `start_url` e `scope` em `/app/` (desde 1.0.17). Com escopo `/`, o app instalado capturava os links do site inteiro no Android. Não volte o escopo; `index.html` ainda redireciona para `/app/` quando abre em standalone, só para instalações antigas.
- **Service worker (`sw.js`).** Rede primeiro; guarda cópia de `/` e `/app/` para abrir em redes que bloqueiam o checkselt.com (CPFL/Cisco); não guarda `/app-teste/`, resposta de outra origem nem `opaqueredirect`. Também cuida dos avisos push (a página de cima assina, o service worker é do site). Teste: `testes/sw.cjs`.
- **Instalação.** `modelos/instalar.html` trata quem chega do ícone antigo (janela standalone do PWA antigo, sem `beforeinstallprompt`): mostra passos pelo menu ⋮ e não segue sozinho. Não há botão "Abrir agora" (abria no navegador).
- **Buscadores.** `robots.txt` libera tudo; `/app/`, `/instalar/` e variantes de teste usam `noindex` (não bloqueie por robots, o Google não leria o noindex). `sitemap.xml` muda de `lastmod` só quando a `index.html` muda, e então o `publicar` avisa o IndexNow (chave `22a5d224dc56b1099bcab224692794a7`).
- **Fora do site público.** `_config.yml` exclui `modelos`, `testes`, `scripts`, `icones-fonte` e `README.md`.

## Cuidados

- Edite arquivos com acentos pelo Edit/Write, nunca por `Get-Content | Set-Content` do PowerShell (quebra UTF-8); o teste confere palavra acentuada.
- Textos públicos sobre as ferramentas (cartões, "Sobre") vêm da lista da sessão do app: peça a ela antes de escrever. A imagem de prévia muda de nome a cada texto novo (`og-checkselt-AAAAMMDD.jpg`), porque o WhatsApp guarda por nome.
- Antes de `publicar`, `git fetch`: o repo `byskopf/check-selt` é da sessão do app, mas este é daqui. O `publicar` recusa se a `main` não estiver em dia.
