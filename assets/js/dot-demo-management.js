(()=>{
"use strict";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const niceDate=v=>v?new Intl.DateTimeFormat("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"}).format(new Date(v+"T12:00:00")):"—";
const niceTime=v=>{if(!v)return"—";const [h,m]=String(v).slice(0,5).split(":").map(Number);return new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"2-digit"}).format(new Date(2000,0,1,h,m))};
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
let state={demos:[],blocks:[],summary:{},teams:{},scheduling:{}},calendarMonth=new Date(),selectedDates=new Set();
const dayNames=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth(),1);
const api=(action,extra={})=>DOTApi.invoke(DOT_PORTAL_CONFIG.demoManagementFunction||"dot-demo-management",{action,...extra});

function alertMsg(msg,bad=false){const n=$("#demoAdminNotice");if(!n)return;n.hidden=false;n.className="dot-banner "+(bad?"warning":"");n.innerHTML=`<strong>${bad?"Action needed":"Saved"}</strong><span>${esc(msg)}</span>`;setTimeout(()=>n.hidden=true,5000)}
function orgName(d){return d.ctpas?.organizations?.dba_name||d.ctpas?.organizations?.legal_name||d.company_name||"C/TPA"}
function statusPill(s){const good=["confirmed","completed"].includes(String(s));return `<span class="dot-status-pill ${good?"ok":""}">${esc(String(s||"confirmed").toUpperCase())}</span>`}
function allDayBlocked(date){return state.blocks.some(b=>b.active!==false&&b.all_day===true&&String(b.block_date)===date)}

function blockCalendar(){
  const y=calendarMonth.getFullYear(),m=calendarMonth.getMonth(),first=new Date(y,m,1),last=new Date(y,m+1,0);
  let cells="";
  for(let i=0;i<first.getDay();i++)cells+=`<button class="demo-admin-day empty" disabled></button>`;
  for(let n=1;n<=last.getDate();n++){
    const d=new Date(y,m,n),key=iso(d),blocked=allDayBlocked(key),selected=selectedDates.has(key);
    cells+=`<button type="button" class="demo-admin-day ${blocked?"blocked":""} ${selected?"selected":""}" data-block-date="${key}" ${blocked?"disabled":""}><span>${n}</span>${blocked?'<small>Blocked</small>':selected?'<small>Selected</small>':""}</button>`;
  }
  return `<div class="demo-admin-calendar">
    <div class="demo-admin-calendar-head"><button type="button" class="dot-btn small" id="blockPrev">‹</button><strong>${new Intl.DateTimeFormat("en-US",{month:"long",year:"numeric"}).format(first)}</strong><button type="button" class="dot-btn small" id="blockNext">›</button></div>
    <div class="demo-admin-weekdays">${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(x=>`<span>${x}</span>`).join("")}</div>
    <div class="demo-admin-days">${cells}</div>
  </div>`;
}


function timezoneOptions(selected){
  const zones=[
    ["America/Chicago","Central Time"],
    ["America/New_York","Eastern Time"],
    ["America/Denver","Mountain Time"],
    ["America/Los_Angeles","Pacific Time"],
    ["America/Phoenix","Arizona Time"],
    ["America/Anchorage","Alaska Time"],
    ["Pacific/Honolulu","Hawaii Time"]
  ];
  if(selected&&!zones.some(([v])=>v===selected))zones.unshift([selected,selected]);
  return zones.map(([v,l])=>`<option value="${esc(v)}" ${v===selected?"selected":""}>${esc(l)} · ${esc(v)}</option>`).join("");
}

