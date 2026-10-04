const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('app/index.html','utf8');const js=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
function montar(opc){const q={src:'',addEventListener(){}};const els={app:q,carregando:{innerHTML:'',style:{}},plano:{},direto:{}};let ouvinte=null;const badges=[];const idb=[];
 const sub={toJSON:()=>({endpoint:'https://fcm/x',keys:{p256dh:'P',auth:'A'}}),unsubscribe:()=>Promise.resolve(true)};
 const reg={pushManager:{getSubscription:()=>Promise.resolve(opc.inscrito?sub:null),subscribe:(o)=>{opc.chaveUsada=o.applicationServerKey;return Promise.resolve(sub)}}};
 const nav={serviceWorker:{register:()=>Promise.resolve(),ready:Promise.resolve(reg)},setAppBadge:n=>badges.push(n),clearAppBadge:()=>badges.push(0)};
 const win={addEventListener:(t,f)=>{if(t==='message')ouvinte=f}};if(opc.suporte){win.PushManager=function(){};win.Notification={}};
 const ctx={window:win,navigator:nav,Notification:{permission:opc.perm||'default',requestPermission:()=>Promise.resolve(opc.resposta||'granted')},atob:s=>Buffer.from(s,'base64').toString('binary'),Uint8Array,
  indexedDB:{open:()=>{const r={};setTimeout(()=>{r.result={transaction:()=>{const tx={objectStore:()=>({put:(v,k)=>idb.push([k,v])})};setTimeout(()=>tx.oncomplete&&tx.oncomplete());return tx},createObjectStore(){}};r.onsuccess&&r.onsuccess()});return r}},
  document:{documentElement:{getAttribute:()=>null},getElementById:id=>els[id]},location:{pathname:'/app/',search:''},history:{replaceState(){}},setTimeout,Promise,Object,String,Number,isFinite,Math};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('app-config.js','utf8').replace('var CHECKSELT_SITE_CONFIG','window.CHECKSELT_SITE_CONFIG'),ctx);
 ctx.window.CHECKSELT_SITE_CONFIG=ctx.window.CHECKSELT_SITE_CONFIG;vm.runInContext(js,ctx);return {ouvinte,badges,idb};}
const O='https://n-ab-0lu-script.googleusercontent.com';
(async()=>{let f=0;const t=(r,v)=>{console.log((v?'ok   ':'ERRO ')+r);if(!v)f++};const espera=()=>new Promise(r=>setTimeout(r,20));
 let resp=[];let a=montar({suporte:false});a.ouvinte({origin:O,data:{tipo:'checkselt-push-estado'},source:{postMessage:m=>resp.push(m)}});await espera();
 t('sem suporte: estado suportado=false',resp[0]&&resp[0].tipo==='checkselt-push-estado'&&resp[0].suportado===false);
 resp=[];a=montar({suporte:true,perm:'granted',inscrito:true});a.ouvinte({origin:O,data:{tipo:'checkselt-push-estado'},source:{postMessage:m=>resp.push(m)}});await espera();
 t('com suporte: permissao e inscrito',resp[0]&&resp[0].suportado===true&&resp[0].permissao==='granted'&&resp[0].inscrito===true);
 resp=[];const opc={suporte:true};a=montar(opc);const chave='BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
 a.ouvinte({origin:O,data:{tipo:'checkselt-push-assinar',chavePublica:chave},source:{postMessage:m=>resp.push(m)}});await espera();await espera();
 t('assinar: devolve toJSON e usou a chave (65 bytes)',resp[0]&&resp[0].tipo==='checkselt-push-assinatura'&&resp[0].assinatura.keys.auth==='A'&&opc.chaveUsada&&opc.chaveUsada.length===65);
 resp=[];a=montar({suporte:true,resposta:'denied'});a.ouvinte({origin:O,data:{tipo:'checkselt-push-assinar',chavePublica:chave},source:{postMessage:m=>resp.push(m)}});await espera();await espera();
 t('permissão negada: erro "negado"',resp[0]&&resp[0].tipo==='checkselt-push-erro'&&resp[0].motivo==='negado');
 resp=[];a=montar({suporte:true});a.ouvinte({origin:O,data:{tipo:'checkselt-push-assinar',chavePublica:'<script>'},source:{postMessage:m=>resp.push(m)}});await espera();
 t('chave inválida recusada',resp[0]&&resp[0].motivo==='chave-invalida');
 a=montar({suporte:true});a.ouvinte({origin:O,data:{tipo:'checkselt-push-id',id:'abcDEF0123456789abcdef'},source:{postMessage(){}}});await espera();await espera();
 t('id válido vai para o IndexedDB com base e caminho',a.idb[0]&&a.idb[0][0]==='atual'&&a.idb[0][1].id==='abcDEF0123456789abcdef'&&a.idb[0][1].caminho==='/app/'&&/AKfycbzo_WN/.test(a.idb[0][1].base));
 a=montar({suporte:true});a.ouvinte({origin:O,data:{tipo:'checkselt-push-id',id:'../x'},source:{postMessage(){}}});await espera();
 t('id inválido ignorado',a.idb.length===0);
 a=montar({suporte:true});a.ouvinte({origin:O,data:{tipo:'checkselt-badge',n:3},source:{}});a.ouvinte({origin:O,data:{tipo:'checkselt-badge',n:0},source:{}});a.ouvinte({origin:O,data:{tipo:'checkselt-badge',n:'x'},source:{}});
 t('badge 3, depois limpa, ignora lixo',a.badges.join()==='3,0');
 resp=[];a=montar({suporte:true});a.ouvinte({origin:'https://evil.com',data:{tipo:'checkselt-push-estado'},source:{postMessage:m=>resp.push(m)}});await espera();
 t('origem estranha ignorada',resp.length===0);
 process.exit(f?1:0)})();
