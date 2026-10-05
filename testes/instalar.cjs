const fs=require('fs'),vm=require('vm');
function primeiro(arquivo,search,standalone,referrer){const h=fs.readFileSync(arquivo,'utf8');const js=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1])[0];let destino=null;
const w={matchMedia:()=>({matches:!!standalone})};const ctx={window:w,document:{referrer:referrer||'',documentElement:{getAttribute:()=>/data-app="\/app-teste\/"/.test(h)?'/app-teste/':'/app/',classList:{add(){}}}},location:{search,replace:u=>destino=u},navigator:{standalone:false},String};
vm.createContext(ctx);vm.runInContext(js,ctx);return {destino:w.CHECKSELT_DESTINO,redirecionou:destino};}
let f=0;const t=(r,v)=>{console.log((v?'ok   ':'ERRO ')+r);if(!v)f++};
let r=primeiro('instalar/index.html','?app=se&lote=AB&de=pwa-antigo');t('destino mantém app e lote, tira de',r.destino==='/app/?app=se&lote=AB'&&r.redirecionou===null);
r=primeiro('instalar/index.html','',true);t('aberto já instalado: segue direto para /app/',r.redirecionou==='/app/');
r=primeiro('instalar-teste/index.html','?app=se');t('instalar-teste vai para /app-teste/',r.destino==='/app-teste/?app=se');
r=primeiro('instalar/index.html','?a=1#x');t('consulta com # é descartada',r.destino==='/app/');
r=primeiro('instalar/index.html','?app=se&de=pwa-antigo',true);t('janela do ícone antigo (standalone + marca): NÃO segue sozinha',r.redirecionou===null&&r.destino==='/app/?app=se');
r=primeiro('instalar/index.html','',true,'https://n-abc-0lu-script.googleusercontent.com/');t('janela do ícone antigo sem marca, vindo do app: NÃO segue',r.redirecionou===null);
r=primeiro('instalar/index.html','?de=pwa-antigox',true);t('marca parecida não engana: segue',r.redirecionou==='/app/');
process.exit(f?1:0);