function businessHoursCard(){
  const s=state.scheduling||{};
  const weekdays=new Set(Array.isArray(s.weekdays)?s.weekdays.map(Number):[1,2,3,4,5]);
  return `<section class="dot-card demo-hours-card" style="grid-column:span 12">
    <div class="dot-card-head"><div><h2>Demo Business Hours</h2><p>Set the days and times customers are allowed to schedule demos. These settings control the live scheduling page.</p></div><span class="dot-status-pill ${s.active===false?"warn":"ok"}">${s.active===false?"PAUSED":"ACTIVE"}</span></div>
    <div class="dot-card-body">
      <div class="demo-hours-grid">
        <div class="dot-field demo-hours-days"><label>Available Days</label><div class="demo-day-picks">${dayNames.map((name,i)=>`<label class="demo-day-pick"><input type="checkbox" class="businessDay" value="${i}" ${weekdays.has(i)?"checked":""}><span>${name}</span></label>`).join("")}</div></div>
        <div class="dot-field"><label>Timezone</label><select id="businessTimezone">${timezoneOptions(s.timezone||"America/Chicago")}</select></div>
        <div class="dot-field"><label>Opening Time</label><input id="businessStart" type="time" value="${esc(String(s.start_time||"09:00").slice(0,5))}"></div>
        <div class="dot-field"><label>Closing Time</label><input id="businessEnd" type="time" value="${esc(String(s.end_time||"17:00").slice(0,5))}"></div>
        <div class="dot-field"><label>Scheduling Interval</label><select id="businessSlot">${[15,30,45,60,90,120].map(v=>`<option value="${v}" ${Number(s.slot_minutes||60)===v?"selected":""}>Every ${v} minutes</option>`).join("")}</select></div>
        <div class="dot-field"><label>Demo Duration</label><select id="businessDuration">${[15,30,45,60,75,90,120].map(v=>`<option value="${v}" ${Number(s.duration_minutes||60)===v?"selected":""}>${v} minutes</option>`).join("")}</select></div>
        <div class="dot-field demo-hours-toggle"><label>Scheduling Status</label><label class="demo-switch"><input id="businessActive" type="checkbox" ${s.active===false?"":"checked"}><span></span><strong>Accept new demo appointments</strong></label></div>
      </div>
      <div class="dot-actions demo-hours-actions"><button class="dot-btn primary" id="saveBusinessHours">Save Business Hours</button></div>
    </div>
  </section>`;
}

function actionModal(){return `<div class="dot-modal-backdrop" id="actionModal" hidden><div class="dot-modal-card demo-confirm-card"><div class="dot-card-head"><div><h2 id="actionModalTitle">Confirm action</h2><p id="actionModalText"></p></div></div><div class="dot-card-body"><div class="dot-actions" style="justify-content:flex-end"><button class="dot-btn" id="actionModalCancel">Cancel</button><button class="dot-btn danger" id="actionModalConfirm">Confirm</button></div></div></div></div>`}
let actionResolve=null;
function confirmAction(title,message,confirmLabel="Confirm"){return new Promise(resolve=>{actionResolve=resolve;$("#actionModalTitle").textContent=title;$("#actionModalText").textContent=message;$("#actionModalConfirm").textContent=confirmLabel;$("#actionModal").hidden=false})}
function closeActionModal(value=false){if($("#actionModal"))$("#actionModal").hidden=true;const r=actionResolve;actionResolve=null;if(r)r(value)}

function modal(){return `<div class="dot-modal-backdrop" id="demoModal" hidden><div class="dot-modal-card"><div class="dot-card-head"><div><h2>Edit Demo</h2><p>Reschedule the confirmed Teams demo or update internal notes.</p></div><button class="dot-btn small" id="closeDemoModal">Close</button></div><div class="dot-card-body"><input type="hidden" id="editDemoId"><div class="dot-field-grid">
<div class="dot-field"><label>Date</label><input id="editDemoDate" type="date"></div>
<div class="dot-field"><label>Time</label><input id="editDemoTime" type="time"></div>
<div class="dot-field"><label>Status</label><input id="editDemoStatus" value="Confirmed automatically" readonly></div>
<div class="dot-field"><label>Meeting Provider</label><input id="editMeetingProvider" value="Microsoft Teams" readonly></div>
<div class="dot-field"><label>Microsoft Event ID</label><input id="editMeetingId" readonly></div>
<div class="dot-field"><label>Teams Meeting</label><input id="editMeetingUrl" readonly></div>
<div class="dot-field" style="grid-column:1/-1"><label>Admin Notes</label><textarea id="editAdminNotes" rows="4"></textarea></div>
</div><div class="dot-actions" style="margin-top:16px;justify-content:flex-end"><button class="dot-btn primary" id="saveDemoEdit">Save Changes</button></div></div></div></div>`}

