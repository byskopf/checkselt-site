const fs=require('fs'),vm=require('vm');
function primeiro(arquivo,search,standalone){const h=fs.readFileSync(arquivo,'utf8');const js=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1])[0];let destino=null;
const w={matchMedia:()=>({matches:!!standalone})};const ctx={window:w,document:{documentElement:{getAttribute:()=>/data-app="\/app-teste\/"/.test(h)?'/app-teste/':'/app/',classList:{add(){}}}},location:{search,replace:u=>destino=u},navigator:{standalone:false},String};
vm.createContext(ctx);vm.runInContext(js,ctx);return {destino:w.CHECKSELT_DESTINO,redirecionou:destino};}
let f=0;const t=(r,v)=>{console.log((v?'ok   ':'ERRO ')+r);if(!v)f++};
let r=primeiro('instalar/index.html','?app=se&lote=AB&de=pwa-antigo');t('destino mantém app e lote, tira de',r.destino==='/app/?app=se&lote=AB'&&r.redirecionou===null);
r=primeiro('instalar/index.html','',true);t('aberto já instalado: segue direto para /app/',r.redirecionou==='/app/');
r=primeiro('instalar-teste/index.html','?app=se');t('instalar-teste vai para /app-teste/',r.destino==='/app-teste/?app=se');
r=primeiro('instalar/index.html','?a=1#x');t('consulta com # é descartada',r.destino==='/app/');
process.exit(f?1:0);
