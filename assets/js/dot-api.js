/* screenings4u DOT Management Portal — instant cached backend adapter */
(()=>{
"use strict";
const cfg=()=>window.DOT_PORTAL_CONFIG;
const CACHE_PREFIX='s4u-dot-api-v7:';
const MEM=new Map(), INFLIGHT=new Map();
let sessionMemo=null,sessionMemoAt=0,warming=false;
const READ_ACTIONS=new Set(['overview','plans','ctpas','employers','owner_operators','drivers','portal_access','programs','pools','pool_members','selections','clearinghouse','new_entrant','rtd','follow_up_testing','compliance','services','documents','notifications','reports','customer_detail','locations','integrations','consents','credentials','training','support','audit_history','billing','orders','testing','results']);
const FAST_READ_ACTIONS=new Set(['plans','ctpas','employers','owner_operators','drivers','programs','pools','selections','clearinghouse','rtd','follow_up_testing','compliance','orders','testing','results','locations','integrations','audit_history']);
async function session(){if(sessionMemo&&Date.now()-sessionMemoAt<3600000)return sessionMemo;const {data,error}=await window.dotSupabase.auth.getSession();if(error)throw error;if(!data?.session?.access_token)throw new Error('Your DOT management session has expired.');sessionMemo=data.session;sessionMemoAt=Date.now();return sessionMemo}
function errorText(v){if(!v)return'';if(typeof v==='string')return v;if(v instanceof Error)return v.message||String(v);if(typeof v==='object')return v.message||v.error_description||v.details||v.hint||(()=>{try{return JSON.stringify(v)}catch{return String(v)}})();return String(v)}
function key(functionName,body){try{return CACHE_PREFIX+functionName+':'+btoa(unescape(encodeURIComponent(JSON.stringify(body||{})))).slice(0,700)}catch{return CACHE_PREFIX+functionName+':'+String(body?.action||'')}}
function readRecord(k){if(MEM.has(k))return MEM.get(k);for(const store of [sessionStorage,localStorage]){try{const x=JSON.parse(store.getItem(k)||'null');if(x){MEM.set(k,x);return x}}catch{}}return null}
function getCached(k,maxAge=3600000,staleAge=2592000000){const x=readRecord(k);if(!x)return{data:null,fresh:false};const age=Date.now()-Number(x.t||0);return {data:age<staleAge?x.d:null,fresh:age<maxAge}}
function setCached(k,d){const x={t:Date.now(),d};MEM.set(k,x);try{sessionStorage.setItem(k,JSON.stringify(x))}catch{}try{localStorage.setItem(k,JSON.stringify(x))}catch{}}
function clearCache(){MEM.clear();for(const store of [sessionStorage,localStorage]){try{Object.keys(store).filter(k=>k.startsWith(CACHE_PREFIX)).forEach(k=>store.removeItem(k))}catch{}}}

function primeAction(action,data){if(!data)return;const body={action},k=key(cfg().managementFunction,body);setCached(k,data)}
function primeFromOverview(d){if(!d||typeof d!=='object')return;const map={
 ctpas:['ctpas'],employers:['employers'],owner_operators:['owner_operators'],drivers:['drivers','employees'],programs:['programs'],pools:['pools'],selections:['selections'],testing:['testing_orders','orders'],results:['results','test_results','reports','test_result_reports'],compliance:['compliance_cases','cases'],audit_history:['audit_events','audit']
};for(const [action,keys] of Object.entries(map)){const out={};let found=false;for(const k of keys){if(Array.isArray(d[k])){out[k]=d[k];found=true}}if(found)primeAction(action,out)}}

async function fastRead(action){
  if(!FAST_READ_ACTIONS.has(action))return null;
  const k='rpc:'+action;if(INFLIGHT.has(k))return INFLIGHT.get(k);
  const job=(async()=>{
    const {data,error}=await window.dotSupabase.rpc('dot_management_fast_read',{p_action:action});
    if(error)throw new Error(errorText(error));
    return data;
  })();
  INFLIGHT.set(k,job);
  try{return await job}finally{INFLIGHT.delete(k)}
}
async function rawInvoke(functionName,body={}){const k='net:'+key(functionName,body);if(INFLIGHT.has(k))return INFLIGHT.get(k);const job=(async()=>{const s=await session();const url=`${cfg().supabaseUrl}/functions/v1/${functionName}`;const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${s.access_token}`,'apikey':cfg().supabaseAnonKey},body:JSON.stringify(body),keepalive:true});const d=await r.json().catch(()=>({}));if(!r.ok||d?.error)throw new Error(errorText(d?.error)||errorText(d?.message)||`DOT request failed (${r.status}).`);return d})();INFLIGHT.set(k,job);try{return await job}finally{INFLIGHT.delete(k)}}
function refreshInBackground(functionName,body,k){if(INFLIGHT.has('bg:'+k))return;const p=rawInvoke(functionName,body).then(d=>setCached(k,d)).catch(()=>{}).finally(()=>INFLIGHT.delete('bg:'+k));INFLIGHT.set('bg:'+k,p)}
async function invoke(functionName,body={},options={}){const action=String(body?.action||'');const cacheable=options.cache===true||['list','get','detail','context'].includes(action);const k=key(functionName,body);if(cacheable&&!options.fresh){const hit=getCached(k,Number(options.ttl||3600000),Number(options.staleTtl||2592000000));if(hit.data){if(!hit.fresh)refreshInBackground(functionName,body,k);return hit.data}}const d=await rawInvoke(functionName,body);if(cacheable)setCached(k,d);else if(action&&!['list','get','detail','context'].includes(action))clearCache();return d}
async function call(action,extra={},options={}){
 const body={action,...extra},cacheable=READ_ACTIONS.has(action),k=key(cfg().managementFunction,body);
 if(cacheable&&!options.fresh){const hit=getCached(k,Number(options.ttl||3600000),Number(options.staleTtl||2592000000));if(hit.data){if(!hit.fresh){(async()=>{try{const fresh=Object.keys(extra||{}).length===0?await fastRead(action):null;if(fresh)setCached(k,fresh);else refreshInBackground(cfg().managementFunction,body,k)}catch{refreshInBackground(cfg().managementFunction,body,k)}})()}return hit.data}}
 let d=null;
 if(cacheable&&Object.keys(extra||{}).length===0){try{d=await fastRead(action)}catch(e){console.warn('[DOT fast read fallback]',action,e)}}
 if(!d)d=await rawInvoke(cfg().managementFunction,body);
 if(cacheable){setCached(k,d);if(action==='overview')primeFromOverview(d)}else clearCache();return d
}
async function prefetch(action,extra={}){if(!READ_ACTIONS.has(action))return;const body={action,...extra},k=key(cfg().managementFunction,body),hit=getCached(k,3600000,2592000000);if(hit.data)return hit.data;try{const d=await rawInvoke(cfg().managementFunction,body);setCached(k,d);return d}catch{}}
async function warm(actions=[]){if(warming)return;warming=true;try{for(const a of actions){const body={action:a},k=key(cfg().managementFunction,body),hit=getCached(k,3600000,2592000000);if(hit.data)continue;await prefetch(a);await new Promise(r=>setTimeout(r,40))}}finally{warming=false}}
async function registry(action,extra={}){const read=/^(inventory|list|get|detail|context|status)$/i.test(String(action));return invoke(cfg().controlRegistryFunction,{action,...extra},{cache:read,ttl:3600000,staleTtl:2592000000})}
async function config(action,extra={}){const read=/^(inventory|list|get|detail|context|status)$/i.test(String(action));return invoke(cfg().configFunction,{action,...extra},{cache:read,ttl:3600000,staleTtl:2592000000})}
async function distribution(action,extra={}){const read=/^(inventory|list|get|detail|context|status)$/i.test(String(action));return invoke(cfg().distributionFunction,{action,...extra},{cache:read,ttl:3600000,staleTtl:2592000000})}
async function health(){try{const d=await call('reports');return {ok:true,data:d}}catch(error){return {ok:false,error}}}
async function websiteControl(action,payload={}){try{return await call('website_'+action,payload)}catch(error){if(/unknown|unsupported|action|not found/i.test(error.message||''))return {notConnected:true,error:error.message};throw error}}
async function portalControl(action,payload={}){try{return await call('portal_control_'+action,payload)}catch(error){if(/unknown|unsupported|action|not found/i.test(error.message||''))return {notConnected:true,error:error.message};throw error}}
window.DOTApi=Object.freeze({call,invoke,health,registry,config,distribution,websiteControl,portalControl,prefetch,warm,clearCache});
})();
