/* screenings4u DOT Management Portal — page controllers */
(()=>{
"use strict";
const page=location.pathname.split('/').pop()||'dot-dashboard.html';
const $=s=>document.querySelector(s),esc=v=>window.DOTShell.escape(v),fmtDate=v=>{if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?esc(v):new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(d)},badge=v=>`<span class="dot-status-pill ${/active|complete|paid|published|resolved|sent/i.test(v||'')?'ok':/error|failed|cancel|inactive/i.test(v||'')?'bad':/pending|draft|open|queued/i.test(v||'')?'warn':''}">${esc(String(v||'—').replaceAll('_',' '))}</span>`;
function message(msg,type='ok'){const n=$('#dotPageStatus');if(n)n.innerHTML=`<div class="dot-banner ${type==='error'?'warning':''}"><div><strong>${type==='error'?'Action needs attention':'Saved'}</strong><span>${esc(msg)}</span></div></div>`}
function base({eyebrow='DOT MANAGEMENT',title,copy,actions=''}){return `<section class="dot-page"><header class="dot-page-head"><div><span class="dot-eyebrow">${esc(eyebrow)}</span><h1>${esc(title)}</h1><p>${esc(copy)}</p></div><div class="dot-actions">${actions}<button class="dot-btn" type="button" id="dotRefresh">Refresh</button></div></header><div id="dotPageStatus"></div><div id="dotPageBody"><div class="dot-card"><div class="dot-empty"><div class="dot-spinner"></div><p>Loading DOT workspace…</p></div></div></div></section>`}
function renderBase(o){$('#dotPageMount').innerHTML=base(o);$('#dotRefresh')?.addEventListener('click',()=>load().catch(showError))}
function showError(e){console.error(e);$('#dotPageStatus').innerHTML=`<div class="dot-banner warning"><div><strong>Unable to load this DOT module.</strong><span>${esc(e?.message||String(e))}</span></div></div>`;$('#dotPageBody').innerHTML='<div class="dot-card"><div class="dot-empty">The page shell is ready, but its backend request did not complete.</div></div>'}
function table(headers,rows){return `<div class="dot-card"><div class="dot-table-wrap"><table class="dot-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}"><div class="dot-empty">No DOT records found.</div></td></tr>`}</tbody></table></div></div>`}
function metric(label,value,small=''){const shown=(value===0||value==='0')?'0':(value??'0');return `<article class="dot-metric"><span>${esc(label)}</span><strong>${esc(String(shown))}</strong><small>${esc(small)}</small></article>`}
function metrics(items){return `<div class="dot-metrics">${items.map(x=>metric(...x)).join('')}</div>`}
function get(d,...keys){for(const k of keys){if(Array.isArray(d?.[k]))return d[k]}return []}
function name(x){return esc(x?.legal_name||x?.name||x?.organizations?.legal_name||[x?.first_name,x?.last_name].filter(Boolean).join(' ')||x?.email||x?.id||'—')}
const listPages={
 'dot-ctpas.html':{action:'ctpas',title:'DOT C/TPAs',copy:'Manage every C/TPA account, subscription, features, staff, customer portfolio, branding, billing, support, and portal controls.',headers:['C/TPA','Contact','Portal','Status','Manage'],rows:d=>get(d,'ctpas').map(x=>[name(x),esc(x.support_email||x.organizations?.primary_email||'—'),badge(x.portal_status||'configured'),badge(x.status),`<a class="dot-btn small primary" href="dot-ctpa-detail.html?id=${encodeURIComponent(x.id)}">Manage</a>`])},
 'dot-employers.html':{action:'employers',title:'DOT Employers',copy:'Manage direct and C/TPA-sponsored employers, USDOT details, agencies, and status.',headers:['Employer','USDOT / MC','Agency','Status'],rows:d=>get(d,'employers').map(x=>[name(x),esc([x.dot_number,x.mc_number].filter(Boolean).join(' / ')||'—'),esc(x.applicable_dot_agency||x.dot_agency||'—'),badge(x.status)])},
 'dot-owner-operators.html':{action:'owner_operators',title:'Owner-Operators',copy:'Manage FMCSA owner-operator accounts and consortium participation.',headers:['Owner-Operator','USDOT / MC','Consortium','Status'],rows:d=>get(d,'owner_operators').map(x=>[name(x),esc([x.dot_number,x.mc_number].filter(Boolean).join(' / ')||'—'),esc(x.consortium_name||x.pool_name||'—'),badge(x.status)])},
 'dot-drivers.html':{action:'drivers',title:'DOT Drivers',copy:'Manage safety-sensitive drivers and DOT workforce records.',headers:['Driver','Employer','Agency / CDL','Status'],rows:d=>get(d,'drivers','employees').map(x=>[name(x),esc(x.employer_name||x.employer_id||'—'),esc([x.dot_agency,x.cdl_number].filter(Boolean).join(' · ')||'—'),badge(x.status||x.employment_status)])},
 'dot-programs.html':{action:'programs',title:'DOT Programs',copy:'Manage employer programs, testing panels, agencies, and compliance settings.',headers:['Program','Employer','Agency','Status'],rows:d=>get(d,'programs').map(x=>[name(x),esc(x.employer_name||x.employer_id||'—'),esc(x.dot_agency||x.agency||'—'),badge(x.status)])},
 'dot-pools.html':{action:'pools',title:'Consortiums & Random Pools',copy:'Manage DOT consortiums, random pools, ownership, membership, and selection setup.',headers:['Pool / Consortium','Owner','Agency','Members','Status'],rows:d=>get(d,'pools').map(x=>[name(x),esc(x.ctpa_name||x.employer_name||x.ctpa_id||x.employer_id||'—'),esc(x.dot_agency||'—'),esc(x.member_count??x.population_size??'—'),badge(x.status)])},
 'dot-random-selections.html':{action:'selections',title:'Random Selections',copy:'Review DOT random selection events, population, completion, and notices.',headers:['Selection','Pool','Date','Population','Status'],rows:d=>get(d,'selections').map(x=>[esc(x.selection_number||x.id||'—'),esc(x.pool_name||x.pool_id||'—'),fmtDate(x.selection_date||x.created_at),esc(x.population_size??'—'),badge(x.status)])},
 'dot-testing-orders.html':{action:'testing',title:'DOT Testing Orders',copy:'Manage drug and alcohol testing requests, collections, status, and handoff.',headers:['Order','Person','Employer','Test','Status'],rows:d=>get(d,'testing_orders','orders').map(x=>[esc(x.order_number||x.id||'—'),esc(x.driver_name||x.employee_name||x.employee_id||'—'),esc(x.employer_name||x.employer_id||'—'),esc([x.test_reason,x.test_type].filter(Boolean).join(' · ')||'—'),badge(x.status)])},
 'dot-results.html':{action:'results',title:'DOT Results',copy:'Review DOT test results, documents, publication status, and final disposition.',headers:['Result','Order','Person','Outcome','Status'],rows:d=>get(d,'results').map(x=>[esc(x.result_number||x.id||'—'),esc(x.order_number||x.testing_order_id||'—'),esc(x.driver_name||x.employee_name||x.employee_id||'—'),esc(x.result||x.outcome||'—'),badge(x.status)])},
 'dot-compliance.html':{action:'compliance',title:'Compliance Cases',copy:'Manage DOT compliance cases, deadlines, priorities, and corrective action.',headers:['Case','Employer','Event','Priority','Status'],rows:d=>get(d,'compliance_cases','cases').map(x=>[esc(x.case_number||x.id||'—'),esc(x.employer_name||x.employer_id||'—'),esc(x.event_type||'—'),esc(x.priority||'—'),badge(x.status)])},
 'dot-clearinghouse.html':{action:'clearinghouse',title:'Clearinghouse',copy:'Manage FMCSA Clearinghouse account relationships and query-management settings.',headers:['Account','C/TPA','Identifier','Features','Status'],rows:d=>get(d,'clearinghouse').map(x=>[name(x),esc(x.ctpa_name||x.ctpa_id||'—'),esc(x.clearinghouse_account_identifier||x.account_identifier||'—'),esc(x.query_management_enabled===true?'Query management enabled':'—'),badge(x.status)])},
 'dot-return-to-duty.html':{action:'rtd',title:'Return-to-Duty / SAP',copy:'Manage SAP evaluations, return-to-duty cases, and follow-up testing status.',headers:['Case','Evaluation','RTD Status','Compliance Case','Status'],rows:d=>get(d,'sap_cases','rtd','cases').map(x=>[esc(x.id||'—'),fmtDate(x.evaluation_date),esc(x.return_to_duty_status||'—'),esc(x.compliance_case_id||'—'),badge(x.status)])},
 'dot-catalog.html':{action:'services',title:'DOT Catalog & Pricing',copy:'Manage DOT services and the product catalog presented to DOT customers.',headers:['Service','Category','Delivery','Price / Code','Status'],rows:d=>get(d,'services').map(x=>[name(x),esc(x.category||'—'),esc(x.delivery_method||x.delivery||'—'),esc(x.price??x.code??'—'),badge(x.status)])},
 'dot-orders.html':{action:'orders',title:'DOT Service Orders',copy:'Review service orders and order status for DOT customers.',headers:['Order','Customer','Service','Total','Status'],rows:d=>get(d,'orders','service_orders').map(x=>[esc(x.order_number||x.id||'—'),esc(x.customer_name||x.employer_name||x.organization_id||'—'),esc(x.service_name||x.service_code||'—'),esc(x.total??x.amount??'—'),badge(x.status)])},
 'dot-invoices.html':{action:'billing',title:'DOT Billing & Invoices',copy:'Review subscriptions, invoices, receivables, and billing status for DOT accounts.',headers:['Invoice / Account','Customer','Amount','Due','Status'],rows:d=>get(d,'invoices','subscriptions').map(x=>[esc(x.invoice_number||x.id||'—'),esc(x.customer_name||x.organization_id||'—'),esc(x.total??x.amount_due??x.amount??'—'),fmtDate(x.due_date||x.current_period_end),badge(x.status)])},
 'dot-documents.html':{action:'documents',title:'DOT Documents',copy:'Manage documents attached to DOT employers, drivers, programs, and compliance records.',headers:['Document','Customer','Type','Updated','Status'],rows:d=>get(d,'documents').map(x=>[name(x),esc(x.customer_name||x.employer_id||'—'),esc(x.document_type||'—'),fmtDate(x.updated_at||x.uploaded_at||x.created_at),badge(x.status||'active')])},
 'dot-training.html':{action:'training',title:'DOT Training Records',copy:'Review DOT-required and customer-assigned training records.',headers:['Training','Person / Account','Type','Completed','Status'],rows:d=>get(d,'training_records','training').map(x=>[name(x),esc(x.driver_name||x.employee_id||x.organization_id||'—'),esc(x.training_type||'—'),fmtDate(x.completed_at),badge(x.status)])},
 'dot-notifications.html':{action:'notifications',title:'DOT Notifications',copy:'Review and manage outbound DOT portal notifications and notices.',headers:['Subject','Channel','Recipient','Queued / Sent','Status'],rows:d=>get(d,'notifications').map(x=>[esc(x.subject||x.event_type||'—'),esc(x.channel||'—'),esc(x.recipient||x.email||'—'),fmtDate(x.sent_at||x.queued_at||x.created_at),badge(x.status)])},
 'dot-support.html':{action:'support',title:'DOT Support',copy:'Manage support activity for DOT C/TPAs, employers, owner-operators, drivers, and portal users.',headers:['Ticket','Customer','Priority','Updated','Status'],rows:d=>get(d,'tickets','support_tickets').map(x=>[esc(x.ticket_number||x.id||'—'),esc(x.customer_name||x.organization_id||'—'),esc(x.priority||'—'),fmtDate(x.updated_at||x.created_at),badge(x.status)])},
 'dot-audit.html':{action:'audit_history',title:'DOT Audit History',copy:'Review DOT management actions and operational audit events.',headers:['Event','Actor','Resource','Date','Status'],rows:d=>get(d,'audit','events').map(x=>[esc(x.action||x.event_type||'—'),esc(x.actor_email||x.actor_id||'—'),esc(x.resource_type||x.resource_id||'—'),fmtDate(x.created_at),badge(x.status||'recorded')])}
};
function genericActionButtons(action){return `<a class="dot-btn primary" href="dot-record.html?module=${encodeURIComponent(action)}&mode=new">New Record</a>`}
async function loadList(c){const scopedCtpa=new URLSearchParams(location.search).get('ctpa_id')||'';const actions=(scopedCtpa?`<a class="dot-btn" href="dot-ctpa-detail.html?id=${encodeURIComponent(scopedCtpa)}">Back to C/TPA</a>`:'')+genericActionButtons(c.action);renderBase({title:c.title,copy:scopedCtpa?c.copy+' Showing records for the selected C/TPA only.':c.copy,actions});const d=scopedCtpa?await window.DOTApi.call('customer_detail',{customer_type:'ctpa',customer_id:scopedCtpa}):await window.DOTApi.call(c.action);const rows=c.rows(d).map((r,i)=>[...r,`<a class="dot-btn small" href="dot-record.html?module=${encodeURIComponent(c.action)}&row=${i}${scopedCtpa?'&ctpa_id='+encodeURIComponent(scopedCtpa):''}">Manage</a>`]);$('#dotPageBody').innerHTML=metrics([['Records',rows.length,'Live DOT records'],['Module',c.action,'DOT data source'],['C/TPA Scope',scopedCtpa?'Selected':'All','Management filter'],['Host','dot-portal','Management']])+table([...c.headers,'Manage'],rows)}
async function loadCtpas(){
 renderBase({title:'DOT C/TPAs',copy:'Create and manage every C/TPA account, subscription, portal access, billing, invitations, features, staff, customers, and support.',actions:'<a class="dot-btn primary" href="dot-account-creation.html">Create C/TPA Account</a><a class="dot-btn" href="dot-portal-detail.html?portal=ctpa_dot">C/TPA Portal Control</a>'});
 const settled=await Promise.allSettled([DOTApi.call('ctpas'),DOTApi.call('billing'),DOTApi.call('portal_access')]);
 const cdata=settled[0].status==='fulfilled'?settled[0].value:{ctpas:[]},billing=settled[1].status==='fulfilled'?settled[1].value:{subscriptions:[],plans:[]},accessData=settled[2].status==='fulfilled'?settled[2].value:{};
 const allCtpas=get(cdata,'ctpas'),subs=get(billing,'subscriptions'),plans=get(billing,'plans'),access=get(accessData,'portal_access','organization_portal_access','ctpa_portal_access');
 const emailKey=x=>String(x?.support_email||x?.organizations?.primary_email||'').trim().toLowerCase();
 const stamp=x=>Math.max(Date.parse(x?.organizations?.updated_at||0)||0,Date.parse(x?.updated_at||0)||0,Date.parse(x?.created_at||0)||0);
 const grouped=new Map();for(const x of allCtpas){const k=emailKey(x)||('ctpa:'+x.id);if(!grouped.has(k))grouped.set(k,[]);grouped.get(k).push(x)}
 const ctpas=[...grouped.values()].map(list=>list.slice().sort((a,b)=>stamp(b)-stamp(a))[0]).filter(x=>String(x.status||'').toLowerCase()!=='inactive');
 const pm=new Map(plans.map(x=>[x.id,x]));
 const rows=ctpas.map(x=>{const sub=subs.find(z=>z.ctpa_id===x.id&&['active','trial','trialing','past_due'].includes(String(z.status||'').toLowerCase()))||subs.find(z=>z.ctpa_id===x.id)||null,plan=sub?pm.get(sub.plan_id):null,pa=access.find(z=>z.organization_id===x.organization_id&&z.portal_code==='ctpa_dot')||null;return [
   `<strong>${name(x)}</strong><br><small>${esc(x.id)}</small>`,
   esc(x.support_email||x.organizations?.primary_email||'—'),
   sub?`<strong>${esc(plan?.name||plan?.code||'Subscription')}</strong><br><small>${esc(sub.billing_frequency||'')} · ${badge(sub.status)}</small>`:'<span class="dot-status-pill warn">No subscription</span>',
   pa?.enabled?'<span class="dot-status-pill ok">Granted</span>':'<span class="dot-status-pill warn">Not granted</span>',
   badge(x.status),
   `<a class="dot-btn small primary" href="dot-ctpa-detail.html?id=${encodeURIComponent(x.id)}">Manage</a>`
 ]});
 $('#dotPageBody').innerHTML=metrics([['C/TPA Accounts',String(ctpas.length),'Live DOT C/TPA accounts'],['Active Subscriptions',String(subs.filter(x=>ctpas.some(c=>c.id===x.ctpa_id)&&String(x.status).toLowerCase()==='active').length),'Current C/TPA subscriptions'],['Portal Access',String(access.filter(x=>x.portal_code==='ctpa_dot'&&x.enabled===true&&ctpas.some(c=>c.organization_id===x.organization_id)).length),'C/TPA portal grants'],['Portal','ctpa-dot','Customer management portal']])+`<div class="dot-card"><div class="dot-card-head"><div><h2>C/TPA Accounts</h2><p>Orange Manage opens the complete account-control workspace for that C/TPA.</p></div><a class="dot-btn primary" href="dot-account-creation.html">New C/TPA</a></div>${table(['C/TPA','Primary Contact','Subscription','Portal Access','Status','Management'],rows)}</div>`;
}
function money(v){const n=Number(v||0);return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number.isFinite(n)?n:0)}
async function loadOrders(){
 const qs=new URLSearchParams(location.search),requestedCtpa=qs.get('ctpa_id')||'';
 renderBase({title:'Create Order',copy:'Create screenings4u drug & alcohol testing, instant-test, and collection-supply orders from the screenings4u Workforce DOT management portal. This page creates orders only — it never creates or changes customer accounts.',actions:`${requestedCtpa?`<a class="dot-btn" href="dot-ctpa-detail.html?id=${encodeURIComponent(requestedCtpa)}">Back to C/TPA</a>`:'<a class="dot-btn" href="dot-ctpas.html">C/TPA Accounts</a>'}<a class="dot-btn" href="dot-invoices.html">Billing & Invoices</a>`});
 const req=[DOTApi.invoke(DOT_PORTAL_CONFIG.adminOrderFunction||'dot-admin-order',{action:'catalog'}),DOTApi.call('orders').catch(()=>({orders:[]})),DOTApi.call('ctpas').catch(()=>({ctpas:[]}))];
 if(requestedCtpa)req.push(DOTApi.call('customer_detail',{customer_type:'ctpa',customer_id:requestedCtpa}));
 const loaded=await Promise.all(req),cat=loaded[0],history=loaded[1],ctpaDirectory=loaded[2]||{ctpas:[]},existing=requestedCtpa?loaded[3]:null,services=cat.services||[],org=existing?.organization||existing?.customer?.organizations||{},ctpa=existing?.customer||null,members=existing?.memberships||[],primary=members.find(x=>x.is_primary)||members[0]||{},profile=primary.profiles||{},meta=org.metadata||{};
 if(requestedCtpa&&!ctpa)throw new Error('The selected C/TPA account was not found.');
 const v=x=>esc(x||''),states=['','AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];
 const stateOpts=cur=>states.map(x=>`<option value="${x}" ${String(cur||'')===x?'selected':''}>${x||'Select'}</option>`).join('');
 const groups={};for(const x of services){const g=x.metadata?.catalog_group||x.metadata?.category||x.product_type||'Services';(groups[g]??=[]).push(x)}
 const groupOrder=['Collection Supplies','Instant Tests'];const sortedGroups=Object.keys(groups).sort((a,b)=>{const ia=groupOrder.indexOf(a),ib=groupOrder.indexOf(b);if(ia>=0||ib>=0)return (ia<0?99:ia)-(ib<0?99:ib);return a.localeCompare(b)});
 const cards=sortedGroups.map(g=>`<section class="dot-order-category"><div class="dot-order-category-head"><div><h3>${esc(g)}</h3><p>Select one or more items and adjust quantities.</p></div></div><div class="dot-order-grid">${groups[g].map(x=>{const pr=Number(x.current_price?.amount||0);return `<label class="dot-order-choice order-product"><input type="checkbox" class="orderItem" value="${esc(x.id)}" data-price="${pr}" data-name="${esc(x.name)}"><span><strong>${esc(x.name)}</strong><b>${money(pr)}</b><small>${esc(x.description||'')}</small><span class="order-qty-row"><em>Qty</em><input class="orderQty" type="number" min="1" max="999" value="1" data-service="${esc(x.id)}"></span></span></label>`}).join('')}</div></section>`).join('');
 const recent=get(history,'orders','service_orders').filter(x=>x.metadata?.created_by_business==='screenings4u_workforce_dot'||x.metadata?.source==='screenings4u_workforce_dot_admin_order').slice(0,15).map(x=>[esc(x.order_number||x.id),esc(x.company_name||x.customer_email||'—'),money(x.total||0),badge(x.payment_status||x.status),fmtDate(x.created_at)]);
 const company=org.legal_name||org.dba_name||'',contactFirst=profile.first_name||meta.contact_first_name||'',contactLast=profile.last_name||meta.contact_last_name||'',contactEmail=profile.email||org.primary_email||ctpa?.support_email||meta.contact_email||'',contactPhone=profile.phone||org.phone||ctpa?.support_phone||meta.contact_phone||'';
 $('#dotPageBody').innerHTML=`
 ${requestedCtpa?`<div class="dot-banner"><div><strong>Ordering for existing C/TPA</strong><span>${esc(company||requestedCtpa)}. Creating this order will not create another account or alter the C/TPA subscription.</span></div></div>`:''}
 <div class="dot-order-layout">
  <div class="dot-order-main">
   <article class="dot-card"><div class="dot-card-head"><div><h2>1. Business Information</h2><p>Customer business associated with this screenings4u order.</p></div></div><div class="dot-card-body"><div class="dot-field-grid">
    <div class="dot-field"><label>Business / Company Name *</label><input id="ordCompany" value="${v(company)}"></div>
    <div class="dot-field"><label>DBA / Display Name</label><input id="ordDba" value="${v(org.dba_name)}"></div>
    <div class="dot-field"><label>EIN</label><input id="ordEin" value="${v(org.ein)}"></div>
    <div class="dot-field"><label>Website</label><input id="ordWebsite" value="${v(org.website)}"></div>
    <div class="dot-field"><label>Business Phone</label><input id="ordBusinessPhone" value="${v(org.phone||ctpa?.support_phone)}"></div>
    <div class="dot-field"><label>Customer / C/TPA ID</label><input value="${v(requestedCtpa)}" disabled></div>
   </div></div></article>
   <article class="dot-card"><div class="dot-card-head"><div><h2>2. Contact Information</h2><p>Order contact and receipt information.</p></div></div><div class="dot-card-body"><div class="dot-field-grid">
    <div class="dot-field"><label>First Name *</label><input id="ordFirst" value="${v(contactFirst)}"></div>
    <div class="dot-field"><label>Last Name *</label><input id="ordLast" value="${v(contactLast)}"></div>
    <div class="dot-field"><label>Email *</label><input id="ordEmail" type="email" value="${v(contactEmail)}"></div>
    <div class="dot-field"><label>Phone</label><input id="ordPhone" value="${v(contactPhone)}"></div>
   </div></div></article>
   <article class="dot-card"><div class="dot-card-head"><div><h2>3. Addresses</h2><p>Billing, shipping, and mailing details are stored with the order.</p></div></div><div class="dot-card-body">
    <div class="dot-address-columns">
     ${addressBlock('Billing','bill',org)}
     ${addressBlock('Shipping','ship',org,true)}
     ${addressBlock('Mailing','mail',org,true)}
    </div>
   </div></article>
   <article class="dot-card"><div class="dot-card-head"><div><h2>4. Services & Supplies</h2><p>Prices come directly from the screenings4u Supabase service catalog.</p></div><span class="dot-badge active">${services.length} items</span></div><div class="dot-card-body">${cards||'<div class="dot-empty">No orderable screenings4u items are configured.</div>'}</div></article>
   <article class="dot-card"><div class="dot-card-head"><div><h2>5. Order Notes</h2><p>Internal and customer-facing order notes.</p></div></div><div class="dot-card-body"><div class="dot-field-grid">
    <div class="dot-field"><label>Internal Notes</label><textarea id="ordInternalNotes" rows="4"></textarea></div>
    <div class="dot-field"><label>Customer Notes</label><textarea id="ordCustomerNotes" rows="4"></textarea></div>
   </div></div></article>
   <div id="orderResult"></div>
   <article class="dot-card"><div class="dot-card-head"><div><h2>Recent Workforce DOT Orders</h2><p>Orders created here are written to the screenings4u master order table and sold by screenings4u.</p></div></div>${table(['Order','Customer','Total','Payment','Created'],recent)}</article>
  </div>
  <aside class="dot-order-sidebar">
   <article class="dot-card dot-order-summary-card"><div class="dot-card-head"><div><h2>Order Summary</h2><p>screenings4u order</p></div></div><div class="dot-card-body">
    <div id="orderSummaryItems" class="dot-summary-lines"><div class="dot-empty compact">Select services or supplies.</div></div>
    <div class="dot-summary-total"><span>Total</span><strong id="orderTotal">$0.00</strong></div>
    <div class="dot-form-subhead">Payment</div>
    <label class="dot-payment-choice"><input type="radio" name="orderPayment" value="stripe" checked><span><strong>Take payment now</strong><small>Secure Stripe Payment Element mounted on this page.</small></span></label>
    <label class="dot-payment-choice"><input type="radio" name="orderPayment" value="unpaid"><span><strong>Create without payment</strong><small>Create an unpaid screenings4u order for follow-up billing.</small></span></label>
    <button class="dot-btn primary dot-btn-block" id="processOrder" type="button">Process Order</button>
    <div id="stripePaymentPanel" class="dot-stripe-panel" hidden><div class="dot-form-subhead">Secure Payment</div><div id="paymentElement"></div><div id="stripeMessage" class="dot-help"></div><button class="dot-btn primary dot-btn-block" id="completeStripePayment" type="button">Pay & Complete Order</button></div>
    <p class="dot-help">Seller: screenings4u, LLC · Created by: screenings4u Workforce DOT.</p>
   </div></article>
  </aside>
 </div>`;
 function addressBlock(title,prefix,o,same=false){return `<section class="dot-address-card"><div class="dot-address-title"><h3>${title} Address</h3>${same?`<label class="dot-check mini"><input type="checkbox" class="copyBilling" data-target="${prefix}"> Same as billing</label>`:''}</div><div class="dot-field"><label>Address 1</label><input id="${prefix}Address1" value="${v(o.address_line1)}"></div><div class="dot-field"><label>Address 2</label><input id="${prefix}Address2" value="${v(o.address_line2)}"></div><div class="dot-field-grid"><div class="dot-field"><label>City</label><input id="${prefix}City" value="${v(o.city)}"></div><div class="dot-field"><label>State</label><select id="${prefix}State">${stateOpts(o.state_region)}</select></div><div class="dot-field"><label>ZIP</label><input id="${prefix}Zip" value="${v(o.postal_code)}"></div><div class="dot-field"><label>Country</label><select id="${prefix}Country"><option value="US" selected>United States of America</option><option value="CA">Canada</option><option value="MX">Mexico</option></select></div></div></section>`}
 function selected(){return [...document.querySelectorAll('.orderItem:checked')].map(ch=>{const q=document.querySelector(`.orderQty[data-service="${CSS.escape(ch.value)}"]`);return {service_id:ch.value,quantity:Math.max(1,Number(q?.value||1)),name:ch.dataset.name||'',price:Number(ch.dataset.price||0)}})}
 function redraw(){const lines=selected(),total=lines.reduce((a,x)=>a+x.price*x.quantity,0);$('#orderTotal').textContent=money(total);$('#orderSummaryItems').innerHTML=lines.length?lines.map(x=>`<div class="dot-summary-line"><span>${esc(x.name)} × ${x.quantity}</span><strong>${money(x.price*x.quantity)}</strong></div>`).join(''):'<div class="dot-empty compact">Select services or supplies.</div>'}
 document.querySelectorAll('.orderItem,.orderQty').forEach(x=>x.addEventListener('change',redraw));
 document.querySelectorAll('.orderQty').forEach(x=>x.addEventListener('click',e=>e.stopPropagation()));
 document.querySelectorAll('.copyBilling').forEach(x=>x.addEventListener('change',()=>{if(!x.checked)return;const t=x.dataset.target;for(const f of ['Address1','Address2','City','State','Zip','Country']){const a=$(`#bill${f}`),b=$(`#${t}${f}`);if(a&&b)b.value=a.value}}));
 function addr(prefix){return {address_line1:$(`#${prefix}Address1`).value.trim(),address_line2:$(`#${prefix}Address2`).value.trim(),city:$(`#${prefix}City`).value.trim(),state:$(`#${prefix}State`).value,postal_code:$(`#${prefix}Zip`).value.trim(),country:$(`#${prefix}Country`).value}}
 function canonicalCtpaByEmail(email){const key=String(email||'').trim().toLowerCase(),rows=ctpaDirectory.ctpas||[],stamp=x=>Math.max(Date.parse(x?.organizations?.updated_at||0)||0,Date.parse(x?.updated_at||0)||0,Date.parse(x?.created_at||0)||0);return rows.filter(x=>String(x.support_email||x.organizations?.primary_email||'').trim().toLowerCase()===key&&String(x.status||'').toLowerCase()!=='inactive').sort((a,b)=>stamp(b)-stamp(a))[0]||null}
 async function syncExistingCtpa(p){const match=canonicalCtpaByEmail(p.customer.email);if(!match)return p;const detail=await DOTApi.call('customer_detail',{customer_type:'ctpa',customer_id:match.id}).catch(()=>({})),mbrs=detail.memberships||[],prim=mbrs.find(x=>x.is_primary)||mbrs[0]||{};await DOTApi.invoke(DOT_PORTAL_CONFIG.ctpaAdminFunction||'dot-ctpa-admin-data',{action:'save_company_profile',ctpa_id:match.id,profile:{primary_user_id:prim.user_id||'',legal_name:p.business.company_name,dba_name:p.business.dba_name,website:p.business.website,ein:p.business.ein,office_phone:p.business.phone,contact_first_name:p.customer.first_name,contact_last_name:p.customer.last_name,contact_phone:p.customer.phone,contact_email:p.customer.email,address_line1:p.billing.address_line1,address_line2:p.billing.address_line2,city:p.billing.city,state:p.billing.state,postal_code:p.billing.postal_code,country:p.billing.country||'US',status:'active',support_email:p.customer.email,support_phone:p.business.phone||p.customer.phone}});p.ctpa_id=match.id;p.organization_id=match.organization_id;return p}
 function payload(){return {ctpa_id:requestedCtpa||null,organization_id:org.id||null,business:{company_name:$('#ordCompany').value.trim(),dba_name:$('#ordDba').value.trim(),ein:$('#ordEin').value.trim(),website:$('#ordWebsite').value.trim(),phone:$('#ordBusinessPhone').value.trim()},customer:{first_name:$('#ordFirst').value.trim(),last_name:$('#ordLast').value.trim(),email:$('#ordEmail').value.trim(),phone:$('#ordPhone').value.trim()},billing:addr('bill'),shipping:addr('ship'),mailing:addr('mail'),items:selected(),internal_notes:$('#ordInternalNotes').value.trim(),customer_notes:$('#ordCustomerNotes').value.trim()}}
 let stripe=null,elements=null,prepared=null;
 $('#processOrder').onclick=async()=>{const btn=$('#processOrder');try{let p=payload();if(!p.business.company_name||!p.customer.first_name||!p.customer.last_name||!p.customer.email)throw new Error('Business name and contact first name, last name, and email are required.');if(!p.items.length)throw new Error('Select at least one service or supply item.');p=await syncExistingCtpa(p);const mode=document.querySelector('input[name="orderPayment"]:checked')?.value||'stripe';btn.disabled=true;btn.textContent=mode==='stripe'?'Preparing Secure Payment…':'Creating Order…';if(mode==='unpaid'){const r=await DOTApi.invoke(DOT_PORTAL_CONFIG.adminOrderFunction||'dot-admin-order',{action:'create_unpaid',...p});$('#orderResult').innerHTML=`<div class="dot-banner"><div><strong>Order ${esc(r.order.order_number)} created</strong><span>The order was created in the screenings4u order table without payment. Total ${money(r.order.total)}.</span></div></div>`;btn.textContent='Order Created';return}
 const r=await DOTApi.invoke(DOT_PORTAL_CONFIG.adminOrderFunction||'dot-admin-order',{action:'prepare_stripe_payment',...p});prepared=r;if(!window.Stripe)throw new Error('Stripe.js did not load.');stripe=Stripe(r.publishable_key);elements=stripe.elements({clientSecret:r.client_secret,appearance:{theme:'stripe'}});elements.create('payment',{layout:'tabs'}).mount('#paymentElement');$('#stripePaymentPanel').hidden=false;btn.hidden=true;$('#stripeMessage').textContent=`Order ${r.order.order_number} has been prepared. Complete the secure payment below.`;}catch(e){btn.disabled=false;btn.textContent='Process Order';message(e.message,'error')}};
 $('#completeStripePayment').onclick=async()=>{const btn=$('#completeStripePayment');try{if(!stripe||!elements||!prepared)throw new Error('Secure payment is not ready.');btn.disabled=true;btn.textContent='Processing Payment…';const result=await stripe.confirmPayment({elements,redirect:'if_required'});if(result.error)throw new Error(result.error.message||'Payment failed.');const r=await DOTApi.invoke(DOT_PORTAL_CONFIG.adminOrderFunction||'dot-admin-order',{action:'confirm_stripe_payment',order_id:prepared.order.id});$('#stripeMessage').textContent='Payment completed successfully.';$('#orderResult').innerHTML=`<div class="dot-banner"><div><strong>Order ${esc(r.order.order_number)} paid</strong><span>The screenings4u order is now paid and ready for fulfillment.</span></div></div>`;btn.textContent='Payment Complete';}catch(e){btn.disabled=false;btn.textContent='Pay & Complete Order';$('#stripeMessage').textContent=e.message;message(e.message,'error')}};
 redraw();
}
async function loadDashboard(){
 renderBase({title:'DOT Management Dashboard',copy:'One organized view of DOT customers, portal operations, testing, compliance, support, billing, and publishing.',actions:'<a class="dot-btn primary" href="dot-portal-control.html">Portal Control</a><a class="dot-btn" href="dot-website.html">DOT Website</a><a class="dot-btn" href="dot-distribution.html">Distribution</a>'});
 const settled=await Promise.allSettled([
   window.DOTApi.call('overview'),
   window.DOTApi.registry('inventory'),
   window.DOTApi.distribution('inventory'),
   window.DOTApi.call('support'),
   window.DOTApi.call('billing')
 ]);
 const value=i=>settled[i]?.status==='fulfilled'?(settled[i].value||{}):{};
 const overview=value(0),registry=value(1),distribution=value(2),support=value(3),billing=value(4);
 const failures=settled.filter(x=>x.status==='rejected');
 const portals=registry.portals||[],portalPages=registry.portal_pages||[],websitePages=registry.website_pages||[],targets=distribution.targets||[],distEvents=distribution.events||[];
 const ctpas=get(overview,'ctpas'),employers=get(overview,'employers').filter(x=>!x.archived_at&&x.status!=='archived'),owners=get(overview,'owner_operators'),drivers=get(overview,'drivers','employees').filter(x=>!x.archived_at),programs=get(overview,'programs'),pools=get(overview,'pools'),orders=get(overview,'testing_orders','orders'),results=get(overview,'test_results','results'),compliance=get(overview,'compliance_cases','cases'),tickets=get(support,'tickets','support_tickets'),subscriptions=get(billing,'subscriptions'),invoices=get(billing,'invoices');
 const openCompliance=compliance.filter(x=>!['resolved','closed','complete','completed'].includes(String(x.status||'').toLowerCase())).length;
 const openSupport=tickets.filter(x=>!['resolved','closed'].includes(String(x.status||'').toLowerCase())).length;
 const openTests=orders.filter(x=>!['completed','complete','cancelled','canceled'].includes(String(x.status||'').toLowerCase())).length;
 const activeSubs=subscriptions.filter(x=>['active','trialing'].includes(String(x.status||'').toLowerCase())).length;
 const outstandingInvoices=invoices.filter(x=>!['paid','void','cancelled','canceled'].includes(String(x.status||'').toLowerCase())).length;
 const websiteTarget=targets.find(x=>x.target_key==='website:dot.screenings4u.com')||{};
 const activePortals=portals.filter(x=>String(x.status||'active').toLowerCase()==='active').length;
 const portalKinds=[...new Set(portals.map(x=>x.portal_kind).filter(Boolean))].length;
 const connectionOk=failures.length===0;
 $('#dotPageStatus').innerHTML=connectionOk?'':`<div class="dot-banner warning"><div><strong>Some dashboard data could not be loaded.</strong><span>${failures.length} data source${failures.length===1?'':'s'} did not answer. The available sections are still shown below.</span></div><span class="dot-status-pill warn">Partial</span></div>`;

 const overviewMetrics=[
   ['DOT Portals',portals.length,'Registered customer-facing portals'],
   ['C/TPAs',ctpas.length,'Managed C/TPA accounts'],
   ['Employers',employers.length,'DOT employer accounts'],
   ['DOT Workers',drivers.length,'Covered people / drivers']
 ];
 const operations=[
   ['C/TPAs',ctpas.length,'dot-ctpas.html','Accounts, subscriptions, staff, customers, branding, billing, and support.'],
   ['Employers',employers.length,'dot-employers.html','Direct and C/TPA-sponsored DOT employers.'],
   ['Owner-Operators',owners.length,'dot-owner-operators.html','Owner-operator accounts and consortium relationships.'],
   ['Drivers / People',drivers.length,'dot-drivers.html','Safety-sensitive workforce records.'],
   ['Programs',programs.length,'dot-programs.html','DOT programs and employer configuration.'],
   ['Pools',pools.length,'dot-pools.html','Consortiums, random pools, and membership.'],
   ['Testing',openTests,'dot-testing-orders.html','Open testing orders needing completion.'],
   ['Results',results.length,'dot-results.html','DOT testing result records.']
 ];
 const portalStatusRows=portals.slice().sort((a,b)=>String(a.label||'').localeCompare(String(b.label||''))).slice(0,6).map(x=>[
   `<strong>${esc(x.label)}</strong><small>${esc(x.portal_code)}</small>`,
   esc(x.portal_kind||'portal'),
   esc(String(x.page_count??portalPages.filter(p=>p.portal_id===x.id).length)),
   badge(x.status||'active'),
   `<a class="dot-btn small" href="dot-portal-detail.html?portal=${encodeURIComponent(x.portal_code)}">Manage</a>`
 ]);
 const recentRows=distEvents.slice(0,6).map(x=>[
   esc(x.action||'—'),
   esc(targets.find(t=>t.id===x.target_id)?.label||x.target_id||'—'),
   esc(String(x.revision??'—')),
   fmtDate(x.created_at)
 ]);

 $('#dotPageBody').innerHTML=`
   <section class="dot-dashboard-section">
     <div class="dot-dashboard-section-head"><div><span>Account Network</span><h2>DOT Operations at a Glance</h2><p>Core customer and workforce counts across the DOT platform.</p></div><span class="dot-status-pill ${connectionOk?'ok':'warn'}">${connectionOk?'Live Data':'Partial Data'}</span></div>
     ${metrics(overviewMetrics)}
   </section>

   <section class="dot-dashboard-section">
     <div class="dot-dashboard-section-head"><div><span>Platform & Publishing</span><h2>Website and Portal Network</h2><p>Manage the public DOT website and all customer-facing DOT portals.</p></div></div>
     <div class="dot-grid dot-dashboard-grid dot-dashboard-platform-grid">
       <article class="dot-card half dot-property-card">
         <div class="dot-card-head"><div><h2>Main DOT Website</h2><p>Public website management for dot.screenings4u.com.</p></div>${badge(websiteTarget.enabled===false?'disabled':'active')}</div>
         <div class="dot-card-body">
           <div class="dot-property-domain">dot.screenings4u.com</div>
           <div class="dot-property-stats"><div><strong>${websitePages.length}</strong><span>website pages</span></div><div><strong>${websiteTarget.published_revision??0}</strong><span>published revision</span></div></div>
           <div class="dot-inline-actions"><a class="dot-btn primary" href="dot-website.html">Manage Website</a><a class="dot-btn" href="dot-distribution.html?target=website%3Adot.screenings4u.com">Distribution</a><a class="dot-btn" href="https://dot.screenings4u.com" target="_blank" rel="noopener">Open Live</a></div>
         </div>
       </article>
       <article class="dot-card half dot-property-card">
         <div class="dot-card-head"><div><h2>DOT Portal Network</h2><p>Central management for every DOT customer portal.</p></div>${badge(activePortals===portals.length?'active':'attention')}</div>
         <div class="dot-card-body">
           <div class="dot-property-domain">${portals.length} registered portals</div>
           <div class="dot-property-stats"><div><strong>${activePortals}</strong><span>active portals</span></div><div><strong>${portalPages.length}</strong><span>portal pages</span></div><div><strong>${portalKinds}</strong><span>portal types</span></div></div>
           <div class="dot-inline-actions"><a class="dot-btn primary" href="dot-portal-control.html">Portal Control</a><a class="dot-btn" href="dot-distribution.html">Distribution</a><a class="dot-btn" href="dot-users-access.html">Access</a></div>
         </div>
       </article>
     </div>
   </section>

   <section class="dot-dashboard-section">
     <div class="dot-dashboard-section-head"><div><span>Priority Review</span><h2>Needs Attention</h2><p>Items that currently need management follow-up.</p></div></div>
     <div class="dot-dashboard-attention-row">
       <a href="dot-support.html"><span>Open Support</span><strong>${openSupport}</strong><small>Customer tickets</small></a>
       <a href="dot-compliance.html"><span>Open Compliance</span><strong>${openCompliance}</strong><small>Cases needing review</small></a>
       <a href="dot-testing-orders.html"><span>Open Testing</span><strong>${openTests}</strong><small>Incomplete orders</small></a>
       <a href="dot-invoices.html"><span>Open Invoices</span><strong>${outstandingInvoices}</strong><small>${activeSubs} active subscriptions</small></a>
     </div>
   </section>

   <section class="dot-dashboard-section">
     <div class="dot-dashboard-section-head"><div><span>Customer Operations</span><h2>Operational Workspaces</h2><p>Open the main areas used to manage DOT customers and testing operations.</p></div></div>
     <div class="dot-card"><div class="dot-card-body"><div class="dot-dashboard-action-grid">${operations.map(([label,count,href,copy])=>`<a class="dot-dashboard-action" href="${href}"><span class="dot-dashboard-action-count">${esc(String(count))}</span><b>${esc(label)}</b><small>${esc(copy)}</small><span class="dot-dashboard-action-link">Open →</span></a>`).join('')}</div></div></div>
   </section>

   <section class="dot-dashboard-section">
     <div class="dot-dashboard-section-head"><div><span>Monitoring</span><h2>Portal & Publishing Activity</h2><p>Quick access to portal status and recent distribution activity.</p></div></div>
     <div class="dot-grid dot-dashboard-grid dot-dashboard-monitor-grid">
       <article class="dot-card half">
         <div class="dot-card-head"><div><h2>Portal Snapshot</h2><p>Recently managed DOT portals.</p></div><a class="dot-card-head-link" href="dot-portal-control.html">View all ${portals.length}</a></div>
         <div class="dot-table-wrap"><table class="dot-table"><thead><tr><th>Portal</th><th>Type</th><th>Pages</th><th>Status</th><th></th></tr></thead><tbody>${portalStatusRows.length?portalStatusRows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join(''):'<tr><td colspan="5"><div class="dot-empty">Portal registry has no records.</div></td></tr>'}</tbody></table></div>
       </article>
       <article class="dot-card half">
         <div class="dot-card-head"><div><h2>Recent Distribution</h2><p>Latest website and portal publishing activity.</p></div><a class="dot-card-head-link" href="dot-distribution.html">Open distribution</a></div>
         <div class="dot-table-wrap"><table class="dot-table"><thead><tr><th>Action</th><th>Target</th><th>Revision</th><th>Date</th></tr></thead><tbody>${recentRows.length?recentRows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join(''):'<tr><td colspan="4"><div class="dot-empty">No distribution activity has been recorded yet.</div></td></tr>'}</tbody></table></div>
       </article>
     </div>
   </section>`;
}
async function loadWebsite(){
 renderBase({title:'DOT Website Management',copy:'Manage the public DOT website registry, page visibility, SEO, and live distribution from one workspace.',actions:'<a class="dot-btn primary" href="dot-distribution.html?target=website%3Adot.screenings4u.com">Website Distribution</a><a class="dot-btn" href="https://dot.screenings4u.com" target="_blank" rel="noopener">Open Live Website</a>'});
 const settled=await Promise.allSettled([window.DOTApi.registry('inventory'),window.DOTApi.distribution('inventory')]);
 if(settled[0].status==='rejected')throw settled[0].reason;
 const d=settled[0].value||{},dist=settled[1].status==='fulfilled'?(settled[1].value||{}):{};
 const pages=d.website_pages||[],targets=dist.targets||[],events=dist.events||[],target=targets.find(x=>x.target_key==='website:dot.screenings4u.com')||null;
 const active=pages.filter(x=>x.status==='active').length,indexed=pages.filter(x=>x.seo_index!==false).length,visible=pages.filter(x=>x.nav_visible!==false).length,managed=pages.filter(x=>x.managed!==false).length;
 const typeCounts={};for(const x of pages){const k=x.page_type||'other';typeCounts[k]=(typeCounts[k]||0)+1}
 const recentEvents=events.filter(x=>!target||x.target_id===target.id).slice(0,5);
 const publishingHealthy=!!target&&target.enabled!==false;
 const statusBanner=!publishingHealthy?`<div class="dot-banner warning"><div><strong>Website distribution needs attention</strong><span>The public website target is not enabled or could not be loaded. Registry management is still available.</span></div></div>`:'';
 $('#dotPageBody').innerHTML=`${statusBanner}
 <section class="dot-website-section"><div class="dot-website-section-head"><div><span>Website Overview</span><h2>Public Website Registry</h2><p>Live page inventory for dot.screenings4u.com.</p></div></div>
 ${metrics([['Website Pages',String(pages.length),'Registered public pages'],['Active',String(active),'Pages available to visitors'],['SEO Indexed',String(indexed),'Search indexing enabled'],['Visible in Navigation',String(visible),'Shown in website navigation']])}</section>
 <section class="dot-website-section"><div class="dot-website-section-head"><div><span>Publishing</span><h2>Website Runtime & Distribution</h2><p>Registry health and the live distribution target used by the public website.</p></div></div>
 <div class="dot-grid dot-website-overview-grid">
  <article class="dot-card" style="grid-column:span 7"><div class="dot-card-head"><div><h2>dot.screenings4u.com</h2><p>Public DOT marketing, pricing, checkout, and information website.</p></div>${publishingHealthy?badge('active'):badge('attention')}</div><div class="dot-card-body">
   <div class="dot-website-runtime-grid"><div><span>Registry</span><strong>${pages.length} pages</strong><small>${managed} managed by DOT Management</small></div><div><span>Draft Revision</span><strong>${esc(String(target?.draft_revision??'—'))}</strong><small>Website-wide distribution draft</small></div><div><span>Published Revision</span><strong>${esc(String(target?.published_revision??'—'))}</strong><small>${target?.published_at?'Published '+fmtDate(target.published_at):'No website-wide publish yet'}</small></div></div>
   <div class="dot-inline-actions"><a class="dot-btn primary" href="dot-distribution.html?target=website%3Adot.screenings4u.com">Manage Distribution</a><a class="dot-btn" href="https://dot.screenings4u.com" target="_blank" rel="noopener">Open Live Website</a></div>
  </div></article>
  <article class="dot-card" style="grid-column:span 5"><div class="dot-card-head"><div><h2>Page Types</h2><p>Registered pages grouped by purpose.</p></div></div><div class="dot-card-body"><div class="dot-website-type-grid">${Object.entries(typeCounts).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))).map(([k,v])=>`<button type="button" class="dot-website-type-card" data-type-quick="${esc(k)}"><span>${esc(k.replaceAll('_',' '))}</span><strong>${esc(String(v))}</strong><small>Show ${esc(k.replaceAll('_',' '))} pages</small></button>`).join('')||'<div class="dot-empty compact">No registered page types.</div>'}</div></div></article>
 </div></section>
 <section class="dot-website-section"><div class="dot-website-section-head"><div><span>Page Management</span><h2>Website Pages</h2><p>Search the registry and open any page to manage its title, status, SEO, navigation, runtime controls, and live publishing.</p></div><div class="dot-website-head-actions"><span id="siteResultCount" class="dot-status-pill">${pages.length} pages</span></div></div>
 <article class="dot-card dot-website-pages-card"><div class="dot-card-body dot-website-filter-bar"><div class="dot-field dot-website-search"><label for="siteSearch">Search pages</label><input id="siteSearch" placeholder="Title, route, file, or page type"></div><div class="dot-field"><label for="siteTypeFilter">Page type</label><select id="siteTypeFilter"><option value="">All types</option>${[...new Set(pages.map(x=>x.page_type).filter(Boolean))].sort().map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select></div><div class="dot-field"><label for="siteStatusFilter">Status</label><select id="siteStatusFilter"><option value="">All statuses</option>${[...new Set(pages.map(x=>x.status).filter(Boolean))].sort().map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select></div><button class="dot-btn dot-website-clear" type="button" id="siteClearFilters">Clear</button></div><div id="sitePagesTable"></div></article>
 </section>
 ${recentEvents.length?`<section class="dot-website-section"><div class="dot-website-section-head"><div><span>Recent Activity</span><h2>Website Publishing Activity</h2><p>Most recent distribution events for the public website.</p></div><a class="dot-card-head-link" href="dot-distribution.html?target=website%3Adot.screenings4u.com">View distribution history</a></div><div class="dot-card"><div class="dot-table-wrap"><table class="dot-table"><thead><tr><th>Action</th><th>Revision</th><th>Date</th></tr></thead><tbody>${recentEvents.map(x=>`<tr><td><strong>${esc(String(x.action||'website update').replaceAll('_',' '))}</strong></td><td>${esc(String(x.revision??'—'))}</td><td>${fmtDate(x.created_at)}</td></tr>`).join('')}</tbody></table></div></div></section>`:''}`;
 const render=()=>{const q=($('#siteSearch').value||'').toLowerCase(),type=$('#siteTypeFilter').value,status=$('#siteStatusFilter').value,filtered=pages.filter(x=>(!q||[x.title,x.route,x.file_name,x.page_type].some(v=>String(v||'').toLowerCase().includes(q)))&&(!type||x.page_type===type)&&(!status||x.status===status));const rows=filtered.map(x=>[`<a class="dot-website-page-link" href="dot-website-page.html?page=${encodeURIComponent(x.page_key)}"><strong>${esc(x.title)}</strong></a><small class="dot-website-route">${esc(x.route)}</small>`,`<span class="dot-website-file">${esc(x.file_name)}</span>`,esc(x.page_type),badge(x.status),x.seo_index===false?badge('noindex'):badge('indexed'),x.nav_visible===false?badge('hidden'):badge('visible'),`<div class="dot-inline-actions"><a class="dot-btn small primary" href="dot-website-page.html?page=${encodeURIComponent(x.page_key)}">Manage</a><a class="dot-btn small" href="https://dot.screenings4u.com${esc(x.route)}" target="_blank" rel="noopener">Open</a></div>`]);$('#sitePagesTable').innerHTML=table(['Page','File','Type','Status','SEO','Navigation','Actions'],rows);$('#siteResultCount').textContent=`${filtered.length} page${filtered.length===1?'':'s'}`};
 ['siteSearch','siteTypeFilter','siteStatusFilter'].forEach(id=>document.getElementById(id)?.addEventListener(id==='siteSearch'?'input':'change',render));
 document.querySelectorAll('[data-type-quick]').forEach(btn=>btn.addEventListener('click',()=>{$('#siteTypeFilter').value=btn.dataset.typeQuick||'';document.querySelector('.dot-website-pages-card')?.scrollIntoView({behavior:'smooth',block:'start'});render()}));
 $('#siteClearFilters')?.addEventListener('click',()=>{$('#siteSearch').value='';$('#siteTypeFilter').value='';$('#siteStatusFilter').value='';render()});
 render();
}

async function loadPortalControl(){renderBase({title:'DOT Portal Control',copy:'Open any DOT portal to manage its identity, every registered page, runtime distribution, and connected operational workflows.',actions:'<a class="dot-btn" href="dot-distribution.html">Distribution Management</a>'});const d=await window.DOTApi.registry('inventory');const rows=(d.portals||[]).map(x=>[`<strong>${esc(x.label)}</strong><small>${esc(x.portal_code)}</small>`,esc(x.portal_kind),esc(x.agency_code||'All DOT'),`<span>${esc(x.domain)}</span>`,`<a href="dot-portal-detail.html?portal=${encodeURIComponent(x.portal_code)}"><strong>${esc(String(x.page_count||0))}</strong> pages</a>`,badge(x.status),`<a class="dot-btn small primary" href="dot-portal-detail.html?portal=${encodeURIComponent(x.portal_code)}">Manage Portal</a>`]);$('#dotPageBody').innerHTML=metrics([['DOT Portals',rows.length,'Registered control targets'],['Portal Pages',String((d.portal_pages||[]).length),'Registered managed pages'],['Agency Portals',String((d.portals||[]).filter(x=>x.portal_kind==='agency').length),'FMCSA / FAA / FRA / FTA / PHMSA / USCG'],['Management Host','dot-portal','Central control plane']])+`<div class="dot-card"><div class="dot-card-head"><div><h2>Managed DOT Portals</h2><p>Select a portal to manage its pages and connected operations.</p></div></div>${table(['Portal','Type','Agency','Host','Pages','Status','Management'],rows)}</div>`}
async function loadAgencies(){renderBase({title:'DOT Agency Management',copy:'Central agency workspace for FMCSA, FAA, FRA, FTA, PHMSA, and USCG program configuration.',actions:''});$('#dotPageBody').innerHTML=`<div class="dot-module-grid">${[['FMCSA','Motor carrier and CDL driver programs'],['FAA','Aviation safety-sensitive programs'],['FRA','Railroad drug and alcohol programs'],['FTA','Transit agency programs'],['PHMSA','Pipeline operator programs'],['USCG','Maritime drug testing programs']].map(([a,b])=>`<a class="dot-module" href="dot-agency-detail.html?agency=${encodeURIComponent(a)}"><b>${a}</b><span>${b}</span></a>`).join('')}</div><div class="dot-card" style="margin-top:15px"><div class="dot-card-head"><div><h2>Agency Workspace</h2><p>Select an agency to load its DOT configuration.</p></div></div><div class="dot-card-body" id="agencyBody"><div class="dot-empty">Choose a DOT agency above.</div></div></div>`;document.querySelectorAll('[data-agency]').forEach(a=>a.onclick=async e=>{e.preventDefault();const agency=a.dataset.agency;$('#agencyBody').innerHTML='<div class="dot-empty"><div class="dot-spinner"></div>Loading agency records…</div>';try{const d=await window.DOTApi.call('agency_workspace',{agency:agency.toLowerCase()});const rows=get(d,'programs','registrations','records').map(x=>[name(x),esc(x.organization_name||x.employer_name||x.organization_id||'—'),badge(x.status||'active')]);$('#agencyBody').innerHTML=table(['Program / Record','Organization','Status'],rows)}catch(err){$('#agencyBody').innerHTML=`<div class="dot-empty">${esc(err.message)}</div>`}})}
async function loadUsers(){renderBase({title:'DOT Users & Portal Access',copy:'Manage staff access to the DOT management portal and customer-facing DOT portal access relationships.',actions:'<a class="dot-btn primary" href="dot-user-detail.html?mode=invite">Invite DOT User</a>'});let d={};try{d=await window.DOTApi.call('portal_access')}catch(e){showError(e);return}const members=get(d,'memberships','users').map((x,i)=>[esc(x.email||x.user_email||x.user_id||'—'),esc(x.role_code||x.role||'—'),esc(x.organization_name||x.organization_id||'—'),badge(x.status||'active'),`<a class="dot-btn small" href="dot-user-detail.html?row=${i}">Manage</a>`]);$('#dotPageBody').innerHTML=table(['User','Role','Account','Status','Manage'],members)}
async function loadIntegrations(){renderBase({title:'DOT Integrations',copy:'DOT-only external systems and data connections, isolated from the enterprise application.',actions:''});let d={};try{d=await window.DOTApi.call('integrations')}catch(e){d={integrations:[]};$('#dotPageStatus').innerHTML=`<div class="dot-banner warning"><div><strong>Integration inventory is not available yet.</strong><span>${esc(e.message)}</span></div></div>`}const rows=get(d,'integrations').map(x=>[name(x),esc(x.provider||x.integration_type||'—'),badge(x.status),fmtDate(x.updated_at)]);$('#dotPageBody').innerHTML=table(['Integration','Provider','Status','Updated'],rows)}
async function loadSettings(){renderBase({title:'DOT Portal Settings',copy:'Configuration for the standalone DOT management portal only.',actions:'<a class="dot-btn primary" href="dot-settings-general.html">Manage Settings</a>'});$('#dotPageBody').innerHTML=`<div class="dot-card"><div class="dot-card-head"><div><h2>Portal Identity</h2><p>These settings belong to the dedicated DOT control plane.</p></div></div><div class="dot-card-body"><div class="dot-field-grid"><div class="dot-field"><label>Management Host</label><input value="dot-portal.screenings4u.com" readonly></div><div class="dot-field"><label>Managed Website</label><input value="https://dot.screenings4u.com" readonly></div><div class="dot-field"><label>Portal Name</label><input id="portalName" value="screenings4u DOT Management Portal"></div><div class="dot-field"><label>Backend Adapter</label><input value="DOT-only Supabase Edge Function" readonly></div></div><div class="dot-help">No Enterprise navigation, CSS, or JavaScript files are loaded by this portal.</div></div></div>`}
async function load(){if(page==='dot-ctpas.html')return loadCtpas();if(page==='dot-orders.html')return loadOrders();if(listPages[page])return loadList(listPages[page]);if(page==='dot-dashboard.html')return loadDashboard();if(page==='dot-website.html')return loadWebsite();if(page==='dot-portal-control.html')return loadPortalControl();if(page==='dot-agencies.html')return loadAgencies();if(page==='dot-users-access.html')return loadUsers();if(page==='dot-integrations.html')return loadIntegrations();if(page==='dot-settings.html')return loadSettings();renderBase({title:'DOT Management',copy:'Standalone DOT management workspace.'});$('#dotPageBody').innerHTML='<div class="dot-card"><div class="dot-empty">This DOT module is ready for its dedicated controller.</div></div>'}
async function start(){const state=await window.DOTAuth.requireAuth();if(!state)return;window.DOTShell.render(state);await load()}
window.addEventListener('DOMContentLoaded',()=>start().catch(showError),{once:true});
})();
