(()=>{
'use strict';
const $=s=>document.querySelector(s);
const esc=v=>DOTShell.escape(v);
const get=(d,...keys)=>{for(const k of keys)if(Array.isArray(d?.[k]))return d[k];return[]};
const norm=v=>String(v||'').trim().toLowerCase();
const metric=(label,value,note='')=>`<article class="dot-metric"><span>${esc(label)}</span><strong>${esc(String(value??0))}</strong><small>${esc(note)}</small></article>`;
const pill=(v,cls='')=>`<span class="dot-status-pill ${cls||(/active|paid|enabled/i.test(v||'')?'ok':/inactive|archived|cancel/i.test(v||'')?'bad':'warn')}">${esc(String(v||'—').replaceAll('_',' '))}</span>`;

function shell(){
  $('#dotPageMount').innerHTML=`<section class="dot-page employer-directory-page">
    <header class="dot-page-head">
      <div>
        <span class="dot-eyebrow">DOT MANAGEMENT</span>
        <h1>DOT Employers</h1>
        <p>One directory for every DOT employer in the system — C/TPA-managed employers, direct employer customers, and employers created through screenings4u administrative orders.</p>
      </div>
      <div class="dot-actions">
        <a class="dot-btn primary" href="dot-record.html?module=employers&mode=new">Add Employer</a>
        <a class="dot-btn" href="dot-orders.html">Create Order</a>
        <button class="dot-btn" type="button" id="refreshEmployers">Refresh</button>
      </div>
    </header>
    <div id="employerStatus"></div>
    <div id="employerBody"><div class="dot-card"><div class="dot-empty"><div class="dot-instant-placeholder" aria-hidden="true"></div></div></div></div>
  </section>`;
}
function notice(msg,error=false){
  $('#employerStatus').innerHTML=`<div class="dot-banner ${error?'warning':''}"><div><strong>${error?'Action needs attention':'Employer update'}</strong><span>${esc(msg)}</span></div></div>`;
}

function classify(emp,sub){
  if(emp.ctpa_id) return {key:'ctpa',label:'C/TPA Managed',cls:'ctpa'};
  const source=norm(sub?.source);
  if(source==='stripe_checkout'||source==='website'||source.includes('checkout')) return {key:'direct',label:'Direct Website',cls:'direct'};
  if(source.includes('manual')||source.includes('admin')||source.includes('enterprise')) return {key:'admin',label:'Admin / Manual',cls:'admin'};
  return {key:'direct',label:'Direct Employer',cls:'direct'};
}

function render({employers,subs,plans,ctpas}){
  const pm=new Map(plans.map(x=>[x.id,x]));
  const cm=new Map(ctpas.map(x=>[x.id,x]));
  const rows=employers.map(emp=>{
    const employerSubs=subs.filter(s=>s.employer_id===emp.id).sort((a,b)=>Date.parse(b.created_at||0)-Date.parse(a.created_at||0));
    const active=employerSubs.find(s=>['active','trial','trialing','past_due'].includes(norm(s.status)))||employerSubs[0]||null;
    const plan=active?pm.get(active.plan_id)||active.plans:null;
    const type=classify(emp,active);
    const ctpa=emp.ctpa_id?cm.get(emp.ctpa_id):null;
    return {...emp,_sub:active,_plan:plan,_type:type,_ctpa:ctpa};
  });

  const activeCount=rows.filter(x=>norm(x.status)==='active').length;
  const ctpaCount=rows.filter(x=>x._type.key==='ctpa').length;
  const directCount=rows.filter(x=>x._type.key==='direct').length;
  const adminCount=rows.filter(x=>x._type.key==='admin').length;

  $('#employerBody').innerHTML=`
    <div class="dot-metrics">
      ${metric('All Employers',rows.length,'Entire DOT employer directory')}
      ${metric('C/TPA Managed',ctpaCount,'Employers added under a C/TPA')}
      ${metric('Direct Employers',directCount,'Direct / website employer accounts')}
      ${metric('Admin / Manual',adminCount,'Administrative employer provisioning')}
    </div>

    <div class="dot-card">
      <div class="dot-card-head">
        <div><h2>Employer Directory</h2><p>Search and manage every employer regardless of how the account entered screenings4u.</p></div>
        <span class="employer-count" id="employerCount">${rows.length} employers</span>
      </div>
      <div class="dot-card-body employer-toolbar">
        <div class="employer-filter-grid">
          <div class="dot-field">
            <label for="employerSearch">Search employers</label>
            <input id="employerSearch" type="search" placeholder="Company, email, USDOT, MC, employer ID">
          </div>
          <div class="dot-field">
            <label for="employerType">Employer type</label>
            <select id="employerType">
              <option value="">All employer types</option>
              <option value="ctpa">C/TPA managed</option>
              <option value="direct">Direct employer</option>
              <option value="admin">Admin / manual</option>
            </select>
          </div>
          <div class="dot-field">
            <label for="employerAgency">Agency</label>
            <select id="employerAgency">
              <option value="">All agencies</option>
              ${[...new Set(rows.map(x=>x.applicable_dot_agency).filter(Boolean))].sort().map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}
            </select>
          </div>
          <div class="dot-field">
            <label for="employerStatusFilter">Status</label>
            <select id="employerStatusFilter">
              <option value="">All statuses</option>
              ${[...new Set(rows.map(x=>x.status).filter(Boolean))].sort().map(x=>`<option value="${esc(x)}">${esc(String(x).replaceAll('_',' '))}</option>`).join('')}
            </select>
          </div>
          <button class="dot-btn" type="button" id="clearEmployerFilters">Clear</button>
        </div>
      </div>
      <div id="employerTable"></div>
    </div>`;

  const draw=()=>{
    const q=norm($('#employerSearch').value),type=$('#employerType').value,agency=$('#employerAgency').value,status=$('#employerStatusFilter').value;
    const filtered=rows.filter(x=>{
      const hay=[x.legal_name,x.dba_name,x.primary_contact_email,x.id,x.organization_id,x.dot_number,x.mc_number,x._ctpa?.legal_name,x._ctpa?.support_email].join(' ').toLowerCase();
      return (!q||hay.includes(q))&&(!type||x._type.key===type)&&(!agency||String(x.applicable_dot_agency||'')===agency)&&(!status||String(x.status||'')===status);
    });
    $('#employerCount').textContent=`${filtered.length} of ${rows.length} employers`;
    $('#employerTable').innerHTML=`<div class="dot-table-wrap"><table class="dot-table employer-table">
      <thead><tr><th>Employer</th><th>Type / Parent</th><th>Contact</th><th>USDOT / MC</th><th>Agency</th><th>Subscription</th><th>Status</th><th>Management</th></tr></thead>
      <tbody>${filtered.map(x=>`<tr>
        <td><strong>${esc(x.legal_name||x.dba_name||'Employer')}</strong><small>${esc(x.id)}</small></td>
        <td><span class="employer-type ${esc(x._type.cls)}">${esc(x._type.label)}</span><small>${x._ctpa?esc(x._ctpa.legal_name||x._ctpa.support_email||x.ctpa_id):x._type.key==='ctpa'?esc(x.ctpa_id||'C/TPA'):'Independent account'}</small></td>
        <td><strong>${esc(x.primary_contact_email||'—')}</strong><small>${esc(x.phone||'')}</small></td>
        <td><strong>${esc(x.dot_number||'—')}</strong><small>${esc(x.mc_number?`MC ${x.mc_number}`:'')}</small></td>
        <td>${esc(x.applicable_dot_agency||'—')}</td>
        <td>${x._sub?`<strong>${esc(x._plan?.name||x._plan?.code||'Employer subscription')}</strong><small>${esc(x._sub.source||'')} · ${pill(x._sub.status)}</small>`:'<span class="dot-status-pill warn">No subscription</span>'}</td>
        <td>${pill(x.status)}</td>
        <td><div class="employer-actions"><a class="dot-btn small primary" href="dot-record.html?module=employers&id=${encodeURIComponent(x.id)}">Manage</a>${x.ctpa_id?`<a class="dot-btn small" href="dot-ctpa-detail.html?id=${encodeURIComponent(x.ctpa_id)}">C/TPA</a>`:''}</div></td>
      </tr>`).join('')||'<tr><td colspan="8"><div class="dot-empty">No employers match these filters.</div></td></tr>'}</tbody>
    </table></div>`;
  };

  ['employerSearch','employerType','employerAgency','employerStatusFilter'].forEach(id=>$('#'+id).addEventListener(id==='employerSearch'?'input':'change',draw));
  $('#clearEmployerFilters').onclick=()=>{$('#employerSearch').value='';$('#employerType').value='';$('#employerAgency').value='';$('#employerStatusFilter').value='';draw()};
  draw();
}

async function load(){
  $('#employerStatus').innerHTML='';
  const settled=await Promise.allSettled([
    DOTApi.call('employers'),
    DOTApi.call('billing'),
    DOTApi.call('ctpas')
  ]);
  if(settled[0].status!=='fulfilled')throw settled[0].reason||new Error('Unable to load employers.');
  const edata=settled[0].value,billing=settled[1].status==='fulfilled'?settled[1].value:{},cdata=settled[2].status==='fulfilled'?settled[2].value:{};
  if(settled[1].status!=='fulfilled'||settled[2].status!=='fulfilled')notice('Employer records loaded, but subscription or C/TPA relationship data may be incomplete.',true);
  render({employers:get(edata,'employers'),subs:get(billing,'subscriptions'),plans:get(billing,'plans'),ctpas:get(cdata,'ctpas')});
}
async function start(){
  const state=await DOTAuth.requireAuth();if(!state)return;
  DOTShell.render(state);shell();
  $('#refreshEmployers').onclick=()=>load().catch(e=>notice(e.message,true));
  await load();
}
addEventListener('DOMContentLoaded',()=>start().catch(e=>{console.error(e);if($('#employerStatus'))notice(e?.message||String(e),true)}),{once:true});
})();