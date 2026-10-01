(()=>{
'use strict';
if(new URLSearchParams(location.search).get('module')==='billing')return;
const $=s=>document.querySelector(s),qs=new URLSearchParams(location.search),esc=v=>DOTShell.escape(v);
const titleCase=s=>String(s||'').replaceAll('_',' ').replaceAll('-',' ').replace(/\b\w/g,m=>m.toUpperCase());
const badge=v=>`<span class="dot-status-pill ${/active|complete|paid|published|resolved|sent/i.test(v||'')?'ok':/error|failed|cancel|inactive|disabled|archived/i.test(v||'')?'bad':'warn'}">${esc(String(v||'—').replaceAll('_',' '))}</span>`;
const modulePage=m=>({employers:'dot-employers.html',owner_operators:'dot-owner-operators.html',drivers:'dot-drivers.html',programs:'dot-programs.html',pools:'dot-pools.html',testing:'dot-testing-orders.html',results:'dot-results.html',compliance:'dot-compliance.html',services:'dot-catalog.html',orders:'dot-orders.html',billing:'dot-invoices.html',documents:'dot-documents.html',training:'dot-training.html',notifications:'dot-notifications.html',support:'dot-support.html',audit_history:'dot-audit.html',selections:'dot-random-selections.html'})[m]||'dot-dashboard.html';
const arrays={employers:['employers'],owner_operators:['owner_operators'],drivers:['drivers','employees'],programs:['programs'],pools:['pools'],testing:['testing_orders','orders'],results:['results'],compliance:['compliance_cases','cases'],services:['services'],orders:['orders','service_orders'],billing:['invoices','subscriptions'],documents:['documents'],training:['training_records','training'],notifications:['notifications'],support:['tickets','support_tickets'],audit_history:['audit','events'],selections:['selections','random_selections']};
const saveActions={employers:'save_employer',owner_operators:'save_owner_operator',drivers:'save_driver',programs:'save_program',pools:'save_pool',results:'save_result',compliance:'save_compliance_case',services:'save_dot_service'};
const payloadKeys={employers:'employer',owner_operators:'owner',drivers:'driver',programs:'program',pools:'pool',results:'result',compliance:'case',services:'service'};

function shell(state,title,copy,actions=''){
  DOTShell.render(state);
  $('#dotPageMount').innerHTML=`<section class="dot-page record-management-page">
    <header class="dot-page-head"><div><span class="dot-eyebrow">DOT MANAGEMENT</span><h1>${esc(title)}</h1><p>${esc(copy)}</p></div><div class="dot-actions">${actions}</div></header>
    <div id="recordStatus"></div><div id="recordBody"><div class="dot-card"><div class="dot-empty"><div class="dot-instant-placeholder" aria-hidden="true"></div></div></div></div>
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


function firstArray(rec,names){for(const n of names){if(Array.isArray(rec?.[n]))return rec[n]}return[]}
function displayValue(v){
 if(v===null||v===undefined||v==='')return '—';
 if(typeof v==='boolean')return v?'Yes':'No';
 if(Array.isArray(v))return `${v.length} record${v.length===1?'':'s'}`;
 if(typeof v==='object')return JSON.stringify(v);
 const s=String(v);if(/_at$|_date$|date|created|updated|run_at|selected_at/i.test(s)===false)return s;
 return s;
}
function csvEscape(v){const s=String(v??'');return /[",\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s}
function downloadBlob(filename,content,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),800)}
function safeFileName(v){return String(v||'random-selection').replace(/[^a-z0-9._-]+/gi,'-').replace(/^-+|-+$/g,'')||'random-selection'}
function sourceForSelection(x,pool){const raw=String(x.source_type||x.owner_type||x.account_type||x.created_by_type||pool?.source_type||pool?.owner_type||'').toLowerCase();if(x.ctpa_id||pool?.ctpa_id||raw.includes('ctpa')||raw.includes('c/tpa'))return 'C/TPA';if(x.employer_id||pool?.employer_id||x.organization_id||pool?.organization_id||raw.includes('employer'))return 'Direct Employer';return 'Admin'}
function companyFromSelection(x,pool,ctpas,employers){
 const src=sourceForSelection(x,pool);let rec=null;
 const orgId=x.organization_id||pool?.organization_id||x.ctpa_organization_id||pool?.ctpa_organization_id||'';
 if(src==='C/TPA')rec=ctpas.find(r=>String(r.id)===String(x.ctpa_id||pool?.ctpa_id||''))||ctpas.find(r=>String(r.organization_id||r.organizations?.id||'')===String(orgId));
 if(src==='Direct Employer')rec=employers.find(r=>String(r.id)===String(x.employer_id||pool?.employer_id||''))||employers.find(r=>String(r.organization_id||r.organizations?.id||'')===String(orgId));
 const org=rec?.organizations||x.organizations||pool?.organizations||{};
 return {source:src,name:rec?.legal_name||rec?.company_name||rec?.name||org.legal_name||x.ctpa_name||x.employer_name||pool?.ctpa_name||pool?.employer_name||(src==='Admin'?'screenings4u':'—'),dba:rec?.dba_name||org.dba_name||'',dot:rec?.dot_number||rec?.usdot_number||'',mc:rec?.mc_number||'',email:rec?.support_email||rec?.primary_email||org.primary_email||rec?.email||'',phone:rec?.support_phone||rec?.phone||org.phone||'',accountId:src==='C/TPA'?(x.ctpa_id||pool?.ctpa_id||rec?.id||''):(src==='Direct Employer'?(x.employer_id||pool?.employer_id||rec?.id||''):(x.organization_id||pool?.organization_id||'')),orgId:orgId||rec?.organization_id||org.id||''};
}
function selectionMembers(rec){return firstArray(rec,['selected_members','selected_drivers','selected_employees','selected_people','selected_participants','members_selected','results'])}
function memberLabel(m,i){return m?.name||m?.employee_name||m?.driver_name||[m?.first_name,m?.last_name].filter(Boolean).join(' ')||m?.employee_number||m?.id||`Selected record ${i+1}`}
function memberRows(members){if(!members.length)return '<div class="dot-empty">No selected-person detail rows were returned with this selection record.</div>';const keys=[...new Set(members.flatMap(m=>Object.keys(m||{})))].filter(k=>!['metadata','raw','payload'].includes(k)).slice(0,8);return `<div class="dot-table-wrap"><table class="dot-table selection-members-table"><thead><tr>${keys.map(k=>`<th>${esc(titleCase(k))}</th>`).join('')}</tr></thead><tbody>${members.map(m=>`<tr>${keys.map(k=>`<td>${esc(typeof m?.[k]==='object'&&m?.[k]!==null?JSON.stringify(m[k]):displayValue(m?.[k]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}

function pick(obj,names){for(const n of names){const v=obj?.[n];if(v!==undefined&&v!==null&&v!=='')return v}return ''}
function fmtDateTime(v){if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString()}
function normalizeTestingStatus(rec){return String(pick(rec,['fulfillment_status','workflow_status','order_status','collection_status','result_status','status'])||'ordered').trim().toLowerCase().replace(/[\s-]+/g,'_')}
function testingStepIndex(rec,result){
 const st=normalizeTestingStatus(rec);
 if(result||pick(rec,['final_result','result','resulted_at','reported_at','reviewed_at'])||/result|reported|final/.test(st))return 5;
 if(pick(rec,['completed_at','test_completed_at','collection_completed_at'])||/complete|completed|collected|closed/.test(st))return 4;
 if(pick(rec,['collection_site_arrived_at','donor_at_collection_site_at','checked_in_at','arrived_at'])||/collection_site|checked_in|arrived/.test(st))return 3;
 if(pick(rec,['donor_pass_created_at','donor_pass_at','passport_created_at','donor_pass_url'])||/donor_pass|passport/.test(st))return 2;
 if(pick(rec,['processing_at','processed_at','submitted_at','sent_to_testing_at'])||/process|submitted|sent/.test(st))return 1;
 return 0;
}
function testingPerson(rec,people){
 const id=String(pick(rec,['driver_id','employee_id','person_id','donor_id'])||'');
 const email=String(pick(rec,['driver_email','employee_email','person_email','donor_email','email'])||'').toLowerCase();
 const found=people.find(x=>String(x.id||'')===id)||(email&&people.find(x=>String(x.email||'').toLowerCase()===email));
 const first=pick(found||rec,['first_name','driver_first_name','employee_first_name','donor_first_name']);
 const last=pick(found||rec,['last_name','driver_last_name','employee_last_name','donor_last_name']);
 const name=pick(rec,['driver_name','employee_name','person_name','donor_name','candidate_name'])||pick(found,['full_name','name'])||[first,last].filter(Boolean).join(' ')||id||'—';
 return {name,email:pick(rec,['driver_email','employee_email','person_email','donor_email'])||pick(found,['email']),phone:pick(rec,['driver_phone','employee_phone','person_phone','donor_phone'])||pick(found,['mobile','phone']),employee:pick(rec,['employee_number','driver_number'])||pick(found,['employee_number','driver_number']),cdl:pick(rec,['cdl_number'])||pick(found,['cdl_number']),id:id||pick(found,['id'])};
}
function testingCompany(rec,ctpas,employers){
 const source=/ctpa/i.test(String(pick(rec,['source_type','account_type','ordered_by_type','customer_type','source'])||''))||!!rec.ctpa_id?'C/TPA':'Direct Employer';
 const id=String(source==='C/TPA'?pick(rec,['ctpa_id','account_id','customer_id']):pick(rec,['employer_id','account_id','customer_id']));
 const org=String(pick(rec,['organization_id','account_organization_id','employer_organization_id','ctpa_organization_id'])||'');
 const list=source==='C/TPA'?ctpas:employers;
 const found=list.find(x=>String(x.id||'')===id)||list.find(x=>String(x.organization_id||x.organizations?.id||'')===org)||null;
 const o=found?.organizations||{};
 return {source,id:id||pick(found,['id']),org:org||pick(found,['organization_id'])||o.id||'',name:pick(found,['legal_name','company_name','name'])||pick(o,['legal_name','name'])||pick(rec,['ordered_by_name','account_name','company_name','employer_name'])||'—',dba:pick(found,['dba_name'])||pick(o,['dba_name']),dot:pick(found,['dot_number','usdot_number'])||pick(rec,['dot_number','usdot_number']),mc:pick(found,['mc_number'])||pick(rec,['mc_number']),email:pick(found,['support_email','email'])||pick(o,['primary_email'])||pick(rec,['account_email','customer_email'])};
}
function relatedTestingOrder(rec,orders){
 const testId=String(rec.id||'');
 const orderId=String(pick(rec,['order_id','screenings4u_order_id','testing_order_id'])||'');
 const orderNumber=String(pick(rec,['order_number','screenings4u_order_number'])||'');
 return orders.find(o=>String(o.id||'')===orderId)||orders.find(o=>String(pick(o,['testing_order_id','dot_testing_order_id','source_record_id'])||'')===testId)||orders.find(o=>orderNumber&&String(o.order_number||'')===orderNumber)||null;
}
function relatedTestingItems(rec,order,data){
 const all=[...(data?.order_items||[]),...(data?.items||[])];
 const oid=String(order?.id||pick(rec,['order_id','screenings4u_order_id'])||'');
 const tid=String(rec.id||'');
 const embedded=Array.isArray(order?.order_items)?order.order_items:Array.isArray(order?.items)?order.items:[];
 return [...embedded,...all.filter(x=>(oid&&String(x.order_id||'')===oid)||(tid&&String(pick(x,['testing_order_id','dot_testing_order_id','source_record_id'])||'')===tid))].filter((x,i,a)=>a.findIndex(y=>String(y.id||JSON.stringify(y))===String(x.id||JSON.stringify(x)))===i);
}
function workflowDate(rec,result,i){
 const keys=[['ordered_at','created_at','requested_at'],['processing_at','processed_at','submitted_at','sent_to_testing_at'],['donor_pass_created_at','donor_pass_at','passport_created_at'],['collection_site_arrived_at','donor_at_collection_site_at','checked_in_at','arrived_at'],['completed_at','test_completed_at','collected_at','collection_completed_at'],['resulted_at','reported_at','reviewed_at']][i];
 const v=pick(i===5?(result||rec):rec,keys);return v?fmtDateTime(v):'';
}
async function renderTestingView(rec,back,context={}){
 const {people=[],ctpas=[],employers=[],ordersData={},results=[]}=context;
 const person=testingPerson(rec,people),company=testingCompany(rec,ctpas,employers),master=relatedTestingOrder(rec,[...(ordersData.orders||[]),...(ordersData.service_orders||[])]),items=relatedTestingItems(rec,master,ordersData);
 const result=results.find(x=>String(pick(x,['testing_order_id','test_order_id','order_id'])||'')===String(rec.id||''))||results.find(x=>person.id&&String(pick(x,['driver_id','employee_id','person_id'])||'')===String(person.id)&&String(pick(x,['specimen_id','order_number'])||'')===String(pick(rec,['specimen_id','order_number'])||''))||null;
 const steps=['Ordered','Processing','Donor Pass Created','Donor at Collection Site','Test Completed','Results'];
 const current=testingStepIndex(rec,result);
 const number=pick(rec,['order_number','testing_order_number','confirmation_number'])||rec.id||'Testing Order';
 const testType=pick(rec,['test_type','testing_panel','panel_name','panel','service_name','product_name'])||'—',reason=pick(rec,['test_reason','reason','reason_for_test','testing_reason'])||'—',agency=pick(rec,['dot_agency','agency','agency_code','regulatory_authority'])||'—';
 const status=pick(rec,['fulfillment_status','workflow_status','order_status','collection_status','result_status','status'])||steps[current];
 const workflow=steps.map((label,i)=>`<div class="testing-flow-step ${i<current?'complete':i===current?'current':'future'}"><div class="testing-flow-marker"><span>${i<current?'✓':i+1}</span></div><div><strong>${esc(label)}</strong>${workflowDate(rec,result,i)?`<small>${esc(workflowDate(rec,result,i))}</small>`:''}</div></div>`).join('');
 const detailRows=[['DOT Test Order',number],['Person',person.name],['Test Type',testType],['Reason',reason],['DOT Agency',agency],['Source',company.source],['Current Fulfillment Status',titleCase(status)],['Ordered',fmtDateTime(pick(rec,['ordered_at','created_at','requested_at']))],['Collection Deadline',fmtDateTime(pick(rec,['collection_deadline','expires_at']))],['Specimen / CCF',pick(rec,['specimen_id','ccf_number','control_number'])||'—']];
 $('#recordBody').innerHTML=`
 <div class="record-hero testing-view-hero"><div><span class="dot-eyebrow">SCREENINGS4U TESTING FULFILLMENT</span><h2>${esc(number)}</h2><p>${esc(person.name)} · ${esc(testType)} · ${esc(reason)}</p></div><div class="testing-readonly-state"><span class="dot-status-pill ok">VIEW ONLY</span>${badge(status)}</div></div>
 <div class="dot-banner testing-business-banner"><div><strong>Fulfilled by screenings4u Testing</strong><span>This DOT portal only displays fulfillment progress. Test processing, donor-pass creation, collection activity, and results are managed by screenings4u Testing and cannot be changed here.</span></div></div>
 <article class="dot-card testing-workflow-card"><div class="dot-card-head"><div><h2>Testing Order Fulfillment</h2><p>Follow the screenings4u Testing order from placement through final results.</p></div></div><div class="dot-card-body"><div class="testing-flow">${workflow}</div></div></article>
 <div class="dot-grid testing-view-grid">
  <article class="dot-card" style="grid-column:span 7"><div class="dot-card-head"><div><h2>Order Details</h2><p>Read-only DOT testing order information.</p></div></div><div class="dot-card-body"><div class="selection-detail-grid">${detailRows.map(([k,v])=>`<div class="selection-detail-row"><span>${esc(k)}</span><strong>${esc(v||'—')}</strong></div>`).join('')}</div></div></article>
  <article class="dot-card" style="grid-column:span 5"><div class="dot-card-head"><div><h2>Person & Ordering Account</h2><p>Who the test is for and who placed the order.</p></div></div><div class="dot-card-body"><div class="testing-person-card"><span>PERSON TESTED</span><strong>${esc(person.name)}</strong>${person.email?`<small>${esc(person.email)}</small>`:''}${person.phone?`<small>${esc(person.phone)}</small>`:''}${person.employee?`<small>Employee # ${esc(person.employee)}</small>`:''}${person.cdl?`<small>CDL ${esc(person.cdl)}</small>`:''}</div><div class="testing-account-card"><span>${esc(company.source.toUpperCase())}</span><strong>${esc(company.name)}</strong>${company.dba?`<small>DBA: ${esc(company.dba)}</small>`:''}${company.dot?`<small>USDOT ${esc(company.dot)}</small>`:''}${company.mc?`<small>MC ${esc(company.mc)}</small>`:''}${company.email?`<small>${esc(company.email)}</small>`:''}</div></div></article>
  <article class="dot-card" style="grid-column:span 12"><div class="dot-card-head"><div><h2>screenings4u Testing Order Link</h2><p>The commerce records used by screenings4u Testing for fulfillment. This section is read-only in the DOT portal.</p></div>${master?'<span class="dot-status-pill ok">LINKED</span>':'<span class="dot-status-pill warn">AWAITING LINK</span>'}</div><div class="dot-card-body">${master?`<div class="testing-link-grid"><div><span>ORDER NUMBER</span><strong>${esc(master.order_number||master.id||'—')}</strong></div><div><span>ORDER ID</span><strong>${esc(master.id||'—')}</strong></div><div><span>ORDER STATUS</span><strong>${esc(titleCase(master.status||master.order_status||'—'))}</strong></div><div><span>ORDER ITEMS</span><strong>${items.length}</strong></div></div>${items.length?`<div class="dot-table-wrap"><table class="dot-table testing-items-table"><thead><tr><th>Item</th><th>Service / Test</th><th>Qty</th><th>Status</th></tr></thead><tbody>${items.map((x,i)=>`<tr><td>${esc(x.id||i+1)}</td><td><strong>${esc(pick(x,['name','service_name','product_name','description'])||testType)}</strong></td><td>${esc(pick(x,['quantity','qty'])||1)}</td><td>${esc(titleCase(pick(x,['status','fulfillment_status'])||master.status||'—'))}</td></tr>`).join('')}</tbody></table></div>`:''}`:`<div class="dot-empty"><strong>No linked screenings4u Testing commerce record was returned.</strong><p>The originating C/TPA or Direct Employer order should create both an <code>orders</code> record and its matching <code>order_items</code> record in Supabase. Once that link is returned by the backend, it will appear here automatically.</p></div>`}</div></article>
  ${result?`<article class="dot-card" style="grid-column:span 12"><div class="dot-card-head"><div><h2>Result Summary</h2><p>Final result information returned by screenings4u Testing.</p></div></div><div class="dot-card-body"><div class="selection-detail-grid">${[['Result Status',pick(result,['result_status','status'])],['Final Result',pick(result,['final_result','result'])],['Specimen ID',pick(result,['specimen_id'])],['Reported',fmtDateTime(pick(result,['reported_at','resulted_at']))],['Reviewed',fmtDateTime(pick(result,['reviewed_at']))]].map(([k,v])=>`<div class="selection-detail-row"><span>${esc(k)}</span><strong>${esc(v||'—')}</strong></div>`).join('')}</div></div></article>`:''}
 </div>`;
}

async function renderSelection(rec,back){
 const settled=await Promise.allSettled([DOTApi.call('pools'),DOTApi.call('ctpas'),DOTApi.call('employers')]);
 const pools=settled[0].status==='fulfilled'?arr(settled[0].value,'pools'):[],ctpas=settled[1].status==='fulfilled'?(settled[1].value?.ctpas||[]):[],employers=settled[2].status==='fulfilled'?(settled[2].value?.employers||[]):[];
 const poolId=rec.pool_id||rec.random_pool_id||rec.consortium_id||rec.dot_pool_id||'',pool=pools.find(x=>String(x.id||x.pool_id||'')===String(poolId))||null,company=companyFromSelection(rec,pool,ctpas,employers),members=selectionMembers(rec);
 const number=rec.selection_number||rec.selection_code||rec.event_number||rec.id||'DOT Selection',poolName=rec.pool_name||pool?.name||pool?.pool_name||pool?.consortium_name||poolId||'—',agency=rec.dot_agency||rec.agency||rec.agency_code||pool?.dot_agency||pool?.agency||'—',population=rec.population_size??rec.population_count??rec.eligible_count??rec.total_population??'—',selected=rec.selected_count??rec.selection_count??rec.selected_drivers_count??rec.selected_employees_count??(members.length||'—'),date=rec.selection_date||rec.run_date||rec.created_at||'—';
 const summary=[['Selection Number',number],['Pool / Consortium',poolName],['Source',company.source],['Company / Account',company.name],['DOT Agency',agency],['Selection Date',date],['Population',population],['Selected',selected],['Status',rec.status||'locked']];
 const exclude=new Set(['selected_members','selected_drivers','selected_employees','selected_people','selected_participants','members_selected','results','metadata','raw','payload']);
 const details=Object.entries(rec).filter(([k,v])=>!exclude.has(k)&&v!==null&&v!==undefined&&v!==''&&typeof v!=='object');
 const companyLines=[company.dba&&`DBA: ${company.dba}`,company.dot&&`USDOT ${company.dot}`,company.mc&&`MC ${company.mc}`,company.email,company.phone,company.accountId&&`Account ${company.accountId}`,company.orgId&&`Org ${company.orgId}`].filter(Boolean);
 $('#recordBody').innerHTML=`
 <div class="record-hero selection-view-hero"><div><span class="dot-eyebrow">READ-ONLY RANDOM SELECTION</span><h2>${esc(number)}</h2><p>Random selections are locked records. They can be reviewed and exported, but they cannot be changed from this portal.</p></div>${badge(rec.status||'locked')}</div>
 <div class="selection-export-bar"><div><strong>Export Selection</strong><span>Download the selection record for audit, compliance, or customer files.</span></div><div class="dot-actions"><button class="dot-btn" id="selectionCsv">Download CSV</button><button class="dot-btn primary" id="selectionPdf">Download PDF</button></div></div>
 <div class="dot-grid selection-readonly-grid">
  <article class="dot-card" style="grid-column:span 8"><div class="dot-card-head"><div><h2>Selection Summary</h2><p>Core information for this locked selection event.</p></div></div><div class="dot-card-body"><div class="selection-summary-grid">${summary.map(([k,v])=>`<div class="selection-value"><span>${esc(k)}</span><strong>${esc(displayValue(v))}</strong></div>`).join('')}</div></div></article>
  <aside class="dot-card" style="grid-column:span 4"><div class="dot-card-head"><div><h2>Company / Account</h2><p>Account that owns the selected pool.</p></div></div><div class="dot-card-body"><div class="selection-company"><strong>${esc(company.name)}</strong>${companyLines.map(v=>`<span>${esc(v)}</span>`).join('')}</div></div></aside>
  <article class="dot-card" style="grid-column:span 12"><div class="dot-card-head"><div><h2>Selected Participants</h2><p>${esc(String(selected))} selected from a population of ${esc(String(population))}.</p></div></div>${memberRows(members)}</article>
  <article class="dot-card" style="grid-column:span 12"><div class="dot-card-head"><div><h2>Selection Record Details</h2><p>Read-only values returned by the DOT selection record.</p></div></div><div class="dot-card-body"><div class="selection-detail-grid">${details.map(([k,v])=>`<div class="selection-detail-row"><span>${esc(titleCase(k))}</span><strong>${esc(displayValue(v))}</strong></div>`).join('')}</div></div></article>
 </div>`;
 const fileBase=safeFileName(number);
 $('#selectionCsv').onclick=()=>{
   const rows=[['Section','Field','Value'],...summary.map(([k,v])=>['Selection Summary',k,displayValue(v)]),...companyLines.map((v,i)=>['Company / Account',`Detail ${i+1}`,v]),...details.map(([k,v])=>['Selection Record',titleCase(k),displayValue(v)])];
   members.forEach((m,i)=>Object.entries(m||{}).forEach(([k,v])=>rows.push([`Selected Participant ${i+1}`,titleCase(k),typeof v==='object'&&v!==null?JSON.stringify(v):displayValue(v)])));
   downloadBlob(`${fileBase}.csv`,rows.map(r=>r.map(csvEscape).join(',')).join('\r\n'),'text/csv;charset=utf-8');
 };
 $('#selectionPdf').onclick=async()=>{
   const lib=window.jspdf?.jsPDF;if(!lib){notice('PDF library did not load. Refresh the page and try again.',true);return}
   const button=$('#selectionPdf'),originalText=button.textContent;button.disabled=true;button.textContent='Building PDF…';
   try{
     const imageData=await fetch('images/logo2.png').then(r=>{if(!r.ok)throw new Error('Logo not found');return r.blob()}).then(blob=>new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=reject;fr.readAsDataURL(blob)})).catch(()=>null);
     const doc=new lib({unit:'pt',format:'letter'}),pageW=612,pageH=792,navy=[13,49,94],blue=[36,70,127],orange=[242,83,0],light=[244,247,251],muted=[93,112,139];
     const footer=()=>{const pages=doc.internal.getNumberOfPages();for(let i=1;i<=pages;i++){doc.setPage(i);doc.setDrawColor(219,227,238);doc.line(40,pageH-38,pageW-40,pageH-38);doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(...muted);doc.text('screenings4u DOT | Read-only random selection record',40,pageH-23);doc.text(`Page ${i} of ${pages}`,pageW-40,pageH-23,{align:'right'});}};
     doc.setFillColor(...navy);doc.rect(0,0,pageW,78,'F');
     if(imageData){try{doc.addImage(imageData,'PNG',40,20,165,27)}catch(e){}}
     if(!imageData){doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(17);doc.text('screenings4u',40,38);doc.setFontSize(9);doc.text('DOT MANAGEMENT PORTAL',40,54)}
     doc.setFillColor(...orange);doc.rect(0,78,pageW,4,'F');
     doc.setTextColor(...navy);doc.setFont('helvetica','bold');doc.setFontSize(20);doc.text('DOT Random Selection',40,116);
     doc.setFontSize(10);doc.setTextColor(...muted);doc.setFont('helvetica','normal');doc.text('Official read-only selection record',40,133);
     doc.setFont('helvetica','bold');doc.setFontSize(11);doc.setTextColor(...navy);doc.text(String(number),40,154);
     doc.setFillColor(255,247,237);doc.setDrawColor(254,215,170);doc.roundedRect(430,105,142,42,6,6,'FD');doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(...orange);doc.text('RECORD STATUS',442,120);doc.setFontSize(10);doc.setTextColor(...navy);doc.text(String(rec.status||'LOCKED').toUpperCase(),442,136);
     doc.autoTable({startY:176,margin:{left:40,right:40,bottom:54},head:[['Field','Value']],body:summary.map(([k,v])=>[k,displayValue(v)]),theme:'grid',styles:{fontSize:8,cellPadding:5,textColor:[28,52,84],lineColor:[216,225,236],lineWidth:.5},headStyles:{fillColor:blue,textColor:[255,255,255],fontStyle:'bold'},alternateRowStyles:{fillColor:light}});
     let y=doc.lastAutoTable.finalY+20;
     if(y>650){doc.addPage();y=48}
     doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(...navy);doc.text('Company / Account',40,y);
     doc.setDrawColor(...orange);doc.setLineWidth(2);doc.line(40,y+6,118,y+6);
     doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(...navy);doc.text(company.name||'—',40,y+24,{maxWidth:520});
     doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(57,72,94);
     if(companyLines.length)doc.text(companyLines,40,y+38,{maxWidth:520,lineHeightFactor:1.3});
     let nextY=y+42+(companyLines.length*11);
     if(members.length){
       if(nextY>650){doc.addPage();nextY=48}
       doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(...navy);doc.text('Selected Participants',40,nextY);doc.setDrawColor(...orange);doc.line(40,nextY+6,132,nextY+6);
       const keys=[...new Set(members.flatMap(m=>Object.keys(m||{})))].filter(k=>!['metadata','raw','payload'].includes(k)).slice(0,7);
       doc.autoTable({startY:nextY+17,margin:{left:40,right:40,bottom:54},head:[keys.map(titleCase)],body:members.map(m=>keys.map(k=>typeof m?.[k]==='object'&&m?.[k]!==null?JSON.stringify(m[k]):displayValue(m?.[k]))),theme:'grid',styles:{fontSize:6.5,cellPadding:3.5,overflow:'linebreak',textColor:[28,52,84],lineColor:[216,225,236],lineWidth:.4},headStyles:{fillColor:blue,textColor:[255,255,255],fontStyle:'bold'},alternateRowStyles:{fillColor:light}});
     }
     footer();
     doc.save(`${fileBase}.pdf`);
   }catch(e){notice(`Unable to build PDF: ${e.message||e}`,true)}finally{button.disabled=false;button.textContent=originalText}
 };
}

async function load(){
 const mod=qs.get('module')||'employers',id=qs.get('id')||'',idx=Number(qs.get('row')||0),mode=qs.get('mode')||'edit',back=modulePage(mod);
 const isSelection=mod==='selections',isTesting=mod==='testing';
 shell(window.DOT_AUTH_STATE,isSelection?'Random Selection':isTesting?'Testing Order Fulfillment':`${titleCase(mod)} Management`,isSelection?'View the locked DOT random selection record and download it for your files.':isTesting?'View the screenings4u Testing fulfillment workflow for this DOT test order. This page is read-only.':`Edit operational data and run management actions for this ${titleCase(mod).toLowerCase()} record.`,`<a class="dot-btn" href="${back}">Back to ${isSelection?'Random Selections':isTesting?'Testing Orders':esc(titleCase(mod))}</a>`);
 const schema=schemas[mod],saveAction=saveActions[mod],payloadKey=payloadKeys[mod];

 if(mode==='new'){
   if(isSelection){$('#recordBody').innerHTML=`<div class="dot-card"><div class="dot-card-head"><div><h2>Random selections are generated from the Random Selections workspace</h2><p>Once a selection is created, this record page is read-only. Existing selections cannot be edited or changed.</p></div></div><div class="dot-card-body"><a class="dot-btn primary" href="${back}">Back to Random Selections</a></div></div>`;return}
   $('#recordBody').innerHTML=`<div class="dot-card"><div class="dot-card-head"><div><h2>Create ${esc(titleCase(mod))}</h2><p>Use the module's full management workflow so account creation, access, subscriptions, and audit records stay synchronized.</p></div></div><div class="dot-card-body"><div class="dot-actions"><a class="dot-btn primary" href="${back}">Open ${esc(titleCase(mod))} Workspace</a></div></div></div>`;
   return;
 }

 let d,context={};
 if(isTesting){
   const scopedCtpa=qs.get('ctpa_id')||'';
   const settled=await Promise.allSettled([scopedCtpa?DOTApi.call('customer_detail',{customer_type:'ctpa',customer_id:scopedCtpa}):DOTApi.call('overview'),DOTApi.call('ctpas'),DOTApi.call('employers'),DOTApi.call('drivers'),DOTApi.call('orders'),DOTApi.call('results')]);
   d=settled[0].status==='fulfilled'?settled[0].value:{testing_orders:[]};
   if(!arr(d,'testing').length){const fallback=await DOTApi.call('testing').catch(()=>null);if(fallback)d=fallback}
   context={ctpas:settled[1].status==='fulfilled'?arr(settled[1].value,'ctpas'):[],employers:settled[2].status==='fulfilled'?arr(settled[2].value,'employers'):[],people:settled[3].status==='fulfilled'?arr(settled[3].value,'drivers'):[],ordersData:settled[4].status==='fulfilled'?settled[4].value:{orders:[],order_items:[]},results:settled[5].status==='fulfilled'?arr(settled[5].value,'results'):[]};
 }else d=await DOTApi.call(mod);
 const records=arr(d,mod).filter(Boolean).filter(x=>!isTesting||['C/TPA','Direct Employer'].includes(testingCompany(x,context.ctpas||[],context.employers||[]).source));
 const rec=id?records.find(x=>String(x.id)===String(id)):records[idx];
 if(!rec){notice('The selected record is no longer available.',true);$('#recordBody').innerHTML='<div class="dot-card"><div class="dot-empty">Record not found.</div></div>';return}

 if(isSelection){await renderSelection(rec,back);return}
 if(isTesting){await renderTestingView(rec,back,context);return}

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

async function start(){const qs=new URLSearchParams(location.search);if(qs.get('module')==='plans')return;const state=await DOTAuth.requireAuth();if(!state)return;await load()}
addEventListener('DOMContentLoaded',()=>start().catch(e=>{console.error(e);if($('#recordStatus'))notice(e?.message||String(e),true)}),{once:true});
})();