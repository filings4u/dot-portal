(()=>{
'use strict';
const $=s=>document.querySelector(s);
const esc=v=>DOTShell.escape(v);
const get=(d,...keys)=>{for(const k of keys)if(Array.isArray(d?.[k]))return d[k];return[]};
const norm=v=>String(v||'').trim().toLowerCase();
const metric=(label,value,note='')=>`<article class="dot-metric"><span>${esc(label)}</span><strong>${esc(String(value??0))}</strong><small>${esc(note)}</small></article>`;
const pill=(v,cls='')=>`<span class="dot-status-pill ${cls||(/active|current|enabled/i.test(v||'')?'ok':/terminated|inactive|archived|cancel/i.test(v||'')?'bad':'warn')}">${esc(String(v||'—').replaceAll('_',' '))}</span>`;
const personName=x=>[x?.first_name,x?.middle_name,x?.last_name].filter(Boolean).join(' ')||x?.employee_number||'Unnamed Driver';
const stamp=x=>Math.max(Date.parse(x?.updated_at||0)||0,Date.parse(x?.created_at||0)||0);

function shell(){
 $('#dotPageMount').innerHTML=`<section class="dot-page driver-directory-page">
  <header class="dot-page-head">
   <div><span class="dot-eyebrow">DOT MANAGEMENT</span><h1>DOT Drivers</h1><p>Manage safety-sensitive workers across every DOT employer and C/TPA relationship from one organized driver directory.</p></div>
   <div class="dot-actions"><a class="dot-btn primary" href="dot-record.html?module=drivers&mode=new">Add Driver</a><a class="dot-btn" href="dot-testing-orders.html">Testing Orders</a><button class="dot-btn" id="refreshDrivers" type="button">Refresh</button></div>
  </header>
  <div id="driverStatus"></div>
  <div id="driverBody"><div class="dot-card"><div class="dot-empty"><div class="dot-spinner"></div><p>Loading driver directory…</p></div></div></div>
 </section>`;
}
function notice(msg,error=false){$('#driverStatus').innerHTML=`<div class="dot-banner ${error?'warning':''}"><div><strong>${error?'Action needs attention':'Driver update'}</strong><span>${esc(msg)}</span></div></div>`}

function identityKey(x){
 const email=norm(x.email);if(email)return 'email:'+email;
 const user=norm(x.auth_user_id);if(user)return 'user:'+user;
 const cdl=norm(x.cdl_number),state=norm(x.cdl_state);if(cdl)return 'cdl:'+state+':'+cdl;
 return 'id:'+x.id;
}
function chooseCanonical(list){
 return list.slice().sort((a,b)=>{
  const aa=norm(a.employment_status)==='active'?1:0,ba=norm(b.employment_status)==='active'?1:0;if(aa!==ba)return ba-aa;
  const ad=norm(a.workforce_worker_type)==='driver'?1:0,bd=norm(b.workforce_worker_type)==='driver'?1:0;if(ad!==bd)return bd-ad;
  const ac=a.cdl_number?1:0,bc=b.cdl_number?1:0;if(ac!==bc)return bc-ac;
  return stamp(b)-stamp(a);
 })[0];
}
function groupDrivers(rows){
 const map=new Map();
 for(const x of rows){const k=identityKey(x);if(!map.has(k))map.set(k,[]);map.get(k).push(x)}
 return [...map.values()].map(records=>({canonical:chooseCanonical(records),records}));
}

function render({drivers,employers,ctpas}){
 const empMap=new Map(employers.map(x=>[x.id,x]));
 const ctpaMap=new Map(ctpas.map(x=>[x.id,x]));
 const groups=groupDrivers(drivers).map(g=>{
  const x=g.canonical,emp=empMap.get(x.employer_id)||null,ctpa=emp?.ctpa_id?ctpaMap.get(emp.ctpa_id)||null:null;
  return {...g,emp,ctpa,relationship:emp?.ctpa_id?'ctpa':'direct'};
 });
 const active=groups.filter(g=>norm(g.canonical.employment_status)==='active').length;
 const safety=groups.filter(g=>g.canonical.safety_sensitive===true).length;
 const cdl=groups.filter(g=>!!g.canonical.cdl_number).length;
 const dupes=groups.filter(g=>g.records.length>1).length;

 $('#driverBody').innerHTML=`
  <div class="dot-metrics">
   ${metric('Driver Identities',groups.length,'Unique workers in the DOT directory')}
   ${metric('Active Drivers',active,'Currently active employment records')}
   ${metric('Safety-Sensitive',safety,'DOT-covered safety-sensitive workers')}
   ${metric('CDL Records',cdl,'Drivers with a CDL number on file')}
  </div>

  <div class="driver-quick-grid">
   <a class="driver-quick-card" href="dot-employers.html"><span>▧</span><div><strong>Employers</strong><small>Open the employer directory and manage each driver’s company relationship.</small></div></a>
   <a class="driver-quick-card" href="dot-testing-orders.html"><span>▤</span><div><strong>Testing Orders</strong><small>Review drug and alcohol testing orders associated with DOT workers.</small></div></a>
   <a class="driver-quick-card" href="dot-results.html"><span>✓</span><div><strong>Results</strong><small>Review completed DOT testing results and MRO activity.</small></div></a>
   <a class="driver-quick-card" href="dot-clearinghouse.html"><span>◎</span><div><strong>Clearinghouse</strong><small>Manage FMCSA Clearinghouse workflow for covered CDL drivers.</small></div></a>
  </div>

  <div class="dot-card driver-card">
   <div class="dot-card-head"><div><h2>Driver Directory</h2><p>Employer names and C/TPA relationships are resolved automatically. Obvious duplicate identities are grouped so the same driver is not presented as unrelated people.</p></div><span class="driver-count" id="driverCount">${groups.length} drivers</span></div>
   <div class="dot-card-body driver-toolbar">
    <div class="driver-filter-grid">
     <div class="dot-field"><label for="driverSearch">Search drivers</label><input id="driverSearch" type="search" placeholder="Driver, email, employer, CDL, employee number"></div>
     <div class="dot-field"><label for="driverAgency">Agency</label><select id="driverAgency"><option value="">All agencies</option>${[...new Set(groups.map(g=>g.canonical.dot_agency).filter(Boolean))].sort().map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select></div>
     <div class="dot-field"><label for="driverRelationship">Relationship</label><select id="driverRelationship"><option value="">All relationships</option><option value="ctpa">C/TPA managed</option><option value="direct">Direct employer</option></select></div>
     <div class="dot-field"><label for="driverStatusFilter">Status</label><select id="driverStatusFilter"><option value="">All statuses</option>${[...new Set(groups.map(g=>g.canonical.employment_status).filter(Boolean))].sort().map(x=>`<option value="${esc(x)}">${esc(String(x).replaceAll('_',' '))}</option>`).join('')}</select></div>
     <div class="dot-field"><label for="driverRecords">Records</label><select id="driverRecords"><option value="">All records</option><option value="single">Single record</option><option value="duplicate">Linked records</option></select></div>
     <button class="dot-btn" id="clearDriverFilters" type="button">Clear</button>
    </div>
   </div>
   <div id="driverTable"></div>
  </div>`;

 const draw=()=>{
  const q=norm($('#driverSearch').value),agency=$('#driverAgency').value,rel=$('#driverRelationship').value,status=$('#driverStatusFilter').value,records=$('#driverRecords').value;
  const filtered=groups.filter(g=>{
   const x=g.canonical;
   const hay=[personName(x),x.email,x.mobile,x.employee_number,x.cdl_number,x.cdl_state,x.job_title,x.id,g.emp?.legal_name,g.emp?.dba_name,g.emp?.primary_contact_email,g.ctpa?.legal_name,g.ctpa?.support_email,...g.records.map(r=>`${personName(r)} ${r.email||''} ${r.cdl_number||''} ${r.dot_agency||''}`)].join(' ').toLowerCase();
   return (!q||hay.includes(q))&&(!agency||String(x.dot_agency||'')===agency)&&(!rel||g.relationship===rel)&&(!status||String(x.employment_status||'')===status)&&(!records||(records==='duplicate'?g.records.length>1:g.records.length===1));
  });
  $('#driverCount').textContent=`${filtered.length} of ${groups.length} drivers${dupes?` · ${dupes} linked identity group${dupes===1?'':'s'}`:''}`;
  $('#driverTable').innerHTML=`<div class="dot-table-wrap"><table class="dot-table driver-table">
   <thead><tr><th>Driver</th><th>Employer</th><th>C/TPA / Relationship</th><th>Agency / CDL</th><th>Worker Type</th><th>Records</th><th>Status</th><th>Management</th></tr></thead>
   <tbody>${filtered.map(g=>{const x=g.canonical,empName=g.emp?.dba_name||g.emp?.legal_name||'Employer not resolved',ctpaName=g.ctpa?.legal_name||g.ctpa?.dba_name||g.ctpa?.support_email||'';return `<tr>
    <td><strong>${esc(personName(x))}</strong><small>${esc(x.email||x.mobile||x.employee_number||x.id)}</small></td>
    <td><strong>${esc(empName)}</strong><small>${esc(g.emp?.primary_contact_email||x.employer_id||'')}</small></td>
    <td>${g.relationship==='ctpa'?`<span class="driver-type ctpa">C/TPA Managed</span><small>${esc(ctpaName||g.emp?.ctpa_id||'C/TPA')}</small>`:`<span class="driver-type direct">Direct Employer</span><small>Independent employer relationship</small>`}</td>
    <td><strong>${esc(x.dot_agency||'—')}</strong><small>${esc(x.cdl_number?`${x.cdl_state?x.cdl_state+' · ':''}${x.cdl_number}`:'No CDL number on file')}</small></td>
    <td><strong>${esc(String(x.workforce_worker_type||x.job_title||'employee').replaceAll('_',' '))}</strong><small>${x.safety_sensitive?'Safety-sensitive':'Not marked safety-sensitive'}${x.dot_covered?' · DOT covered':''}</small></td>
    <td>${g.records.length>1?`<span class="driver-duplicate">${g.records.length} linked records</span>`:'<span class="driver-single">1 record</span>'}</td>
    <td>${pill(x.employment_status)}</td>
    <td><div class="driver-actions"><a class="dot-btn small primary" href="dot-record.html?module=drivers&id=${encodeURIComponent(x.id)}">Manage</a>${g.emp?`<a class="dot-btn small" href="dot-record.html?module=employers&id=${encodeURIComponent(g.emp.id)}">Employer</a>`:''}${g.ctpa?`<a class="dot-btn small" href="dot-ctpa-detail.html?id=${encodeURIComponent(g.ctpa.id)}">C/TPA</a>`:''}</div></td>
   </tr>`}).join('')||'<tr><td colspan="8"><div class="dot-empty">No drivers match these filters.</div></td></tr>'}</tbody>
  </table></div>`;
 };
 ['driverSearch','driverAgency','driverRelationship','driverStatusFilter','driverRecords'].forEach(id=>$('#'+id).addEventListener(id==='driverSearch'?'input':'change',draw));
 $('#clearDriverFilters').onclick=()=>{$('#driverSearch').value='';$('#driverAgency').value='';$('#driverRelationship').value='';$('#driverStatusFilter').value='';$('#driverRecords').value='';draw()};
 draw();
}

async function load(){
 $('#driverStatus').innerHTML='';
 const settled=await Promise.allSettled([DOTApi.call('drivers'),DOTApi.call('employers'),DOTApi.call('ctpas')]);
 if(settled[0].status!=='fulfilled')throw settled[0].reason||new Error('Unable to load drivers.');
 const ddata=settled[0].value,edata=settled[1].status==='fulfilled'?settled[1].value:{},cdata=settled[2].status==='fulfilled'?settled[2].value:{};
 if(settled[1].status!=='fulfilled'||settled[2].status!=='fulfilled')notice('Drivers loaded, but one or more employer/C/TPA relationship sources may be incomplete.',true);
 render({drivers:get(ddata,'drivers','employees'),employers:get(edata,'employers'),ctpas:get(cdata,'ctpas')});
}
async function start(){
 const state=await DOTAuth.requireAuth();if(!state)return;
 DOTShell.render(state);shell();
 $('#refreshDrivers').onclick=()=>load().catch(e=>notice(e.message,true));
 await load();
}
addEventListener('DOMContentLoaded',()=>start().catch(e=>{console.error(e);if($('#driverStatus'))notice(e?.message||String(e),true)}),{once:true});
})();
