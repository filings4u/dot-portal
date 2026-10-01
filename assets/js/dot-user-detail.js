(()=>{
'use strict';
const $=s=>document.querySelector(s);
const esc=v=>DOTShell.escape(v);
const norm=v=>String(v||'').trim().toLowerCase();
const qs=new URLSearchParams(location.search);
const get=(d,...keys)=>{for(const k of keys)if(Array.isArray(d?.[k]))return d[k];return[]};
const title=v=>String(v||'').replaceAll('_',' ').replaceAll('-',' ').replace(/\b\w/g,m=>m.toUpperCase());
const pill=(v,forced='')=>{const s=String(v||'—').replaceAll('_',' '),c=forced||(/active|enabled|granted/i.test(s)?'ok':/suspend|inactive|disabled|revoked|archiv/i.test(s)?'bad':'warn');return `<span class="dot-status-pill ${c}">${esc(s)}</span>`};
const metric=(label,value,note='')=>`<article class="dot-metric"><span>${esc(label)}</span><strong>${esc(String(value??0))}</strong><small>${esc(note)}</small></article>`;
const portalLabel=code=>({ctpa_dot:'C/TPA Portal',employer_dot:'Employer Portal',driver_dot:'Driver Portal',employee_dot:'Employee Portal',direct_driver_dot:'Direct Driver Portal',owner_operator_dot:'Owner-Operator Portal'}[code]||title(code||'DOT Portal'));
const profileName=m=>{const p=m?.profiles||{};return [p.first_name,p.last_name].filter(Boolean).join(' ')||p.full_name||m.user_name||m.email||m.user_email||'Unnamed user'};
const profileEmail=m=>{const p=m?.profiles||{};return p.email||m.email||m.user_email||''};
const roleOf=m=>m.membership_role||m.role_code||m.role||m.roles?.name||m.roles?.code||'member';
const accountTypeForInvite=t=>t==='C/TPA'?'dot_ctpa_staff':t==='Owner-Operator'?'dot_employer_staff':'dot_employer_staff';

function notice(msg,error=false){
 const el=$('#userStatus');if(!el)return;
 el.innerHTML=`<div class="dot-banner ${error?'warning':''}"><div><strong>${error?'Action needs attention':'User access update'}</strong><span>${esc(msg)}</span></div></div>`;
}
function shell(state,titleText,copy,actions=''){
 DOTShell.render(state);
 $('#dotPageMount').innerHTML=`<section class="dot-page user-detail-page">
  <header class="dot-page-head"><div><span class="dot-eyebrow">DOT CONTROL PLANE</span><h1>${esc(titleText)}</h1><p>${esc(copy)}</p></div><div class="dot-actions">${actions}</div></header>
  <div id="userStatus"></div><div id="userBody"><div class="dot-card"><div class="dot-empty"><div class="dot-spinner"></div><p>Loading user access…</p></div></div></div>
 </section>`;
}
function accountMap(ctpas,employers,owners){
 const map=new Map();
 for(const x of ctpas){const o=x.organizations||{};if(x.organization_id)map.set(x.organization_id,{id:x.id,organization_id:x.organization_id,type:'C/TPA',label:o.dba_name||o.legal_name||x.legal_name||x.support_email||x.company_code||'C/TPA Account',code:x.company_code||'',record:x});}
 for(const x of employers){if(x.organization_id)map.set(x.organization_id,{id:x.id,organization_id:x.organization_id,type:'Employer',label:x.dba_name||x.legal_name||x.primary_contact_email||'Employer Account',code:x.dot_number||x.mc_number||'',record:x});}
 for(const x of owners){if(x.organization_id&&!map.has(x.organization_id))map.set(x.organization_id,{id:x.id,organization_id:x.organization_id,type:'Owner-Operator',label:x.dba_name||x.legal_name||x.email||'Owner-Operator Account',code:x.dot_number||x.mc_number||'',record:x});}
 return map;
}
function accountHref(a){
 if(!a)return '';
 if(a.type==='C/TPA')return `dot-ctpa-detail.html?id=${encodeURIComponent(a.id)}`;
 if(a.type==='Owner-Operator')return `dot-record.html?module=owner_operators&id=${encodeURIComponent(a.id)}`;
 return `dot-record.html?module=employers&id=${encodeURIComponent(a.id)}`;
}
function inviteRoleOptions(value='member'){
 return ['member','admin','manager','account_admin'].map(x=>`<option value="${x}" ${x===value?'selected':''}>${esc(title(x))}</option>`).join('');
}
function inviteAccountTypeOptions(value=''){
 const opts=['','dot_employer_staff','dot_employer_driver','dot_employer_contractor','dot_ctpa','dot_ctpa_internal_staff','dot_ctpa_staff','dot_ctpa_driver','dot_ctpa_contractor'];
 return opts.map(x=>`<option value="${esc(x)}" ${x===value?'selected':''}>${esc(x?title(x):'Use account default')}</option>`).join('');
}
function inviteForm(accounts,prefill={},heading='Add DOT Account Access',copy='Create or connect this user to another DOT customer account and send the secure password setup workflow.'){
 return `<article class="dot-card user-invite-card"><div class="dot-card-head"><div><h2>${esc(heading)}</h2><p>${esc(copy)}</p></div></div><div class="dot-card-body">
  <div class="dot-field-grid">
   <div class="dot-field"><label for="firstName">First Name</label><input id="firstName" value="${esc(prefill.first_name||'')}"></div>
   <div class="dot-field"><label for="lastName">Last Name</label><input id="lastName" value="${esc(prefill.last_name||'')}"></div>
   <div class="dot-field"><label for="userEmail">Email</label><input id="userEmail" type="email" value="${esc(prefill.email||'')}"></div>
   <div class="dot-field"><label for="orgId">DOT Account</label><select id="orgId"><option value="">Select account</option>${accounts.map(a=>`<option value="${esc(a.organization_id)}" data-type="${esc(a.type)}">${esc(a.label)} — ${esc(a.type)}</option>`).join('')}</select></div>
   <div class="dot-field"><label for="userRole">Role</label><select id="userRole">${inviteRoleOptions(prefill.role||'member')}</select></div>
   <div class="dot-field"><label for="accountType">Account Type</label><select id="accountType">${inviteAccountTypeOptions(prefill.account_type||'')}</select></div>
  </div>
  <div class="dot-actions"><button class="dot-btn primary" id="sendInvite" type="button">Create / Invite User</button></div>
 </div></article>`;
}
async function sendInviteFromForm(){
 const org=$('#orgId')?.value,email=$('#userEmail')?.value.trim();
 if(!org)throw new Error('Select the DOT account for this user.');
 if(!email)throw new Error('Enter the user email address.');
 const btn=$('#sendInvite');if(btn){btn.disabled=true;btn.textContent='Creating access…'}
 try{
  const out=await DOTApi.invoke(DOT_PORTAL_CONFIG.inviteFunction,{organization_id:org,email,first_name:$('#firstName')?.value.trim()||'',last_name:$('#lastName')?.value.trim()||'',role:$('#userRole')?.value||'member',account_type:$('#accountType')?.value||undefined});
  notice(out?.branded_email_sent===false?'Access was created, but the branded email provider did not confirm delivery.':'DOT account access created and the secure setup workflow was sent.');
  return out;
 }finally{if(btn){btn.disabled=false;btn.textContent='Create / Invite User'}}
}
function wireAccountTypeSuggestion(){
 const org=$('#orgId'),type=$('#accountType');if(!org||!type)return;
 org.addEventListener('change',()=>{if(type.value)return;const selected=org.selectedOptions[0],t=selected?.dataset.type;if(t)type.value=accountTypeForInvite(t)});
}

async function renderInvite(state){
 shell(state,'Invite DOT Portal User','Create one user identity, connect it to the correct DOT customer account, and send the secure password setup workflow.','<a class="dot-btn" href="dot-users-access.html">Back to Users & Access</a>');
 const settled=await Promise.allSettled([DOTApi.call('ctpas'),DOTApi.call('employers'),DOTApi.call('owner_operators')]);
 const c=settled[0].status==='fulfilled'?get(settled[0].value,'ctpas'):[],e=settled[1].status==='fulfilled'?get(settled[1].value,'employers'):[],o=settled[2].status==='fulfilled'?get(settled[2].value,'owner_operators'):[];
 const accounts=[...accountMap(c,e,o).values()].sort((a,b)=>a.label.localeCompare(b.label));
 $('#userBody').innerHTML=`<div class="dot-account-hero"><div><span class="dot-eyebrow">NEW USER ACCESS</span><h2>Create or connect a DOT user</h2><p>Use one email identity per person. Additional DOT accounts should be linked to that same person instead of creating duplicate users.</p></div>${pill('Invitation workflow','warn')}</div>
 <div class="dot-metrics">${metric('DOT Accounts',accounts.length,'Available customer accounts')}${metric('Identity Rule','1','One person · one email identity')}${metric('Setup Method','Email','Secure password setup link')}${metric('Portal Scope','DOT','Customer-facing portal access')}</div>
 <section class="dot-account-section"><div class="dot-section-heading"><div><span>01</span><h2>User & Account Assignment</h2><p>Enter the user identity, choose the correct DOT account, then assign the membership role and account type.</p></div></div>${inviteForm(accounts,{},'Portal Invitation','Creates or connects the user account, membership, account type, and secure password setup workflow.')}</section>`;
 wireAccountTypeSuggestion();
 $('#sendInvite').onclick=()=>sendInviteFromForm().catch(e=>notice(e.message,true));
}

async function renderExisting(state,userId){
 shell(state,'DOT User Management','Review one person, every DOT account they belong to, portal availability, role assignments, and secure access workflows.','<a class="dot-btn" href="dot-users-access.html">Back to Users & Access</a>');
 const settled=await Promise.allSettled([DOTApi.call('portal_access'),DOTApi.call('ctpas'),DOTApi.call('employers'),DOTApi.call('owner_operators')]);
 if(settled[0].status!=='fulfilled')throw settled[0].reason||new Error('Unable to load DOT users and access.');
 const pa=settled[0].value,c=settled[1].status==='fulfilled'?get(settled[1].value,'ctpas'):[],e=settled[2].status==='fulfilled'?get(settled[2].value,'employers'):[],o=settled[3].status==='fulfilled'?get(settled[3].value,'owner_operators'):[];
 const memberships=get(pa,'memberships','users'),portalAccess=get(pa,'portal_access','organization_portal_access','ctpa_portal_access'),orgMap=accountMap(c,e,o);
 const related=memberships.filter(m=>String(m.user_id||'')===String(userId));
 if(!related.length){$('#userBody').innerHTML=`<div class="dot-card"><div class="dot-card-body"><div class="dot-empty"><strong>User not found</strong><p>No DOT membership was found for this user identity.</p><div class="dot-actions" style="justify-content:center;margin-top:14px"><a class="dot-btn primary" href="dot-users-access.html">Return to Users & Access</a></div></div></div></div>`;return;}
 const first=related[0],p=first.profiles||{},name=profileName(first),email=profileEmail(first),roles=[...new Set(related.map(roleOf).filter(Boolean))],activeCount=related.filter(m=>norm(m.status)==='active').length;
 const accounts=related.map(m=>({membership:m,account:orgMap.get(m.organization_id)||{id:m.organization_id,organization_id:m.organization_id,type:'DOT Account',label:m.organization_name||'DOT Account',code:''}}));
 const grants=related.flatMap(m=>portalAccess.filter(x=>x.organization_id===m.organization_id).map(x=>({...x,organization_id:m.organization_id,account:orgMap.get(m.organization_id)})));
 const enabledGrants=grants.filter(x=>x.enabled===true);
 const allAccounts=[...orgMap.values()].sort((a,b)=>a.label.localeCompare(b.label));
 const membershipRows=accounts.map(({membership:m,account:a})=>`<tr>
  <td><strong>${esc(a.label)}</strong><small>${esc(a.type+(a.code?' · '+a.code:''))}</small></td>
  <td>${esc(title(roleOf(m)))}</td><td>${m.is_primary?'Yes':'No'}</td><td>${pill(m.status||'active')}</td>
  <td><div class="user-row-actions">${a.type!=='DOT Account'?`<a class="dot-btn small" href="${accountHref(a)}">Open Account</a>`:''}<button class="dot-btn small primary resendInvite" data-org="${esc(m.organization_id)}" data-role="${esc(roleOf(m))}" data-type="${esc(a.type)}" type="button">Send / Reset</button>${a.type==='C/TPA'?`<button class="dot-btn small ctpaAccessToggle" data-ctpa="${esc(a.id)}" data-user="${esc(userId)}" data-next="${norm(m.status)==='active'?'0':'1'}" type="button">${norm(m.status)==='active'?'Revoke':'Grant'}</button>`:''}</div></td>
 </tr>`).join('');
 const portalRows=grants.map(g=>`<tr><td><strong>${esc(portalLabel(g.portal_code))}</strong><small>${esc(g.portal_code||'')}</small></td><td>${esc(g.account?.label||'DOT Account')}</td><td>${pill(g.enabled===true?'enabled':'disabled')}</td><td>${esc(g.updated_at?new Date(g.updated_at).toLocaleString():'—')}</td></tr>`).join('');
 $('#userBody').innerHTML=`
 <div class="dot-account-hero"><div><span class="dot-eyebrow">USER IDENTITY</span><h2>${esc(name)}</h2><p>${esc(email||'No email on profile')} · ${esc(userId)}</p></div><div class="dot-inline-actions">${pill(activeCount?'active':'inactive')}<button class="dot-btn primary" id="sendPrimarySetup" type="button">Send Password Setup / Reset</button></div></div>
 <nav class="dot-account-nav" aria-label="User management sections"><a href="#profile">Profile</a><a href="#memberships">Account Memberships</a><a href="#portals">Portal Access</a><a href="#add-access">Add Access</a></nav>
 <div class="dot-metrics">${metric('DOT Accounts',related.length,'Membership relationships')}${metric('Active Memberships',activeCount,`${related.length-activeCount} inactive / other`)}${metric('Enabled Portals',enabledGrants.length,'Organization-level portal grants')}${metric('Roles',roles.length,roles.map(title).join(' · ')||'No role assigned')}</div>
 <section id="profile" class="dot-account-section"><div class="dot-section-heading"><div><span>01</span><h2>User Profile & Identity</h2><p>Primary person record used across every DOT account membership.</p></div></div><div class="dot-grid">
  <article class="dot-card half"><div class="dot-card-head"><div><h2>Identity</h2><p>One profile should represent this person everywhere in the DOT system.</p></div></div><div class="dot-card-body"><div class="dot-detail-grid"><div class="dot-detail-item"><span>First Name</span><strong>${esc(p.first_name||'—')}</strong></div><div class="dot-detail-item"><span>Last Name</span><strong>${esc(p.last_name||'—')}</strong></div><div class="dot-detail-item"><span>Email</span><strong>${esc(email||'—')}</strong></div><div class="dot-detail-item"><span>User ID</span><strong>${esc(userId)}</strong></div></div></div></article>
  <article class="dot-card half"><div class="dot-card-head"><div><h2>Access Summary</h2><p>Current account and role coverage for this identity.</p></div></div><div class="dot-card-body"><div class="dot-detail-grid"><div class="dot-detail-item"><span>Memberships</span><strong>${related.length}</strong></div><div class="dot-detail-item"><span>Active</span><strong>${activeCount}</strong></div><div class="dot-detail-item"><span>Roles</span><strong>${esc(roles.map(title).join(', ')||'—')}</strong></div><div class="dot-detail-item"><span>Portal Grants</span><strong>${enabledGrants.length}</strong></div></div></div></article>
 </div></section>
 <section id="memberships" class="dot-account-section"><div class="dot-section-heading"><div><span>02</span><h2>DOT Account Memberships</h2><p>Every customer account this user belongs to, including role, primary status, and access state.</p></div></div><div class="dot-card"><div class="dot-table-wrap"><table class="dot-table"><thead><tr><th>DOT Account</th><th>Role</th><th>Primary</th><th>Status</th><th>Management</th></tr></thead><tbody>${membershipRows}</tbody></table></div></div></section>
 <section id="portals" class="dot-account-section"><div class="dot-section-heading"><div><span>03</span><h2>Portal Availability</h2><p>Customer portal grants enabled for the organizations attached to this user. These grants are organization-level; the membership above controls whether this person belongs to that account.</p></div></div><div class="dot-card"><div class="dot-table-wrap"><table class="dot-table"><thead><tr><th>Portal</th><th>DOT Account</th><th>Status</th><th>Updated</th></tr></thead><tbody>${portalRows||'<tr><td colspan="4"><div class="dot-empty">No portal grants are registered for this user’s accounts.</div></td></tr>'}</tbody></table></div></div></section>
 <section id="add-access" class="dot-account-section"><div class="dot-section-heading"><div><span>04</span><h2>Add Account Access</h2><p>Connect this existing identity to another DOT customer account instead of creating a duplicate person.</p></div></div>${inviteForm(allAccounts,{first_name:p.first_name||'',last_name:p.last_name||'',email,role:'member'},'Connect Existing User','Uses the same email identity and adds another account membership / access relationship.')}</section>`;
 wireAccountTypeSuggestion();
 $('#sendInvite').onclick=async()=>{try{await sendInviteFromForm();setTimeout(()=>location.reload(),700)}catch(e){notice(e.message,true)}};
 const resend=async(org,role,type)=>{if(!email)throw new Error('This user does not have an email address.');const out=await DOTApi.invoke(DOT_PORTAL_CONFIG.inviteFunction,{organization_id:org,email,first_name:p.first_name||'',last_name:p.last_name||'',role:role||'member',account_type:accountTypeForInvite(type)});notice(out?.branded_email_sent===false?'Access was updated, but email delivery was not confirmed.':'Secure password setup / reset email sent.');};
 $('#sendPrimarySetup').onclick=async()=>{try{await resend(related[0].organization_id,roleOf(related[0]),orgMap.get(related[0].organization_id)?.type||'Employer')}catch(e){notice(e.message,true)}};
 document.querySelectorAll('.resendInvite').forEach(btn=>btn.onclick=async()=>{try{await resend(btn.dataset.org,btn.dataset.role,btn.dataset.type)}catch(e){notice(e.message,true)}});
 document.querySelectorAll('.ctpaAccessToggle').forEach(btn=>btn.onclick=async()=>{try{btn.disabled=true;await DOTApi.call('set_ctpa_user_access',{ctpa_id:btn.dataset.ctpa,user_id:btn.dataset.user,enabled:btn.dataset.next==='1'});notice(btn.dataset.next==='1'?'C/TPA user access granted.':'C/TPA user access revoked.');setTimeout(()=>location.reload(),500)}catch(e){btn.disabled=false;notice(e.message,true)}});
}

async function start(){
 const state=await DOTAuth.requireAuth();if(!state)return;
 if(qs.get('mode')==='invite'||!qs.get('user_id'))return renderInvite(state);
 return renderExisting(state,qs.get('user_id'));
}
addEventListener('DOMContentLoaded',()=>start().catch(e=>{console.error(e);if($('#userStatus'))notice(e?.message||String(e),true)}),{once:true});
})();
