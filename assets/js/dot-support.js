(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],esc=v=>String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":'&#39;'}[c]));
const api=(action,extra={})=>DOTApi.invoke('dot-support-admin',{action,...extra});
const fmt=v=>{if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString()};
let state={tickets:[],summary:{}},active=null,detail=null;
function label(v){return String(v||'').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase())}
function statusBadge(v){const s=String(v||'').toLowerCase();const c=['resolved','closed'].includes(s)?'ok':['urgent','high'].includes(s)?'bad':['open','pending','waiting_customer','in_progress'].includes(s)?'warn':'';return `<span class="dot-status-pill ${c}">${esc(label(v||'open').toUpperCase())}</span>`}
function priorityBadge(v){const s=String(v||'normal').toLowerCase();const c=s==='urgent'||s==='high'?'bad':s==='low'?'ok':'warn';return `<span class="dot-status-pill ${c}">${esc(s.toUpperCase())}</span>`}
function shell(){DOTShell.render(window.DOT_AUTH_STATE);$('#dotPageMount').innerHTML=`<section class="dot-page support-admin-page"><header class="dot-page-head"><div><span class="dot-eyebrow">CUSTOMER SUPPORT</span><h1>DOT Support Center</h1><p>Manage support inquiries and portal conversations from C/TPAs, Direct Employers, and Owner-Operators.</p></div><div class="dot-actions"><button class="dot-btn" id="supportRefresh">Refresh</button></div></header><div id="supportNotice"></div><div id="supportMount"></div></section>`;$('#supportRefresh').onclick=load}
function notice(msg,bad=false){$('#supportNotice').innerHTML=`<div class="dot-banner ${bad?'warning':''}"><div><strong>${bad?'Action needs attention':'Support Center'}</strong><span>${esc(msg)}</span></div></div>`}
function render(){const s=state.summary||{},rows=state.tickets||[];$('#supportMount').innerHTML=`
<div class="dot-metrics support-metrics">
 <article class="dot-metric"><span>All Inquiries</span><strong>${s.total||0}</strong><small>Across all DOT customer portals</small></article>
 <article class="dot-metric"><span>Open</span><strong>${s.open||0}</strong><small>Active support conversations</small></article>
 <article class="dot-metric"><span>Needs Response</span><strong>${s.needs_response||0}</strong><small>Customer is waiting on us</small></article>
 <article class="dot-metric"><span>High / Urgent</span><strong>${s.urgent||0}</strong><small>Priority support items</small></article>
</div>
<div class="support-workspace dot-card">
 <aside class="support-inbox-panel">
  <div class="support-panel-head"><div><h2>Support Inbox</h2><p>All customer support and portal conversations.</p></div><span id="supportResultCount">${rows.length}</span></div>
  <div class="support-filter-stack">
   <input id="supportSearch" placeholder="Search ticket, customer, subject, message...">
   <div class="support-filter-grid">
    <select id="supportAccount"><option value="">All account types</option><option value="C/TPA">C/TPA</option><option value="Direct Employer">Direct Employer</option><option value="Owner-Operator">Owner-Operator</option></select>
    <select id="supportStatus"><option value="">All statuses</option><option value="open">Open</option><option value="in_progress">In Progress</option><option value="waiting_customer">Waiting Customer</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select>
    <select id="supportPriority"><option value="">All priorities</option><option value="urgent">Urgent</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select>
    <select id="supportNeed"><option value="">All response states</option><option value="required">Needs Response</option><option value="clear">No Response Due</option></select>
   </div>
  </div>
  <div id="supportTicketList" class="support-ticket-list"></div>
 </aside>
 <section class="support-thread-panel" id="supportThreadPanel">
  <div class="support-empty-thread"><div class="support-empty-icon">?</div><h2>Select a support inquiry</h2><p>Choose a ticket or message on the left to review the conversation and respond.</p></div>
 </section>
</div>`;
 const paint=()=>{const q=$('#supportSearch').value.toLowerCase(),acct=$('#supportAccount').value,st=$('#supportStatus').value,pri=$('#supportPriority').value,need=$('#supportNeed').value;const filtered=rows.filter(x=>(!q||[x.ticket_number,x.title,x.customer,x.preview,x.category,x.portal].join(' ').toLowerCase().includes(q))&&(!acct||x.account_type===acct)&&(!st||x.status===st)&&(!pri||x.priority===pri)&&(!need||(need==='required'&&x.response_required)||(need==='clear'&&!x.response_required)));$('#supportResultCount').textContent=filtered.length;$('#supportTicketList').innerHTML=filtered.length?filtered.map(x=>`<button class="support-ticket-card ${active?.kind===x.kind&&active?.id===x.id?'active':''} ${x.response_required?'needs-response':''}" data-kind="${esc(x.kind)}" data-id="${esc(x.id)}"><div class="support-ticket-top"><strong>${esc(x.ticket_number||'Support')}</strong><span>${fmt(x.updated_at)}</span></div><h3>${esc(x.title||'Support inquiry')}</h3><div class="support-ticket-customer"><strong>${esc(x.customer||'—')}</strong><span>${esc(x.account_type||'')}</span></div><p>${esc(x.preview||'No message preview available.')}</p><div class="support-ticket-foot"><div>${priorityBadge(x.priority)} ${statusBadge(x.status)}</div>${x.response_required?'<span class="support-response-flag">RESPONSE REQUIRED</span>':''}</div></button>`).join(''):'<div class="dot-empty">No support inquiries match these filters.</div>';$$('.support-ticket-card').forEach(b=>b.onclick=()=>openTicket(b.dataset.kind,b.dataset.id))};
 ['#supportSearch','#supportAccount','#supportStatus','#supportPriority','#supportNeed'].forEach(sel=>{$(sel).oninput=paint;$(sel).onchange=paint});paint();
 if(active)openTicket(active.kind,active.id,true)
}
function messageClass(m){if(m.is_internal_note)return'note';return ['staff','platform','admin'].includes(String(m.sender_type))?'staff':'customer'}
function renderThread(){if(!active||!detail)return;const record=detail.record||{},messages=detail.messages||[];const pane=$('#supportThreadPanel');pane.innerHTML=`
 <div class="support-thread-head">
  <div><span class="support-thread-kicker">${esc(active.ticket_number||'SUPPORT')}</span><h2>${esc(active.title||'Support inquiry')}</h2><p>${esc(active.customer||'—')} · ${esc(active.account_type||'')}</p></div>
  <div class="support-thread-head-badges">${priorityBadge(active.priority)} ${statusBadge(active.status)}</div>
 </div>
 <div class="support-thread-toolbar">
  <label><span>Status</span><select id="threadStatus"><option value="open">Open</option><option value="in_progress">In Progress</option><option value="waiting_customer">Waiting Customer</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></label>
  ${['support_ticket','dot_support_ticket'].includes(active.kind)?`<label><span>Priority</span><select id="threadPriority"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>`:''}
  <button class="dot-btn" id="saveThreadState">Save Status</button>
 </div>
 <div class="support-customer-context">
  <div><span>Customer</span><strong>${esc(active.customer||'—')}</strong></div><div><span>Portal</span><strong>${esc(label(active.portal||active.account_type||'—'))}</strong></div><div><span>Category</span><strong>${esc(label(active.category||'general'))}</strong></div><div><span>Updated</span><strong>${fmt(active.updated_at)}</strong></div>
 </div>
 <div class="support-conversation" id="supportConversation">
  ${messages.length?messages.map(m=>`<article class="support-message ${messageClass(m)}"><div class="support-message-meta"><strong>${m.is_internal_note?'Internal Note':esc(label(m.sender_type||'message'))}</strong><span>${fmt(m.created_at)}</span></div><p>${esc(m.body||'')}</p></article>`).join(''):`<article class="support-message customer"><div class="support-message-meta"><strong>Customer</strong><span>${fmt(record.created_at)}</span></div><p>${esc(record.message||active.preview||'No message body was stored for this inquiry.')}</p></article>`}
 </div>
 <div class="support-response-area">
  <div class="support-response-tabs"><button class="active" data-compose="reply">Reply to Customer</button>${['support_ticket','dot_support_ticket'].includes(active.kind)?'<button data-compose="note">Internal Note</button>':''}</div>
  <textarea id="supportReplyText" rows="6" placeholder="Write a response to the customer..."></textarea>
  <div class="support-compose-foot"><span id="supportComposeHint">Reply will be added to the support thread and emailed when an address is available.</span><button class="dot-btn primary" id="sendSupportReply">Send Reply</button></div>
 </div>`;
 $('#threadStatus').value=normalizeThreadStatus(active.status);if($('#threadPriority'))$('#threadPriority').value=active.priority||'normal';
 let mode='reply';$$('[data-compose]').forEach(b=>b.onclick=()=>{mode=b.dataset.compose;$$('[data-compose]').forEach(x=>x.classList.toggle('active',x===b));$('#supportReplyText').placeholder=mode==='note'?'Add an internal note visible only to screenings4u staff...':'Write a response to the customer...';$('#supportComposeHint').textContent=mode==='note'?'Internal notes are never sent to the customer.':'Reply will be added to the support thread and emailed when an address is available.';$('#sendSupportReply').textContent=mode==='note'?'Add Internal Note':'Send Reply'});
 $('#sendSupportReply').onclick=async()=>{const body=$('#supportReplyText').value.trim();if(!body)return;try{const r=await api(mode==='note'?'note':'reply',{kind:active.kind,id:active.id,body});notice(mode==='note'?'Internal note added.':r.email_error?`Reply saved. Email issue: ${r.email_error}`:'Reply sent.');await load(true)}catch(e){notice(e.message,true)}};
 $('#saveThreadState').onclick=async()=>{try{await api('update',{kind:active.kind,id:active.id,status:$('#threadStatus').value,priority:$('#threadPriority')?.value||''});notice('Support status updated.');await load(true)}catch(e){notice(e.message,true)}};
 const c=$('#supportConversation');if(c)c.scrollTop=c.scrollHeight
}
function normalizeThreadStatus(v){const s=String(v||'open');return['open','in_progress','waiting_customer','resolved','closed'].includes(s)?s:'open'}
async function openTicket(kind,id,silent=false){try{active=(state.tickets||[]).find(x=>x.kind===kind&&x.id===id)||{kind,id};detail=await api('detail',{kind,id});renderThread();$$('.support-ticket-card').forEach(b=>b.classList.toggle('active',b.dataset.kind===kind&&b.dataset.id===id));}catch(e){if(!silent)notice(e.message,true)}}
async function load(keep=false){try{const prev=keep&&active?{...active}:null;state=await api('list');if(prev)active=(state.tickets||[]).find(x=>x.kind===prev.kind&&x.id===prev.id)||null;render();if(active){detail=await api('detail',{kind:active.kind,id:active.id});renderThread()}}catch(e){notice(e.message,true)}}
async function start(){const s=await DOTAuth.requireAuth();if(!s)return;window.DOT_AUTH_STATE=s;shell();await load()}
addEventListener('DOMContentLoaded',start,{once:true});
})();
