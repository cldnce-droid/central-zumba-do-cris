const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
let checks = 0;
function check(name, fn) { fn(); checks++; console.log('PASS '+name); }
const tables = {
 Alunos: [['id','nome','whatsapp','statusCadastro','statusPagamento','plano'], ['A1','Maria','48999999999','ativo','atrasado','2x'], ['A2','Ana','48888888888','ativo','atrasado','1x']],
 Conquistas: [['id','alunoId','nomeAluno','tipo','titulo','coreografia','dataConquista','observacao']]
};
let calls=[], lockAllowed=true, failDecision=false;
function sheet(name) { return {
 getLastColumn:()=>tables[name][0].length, getLastRow:()=>tables[name].length,
 appendRow:row=>tables[name].push(row),
 getRange:(r,c,n=1,m=1)=>({
  getValues:()=>{calls.push(['read',name,r,c,n,m]);return Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>tables[name][r-1+i]?.[c-1+j]??''));},
  setValue:v=>{ calls.push(['write-cell',name,r,c]); tables[name][r-1][c-1]=v; },
  setValues:rows=>{ if(failDecision&&name==='SolicitacoesSelos') {failDecision=false;throw Error('interrupted');} rows.forEach((row,i)=>row.forEach((v,j)=>tables[name][r-1+i][c-1+j]=v)); }
 })
}; }
const context = vm.createContext({ console:{error(){}}, Date, SpreadsheetApp:{flush(){},getActiveSpreadsheet:()=>({getSheetByName:n=>tables[n]?sheet(n):null,insertSheet:n=>{tables[n]=[];return sheet(n);}})}, LockService:{getScriptLock:()=>({tryLock:()=>lockAllowed,releaseLock(){}})}, ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({setMimeType:()=>text})},Utilities:{formatDate:d=>d.toISOString().slice(0,10)},Session:{getScriptTimeZone:()=> 'America/Sao_Paulo'} });
const source=fs.readFileSync(path.join(root,'GOOGLE_APPS_SCRIPT_SETUP.md'),'utf8').replace(/\r\n/g,'\n').split('```javascript\n')[1].split('\n```')[0];
vm.runInContext(source,context);
function action(action,data={}) {return JSON.parse(context.doPost({postData:{contents:JSON.stringify({secret:'COLOQUE_UM_SEGREDO_FORTE_AQUI',action,data})}}));}
check('payment writes only target cell and preserves other student',()=>{
 const r=action('updateAluno',{id:'A1',statusPagamento:'pago'});assert.equal(r.ok,true);assert.equal(tables.Alunos[1][4],'pago');assert.equal(tables.Alunos[2][4],'atrasado');assert(calls.some(c=>c[0]==='write-cell'));assert(!calls.some(c=>c[0]==='read'&&c[4]>1&&c[5]>1));
});
check('missing payment column gives actionable error',()=>{tables.Alunos[0][4]='wrong';assert.match(action('updateAluno',{id:'A1',statusPagamento:'pago'}).error,/statusPagamento/);tables.Alunos[0][4]='statusPagamento';});
check('manual sofa grant is idempotent',()=>{assert(action('concederSelo',{alunoId:'A1',selo:'sofa'}).ok);action('concederSelo',{alunoId:'A1',selo:'sofa'});assert.equal(tables.Conquistas.length,2);});
check('Patriota request cannot self approve and cannot duplicate',()=>{const data={alunoId:'A1',whatsapp:'48999999999',status:'aprovada'};assert.equal(action('solicitarSeloPatriota',data).data.status,'solicitada');action('solicitarSeloPatriota',data);assert.equal(tables.SolicitacoesSelos.length,2);assert.equal(tables.Conquistas.length,2);});
check('wrong phone is rejected',()=>{assert.equal(action('solicitarSeloPatriota',{alunoId:'A2',whatsapp:'48999999999'}).ok,false);});
check('approval retry after interrupted request update never duplicates badge',()=>{failDecision=true;assert.equal(action('decidirSelo',{id:'SOL_A1_PATRIOTA_2026_09_07',aprovar:true}).ok,false);const result=action('decidirSelo',{id:'SOL_A1_PATRIOTA_2026_09_07',aprovar:true});assert.equal(result.data.status,'aprovada');assert.equal(tables.Conquistas.length,3);});
check('stale rejection cannot revoke approved badge',()=>{assert.equal(action('decidirSelo',{id:'SOL_A1_PATRIOTA_2026_09_07',aprovar:false}).data.status,'aprovada');});
check('rejection grants no badge, professor may later correct manually',()=>{action('solicitarSeloPatriota',{alunoId:'A2',whatsapp:'48888888888'});assert.equal(action('decidirSelo',{id:'SOL_A2_PATRIOTA_2026_09_07',aprovar:false}).data.status,'recusada');assert.equal(tables.Conquistas.length,3);action('concederSelo',{alunoId:'A2',selo:'patriota'});assert.equal(action('consultarSeloPatriota',{alunoId:'A2',whatsapp:'48888888888'}).data.status,'aprovada');});
check('lock contention is an explicit retryable error',()=>{lockAllowed=false;assert.match(action('updateAluno',{id:'A1',statusPagamento:'atrasado'}).error,/ocupada/);lockAllowed=true;});

