(()=>{
'use strict';
const $=s=>document.querySelector(s);
const esc=v=>DOTShell.escape(v);
const norm=v=>String(v||'').trim().toLowerCase();
const get=(d,...keys)=>{for(const k of keys)if(Array.isArray(d?.[k]))return d[k];return[]};
const title=v=>String(v||'').replaceAll('_',' ').replaceAll('-',' ').replace(/\b\w/g,m=>m.toUpperCase());
const metric=(label,value,note='')=>`<article class="dot-metric"><span>${esc(label)}</span><strong>${esc(String(value??0))}</strong><small>${esc(note)}</small></article>`;
const pill=(v,forced='')=>{const s=String(v||'—').replaceAll('_',' '),c=forced||(/active|enabled|granted/i.test(s)?'ok':/suspend|inactive|disabled|revoked|archiv/i.test(s)?'bad':'warn');return `<span class="dot-status-pill ${c}">${esc(s)}</span>`};

function shell(){
 $('#dotPageMount').innerHTML=`<section class="dot-page users-access-page">
  <header class="dot-page-head">
   <div><span class="dot-eyebrow">DOT MANAGEMENT</span><h1>DOT Users & Portal Access</h1><p>Manage each person once, see every DOT account they belong to, and control customer portal membership without exposing raw database IDs.</p></div>
   <div class="dot-actions"><a class="dot-btn primary" href="dot-user-detail.html?mode=invite">Invite DOT User</a><a class="dot-btn" href="dot-portal-control.html">Portal Control</a><button class="dot-btn" id="refreshUsers" type="button">Refresh</button></div>
  </header>
  <div id="usersStatus"></div>
  <div id="usersBody"><div class="dot-card"><div class="dot-empty"><div class="dot-spinner"></div><p>Loading users and portal access…</p></div></div></div>
 </section>`;
}
function notice(msg,error=false){$('#usersStatus').innerHTML=`<div class="dot-banner ${error?'warning':''}"><div><strong>${error?'Action needs attention':'Users & access update'}</strong><span>${esc(msg)}</span></div></div>`}
function profileName(m){const p=m?.profiles||{};return [p.first_name,p.last_name].filter(Boolean).join(' ')||p.full_name||m.user_name||m.email||m.user_email||'Unnamed user'}
function profileEmail(m){const p=m?.profiles||{};return p.email||m.email||m.user_email||''}
function roleOf(m){return m.membership_role||m.role_code||m.role||m.roles?.name||m.roles?.code||'member'}
function portalLabel(code){const map={ctpa_dot:'C/TPA Portal',employer_dot:'Employer Portal',driver_dot:'Driver Portal',employee_dot:'Employee Portal',direct_driver_dot:'Direct Driver Portal',owner_operator_dot:'Owner-Operator Portal'};return map[code]||title(code||'DOT Portal')}
function accountMap(ctpas,employers,owners){
 const map=new Map();
 for(const x of ctpas){const org=x.organizations||{};if(x.organization_id)map.set(x.organization_id,{id:x.id,type:'C/TPA',label:org.dba_name||org.legal_name||x.legal_name||x.support_email||x.company_code||'C/TPA Account',code:x.company_code||''});}
 for(const x of employers){if(x.organization_id)map.set(x.organization_id,{id:x.id,type:'Employer',label:x.dba_name||x.legal_name||x.primary_contact_email||'Employer Account',code:x.dot_number||x.mc_number||''});}
 for(const x of owners){if(x.organization_id)map.set(x.organization_id,{id:x.id,type:'Owner-Operator',label:x.dba_name||x.legal_name||x.email||'Owner-Operator Account',code:x.dot_number||x.mc_number||''});}
 return map;
}
function groupUsers(memberships,orgMap,portalAccess){
 const paByOrg=new Map();
 for(const p of portalAccess){if(!paByOrg.has(p.organization_id))paByOrg.set(p.organization_id,[]);paByOrg.get(p.organization_id).push(p)}
 const grouped=new Map();
 for(const m of memberships){
  const key=String(m.user_id||profileEmail(m)||m.id);
  if(!grouped.has(key))grouped.set(key,{key,user_id:m.user_id||'',memberships:[],profile:m.profiles||{},name:profileName(m),email:profileEmail(m)});
  const g=grouped.get(key);g.memberships.push({...m,account:orgMap.get(m.organization_id)||{id:m.organization_id,type:'DOT Account',label:m.organization_name||'DOT Account',code:''},portals:paByOrg.get(m.organization_id)||[]});
  if(!g.email)g.email=profileEmail(m);if(/^Unnamed user$/.test(g.name))g.name=profileName(m);
 }
 return [...grouped.values()].sort((a,b)=>a.name.localeCompare(b.name)||a.email.localeCompare(b.email));
}
function overallStatus(g){return g.memberships.some(m=>norm(m.status)==='active')?'active':g.memberships.some(m=>/suspend/i.test(m.status||''))?'suspended':g.memberships[0]?.status||'inactive'}
function roleList(g){return [...new Set(g.memberships.map(roleOf).filter(Boolean))]}
function portalList(g){return [...new Set(g.memberships.flatMap(m=>m.portals.filter(p=>p.enabled===true).map(p=>p.portal_code)).filter(Boolean))]}

function render(data){
 const orgMap=accountMap(data.ctpas,data.employers,data.owners),users=groupUsers(data.memberships,orgMap,data.portalAccess);
 const active=users.filter(g=>overallStatus(g)==='active').length;
 const suspended=users.filter(g=>/suspend/i.test(overallStatus(g))).length;
 const memberships=users.reduce((n,g)=>n+g.memberships.length,0);
 const enabledPortals=data.portalAccess.filter(x=>x.enabled===true).length;

 $('#usersBody').innerHTML=`
  <div class="dot-metrics">
   ${metric('User Identities',users.length,'One row per person')}
   ${metric('Active Users',active,'At least one active DOT membership')}
   ${metric('Account Memberships',memberships,'User-to-account relationships')}
   ${metric('Enabled Portals',enabledPortals,'Organization portal grants')}
  </div>
  <div class="users-quick-grid">
   <a class="users-quick-card" href="dot-user-detail.html?mode=invite"><span>＋</span><div><strong>Invite DOT User</strong><small>Create or connect a user to the correct DOT customer account.</small></div></a>
   <a class="users-quick-card" href="dot-ctpas.html"><span>◇</span><div><strong>C/TPA Accounts</strong><small>Manage C/TPA customer users, subscriptions, and portal access.</small></div></a>
   <a class="users-quick-card" href="dot-employers.html"><span>▧</span><div><strong>Employers</strong><small>Manage employer accounts and their workforce access relationships.</small></div></a>
   <a class="users-quick-card" href="dot-portal-control.html"><span>◉</span><div><strong>Portal Control</strong><small>Review customer-facing DOT portals and their availability.</small></div></a>
  </div>
  <div class="dot-card users-card">
   <div class="dot-card-head"><div><h2>DOT User Directory</h2><p>Users are grouped by identity. Each row shows all linked DOT accounts, roles, and customer portal grants.</p></div><span class="users-count" id="usersCount">${users.length} users</span></div>
   <div class="dot-card-body users-toolbar"><div class="users-filter-grid">
    <div class="dot-field"><label for="usersSearch">Search users</label><input id="usersSearch" type="search" placeholder="Name, email, company, role, or account code"></div>
    <div class="dot-field"><label for="usersRole">Role</label><select id="usersRole"><option value="">All roles</option>${[...new Set(users.flatMap(roleList))].sort().map(r=>`<option value="${esc(r)}">${esc(title(r))}</option>`).join('')}</select></div>
    <div class="dot-field"><label for="usersAccountType">Account type</label><select id="usersAccountType"><option value="">All accounts</option><option value="C/TPA">C/TPA</option><option value="Employer">Employer</option><option value="Owner-Operator">Owner-Operator</option><option value="DOT Account">Other DOT account</option></select></div>
    <div class="dot-field"><label for="usersStatusFilter">Status</label><select id="usersStatusFilter"><option value="">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="inactive">Inactive / other</option></select></div>
    <div class="dot-field"><label for="usersMemberships">Memberships</label><select id="usersMemberships"><option value="">All users</option><option value="single">One account</option><option value="multiple">Multiple accounts</option></select></div>
    <button class="dot-btn" id="clearUsersFilters" type="button">Clear</button>
   </div></div>
   <div id="usersTable"></div>
  </div>
  `;

 const draw=()=>{
  const q=norm($('#usersSearch').value),rf=$('#usersRole').value,tf=$('#usersAccountType').value,sf=$('#usersStatusFilter').value,mf=$('#usersMemberships').value;
  const rows=users.filter(g=>{
   const roles=roleList(g),status=overallStatus(g),statusGroup=status==='active'?'active':/suspend/i.test(status)?'suspended':'inactive';
   const hay=[g.name,g.email,g.user_id,...roles,...g.memberships.flatMap(m=>[m.account?.label,m.account?.type,m.account?.code,m.organization_id,...m.portals.map(p=>portalLabel(p.portal_code))])].join(' ').toLowerCase();
   return (!q||hay.includes(q))&&(!rf||roles.includes(rf))&&(!tf||g.memberships.some(m=>m.account?.type===tf))&&(!sf||statusGroup===sf)&&(!mf||(mf==='multiple'?g.memberships.length>1:g.memberships.length===1));
  });
  $('#usersCount').textContent=`${rows.length} of ${users.length} users`;
  $('#usersTable').innerHTML=`<div class="dot-table-wrap"><table class="dot-table users-table"><thead><tr><th>User</th><th>Roles</th><th>DOT Accounts</th><th>Portal Access</th><th>Memberships</th><th>Status</th><th>Management</th></tr></thead><tbody>
   ${rows.map(g=>{const roles=roleList(g),portals=portalList(g),accounts=g.memberships.map(m=>m.account).filter(Boolean),uniqueAccounts=[...new Map(accounts.map(a=>[a.label+'|'+a.type,a])).values()];return `<tr>
    <td><strong>${esc(g.name)}</strong><small>${esc(g.email||'No email on profile')}</small></td>
    <td><div class="users-tag-list">${roles.map(r=>`<span class="users-role-tag">${esc(title(r))}</span>`).join('')||'<span class="users-muted">No role assigned</span>'}</div></td>
    <td><strong>${esc(uniqueAccounts[0]?.label||'Account not resolved')}</strong><small>${uniqueAccounts[0]?esc(uniqueAccounts[0].type+(uniqueAccounts[0].code?' · '+uniqueAccounts[0].code:'')):''}${uniqueAccounts.length>1?` · +${uniqueAccounts.length-1} more`:''}</small></td>
    <td>${portals.length?`<div class="users-tag-list">${portals.slice(0,2).map(p=>`<span class="users-portal-tag">${esc(portalLabel(p))}</span>`).join('')}${portals.length>2?`<span class="users-more">+${portals.length-2}</span>`:''}</div>`:'<span class="users-muted">No enabled portal grant</span>'}</td>
    <td>${g.memberships.length>1?`<span class="users-multi">${g.memberships.length} linked accounts</span>`:'<span class="users-muted">1 account</span>'}</td>
    <td>${pill(overallStatus(g))}</td>
    <td><div class="users-actions"><a class="dot-btn small primary" href="dot-user-detail.html?user_id=${encodeURIComponent(g.user_id||g.key)}">Manage</a>${uniqueAccounts[0]?.type==='C/TPA'?`<a class="dot-btn small" href="dot-ctpa-detail.html?id=${encodeURIComponent(uniqueAccounts[0].id)}">Account</a>`:''}</div></td>
   </tr>`}).join('')||'<tr><td colspan="7"><div class="dot-empty">No DOT users match the selected filters.</div></td></tr>'}
   </tbody></table></div>`;
};
 ['usersSearch','usersRole','usersAccountType','usersStatusFilter','usersMemberships'].forEach(id=>$('#'+id).addEventListener(id==='usersSearch'?'input':'change',draw));
 $('#clearUsersFilters').onclick=()=>{$('#usersSearch').value='';$('#usersRole').value='';$('#usersAccountType').value='';$('#usersStatusFilter').value='';$('#usersMemberships').value='';draw()};

 draw();
}

async function load(){
 $('#usersStatus').innerHTML='';
 const settled=await Promise.allSettled([DOTApi.call('portal_access'),DOTApi.call('ctpas'),DOTApi.call('employers'),DOTApi.call('owner_operators')]);
 if(settled[0].status!=='fulfilled')throw settled[0].reason||new Error('Unable to load DOT users and portal access.');
 const p=settled[0].value,c=settled[1].status==='fulfilled'?settled[1].value:{},e=settled[2].status==='fulfilled'?settled[2].value:{},o=settled[3].status==='fulfilled'?settled[3].value:{};
 if(settled.slice(1).some(x=>x.status!=='fulfilled'))notice('Users loaded, but one or more customer account directories could not be fully resolved.',true);
 render({memberships:get(p,'memberships','users'),portalAccess:get(p,'portal_access','organization_portal_access','ctpa_portal_access'),ctpas:get(c,'ctpas'),employers:get(e,'employers'),owners:get(o,'owner_operators')});
}
async function start(){const state=await DOTAuth.requireAuth();if(!state)return;DOTShell.render(state);shell();$('#refreshUsers').onclick=()=>load().catch(e=>notice(e.message,true));await load()}
addEventListener('DOMContentLoaded',()=>start().catch(e=>{console.error(e);if($('#usersStatus'))notice(e?.message||String(e),true)}),{once:true});
})();
