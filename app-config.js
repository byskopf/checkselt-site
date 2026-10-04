/* Configuração do app instalado a partir de checkselt.com.
   O appUrl tem de ser o MESMO do portal antigo (byskopf/check-selt, lt/app-config.js): quando um mudar,
   o outro muda junto. A versão sobe a cada mudança, junto com o importScripts do sw.js. */
var CHECKSELT_SITE_CONFIG = Object.freeze({
  version: '1.0.3',
  appUrl: 'https://script.google.com/macros/s/AKfycbzo_WN_PzoRhS-LhV070vmE8GDr1vJX9qEa1iqxADe6kVhNZa968olZLVVDAtObmvE/exec',
  /* TESTE do app, só para a página /app-teste/ (sem link no site). */
  appUrlTeste: 'https://script.google.com/macros/s/AKfycbyrL8EqMnFFHwq4VqhjvFJinaQYMsxobJ2bv93FYR5-HqRVjY9BdUbbIHj8iOjY-Sc/exec'
});