const storage = new Map();
global.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
global.window={setTimeout,clearTimeout};
const loaded={};
function load(file){file=path.resolve(root,file);if(loaded[file])return loaded[file].exports;const mod={exports:{}};loaded[file]=mod;const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',js)(id=>id.startsWith('@/')?load(id.slice(2)+(fs.existsSync(path.join(root,id.slice(2)+'.ts'))?'.ts':'/index.ts')):require(id),mod,mod.exports);return mod.exports;}
(async()=>{
 const sheets=load('lib/services/googleSheetsService.ts'), professor=load('lib/services/professorService.ts');
 sheets.replaceCachedSheet('Alunos',[{id:'A1',statusPagamento:'atrasado'}]);
 let release;global.fetch=()=>new Promise(resolve=>release=resolve);
 const saving=professor.atualizarStatusPagamento('A1','pago');
 assert.equal(sheets.getCachedSheet('Alunos')[0].statusPagamento,'atrasado');
 release(new Response(JSON.stringify({error:'Falha real'}),{status:500}));await assert.rejects(saving,/Falha real/);
 assert.equal(sheets.getCachedSheet('Alunos')[0].statusPagamento,'atrasado');console.log('PASS failed write never changes local payment');checks++;
 let requests=0;global.fetch=async()=>{requests++;return new Response('{}');};
 await professor.atualizarStatusPagamento('A1','pago');assert.equal(requests,1);assert.equal(sheets.getCachedSheet('Alunos')[0].statusPagamento,'pago');console.log('PASS successful toggle uses exactly one request');checks++;
 global.fetch=()=>new Promise(resolve=>release=resolve);const sync=sheets.syncGoogleSheetsData(['Alunos']);
 sheets.updateCachedRow('Alunos','A1',{statusPagamento:'pago'});release(new Response(JSON.stringify({configured:true,data:[{id:'A1',statusPagamento:'atrasado'}]})));await sync;assert.equal(sheets.getCachedSheet('Alunos')[0].statusPagamento,'pago');console.log('PASS stale read cannot overwrite successful write');checks++;
 requests=0;global.fetch=()=>{requests++;return new Promise(resolve=>release=resolve);};const r1=sheets.readSheet('Alunos'),r2=sheets.readSheet('Alunos');assert.equal(requests,1);release(new Response(JSON.stringify({configured:true,data:[]})));await Promise.all([r1,r2]);console.log('PASS identical in-flight reads share one request');checks++;
 console.log(`${checks} regression checks passed`);
})().catch(e=>{console.error(e);process.exitCode=1;});
