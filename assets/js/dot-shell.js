/* screenings4u DOT Management Portal — standalone navigation shell */
(()=>{
"use strict";
const page=location.pathname.split('/').pop()||'dot-dashboard.html';
const groups=[
 ['Control Center',[['dot-dashboard.html','Overview','⌂'],['dot-website.html','DOT Website','◫'],['dot-portal-control.html','Portal Control','◎'],['dot-distribution.html','Distribution','⇧']]],
 ['Customers',[['dot-ctpas.html','C/TPAs','◈'],['dot-employers.html','Employers','▣'],['dot-owner-operators.html','Owner-Operators','◇'],['dot-drivers.html','Drivers','◉'],['dot-users-access.html','Users & Access','♙']]],
 ['Programs & Testing',[['dot-programs.html','Programs','≡'],['dot-pools.html','Consortiums & Pools','⊙'],['dot-random-selections.html','Random Selections','⌁'],['dot-testing-orders.html','Testing Orders','✚'],['dot-results.html','Results','✓']]],
 ['Compliance',[['dot-compliance.html','Compliance Cases','⚑'],['dot-clearinghouse.html','Clearinghouse','⇄'],['dot-return-to-duty.html','Return-to-Duty / SAP','↺'],['dot-agencies.html','DOT Agencies','✦']]],
 ['Commerce & Records',[['dot-catalog.html','Website Plans & Pricing','$'],['dot-ctpa-pricing.html','C/TPA Testing Pricing','¢'],['dot-orders.html','Service Orders','▤'],['dot-invoices.html','Invoices','▧'],['dot-documents.html','Documents','▱'],['dot-training.html','Training Records','△']]],
 ['Administration',[['dot-notifications.html','Notifications','●'],['dot-demo-management.html','Demo Management','◫'],['dot-support.html','Support','?'],['dot-integrations.html','Integrations','⌘'],['dot-settings.html','Settings','⚙'],['dot-audit.html','Audit History','☷']]]
];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function initials(v){return String(v||'DOT').split(/\s+|@/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()).join('')||'DOT'}
function nav(){return groups.map(([label,links])=>`<div class="dot-nav-group"><span>${esc(label)}</span>${links.map(([href,name,icon])=>`<a href="${href}" class="${page===href?'active':''}"><i class="dot-nav-icon">${icon}</i><b>${esc(name)}</b></a>`).join('')}</div>`).join('')}
function render(state){const p=state?.profile||{},u=state?.user||{},name=p.display_name||[p.first_name,p.last_name].filter(Boolean).join(' ')||u.user_metadata?.full_name||u.email||'DOT Administrator',role=(state?.roles||[])[0]||'staff';document.body.classList.add('dot-shell-ready');document.body.innerHTML=`<div class="dot-app"><aside class="dot-sidebar"><div class="dot-brand"><a href="dot-dashboard.html" aria-label="screenings4u Workforce DOT Management"><img class="dot-brand-logo" src="images/logo.png" alt="screenings4u Workforce DOT"><span class="dot-brand-portal-label">Management Portal</span></a></div><div class="dot-workspace"><span>Workspace</span><strong>DOT Operations</strong></div><nav class="dot-nav" aria-label="DOT management">${nav()}</nav><div class="dot-sidebar-footer">dot-portal.screenings4u.com<br>Standalone DOT control plane</div></aside><div class="dot-main"><header class="dot-topbar"><div class="dot-topbar-left"><button class="dot-menu-button" id="dotMenu" aria-label="Open navigation">☰</button><button class="dot-sidebar-toggle" id="dotSidebarToggle" aria-label="Hide sidebar" title="Hide sidebar">◀</button><div class="dot-topbar-title"><strong>screenings4u DOT</strong><small>Manage dot.screenings4u.com and all DOT portals</small></div></div><div class="dot-topbar-actions"><a class="dot-icon-button" href="dot-notifications.html" title="Notifications">●</a><a class="dot-icon-button" href="dot-support.html" title="Support">?</a><a class="dot-user-button" id="dotUser" href="dot-profile.html"><span class="dot-avatar">${esc(initials(name))}</span><span class="dot-user-copy"><strong>${esc(name)}</strong><small>${esc(role)}</small></span></a></div></header><main id="dotPageMount"></main></div></div><div class="dot-overlay" id="dotOverlay"></div>`;document.getElementById('dotMenu')?.addEventListener('click',()=>document.body.classList.add('dot-menu-open'));document.getElementById('dotOverlay')?.addEventListener('click',()=>document.body.classList.remove('dot-menu-open'));const saved=localStorage.getItem('dot-sidebar-collapsed')==='1';if(saved)document.body.classList.add('dot-sidebar-collapsed');const t=document.getElementById('dotSidebarToggle');const sync=()=>{const collapsed=document.body.classList.contains('dot-sidebar-collapsed');if(t){t.textContent=collapsed?'▶':'◀';t.setAttribute('aria-label',collapsed?'Show sidebar':'Hide sidebar');t.setAttribute('title',collapsed?'Show sidebar':'Hide sidebar')}};sync();t?.addEventListener('click',()=>{document.body.classList.toggle('dot-sidebar-collapsed');localStorage.setItem('dot-sidebar-collapsed',document.body.classList.contains('dot-sidebar-collapsed')?'1':'0');sync()});}
function dialog({title="screenings4u DOT",message="",confirmText="OK",cancelText="",danger=false}={}){
  return new Promise(resolve=>{
    document.getElementById("dotGlobalDialog")?.remove();
    const back=document.createElement("div");back.id="dotGlobalDialog";back.style.cssText="position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;padding:24px;background:rgba(16,47,85,.68);backdrop-filter:blur(3px)";
    const card=document.createElement("section");card.setAttribute("role","dialog");card.setAttribute("aria-modal","true");card.style.cssText="width:min(500px,100%);background:#fff;border-radius:14px;border-top:5px solid #f05a00;box-shadow:0 24px 70px rgba(0,0,0,.28);padding:26px;font-family:Inter,Arial,sans-serif";
    card.innerHTML=`<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px"><img src="images/logo.png" alt="screenings4u" style="max-width:175px;max-height:44px"></div><h2 style="margin:0 0 8px;color:#123b6d;font-size:20px">${esc(title)}</h2><p style="margin:0;color:#667892;line-height:1.55;font-size:13px;white-space:pre-wrap">${esc(message)}</p><div data-actions style="display:flex;justify-content:flex-end;gap:9px;flex-wrap:wrap;margin-top:22px"></div>`;
    const actions=card.querySelector("[data-actions]"),done=v=>{back.remove();resolve(v)};
    const btn=(label,primary,fn)=>{const b=document.createElement("button");b.type="button";b.textContent=label;b.style.cssText=`min-height:40px;padding:0 16px;border-radius:8px;border:1px solid ${primary?(danger?"#b42318":"#f05a00"):"#cfd9e5"};background:${primary?(danger?"#b42318":"#f05a00"):"#fff"};color:${primary?"#fff":"#24467f"};font:800 12px Inter,Arial,sans-serif;cursor:pointer`;b.onclick=fn;return b};
    if(cancelText)actions.append(btn(cancelText,false,()=>done(false)));
    actions.append(btn(confirmText,true,()=>done(true)));
    back.onclick=e=>{if(e.target===back&&cancelText)done(false)};
    back.addEventListener("keydown",e=>{if(e.key==="Escape"&&cancelText)done(false)});
    back.append(card);document.body.append(back);actions.querySelector("button:last-child")?.focus();
  });
}
window.DOTDialog=Object.freeze({
  alert:(message,opts={})=>dialog({title:opts.title||"screenings4u DOT",message,confirmText:opts.confirmText||"OK",danger:!!opts.danger}),
  confirm:(message,opts={})=>dialog({title:opts.title||"Confirm Action",message,confirmText:opts.confirmText||"Continue",cancelText:opts.cancelText||"Cancel",danger:!!opts.danger})
});
window.DOTShell=Object.freeze({render,groups,escape:esc});
})();
