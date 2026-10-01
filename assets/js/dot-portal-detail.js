(()=>{
'use strict';
const $=s=>document.querySelector(s),esc=v=>window.DOTShell.escape(v),qs=new URLSearchParams(location.search);
const titleCase=s=>String(s||'').replaceAll('_',' ').replaceAll('-',' ').replace(/\b\w/g,m=>m.toUpperCase());
const badge=v=>`<span class="dot-status-pill ${/active|complete|paid|published|resolved|sent/i.test(v||'')?'ok':/error|failed|cancel|inactive|disabled/i.test(v||'')?'bad':'warn'}">${esc(String(v||'—').replaceAll('_',' '))}</span>`;
function shell(state){window.DOTShell.render(state);$('#dotPageMount').innerHTML=`<section class="dot-page portal-detail-page"><header class="dot-page-head"><div><span class="dot-eyebrow">DOT CONTROL PLANE</span><h1>DOT Portal Management</h1><p>Manage portal identity, registered pages, runtime distribution, and the operational workspaces connected to this portal.</p></div><div class="dot-actions"><a class="dot-btn" href="dot-portal-control.html">Back to Portal Control</a><button class="dot-btn" id="portalRefresh" type="button">Refresh</button></div></header><div id="dotPageStatus"></div><div id="dotPageBody"><div class="dot-card"><div class="dot-empty"><div class="dot-spinner"></div><p>Loading portal management…</p></div></div></div></section>`}
function notice(msg,error=false){$('#dotPageStatus').innerHTML=`<div class="dot-banner ${error?'warning':''}"><div><strong>${error?'Action needs attention':'Management update'}</strong><span>${esc(msg)}</span></div></div>`}
function field(label,id,value=''){return `<div class="dot-field"><label for="${id}">${esc(label)}</label><input id="${id}" value="${esc(value??'')}"></div>`}
function select(label,id,value,options){return `<div class="dot-field"><label for="${id}">${esc(label)}</label><select id="${id}">${options.map(x=>`<option value="${esc(x)}" ${String(x)===String(value)?'selected':''}>${esc(titleCase(x))}</option>`).join('')}</select></div>`}
function metric(label,value,small){return `<article class="dot-metric"><span>${esc(label)}</span><strong>${esc(String(value??0))}</strong><small>${esc(small||'')}</small></article>`}
function scopeItem(label,value){return `<div class="portal-scope-item"><span>${esc(label)}</span><strong>${esc(value??'—')}</strong></div>`}
function liveUrl(domain,route='/'){if(!domain)return '#';const base=/^https?:\/\//i.test(domain)?domain:`https://${domain}`;try{return new URL(route||'/',base).href}catch{return base}}
const workspaces={
 ctpa_dot:[
  ['C/TPA Accounts','Accounts, subscriptions, staff, access and account control.','dot-ctpas.html','C'],
  ['Employers','C/TPA-managed employer accounts and DOT relationships.','dot-employers.html','E'],
  ['Owner-Operators','Owner-operator accounts, consortium relationships and status.','dot-owner-operators.html','O'],
  ['Programs','DOT programs and workforce assignments.','dot-programs.html','P'],
  ['Consortiums & Pools','Pool configuration, membership and eligibility.','dot-pools.html','◎'],
  ['Random Selections','Selection events, members, schedules and completion.','dot-random-selections.html','R'],
  ['Testing Orders','Drug and alcohol testing orders and collection workflows.','dot-testing-orders.html','T'],
  ['Results','Testing results, disposition and reporting workflows.','dot-results.html','✓'],
  ['Compliance','Compliance cases, post-accident and RTD/SAP activity.','dot-compliance.html','!'],
  ['Billing & Invoices','Subscriptions, invoices and customer billing records.','dot-invoices.html','$'],
  ['Support','C/TPA support requests and communications.','dot-support.html','?'],
  ['Audit History','Portal and customer activity history.','dot-audit.html','A'],
  ['Integrations','External connections and DOT integration controls.','dot-integrations.html','⌘'],
  ['Users & Access','Staff roles and customer-facing portal access.','dot-users-access.html','U']
 ]
};
async function load(){
 const code=qs.get('portal')||'';
 if(!code){$('#dotPageBody').innerHTML='<div class="dot-card"><div class="portal-empty">Choose a portal from Portal Control.<div class="dot-actions" style="justify-content:center;margin-top:15px"><a class="dot-btn primary" href="dot-portal-control.html">Open Portal Control</a></div></div></div>';return}
 const d=await DOTApi.registry('portal',{portal_code:code}),p=d.portal,pages=Array.isArray(d.pages)?d.pages:[];
 if(!p){notice('Portal registry entry was not found.',true);$('#dotPageBody').innerHTML='<div class="dot-card"><div class="portal-empty">This portal is not registered in the DOT control registry.</div></div>';return}
 const domain=p.domain||'',kind=p.portal_kind||p.kind||'portal',agency=p.agency_code||p.agency||'All DOT',directory=p.directory_name||p.directory||'—',activePages=pages.filter(x=>String(x.status||'').toLowerCase()==='active').length,managedPages=pages.filter(x=>x.managed!==false).length,pageTypes=new Set(pages.map(x=>x.page_type).filter(Boolean)).size;
 const ops=workspaces[code]||[];
 $('#dotPageBody').innerHTML=`
 <div class="dot-metrics">${metric('Registered Pages',pages.length,'Portal registry')}${metric('Active Pages',activePages,'Currently active')}${metric('Managed Pages',managedPages,'Controlled here')}${metric('Page Types',pageTypes,'Distinct page groups')}</div>
 <div class="portal-detail-hero">
  <article class="dot-card portal-identity-card"><div class="dot-card-head"><div><h2>Portal Identity</h2><p class="portal-domain"><a href="${esc(liveUrl(domain))}" target="_blank" rel="noopener">${esc(domain||'No live domain')}</a></p></div>${badge(p.status)}</div><div class="dot-card-body">
   <div class="dot-field-grid">${field('Portal Label','portalLabel',p.label)}${select('Status','portalStatus',p.status||'active',['active','maintenance','disabled','draft'])}</div>
   <div class="dot-field"><label for="portalNotes">Management Notes</label><textarea id="portalNotes" placeholder="Internal management notes for this portal">${esc(p.notes||'')}</textarea></div>
   <div class="portal-form-actions"><button class="dot-btn primary" id="savePortal" type="button">Save Portal</button><a class="dot-btn" href="dot-distribution.html?target=${encodeURIComponent('portal:'+code)}">Manage Distribution</a><a class="dot-btn" href="${esc(liveUrl(domain))}" target="_blank" rel="noopener">Open Live Portal</a>${code==='ctpa_dot'?'<a class="dot-btn" href="dot-ctpas.html">Manage C/TPA Accounts</a>':''}</div>
  </div></article>
  <article class="dot-card portal-scope-card"><div class="dot-card-head"><div><h2>Control Scope</h2><p>Registry and deployment information for this portal.</p></div></div><div class="dot-card-body"><div class="portal-scope-grid">${scopeItem('Portal Code',p.portal_code||code)}${scopeItem('Portal Kind',kind)}${scopeItem('Agency',agency)}${scopeItem('Directory',directory)}${scopeItem('Page Count',pages.length)}${scopeItem('Control Phase',p.metadata?.control_phase||'registered')}${scopeItem('Source Version',p.metadata?.source_version||'—')}${scopeItem('Host','dot-portal')}</div></div></article>
 </div>
 ${ops.length?`<article class="dot-card portal-section"><div class="dot-card-head"><div><h2>C/TPA Operational Management</h2><p>Business-data workspaces used by the C/TPA portal. Each card opens the live management page for that module.</p></div></div><div class="dot-card-body"><div class="portal-workspace-grid">${ops.map(([name,copy,href,icon])=>`<a class="portal-workspace" href="${href}"><span class="portal-workspace-icon">${esc(icon)}</span><span><b>${esc(name)}</b><span>${esc(copy)}</span></span></a>`).join('')}</div></div></article>`:''}
 <article class="dot-card portal-section"><div class="dot-card-head"><div><h2>Portal Pages</h2><p>Search the registry, open the live page, or manage page settings and runtime distribution.</p></div>${badge(`${pages.length} pages`)}</div>
  <div class="portal-page-tools"><div class="dot-field search-field"><label for="portalPageSearch">Search pages</label><input id="portalPageSearch" placeholder="Page name, route, file or type"></div><div class="dot-field"><label for="portalPageType">Page type</label><select id="portalPageType"><option value="">All types</option>${[...new Set(pages.map(x=>x.page_type).filter(Boolean))].sort().map(x=>`<option value="${esc(x)}">${esc(titleCase(x))}</option>`).join('')}</select></div><div class="dot-field"><label for="portalPageStatus">Status</label><select id="portalPageStatus"><option value="">All statuses</option>${[...new Set(pages.map(x=>x.status).filter(Boolean))].sort().map(x=>`<option value="${esc(x)}">${esc(titleCase(x))}</option>`).join('')}</select></div><div class="portal-result-count" id="portalPageCount"></div></div>
  <div id="portalPagesTable"></div>
 </article>`;
 const renderPages=()=>{const q=($('#portalPageSearch')?.value||'').trim().toLowerCase(),type=$('#portalPageType')?.value||'',status=$('#portalPageStatus')?.value||'';const filtered=pages.filter(pg=>(!q||[pg.label,pg.route,pg.file_name,pg.page_type].some(v=>String(v||'').toLowerCase().includes(q)))&&(!type||pg.page_type===type)&&(!status||pg.status===status));$('#portalPageCount').textContent=`${filtered.length} of ${pages.length} pages`;$('#portalPagesTable').innerHTML=`<div class="dot-table-wrap"><table class="dot-table"><thead><tr><th>Page</th><th>Route</th><th>Type</th><th>Status</th><th>Management</th></tr></thead><tbody>${filtered.length?filtered.map(pg=>`<tr><td class="portal-page-title"><strong>${esc(pg.label||pg.file_name||pg.route)}</strong><small>${esc(pg.file_name||'')}</small></td><td>${esc(pg.route||'/')}</td><td>${esc(titleCase(pg.page_type||'page'))}</td><td>${badge(pg.status)}</td><td><div class="portal-page-actions"><a class="dot-btn small primary" href="dot-portal-page.html?portal=${encodeURIComponent(code)}&route=${encodeURIComponent(pg.route||'/')}">Manage Page</a><a class="dot-btn small" href="${esc(liveUrl(domain,pg.route||'/'))}" target="_blank" rel="noopener">Open Live</a></div></td></tr>`).join(''):'<tr><td colspan="5"><div class="dot-empty">No portal pages match these filters.</div></td></tr>'}</tbody></table></div>`};
 ['portalPageSearch','portalPageType','portalPageStatus'].forEach(id=>document.getElementById(id)?.addEventListener(id==='portalPageSearch'?'input':'change',renderPages));renderPages();
 $('#savePortal').onclick=async()=>{const btn=$('#savePortal');try{const label=$('#portalLabel').value.trim();if(!label)throw new Error('Portal label is required.');btn.disabled=true;btn.textContent='Saving…';await DOTApi.registry('save_portal',{portal_code:code,data:{label,status:$('#portalStatus').value,notes:$('#portalNotes').value}});notice('Portal settings saved successfully.');await load()}catch(e){notice(e.message||String(e),true)}finally{if(btn){btn.disabled=false;btn.textContent='Save Portal'}}};
}
async function start(){const state=await DOTAuth.requireAuth();if(!state)return;window.DOT_AUTH_STATE=state;shell(state);$('#portalRefresh')?.addEventListener('click',()=>load().catch(e=>notice(e.message||String(e),true)));try{await load()}catch(e){console.error(e);notice(e.message||String(e),true);$('#dotPageBody').innerHTML='<div class="dot-card"><div class="portal-empty">The page shell loaded, but the portal registry request did not complete.</div></div>'}}
addEventListener('DOMContentLoaded',start,{once:true});
})();
