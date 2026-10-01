(()=>{
'use strict';
const $=s=>document.querySelector(s),qs=new URLSearchParams(location.search),esc=v=>DOTShell.escape(v);
const titleCase=s=>String(s||'').replaceAll('_',' ').replaceAll('-',' ').replace(/\b\w/g,m=>m.toUpperCase());
const badge=v=>`<span class="dot-status-pill ${/active|complete|paid|published|resolved|sent/i.test(v||'')?'ok':/error|failed|cancel|inactive|disabled|archived/i.test(v||'')?'bad':'warn'}">${esc(String(v||'—').replaceAll('_',' '))}</span>`;
const modulePage=m=>({employers:'dot-employers.html',owner_operators:'dot-owner-operators.html',drivers:'dot-drivers.html',programs:'dot-programs.html',pools:'dot-pools.html',testing:'dot-testing-orders.html',results:'dot-results.html',compliance:'dot-compliance.html',services:'dot-catalog.html',orders:'dot-orders.html',billing:'dot-invoices.html',documents:'dot-documents.html',training:'dot-training.html',notifications:'dot-notifications.html',support:'dot-support.html',audit_history:'dot-audit.html'})[m]||'dot-dashboard.html';
const arrays={employers:['employers'],owner_operators:['owner_operators'],drivers:['drivers','employees'],programs:['programs'],pools:['pools'],testing:['testing_orders','orders'],results:['results'],compliance:['compliance_cases','cases'],services:['services'],orders:['orders','service_orders'],billing:['invoices','subscriptions'],documents:['documents'],training:['training_records','training'],notifications:['notifications'],support:['tickets','support_tickets'],audit_history:['audit','events']};
const saveActions={employers:'save_employer',owner_operators:'save_owner_operator',drivers:'save_driver',programs:'save_program',pools:'save_pool',testing:'save_testing_order',results:'save_result',compliance:'save_compliance_case',services:'save_dot_service'};
const payloadKeys={employers:'employer',owner_operators:'owner',drivers:'driver',programs:'program',pools:'pool',testing:'order',results:'result',compliance:'case',services:'service'};

function shell(state,title,copy,actions=''){
  DOTShell.render(state);
  $('#dotPageMount').innerHTML=`<section class="dot-page record-management-page">
    <header class="dot-page-head"><div><span class="dot-eyebrow">DOT MANAGEMENT</span><h1>${esc(title)}</h1><p>${esc(copy)}</p></div><div class="dot-actions">${actions}</div></header>
    <div id="recordStatus"></div><div id="recordBody"><div class="dot-card"><div class="dot-empty"><div class="dot-spinner"></div><p>Loading management workspace…</p></div></div></div>
  </section>`;
}
function notice(msg,error=false){
  $('#recordStatus').innerHTML=`<div class="dot-banner ${error?'warning':''}"><div><strong>${error?'Action needs attention':'Saved'}</strong><span>${esc(msg)}</span></div></div>`;
}
function arr(d,m){for(const k of arrays[m]||[m])if(Array.isArray(d?.[k]))return d[k];return[]}
function val(v){return v===null||v===undefined?'':String(v)}
function input(name,value,type='text',readonly=false){
  return `<div class="dot-field"><label for="f_${esc(name)}">${esc(titleCase(name))}</label><input id="f_${esc(name)}" data-field="${esc(name)}" type="${type}" value="${esc(val(value))}" ${readonly?'readonly aria-readonly="true"':''}></div>`;
}
function selectField(name,value,options){
  return `<div class="dot-field"><label for="f_${esc(name)}">${esc(titleCase(name))}</label><select id="f_${esc(name)}" data-field="${esc(name)}">${options.map(o=>`<option value="${esc(o)}" ${String(value)===String(o)?'selected':''}>${esc(titleCase(o))}</option>`).join('')}</select></div>`;
}
function textarea(name,value){
  return `<div class="dot-field record-span-2"><label for="f_${esc(name)}">${esc(titleCase(name))}</label><textarea id="f_${esc(name)}" data-field="${esc(name)}">${esc(val(value))}</textarea></div>`;
}

const schemas={
 employers:{
  groups:[
   ['Company Identity',['legal_name','dba_name','ein','business_type','website','phone']],
   ['DOT Registration',['dot_number','mc_number','applicable_dot_agency','state','timezone','status']],
   ['Primary Contact',['primary_contact_name','primary_contact_email','safety_manager_name','safety_manager_email','hr_contact_name','hr_contact_email','billing_contact_name','billing_contact_email']],
   ['Workforce',['employee_count','dot_employee_count']],
   ['Primary Address',['address_line1','address_line2','city','postal_code','country']],
   ['Billing Address',['billing_address_line1','billing_address_line2','billing_city','billing_state','billing_postal_code','billing_country','billing_phone']]
  ]
 },
 owner_operators:{groups:[['Account',['legal_name','dba_name','dot_number','mc_number','state','phone','email','timezone','status','consortium_status','vehicle_count','cdl_driver_count','requires_ctpa']]]},
 drivers:{groups:[['Worker',['employee_number','first_name','middle_name','last_name','email','mobile','job_title','employment_status']],['DOT Credentials',['dot_agency','cdl_number','cdl_state','hire_date','termination_date']],['Address',['address_line1','address_line2','city','state','postal_code','country']]]},
 programs:{groups:[['Program',['name','regulatory_authority','dot_agency','testing_panel','testing_method','drug_random_rate','alcohol_random_rate','testing_frequency','effective_date','status']]]},
 pools:{groups:[['Pool',['name','pool_type','dot_agency','effective_date','drug_testing_rate','alcohol_testing_rate','selection_schedule','status']]]},
 testing:{groups:[['Testing Order',['reason','test_type','testing_panel','collection_type','collection_deadline','status','scheduled_at','collected_at','completed_at']]]},
 results:{groups:[['Test Result',['specimen_id','preliminary_status','result_status','final_result','reviewed_at','reported_at','status']]]},
 compliance:{groups:[['Compliance Case',['event_type','violation_date','priority','status','resolution','clearinghouse_status','clearinghouse_reported_at','clearinghouse_reference','compliance_due_at']]]},
 services:{groups:[['Service',['service_code','name','orderable','is_default']]]}
};

function fieldHtml(name,rec){
 const v=rec[name];
 if(name==='id'||name.endsWith('_id')||name==='tenant_id'||name==='organization_id'||name==='ctpa_id'||name==='employer_id')return input(name,v,'text',true);
 if(['status','employment_status'].includes(name)) return selectField(name,v,['onboarding','active','pending','past_due','suspended','inactive','archived','completed','cancelled'].filter((x,i,a)=>x===v||['active','pending','suspended','inactive','archived','completed','cancelled'].includes(x)));
 if(typeof v==='boolean') return `<label class="dot-check"><input data-field="${esc(name)}" type="checkbox" ${v?'checked':''}> ${esc(titleCase(name))}</label>`;
 if(name.includes('email')) return input(name,v,'email');
 if(name.includes('date')||name.endsWith('_at')) return input(name,v,'text');
 if(name==='notes'||name==='resolution'||name==='description') return textarea(name,v);
 if(typeof v==='number') return input(name,v,'number');
 return input(name,v);
}
function collect(rec,schema){
 const out={...rec};
 document.querySelectorAll('[data-field]').forEach(el=>{
   const k=el.dataset.field;
   if(el.type==='checkbox') out[k]=el.checked;
   else if(el.type==='number') out[k]=el.value===''?null:Number(el.value);
   else out[k]=el.value.trim();
 });
 return out;
}

async function load(){
 const mod=qs.get('module')||'employers',id=qs.get('id')||'',idx=Number(qs.get('row')||0),mode=qs.get('mode')||'edit',back=modulePage(mod);
 shell(window.DOT_AUTH_STATE,`${titleCase(mod)} Management`,`Edit operational data and run management actions for this ${titleCase(mod).toLowerCase()} record.`,`<a class="dot-btn" href="${back}">Back to ${esc(titleCase(mod))}</a>`);
 const schema=schemas[mod],saveAction=saveActions[mod],payloadKey=payloadKeys[mod];

 if(mode==='new'){
   $('#recordBody').innerHTML=`<div class="dot-card"><div class="dot-card-head"><div><h2>Create ${esc(titleCase(mod))}</h2><p>Use the module's full management workflow so account creation, access, subscriptions, and audit records stay synchronized.</p></div></div><div class="dot-card-body"><div class="dot-actions"><a class="dot-btn primary" href="${back}">Open ${esc(titleCase(mod))} Workspace</a></div></div></div>`;
   return;
 }

 const d=await DOTApi.call(mod);
 const records=arr(d,mod);
 const rec=id?records.find(x=>String(x.id)===String(id)):records[idx];
 if(!rec){notice('The selected record is no longer available.',true);$('#recordBody').innerHTML='<div class="dot-card"><div class="dot-empty">Record not found.</div></div>';return}

 if(!schema||!saveAction){
   $('#recordBody').innerHTML=`<div class="dot-card"><div class="dot-card-head"><div><h2>${esc(rec.legal_name||rec.name||rec.order_number||rec.id)}</h2><p>This module is managed through its operational workspace rather than a read-only record page.</p></div>${badge(rec.status||'active')}</div><div class="dot-card-body"><div class="dot-actions"><a class="dot-btn primary" href="${back}">Open ${esc(titleCase(mod))} Management</a></div></div></div>`;
   return;
 }

 const groups=schema.groups.map(([title,fields])=>`<section class="record-section"><div class="record-section-head"><h2>${esc(title)}</h2></div><div class="dot-field-grid">${fields.filter(f=>f in rec).map(f=>fieldHtml(f,rec)).join('')}</div></section>`).join('');
 const identifiers=['id','tenant_id','organization_id','ctpa_id','employer_id'].filter(k=>rec[k]!=null);
 $('#recordBody').innerHTML=`
 <div class="record-hero"><div><span class="dot-eyebrow">MANAGE RECORD</span><h2>${esc(rec.legal_name||rec.name||rec.title||rec.order_number||rec.id)}</h2><p>${esc(rec.primary_contact_email||rec.email||'')}</p></div>${badge(rec.status||rec.employment_status||'active')}</div>
 <div class="dot-grid">
   <article class="dot-card" style="grid-column:span 9"><div class="dot-card-body">${groups}</div></article>
   <aside class="dot-card record-side" style="grid-column:span 3"><div class="dot-card-head"><div><h2>Record Controls</h2><p>Save changes directly to the DOT backend.</p></div></div><div class="dot-card-body">
     ${identifiers.map(k=>`<div class="record-id"><span>${esc(titleCase(k))}</span><strong>${esc(rec[k])}</strong></div>`).join('')}
     <div class="dot-actions record-actions"><button class="dot-btn primary" id="saveRecord">Save Changes</button><button class="dot-btn" id="resetRecord">Reset</button></div>
     ${rec.ctpa_id?`<a class="dot-btn record-full" href="dot-ctpa-detail.html?id=${encodeURIComponent(rec.ctpa_id)}">Open Parent C/TPA</a>`:''}
   </div></aside>
 </div>`;

 const snapshot=JSON.stringify(rec);
 $('#resetRecord').onclick=()=>load().catch(e=>notice(e.message,true));
 $('#saveRecord').onclick=async()=>{
   const btn=$('#saveRecord');
   try{
     btn.disabled=true;btn.textContent='Saving…';
     const payload=collect(rec,schema);
     await DOTApi.call(saveAction,{[payloadKey]:payload});
     notice(`${titleCase(mod)} record saved successfully.`);
     setTimeout(()=>load().catch(e=>notice(e.message,true)),350);
   }catch(e){notice(e.message,true);btn.disabled=false;btn.textContent='Save Changes'}
 };
}

async function start(){const state=await DOTAuth.requireAuth();if(!state)return;await load()}
addEventListener('DOMContentLoaded',()=>start().catch(e=>{console.error(e);if($('#recordStatus'))notice(e?.message||String(e),true)}),{once:true});
})();