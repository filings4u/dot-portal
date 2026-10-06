(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],esc=v=>String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>{if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString()};
const api=(action,extra={})=>DOTApi.invoke('dot-document-admin',{action,...extra});
const logo='https://elpbnytpciqnbexiaebp.supabase.co/storage/v1/object/public/enterprise_branding/workforce-dot2.png';
let data={company:null,documents:[]};

function shell(title,copy){
 DOTShell.render(window.DOT_AUTH_STATE);
 $('#dotPageMount').innerHTML=`<section class="dot-page company-documents-page"><header class="dot-page-head"><div><span class="dot-eyebrow">DOT DOCUMENTS</span><h1>${esc(title)}</h1><p>${esc(copy)}</p></div><div class="dot-actions"><a class="dot-btn" href="dot-documents.html">Back to Companies</a><a class="dot-btn primary" href="dot-document-editor.html?mode=new">Create Document</a></div></header><div id="companyDocNotice"></div><div id="companyDocMount"></div></section>`;
}
function notice(msg,bad=false){$('#companyDocNotice').innerHTML=`<div class="dot-banner ${bad?'warning':''}"><div><strong>${bad?'Action needs attention':'Document update'}</strong><span>${esc(msg)}</span></div></div>`}
function badge(v){const s=String(v||'draft').toLowerCase();return `<span class="dot-status-pill ${['published','accepted','confirmed','active'].includes(s)?'ok':s==='archived'?'bad':'warn'}">${esc(s.toUpperCase())}</span>`}
function typeLabel(v){return String(v||'document').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase())}
function directionLabel(d){if(d.onboarding_document)return '<span class="doc-source-pill onboarding">Onboarding</span>';if(d.direction==='received')return '<span class="doc-source-pill received">Received from Company</span>';return '<span class="doc-source-pill sent">Sent by Workforce DOT</span>'}
function modal(){
 let m=$('#companyDocumentViewer');
 if(m)return m;
 document.body.insertAdjacentHTML('beforeend',`<div id="companyDocumentViewer" class="document-preview-modal" hidden><div class="document-preview-backdrop" data-close-company-doc></div><div class="document-preview-dialog company-document-viewer-dialog"><div class="document-preview-head"><div><span>DOCUMENT VIEWER</span><h2 id="companyViewerTitle">Document</h2></div><div class="document-actions"><button class="dot-btn" id="viewerDownload">Download PDF</button><button class="dot-btn" data-close-company-doc>Close</button></div></div><div class="document-preview-stage company-document-viewer-stage"><div id="companyViewerBody" class="company-viewer-body"></div></div></div></div>`);
 m=$('#companyDocumentViewer');$$('[data-close-company-doc]').forEach(x=>x.onclick=()=>m.hidden=true);return m;
}
function htmlPaper(doc){
 const body=String(doc.html_content||'<p>No preview content is available.</p>');
 return `<div class="pdf-render-paper company-generated-document"><div class="document-security-shell"><div class="preview-brand"><img src="${logo}" alt="Workforce DOT | screenings4u"><span>DOT COMPLIANCE DOCUMENT</span></div><div class="preview-content">${body}</div><div class="document-security-bottom">Workforce DOT | screenings4u · ${esc(doc.title||doc.file_name||'Document')}</div></div></div>`;
}
async function storedUrl(doc,download=false){const r=await api('file_url',{id:doc.id,download});return r.url}
async function openDoc(id){
 try{
  const r=await api('get',{id}),doc=r.document;modal();$('#companyViewerTitle').textContent=doc.title||doc.file_name||'Document';
  const body=$('#companyViewerBody');body.innerHTML='<div class="dot-loading-state"><span class="dot-spinner"></span><span>Loading document…</span></div>';
  $('#viewerDownload').onclick=()=>downloadDoc(id);
  if(doc.html_content){body.innerHTML=htmlPaper(doc)}
  else{
   const url=await storedUrl(doc,false);
   body.innerHTML=`<iframe class="company-document-frame" src="${esc(url)}" title="${esc(doc.title||doc.file_name||'Document')}"></iframe>`;
  }
  $('#companyDocumentViewer').hidden=false;
 }catch(e){notice(e.message||String(e),true)}
}
async function downloadHtmlPdf(doc){
 if(!window.jspdf?.jsPDF||!window.html2canvas)throw new Error('PDF rendering libraries are unavailable.');
 const wrap=document.createElement('div');wrap.innerHTML=htmlPaper(doc);wrap.style.position='fixed';wrap.style.left='-12000px';wrap.style.top='0';document.body.appendChild(wrap);
 try{
  const el=wrap.firstElementChild,canvas=await html2canvas(el,{scale:2,backgroundColor:'#fff',useCORS:true});
  const {jsPDF}=window.jspdf,pdf=new jsPDF({unit:'pt',format:'letter',orientation:'portrait'}),pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight(),iw=pw-48,ih=canvas.height*iw/canvas.width,img=canvas.toDataURL('image/png');
  let y=24,left=ih;pdf.addImage(img,'PNG',24,y,iw,ih);left-=ph-48;while(left>0){pdf.addPage();y=24-left;pdf.addImage(img,'PNG',24,y,iw,ih);left-=ph-48}
  pdf.save(`${(doc.title||'document').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')}.pdf`);
 }finally{wrap.remove()}
}
async function downloadDoc(id){
 try{
  const r=await api('get',{id}),doc=r.document;
  if(doc.html_content)return await downloadHtmlPdf(doc);
  const url=await storedUrl(doc,true);
  const a=document.createElement('a');a.href=url;a.download=(doc.file_name||doc.title||'document').replace(/\.(html?)$/i,'')+(String(doc.file_name||'').toLowerCase().endsWith('.pdf')?'':'.pdf');document.body.appendChild(a);a.click();a.remove();
 }catch(e){notice(e.message||String(e),true)}
}
function render(){
 const c=data.company||{},docs=data.documents||[],sent=docs.filter(x=>x.direction==='sent').length,received=docs.filter(x=>x.direction==='received').length,onboarding=docs.filter(x=>x.onboarding_document).length;
 $('#companyDocMount').innerHTML=`<div class="company-document-summary"><div><span>Company</span><strong>${esc(c.company_name||'Company')}</strong><small>${c.dot_number?'USDOT #'+esc(c.dot_number):''}</small></div><div><span>Total Documents</span><strong>${docs.length}</strong></div><div><span>Sent by Workforce DOT</span><strong>${sent}</strong></div><div><span>Received / Onboarding</span><strong>${received+onboarding}</strong></div></div><div class="dot-card"><div class="dot-card-head"><div><h2>Complete Document File</h2><p>All documents for this company, including Workforce DOT documents, customer uploads, and onboarding records.</p></div></div><div class="dot-card-body"><div class="dot-filter-row company-document-detail-filters"><input id="detailSearch" placeholder="Search document or type"><select id="detailSource"><option value="">All documents</option><option value="sent">Sent by Workforce DOT</option><option value="received">Received from Company</option><option value="onboarding">Onboarding Documents</option></select></div></div><div class="dot-table-wrap"><table class="dot-table company-document-detail-table"><thead><tr><th>Document</th><th>Source</th><th>Type</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody id="companyDocumentRows"></tbody></table></div></div>`;
 const paint=()=>{
  const q=($('#detailSearch').value||'').toLowerCase(),src=$('#detailSource').value||'';
  const rows=docs.filter(d=>(!q||[d.title,d.file_name,d.document_type].join(' ').toLowerCase().includes(q))&&(!src||(src==='onboarding'?d.onboarding_document:d.direction===src&&!d.onboarding_document)));
  $('#companyDocumentRows').innerHTML=rows.length?rows.map(d=>`<tr><td><strong>${esc(d.title||d.file_name||'Document')}</strong><small>${esc(d.file_name||'')}</small></td><td>${directionLabel(d)}</td><td>${esc(typeLabel(d.document_type))}</td><td>${fmt(d.updated_at||d.uploaded_at)}</td><td>${badge(d.document_status)}</td><td><div class="document-actions"><button class="dot-btn small" data-view-doc="${esc(d.id)}">View</button><button class="dot-btn small" data-download-doc="${esc(d.id)}">Download PDF</button></div></td></tr>`).join(''):'<tr><td colspan="6"><div class="dot-empty">No documents match these filters.</div></td></tr>';
  $$('[data-view-doc]').forEach(b=>b.onclick=()=>openDoc(b.dataset.viewDoc));$$('[data-download-doc]').forEach(b=>b.onclick=()=>downloadDoc(b.dataset.downloadDoc));
 };
 $('#detailSearch').oninput=paint;$('#detailSource').onchange=paint;paint();
}
async function start(){
 const s=await DOTAuth.requireAuth();if(!s)return;window.DOT_AUTH_STATE=s;
 const q=new URLSearchParams(location.search),type=q.get('type')||'',id=q.get('id')||'';
 shell('Company Documents','Loading complete company document file…');
 if(!type||!id)return notice('A company was not selected.',true);
 try{data=await api('company_documents',{company_type:type,company_id:id});shell(data.company?.company_name||'Company Documents','View every DOT document associated with this company in one place.');render()}catch(e){notice(e.message||String(e),true)}
}
addEventListener('DOMContentLoaded',start,{once:true});
})();