function render(){
 const s=state.summary||{};
 $("#dotPageMount").innerHTML=`<div class="dot-page demo-admin-page"><div class="dot-page-head"><div><span class="dot-eyebrow">Customer Success</span><h1>Demo Management</h1><p>View, reschedule, or delete C/TPA demos and manage unavailable dates. Open appointment slots are accepted automatically and Microsoft Teams meetings are created immediately.</p></div></div>
 <div id="demoAdminNotice" class="dot-banner" hidden></div>
 <div class="dot-metrics"><div class="dot-metric"><span>Total Requests</span><strong>${s.total||0}</strong><small>All demo requests</small></div><div class="dot-metric"><span>Confirmed</span><strong>${s.confirmed||0}</strong><small>Accepted automatically</small></div><div class="dot-metric"><span>Blocked Dates</span><strong>${state.blocks.filter(x=>x.active!==false&&x.all_day).length}</strong><small>Unavailable calendar days</small></div><div class="dot-metric"><span>Teams Setup</span><strong>${state.teams?.configured&&state.teams?.acs_configured?'READY':'CHECK'}</strong><small>${state.teams?.configured&&state.teams?.acs_configured?'Graph + embedded calling configured':'Review project configuration'}</small></div></div>
 ${state.teams?.configured&&state.teams?.acs_configured?'':`<div class="dot-banner warning"><strong>Teams configuration incomplete</strong><span>${esc([...(state.teams?.missing||[]),...(state.teams?.acs_configured?[]:['AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING / ACS_CONNECTION_STRING'])].join(', '))}</span></div>`}
 <div class="dot-grid">${businessHoursCard()}
 <section class="dot-card" style="grid-column:span 8"><div class="dot-card-head"><div><h2>Demo Requests</h2><p>Appointments are automatically accepted when the requested slot is available.</p></div></div><div class="dot-table-wrap"><table class="dot-table"><thead><tr><th>C/TPA</th><th>Contact</th><th>Appointment</th><th>Topic</th><th>Status</th><th>Meeting</th><th>Actions</th></tr></thead><tbody>${state.demos.length?state.demos.map(d=>`<tr><td><strong>${esc(orgName(d))}</strong><small>${esc(d.ctpas?.company_code||"")}</small></td><td>${esc(d.contact_first_name)} ${esc(d.contact_last_name)}<small>${esc(d.contact_email)}<br>${esc(d.contact_phone)}</small></td><td><strong>${esc(niceDate(d.requested_date))}</strong><small>${esc(niceTime(d.requested_time))} · ${esc(d.timezone||"America/Chicago")}</small></td><td>${esc(d.demo_topic||"C/TPA DOT Platform Demo")}</td><td>${statusPill(d.status)}</td><td>${d.meeting_url?'<span class="dot-status-pill ok">TEAMS READY</span>':'<span class="dot-muted">—</span>'}</td><td><div class="dot-actions"><button class="dot-btn small editDemo" data-id="${d.id}">Edit</button><button class="dot-btn small danger deleteDemo" data-id="${d.id}">Delete</button></div></td></tr>`).join(""):`<tr><td colspan="7"><div class="dot-empty">No demo requests yet.</div></td></tr>`}</tbody></table></div></section>
 <section class="dot-card" style="grid-column:span 4"><div class="dot-card-head"><div><h2>Block Availability</h2><p>Select one or more days on the calendar. You can select an entire work week and block it in one save.</p></div></div><div class="dot-card-body">
 ${blockCalendar()}
 <div class="dot-actions demo-calendar-actions"><button class="dot-btn small" id="selectWeek">Select Work Week</button><button class="dot-btn small" id="clearDates">Clear Selection</button></div>
 <div class="demo-selection-count"><strong id="selectedCount">${selectedDates.size}</strong> selected day${selectedDates.size===1?"":"s"}</div>
 <div class="dot-field" style="margin-top:12px"><label>Reason</label><input id="blockReason" placeholder="Holiday, office closed, unavailable..."></div>
 <button class="dot-btn primary dot-btn-block" id="saveBlocks" ${selectedDates.size?"":"disabled"}>Block Selected Days</button></div>
 <div class="dot-card-head" style="border-top:1px solid var(--dot-line)"><div><h2>Current Blocks</h2><p>Remove a blocked day to make it available again.</p></div></div><div class="dot-card-body demo-block-list">${state.blocks.length?state.blocks.filter(x=>x.active!==false).map(b=>`<div class="demo-block-row"><div><strong>${esc(niceDate(b.block_date))}</strong><small>${b.all_day?"All day":`${esc(niceTime(b.start_time))} – ${esc(niceTime(b.end_time))}`}<br>${esc(b.reason||"No reason entered")}</small></div><button class="dot-btn small danger deleteBlock" data-id="${b.id}">Remove</button></div>`).join(""):'<div class="dot-empty compact">No blocked dates.</div>'}</div></section>
 </div>${modal()}${actionModal()}</div>`;
 bind();
}

function openDemo(id){const d=state.demos.find(x=>x.id===id);if(!d)return;$("#editDemoId").value=d.id;$("#editDemoDate").value=d.requested_date||"";$("#editDemoTime").value=String(d.requested_time||"").slice(0,5);$("#editMeetingId").value=d.meeting_id||"";$("#editMeetingUrl").value=d.meeting_url||"";$("#editAdminNotes").value=d.admin_notes||"";$("#demoModal").hidden=false}

