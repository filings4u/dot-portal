/* screenings4u DOT Portal Control — dedicated page controller */
(()=>{
"use strict";
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v??'').trim().toLowerCase();
const labelize=v=>String(v||'portal').replace(/[_-]+/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
const badge=v=>{const s=norm(v),cls=/active|published|ready|live|enabled/.test(s)?'ok':/disabled|inactive|failed|error|blocked/.test(s)?'bad':/pending|draft|warning|attention/.test(s)?'warn':'';return `<span class="dot-status-pill ${cls}">${esc(v||'unknown')}</span>`};

function pageShell(){
 const mount=$('#dotPageMount');
 if(!mount)return null;
 mount.innerHTML=`<section class="dot-page">
   <div class="dot-page-head">
     <div><span class="dot-eyebrow">DOT Management</span><h1>DOT Portal Control</h1><p>Manage every DOT portal from one control plane — identity, registered pages, live host, status, and runtime distribution.</p></div>
     <div class="dot-actions"><a class="dot-btn primary" href="dot-distribution.html">Distribution Management</a><button class="dot-btn" id="portalRefresh" type="button">Refresh</button></div>
   </div>
   <div id="dotPageStatus"></div>
   <div id="dotPageBody"><div class="dot-card"><div class="dot-empty"><div class="dot-spinner"></div>Loading portal registry…</div></div></div>
 </section>`;
 return $('#dotPageBody');
}

function metric(label,value,copy){return `<div class="dot-metric"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(copy)}</small></div>`}

function kindGroup(portal){
 const k=norm(portal.portal_kind||portal.kind);
 if(k==='agency')return 'agency';
 if(k.includes('ctpa'))return 'ctpa';
 if(k.includes('employer'))return 'employer';
 if(k==='self'||k.includes('driver')||k.includes('employee')||k.includes('contractor'))return 'worker';
 return 'other';
}

async function load(){
 const body=pageShell();
 if(!body)return;
 let d;
 try{d=await window.DOTApi.registry('inventory')}catch(err){
   $('#dotPageStatus').innerHTML=`<div class="dot-banner warning"><div><strong>Portal inventory could not be loaded.</strong><span>${esc(err.message||'Please try again.')}</span></div></div>`;
   body.innerHTML='<div class="dot-card"><div class="dot-empty">The portal registry is unavailable right now.</div></div>';
   return;
 }
 const portals=Array.isArray(d?.portals)?d.portals:[];
 const pages=Array.isArray(d?.portal_pages)?d.portal_pages:[];
 const distribution=Array.isArray(d?.distribution_targets)?d.distribution_targets:[];
 const activeCount=portals.filter(p=>norm(p.status)==='active').length;
 const agencyPortals=portals.filter(p=>kindGroup(p)==='agency');
 const agencies=[...new Set(agencyPortals.map(p=>p.agency_code||p.agency).filter(Boolean))].sort();
 const typeDefs=[
   ['all','All Portals','Complete portal network'],
   ['ctpa','C/TPA','C/TPA and internal-role portals'],
   ['employer','Employer','Employer-facing portals'],
   ['worker','Worker / Self','Driver, employee, and contractor portals'],
   ['agency','Agency','DOT agency portals'],
   ['other','Other','Other registered portal types']
 ];
 const typeCount=key=>key==='all'?portals.length:portals.filter(p=>kindGroup(p)===key).length;
 const portalIds=new Set(portals.map(p=>p.id).filter(Boolean));
 const registeredPageCount=pages.length || portals.reduce((n,p)=>n+Number(p.page_count||0),0);
 const publishedTargets=distribution.filter(x=>/published|active|live|ready/i.test(String(x.status||x.distribution_status||''))).length;

 body.innerHTML=`
   <div class="dot-portal-summary">
     ${metric('DOT Portals',portals.length,'Registered control targets')}
     ${metric('Portal Pages',registeredPageCount,'Registered managed pages')}
     ${metric('Active Portals',activeCount,'Currently enabled')}
     ${metric('Agency Portals',agencyPortals.length,agencies.length?agencies.join(' / '):'DOT agency network')}
   </div>

   <div class="dot-grid">
     <article class="dot-card">
       <div class="dot-card-head"><div><h2>Portal Network</h2><p>Use a portal type to narrow the registry instantly.</p></div></div>
       <div class="dot-card-body"><div class="dot-portal-network" id="portalTypeCards">
         ${typeDefs.map(([key,title,copy],i)=>`<button class="dot-portal-network-button${i===0?' active':''}" type="button" data-kind="${key}"><strong>${typeCount(key)}</strong><span>${esc(title)}</span><small>${esc(copy)}</small></button>`).join('')}
       </div></div>
     </article>

     <article class="dot-card half">
       <div class="dot-card-head"><div><h2>Agency Coverage</h2><p>Quick access to DOT agency portal groups.</p></div><a class="dot-card-head-link" href="dot-agencies.html">Agency Management</a></div>
       <div class="dot-card-body"><div class="dot-portal-agencies">${agencies.length?agencies.map(a=>`<button type="button" class="dot-portal-agency" data-agency="${esc(a)}"><span>${esc(a)}</span><b>${agencyPortals.filter(p=>(p.agency_code||p.agency)===a).length}</b></button>`).join(''):'<span class="dot-help">No agency-specific portals are registered.</span>'}</div></div>
     </article>

     <article class="dot-card half">
       <div class="dot-card-head"><div><h2>Runtime & Distribution</h2><p>Portal registry and distribution control-plane status.</p></div><a class="dot-card-head-link" href="dot-distribution.html">Open Distribution</a></div>
       <div class="dot-card-body"><div class="dot-portal-runtime-grid">
         <div class="dot-portal-runtime-item"><span>Management Host</span><strong>dot-portal</strong></div>
         <div class="dot-portal-runtime-item"><span>Registry Targets</span><strong>${portalIds.size||portals.length}</strong></div>
         <div class="dot-portal-runtime-item"><span>Distribution Targets</span><strong>${distribution.length}</strong></div>
         <div class="dot-portal-runtime-item"><span>Published / Ready</span><strong>${distribution.length?publishedTargets:'—'}</strong></div>
       </div></div>
     </article>

     <article class="dot-card">
       <div class="dot-card-head"><div><h2>Managed DOT Portals</h2><p>Search, filter, open, and manage every registered portal.</p></div></div>
       <div class="dot-card-body">
         <div class="dot-portal-toolbar">
           <div class="dot-field"><label for="portalSearch">Search portals</label><input id="portalSearch" placeholder="Name, code, host, type, or agency"></div>
           <div class="dot-field"><label for="portalKindFilter">Portal type</label><select id="portalKindFilter"><option value="">All types</option>${[...new Set(portals.map(p=>p.portal_kind||p.kind).filter(Boolean))].sort().map(v=>`<option value="${esc(v)}">${esc(labelize(v))}</option>`).join('')}</select></div>
           <div class="dot-field"><label for="portalAgencyFilter">Agency</label><select id="portalAgencyFilter"><option value="">All agencies</option>${agencies.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('')}</select></div>
           <div class="dot-field"><label for="portalStatusFilter">Status</label><select id="portalStatusFilter"><option value="">All statuses</option>${[...new Set(portals.map(p=>p.status).filter(Boolean))].sort().map(v=>`<option value="${esc(v)}">${esc(labelize(v))}</option>`).join('')}</select></div>
           <button class="dot-btn" id="portalClearFilters" type="button">Clear Filters</button>
         </div>
         <div class="dot-portal-results"><span><strong id="portalResultCount">0</strong> portals shown</span><span>Manage opens the portal controller. Open Live launches the registered host.</span></div>
       </div>
       <div id="portalRegistryTable"></div>
     </article>
   </div>`;

 const search=$('#portalSearch'),kind=$('#portalKindFilter'),agency=$('#portalAgencyFilter'),status=$('#portalStatusFilter'),table=$('#portalRegistryTable'),count=$('#portalResultCount');
 let quickKind='all';
 const render=()=>{
   const q=norm(search.value),kindValue=kind.value,agencyValue=agency.value,statusValue=status.value;
   const filtered=portals.filter(p=>{
     const hay=[p.label,p.portal_code,p.domain,p.portal_kind,p.kind,p.agency_code,p.agency].map(norm).join(' ');
     return (!q||hay.includes(q)) && (quickKind==='all'||kindGroup(p)===quickKind) && (!kindValue||(p.portal_kind||p.kind)===kindValue) && (!agencyValue||(p.agency_code||p.agency)===agencyValue) && (!statusValue||p.status===statusValue);
   });
   count.textContent=String(filtered.length);
   table.innerHTML=`<div class="dot-table-wrap"><table class="dot-table"><thead><tr><th>Portal</th><th>Type</th><th>Agency</th><th>Host</th><th>Pages</th><th>Status</th><th>Management</th></tr></thead><tbody>${filtered.length?filtered.map(p=>{
     const code=p.portal_code||p.id||'';
     const host=p.domain||'';
     const pageCount=Number((p.page_count ?? pages.filter(x=>x.portal_id===p.id||x.portal_code===code).length) || 0);
     return `<tr><td><strong>${esc(p.label||labelize(code))}</strong><span class="dot-portal-code">${esc(code)}</span></td><td>${esc(labelize(p.portal_kind||p.kind||'portal'))}</td><td>${esc(p.agency_code||p.agency||'All DOT')}</td><td><div class="dot-portal-host">${host?`<a href="https://${esc(host)}" target="_blank" rel="noopener">${esc(host)}</a>`:'—'}</div></td><td><a href="dot-portal-detail.html?portal=${encodeURIComponent(code)}"><strong>${pageCount}</strong> pages</a></td><td>${badge(p.status)}</td><td><div class="dot-portal-actions"><a class="dot-btn small primary" href="dot-portal-detail.html?portal=${encodeURIComponent(code)}">Manage</a>${host?`<a class="dot-btn small" href="https://${esc(host)}" target="_blank" rel="noopener">Open Live</a>`:''}</div></td></tr>`;
   }).join(''):'<tr><td colspan="7"><div class="dot-empty">No portals match the current filters.</div></td></tr>'}</tbody></table></div>`;
 };

 ['input','change'].forEach(evt=>search.addEventListener(evt,render));
 [kind,agency,status].forEach(el=>el.addEventListener('change',render));
 $('#portalClearFilters').addEventListener('click',()=>{search.value='';kind.value='';agency.value='';status.value='';quickKind='all';document.querySelectorAll('.dot-portal-network-button').forEach((b,i)=>b.classList.toggle('active',i===0));render()});
 document.querySelectorAll('.dot-portal-network-button').forEach(btn=>btn.addEventListener('click',()=>{quickKind=btn.dataset.kind||'all';document.querySelectorAll('.dot-portal-network-button').forEach(b=>b.classList.toggle('active',b===btn));render()}));
 document.querySelectorAll('.dot-portal-agency').forEach(btn=>btn.addEventListener('click',()=>{agency.value=btn.dataset.agency||'';render();$('#portalSearch')?.scrollIntoView({behavior:'smooth',block:'center'})}));
 render();
}

async function start(){
 const state=await window.DOTAuth.requireAuth();
 if(!state)return;
 window.DOTShell.render(state);
 $('#portalRefresh')?.addEventListener('click',()=>location.reload());
 await load();
 $('#portalRefresh')?.addEventListener('click',()=>location.reload());
}
window.addEventListener('DOMContentLoaded',()=>start().catch(err=>{
 const mount=$('#dotPageMount');
 if(mount)mount.innerHTML=`<section class="dot-page"><div class="dot-banner warning"><div><strong>Portal Control could not load.</strong><span>${esc(err.message||'Unknown error')}</span></div></div></section>`;
}),{once:true});
})();
