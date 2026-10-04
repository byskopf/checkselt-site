const fs=require('fs'),vm=require('vm');
function rodar(search){const html=fs.readFileSync('app/index.html','utf8');const js=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
const q={src:'',addEventListener(){}};const els={app:q,carregando:{innerHTML:'',style:{}},plano:{},direto:{}};let o=null;const h=[];
const ctx={window:{addEventListener:(t,f)=>{if(t==='message')o=f}},document:{documentElement:{getAttribute:()=>null},getElementById:id=>els[id]},location:{pathname:'/app/',search},history:{replaceState:(a,b,u)=>h.push(u)},setTimeout(){},Object};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('app-config.js','utf8').replace('var CHECKSELT_SITE_CONFIG','window.CHECKSELT_SITE_CONFIG'),ctx);vm.runInContext(js,ctx);return {q,o,h};}
let f=0;const t=(r,v)=>{console.log((v?'ok   ':'ERRO ')+r);if(!v)f++};
let r=rodar('?de=pwa-antigo');t('só a marca: some e o endereço fica limpo',r.q.src.endsWith('/exec')&&r.h[0]==='/app/');
r=rodar('?app=se&lote=AB&de=pwa-antigo');t('marca no fim: mantém app e lote',r.q.src.endsWith('/exec?app=se&lote=AB')&&r.h[0]==='/app/?app=se&lote=AB');
r=rodar('?de=pwa-antigo&foto=xx.yy');t('marca no começo: mantém a foto',r.q.src.endsWith('/exec?foto=xx.yy'));
r=rodar('?approval=tok&action=ok');t('sem marca: nada muda e não reescreve o endereço',r.q.src.endsWith('/exec?approval=tok&action=ok')&&r.h.length===0);
r=rodar('?deposito=1&de=x');t('não confunde "deposito" com "de"',r.q.src.endsWith('/exec?deposito=1'));
const fonte={postMessage(){}};r=rodar('');r.o({origin:'https://n-a-script.googleusercontent.com',data:{tipo:'checkselt-abrir',consulta:'?app=se&de=pwa-antigo'},source:fonte});
t('mensagem do app com marca: tira a marca',r.q.src.endsWith('/exec?app=se')&&r.h[0]==='/app/?app=se');
process.exit(f?1:0);
