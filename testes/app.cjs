const fs=require('fs'),vm=require('vm');
function rodar(arquivo,search,semConfig){
  const html=fs.readFileSync(arquivo,'utf8');const js=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
  const quadro={src:'',addEventListener(){}};const els={app:quadro,carregando:{innerHTML:'',style:{}},plano:{hidden:true},direto:{}};let ouvinte=null;const hist=[];
  const ctx={window:{addEventListener:(t,f)=>{if(t==='message')ouvinte=f}},document:{documentElement:{getAttribute:k=>/data-ambiente="teste"/.test(html)?'teste':null},getElementById:id=>els[id]},location:{pathname:arquivo.startsWith('app-teste')?'/app-teste/':'/app/',search},history:{replaceState:(a,b,u)=>hist.push(u)},setTimeout(){},Object};
  vm.createContext(ctx);if(!semConfig)vm.runInContext(fs.readFileSync('app-config.js','utf8').replace('var CHECKSELT_SITE_CONFIG','window.CHECKSELT_SITE_CONFIG'),ctx);vm.runInContext(js,ctx);
  return {quadro,ouvinte,hist,els};
}
let f=0;const t=(r,v)=>{console.log((v?'ok   ':'ERRO ')+r);if(!v)f++};
let r=rodar('app/index.html','?app=se&lote=AB12');t('produção com consulta',r.quadro.src.includes('AKfycbzo_WN')&&r.quadro.src.endsWith('?app=se&lote=AB12'));
const foto='?foto='+'A'.repeat(2900)+'.x';r=rodar('app/index.html',foto);t('link de foto longo (≈2900) passa',r.quadro.src.endsWith(foto));
r=rodar('app/index.html','?x=1',true);t('sem configuração: não monta endereço e mostra "Sem conexão"',r.quadro.src===''&&/Sem conexão/.test(r.els.carregando.innerHTML)&&r.ouvinte===null);
r=rodar('app/index.html','');const resp=[];const fonte={postMessage:m=>resp.push(m)};
r.ouvinte({origin:'https://n-ab-0lu-script.googleusercontent.com',data:{tipo:'checkselt-abrir',consulta:'?app=se'},source:fonte});
t('troca LT→SE responde e grava',resp.length===1&&r.quadro.src.endsWith('?app=se')&&r.hist[0]==='/app/?app=se');
const antes=r.quadro.src;r.ouvinte({origin:'https://x-script.googleusercontent.com.evil.com',data:{tipo:'checkselt-abrir',consulta:'?a'},source:fonte});
r.ouvinte({origin:'https://n-ab-script.googleusercontent.com',data:{tipo:'checkselt-abrir',consulta:'?'+'a'.repeat(3100)},source:fonte});
t('recusa origem falsa e texto longo demais',r.quadro.src===antes&&resp.length===1);
r=rodar('app-teste/index.html','?app=se');t('app-teste usa o TESTE',r.quadro.src.includes('AKfycbyrL8EqMn'));
const h=fs.readFileSync('app/index.html','utf8'),ht=fs.readFileSync('app-teste/index.html','utf8');
t('/app/ tem manifesto e /app-teste/ não',h.includes('rel="manifest"')&&!ht.includes('rel="manifest"'));
t('aviso de carregamento fica por cima',/#carregando\{position:fixed;inset:0;z-index:1;background:#fff/.test(h));
process.exit(f?1:0);
