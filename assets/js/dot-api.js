/* screenings4u DOT Management Portal — DOT-only backend adapter */
(()=>{
"use strict";
const cfg=()=>window.DOT_PORTAL_CONFIG;
async function session(){const {data,error}=await window.dotSupabase.auth.getSession();if(error)throw error;if(!data?.session?.access_token)throw new Error('Your DOT management session has expired.');return data.session}
async function invoke(functionName,body={}){const s=await session();const url=`${cfg().supabaseUrl}/functions/v1/${functionName}`;const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${s.access_token}`,'apikey':cfg().supabaseAnonKey},body:JSON.stringify(body)});const d=await r.json().catch(()=>({}));if(!r.ok||d?.error)throw new Error(d?.error||`DOT request failed (${r.status}).`);return d}
async function call(action,extra={}){return invoke(cfg().managementFunction,{action,...extra})}
async function registry(action,extra={}){return invoke(cfg().controlRegistryFunction,{action,...extra})}
async function config(action,extra={}){return invoke(cfg().configFunction,{action,...extra})}
async function health(){try{const d=await call('reports');return {ok:true,data:d}}catch(error){return {ok:false,error}}}
async function websiteControl(action,payload={}){
  // Dedicated front-end contract for dot.screenings4u.com. Backend route can be added without changing portal pages.
  try{return await call('website_'+action,payload)}catch(error){if(/unknown|unsupported|action|not found/i.test(error.message||''))return {notConnected:true,error:error.message};throw error}
}
async function portalControl(action,payload={}){
  // Dedicated contract for customer-facing DOT portals. This is intentionally isolated from Enterprise modules.
  try{return await call('portal_control_'+action,payload)}catch(error){if(/unknown|unsupported|action|not found/i.test(error.message||''))return {notConnected:true,error:error.message};throw error}
}
window.DOTApi=Object.freeze({call,invoke,health,registry,config,websiteControl,portalControl});
})();
