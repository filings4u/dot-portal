(()=>{
'use strict';
const $=s=>document.querySelector(s);
const esc=v=>DOTShell.escape(v);
const get=(d,...keys)=>{for(const k of keys)if(Array.isArray(d?.[k]))return d[k];return[]};
const norm=v=>String(v||'').trim().toLowerCase();
const stamp=x=>Math.max(Date.parse(x?.organizations?.updated_at||0)||0,Date.parse(x?.updated_at||0)||0,Date.parse(x?.created_at||0)||0);
const name=x=>x?.legal_name||x?.name||x?.organizations?.legal_name||x?.organizations?.dba_name||'Unnamed C/TPA';
const email=x=>String(x?.support_email||x?.organizations?.primary_email||'').trim();
const companyCode=x=>x?.company_code||x?.organizations?.metadata?.company_code||'';
const pill=(v,forced='')=>{
 const s=String(v||'—').replaceAll('_',' ');
 const c=forced||(/active|granted|paid|trial/i.test(s)?'ok':/inactive|disabled|revoked|failed|cancel/i.test(s)?'bad':'warn');
 return `<span class="dot-status-pill ${c}">${esc(s)}</span>`;
};
const metric=(label,value,note='')=>`<article class="dot-metric"><span>${esc(label)}</span><strong>${esc(String(value??0))}</strong><small>${esc(note)}</small></article>`;

function shell(){
 $('#dotPageMount').innerHTML=`<section class="dot-page ctpa-directory-page">
 <header class="dot-page-head"><div><span class="dot-eyebrow">DOT MANAGEMENT</span><h1>DOT C/TPAs</h1><p>Manage each C/TPA as one customer workspace with its subscription, portal access, users, orders, billing, and operational records.</p></div>
 <div class="dot-actions"><a class="dot-btn primary" href="dot-account-creation.html">Create C/TPA Account</a><a class="dot-btn" href="dot-portal-detail.html?portal=ctpa_dot">C/TPA Portal Control</a><button class="dot-btn" id="refreshCtpAs" type="button">Refresh</button></div></header>
 <div id="ctpaStatus"></div><div id="ctpaBody"><div class="dot-card"><div class="dot-empty"><div class="dot-instant-placeholder" aria-hidden="true"></div></div></div></div></section>`;
}
function notice(m,e=false){$('#ctpaStatus').innerHTML=`<div class="dot-banner ${e?'warning':''}"><div><strong>${e?'Action needs attention':'C/TPA update'}</strong><span>${esc(m)}</span></div></div>`}

function chooseCanonical(list,subs,access){
 return list.slice().sort((a,b)=>{
   const aActive=subs.some(s=>s.ctpa_id===a.id&&['active','trial','trialing','past_due'].includes(norm(s.status)))?1:0;
   const bActive=subs.some(s=>s.ctpa_id===b.id&&['active','trial','trialing','past_due'].includes(norm(s.status)))?1:0;
   if(aActive!==bActive)return bActive-aActive;
   const aGrant=access.some(p=>p.organization_id===a.organization_id&&p.portal_code==='ctpa_dot'&&p.enabled===true)?1:0;
   const bGrant=access.some(p=>p.organization_id===b.organization_id&&p.portal_code==='ctpa_dot'&&p.enabled===true)?1:0;
   if(aGrant!==bGrant)return bGrant-aGrant;
   return stamp(b)-stamp(a);
 })[0];
}
function groupAccounts(all,subs,access){
 const groups=new Map();
 for(const x of all){
   const e=norm(email(x));
   const key=e||String(x.organization_id||x.id);
   if(!groups.has(key))groups.set(key,[]);
   groups.get(key).push(x);
 }
 return [...groups.values()].map(list=>({canonical:chooseCanonical(list,subs,access),records:list})).filter(g=>norm(g.canonical.status)!=='inactive');
}
function render(data){
 const {all,subs,plans,access}=data,pm=new Map(plans.map(p=>[p.id,p]));
 const groups=groupAccounts(all,subs,access);
 const duplicateGroups=groups.filter(g=>g.records.length>1).length;
 const activeSubs=groups.filter(g=>subs.some(s=>s.ctpa_id===g.canonical.id&&norm(s.status)==='active')).length;
 const portalGrants=groups.filter(g=>access.some(p=>p.organization_id===g.canonical.organization_id&&p.portal_code==='ctpa_dot'&&p.enabled===true)).length;

 $('#ctpaBody').innerHTML=`<div class="dot-metrics">
 ${metric('Customer Accounts',groups.length,'One row per customer identity')}
 ${metric('Active Subscriptions',activeSubs,'Current active C/TPA subscriptions')}
 ${metric('Portal Access',portalGrants,'Customers with C/TPA portal access')}
 ${metric('Duplicate Groups',duplicateGroups,duplicateGroups?'Multiple records share one email':'No duplicate email groups')}
 </div>
 <div class="ctpa-workspace-grid">
  <a class="ctpa-workspace-card" href="dot-account-creation.html"><span>＋</span><div><strong>Create C/TPA</strong><small>Create a new account only when the email does not already belong to a customer.</small></div></a>
  <a class="ctpa-workspace-card" href="dot-orders.html"><span>▤</span><div><strong>Orders</strong><small>Create or review screenings4u orders tied to C/TPA customers.</small></div></a>
  <a class="ctpa-workspace-card" href="dot-users-access.html"><span>♙</span><div><strong>Users & Access</strong><small>Manage customer users, memberships, and portal permissions.</small></div></a>
  <a class="ctpa-workspace-card" href="dot-invoices.html"><span>▧</span><div><strong>Billing</strong><small>Review subscriptions, invoices, and account billing records.</small></div></a>
 </div>
 <div class="dot-card ctpa-card">
   <div class="dot-card-head"><div><h2>C/TPA Customer Accounts</h2><p>Accounts are grouped by customer email so duplicate database records do not appear as separate customers.</p></div><span class="ctpa-count" id="ctpaCount">${groups.length} customers</span></div>
   <div class="dot-card-body ctpa-tools"><div class="ctpa-filters">
     <div class="dot-field"><label for="ctpaSearch">Search</label><input id="ctpaSearch" type="search" placeholder="Company, email, account code, or ID"></div>
     <div class="dot-field"><label for="ctpaSub">Subscription</label><select id="ctpaSub"><option value="">All subscriptions</option><option value="active">Active</option><option value="none">No subscription</option><option value="other">Other</option></select></div>
     <div class="dot-field"><label for="ctpaAccess">Portal access</label><select id="ctpaAccess"><option value="">All access</option><option value="granted">Granted</option><option value="not-granted">Not granted</option></select></div>
     <div class="dot-field"><label for="ctpaDup">Records</label><select id="ctpaDup"><option value="">All records</option><option value="single">Single record</option><option value="duplicate">Duplicate groups</option></select></div>
     <button class="dot-btn" id="clearCtpa" type="button">Clear</button>
   </div></div>
   <div id="ctpaTable"></div>
 </div>`;

 const draw=()=>{
   const q=norm($('#ctpaSearch').value),sf=$('#ctpaSub').value,af=$('#ctpaAccess').value,df=$('#ctpaDup').value;
   const rows=groups.filter(g=>{
     const x=g.canonical;
     const sub=subs.find(s=>s.ctpa_id===x.id&&['active','trial','trialing','past_due'].includes(norm(s.status)))||subs.find(s=>s.ctpa_id===x.id)||null;
     const granted=access.some(p=>p.organization_id===x.organization_id&&p.portal_code==='ctpa_dot'&&p.enabled===true);
     const ss=!sub?'none':norm(sub.status)==='active'?'active':'other';
     const hay=[name(x),email(x),companyCode(x),x.id,x.organization_id,...g.records.map(r=>`${name(r)} ${email(r)} ${companyCode(r)} ${r.id}`)].join(' ').toLowerCase();
     return (!q||hay.includes(q))&&(!sf||ss===sf)&&(!af||(af==='granted'?granted:!granted))&&(!df||(df==='duplicate'?g.records.length>1:g.records.length===1));
   });
   $('#ctpaCount').textContent=`${rows.length} of ${groups.length} customers`;
   $('#ctpaTable').innerHTML=`<div class="dot-table-wrap"><table class="dot-table ctpa-table"><thead><tr><th>C/TPA Customer</th><th>Primary Contact</th><th>Subscription</th><th>Portal Access</th><th>Records</th><th>Status</th><th>Management</th></tr></thead><tbody>
   ${rows.map(g=>{
     const x=g.canonical,sub=subs.find(s=>s.ctpa_id===x.id&&['active','trial','trialing','past_due'].includes(norm(s.status)))||subs.find(s=>s.ctpa_id===x.id)||null,plan=sub?pm.get(sub.plan_id):null,granted=access.some(p=>p.organization_id===x.organization_id&&p.portal_code==='ctpa_dot'&&p.enabled===true);
     return `<tr><td><strong>${esc(name(x))}</strong><small>${esc(companyCode(x)||x.id)}</small></td><td><strong>${esc(email(x)||'—')}</strong><small>${esc(x.support_phone||x.organizations?.phone||'')}</small></td><td>${sub?`<strong>${esc(plan?.name||plan?.code||'Subscription')}</strong><small>${esc(sub.billing_frequency||'')} · ${pill(sub.status)}</small>`:pill('No subscription','warn')}</td><td>${granted?pill('Granted','ok'):pill('Not granted','warn')}</td><td>${g.records.length>1?`<span class="ctpa-duplicate-pill">${g.records.length} linked records</span>`:'<span class="ctpa-single-record">1 record</span>'}</td><td>${pill(x.status)}</td><td><div class="ctpa-row-actions"><a class="dot-btn small primary" href="dot-ctpa-detail.html?id=${encodeURIComponent(x.id)}">Manage</a><a class="dot-btn small" href="dot-orders.html?ctpa_id=${encodeURIComponent(x.id)}">Order</a></div></td></tr>`;
   }).join('')||'<tr><td colspan="7"><div class="dot-empty">No C/TPA customers match the selected filters.</div></td></tr>'}</tbody></table></div>`;
 };
 ['ctpaSearch','ctpaSub','ctpaAccess','ctpaDup'].forEach(id=>$('#'+id).addEventListener(id==='ctpaSearch'?'input':'change',draw));
 $('#clearCtpa').onclick=()=>{$('#ctpaSearch').value='';$('#ctpaSub').value='';$('#ctpaAccess').value='';$('#ctpaDup').value='';draw()};
 draw();
}
async function load(){
 const settled=await Promise.allSettled([DOTApi.call('ctpas'),DOTApi.call('billing'),DOTApi.call('portal_access')]);
 if(settled[0].status!=='fulfilled')throw settled[0].reason||new Error('Unable to load C/TPA accounts.');
 const cdata=settled[0].value,billing=settled[1].status==='fulfilled'?settled[1].value:{},accessData=settled[2].status==='fulfilled'?settled[2].value:{};
 if(settled[1].status!=='fulfilled'||settled[2].status!=='fulfilled')notice('Accounts loaded, but subscription or portal access data may be incomplete.',true);
 render({all:get(cdata,'ctpas'),subs:get(billing,'subscriptions'),plans:get(billing,'plans'),access:get(accessData,'portal_access','organization_portal_access','ctpa_portal_access')});
}
async function start(){
 const state=await DOTAuth.requireAuth();if(!state)return;
 DOTShell.render(state);shell();
 $('#refreshCtpAs').onclick=()=>load().catch(e=>notice(e.message,true));
 await load();
}
addEventListener('DOMContentLoaded',()=>start().catch(e=>{console.error(e);if($('#ctpaStatus'))notice(e?.message||String(e),true)}),{once:true});
})();