function selectWorkWeek(){
 const base=calendarMonth.getFullYear()===new Date().getFullYear()&&calendarMonth.getMonth()===new Date().getMonth()?new Date():new Date(calendarMonth.getFullYear(),calendarMonth.getMonth(),1);
 const day=base.getDay(),monday=new Date(base);monday.setDate(base.getDate()+((1-day+7)%7));
 for(let i=0;i<5;i++){const d=new Date(monday);d.setDate(monday.getDate()+i);const key=iso(d);if(d.getMonth()===calendarMonth.getMonth()&&!allDayBlocked(key))selectedDates.add(key)}
 render();
}

function bind(){
 $$(".editDemo").forEach(b=>b.onclick=()=>openDemo(b.dataset.id));
 $$(".deleteDemo").forEach(b=>b.onclick=async()=>{if(!(await confirmAction("Delete Demo","Delete this confirmed demo? Any linked Teams calendar event will also be cancelled.","Delete Demo")))return;try{await api("delete_demo",{id:b.dataset.id});await load();alertMsg("Demo deleted and calendar event cancelled.")}catch(e){alertMsg(e.message,true)}});
 $$(".deleteBlock").forEach(b=>b.onclick=async()=>{if(!(await confirmAction("Remove Blocked Date","Make this date available for demo scheduling again?","Remove Block")))return;try{await api("delete_block",{id:b.dataset.id});await load();alertMsg("Blocked date removed.")}catch(e){alertMsg(e.message,true)}});
 $$("#dotPageMount [data-block-date]").forEach(b=>b.onclick=()=>{const k=b.dataset.blockDate;selectedDates.has(k)?selectedDates.delete(k):selectedDates.add(k);render()});
 $("#blockPrev").onclick=()=>{calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()-1,1);render()};
 $("#blockNext").onclick=()=>{calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+1,1);render()};
 $("#selectWeek").onclick=selectWorkWeek;
 $("#clearDates").onclick=()=>{selectedDates.clear();render()};
 $("#saveBlocks").onclick=async()=>{try{if(!selectedDates.size)throw new Error("Select at least one day.");const dates=[...selectedDates].sort();await api("save_blocks",{dates,reason:$("#blockReason").value});selectedDates.clear();await load();alertMsg(`${dates.length} day${dates.length===1?"":"s"} blocked.`)}catch(e){alertMsg(e.message,true)}};
 $("#saveBusinessHours").onclick=async()=>{try{const weekdays=$$(".businessDay:checked").map(x=>Number(x.value));if(!weekdays.length)throw new Error("Select at least one available day.");const start_time=$("#businessStart").value,end_time=$("#businessEnd").value;if(!start_time||!end_time||end_time<=start_time)throw new Error("Closing time must be after opening time.");await api("save_settings",{weekdays,start_time,end_time,timezone:$("#businessTimezone").value,slot_minutes:Number($("#businessSlot").value),duration_minutes:Number($("#businessDuration").value),active:$("#businessActive").checked});await load();alertMsg("Demo business hours updated.")}catch(e){alertMsg(e.message,true)}};
 $("#actionModalCancel").onclick=()=>closeActionModal(false);
 $("#actionModalConfirm").onclick=()=>closeActionModal(true);
 $("#actionModal").onclick=e=>{if(e.target.id==="actionModal")closeActionModal(false)};
 $("#closeDemoModal").onclick=()=>$("#demoModal").hidden=true;
 $("#demoModal").onclick=e=>{if(e.target.id==="demoModal")$("#demoModal").hidden=true};
 $("#saveDemoEdit").onclick=async()=>{try{const id=$("#editDemoId").value,date=$("#editDemoDate").value,time=$("#editDemoTime").value;if(!date||!time)throw new Error("Date and time are required.");await api("save_demo",{id,requested_date:date,requested_time:time,admin_notes:$("#editAdminNotes").value});$("#demoModal").hidden=true;await load();alertMsg("Demo updated. Confirmation and calendar update sent.")}catch(e){alertMsg(e.message,true)}};
}

async function load(){state=await api("list");render()}
async function start(){const s=await DOTAuth.requireAuth();if(!s)return;DOTShell.render(s);try{await load()}catch(e){document.querySelector("#dotPageMount").innerHTML=`<div class="dot-page"><div class="dot-banner warning"><strong>Unable to load demos</strong><span>${esc(e.message)}</span></div></div>`}}
start();
})();