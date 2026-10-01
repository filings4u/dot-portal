(()=>{
'use strict';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = v => DOTShell.escape(v);
const qs = new URLSearchParams(location.search);

function notice(message, error=false, title='Distribution update'){
  const host = $('#distStatus');
  if (!host) return;
  host.innerHTML = `<div class="dot-banner ${error?'warning':''}"><div><strong>${esc(error?'Action needs attention':title)}</strong><span>${esc(message)}</span></div></div>`;
}

function pill(label, kind=''){
  return `<span class="dot-status-pill ${kind}">${esc(label)}</span>`;
}

function metric(label, value, note=''){
  return `<article class="dot-metric"><span>${esc(label)}</span><strong>${esc(String(value ?? 0))}</strong><small>${esc(note)}</small></article>`;
}

function parseConfig(){
  const raw = $('#cfg')?.value.trim() || '';
  if (!raw) return {};
  try { return JSON.parse(raw); }
  catch { throw new Error('Runtime configuration must be valid JSON before it can be saved or published.'); }
}

function revisions(target){
  return {
    published: Number(target?.published_revision || 0),
    draft: Number(target?.draft_revision || 0)
  };
}

function hasDraft(target){
  const r = revisions(target);
  return r.draft > r.published;
}

function typeLabel(type){
  const map = {global:'Global',website:'Website',portal:'Portal'};
  return map[String(type||'').toLowerCase()] || String(type||'Target');
}

function renderShell(){
  $('#dotPageMount').innerHTML = `
    <section class="dot-page distribution-page">
      <header class="dot-page-head">
        <div>
          <span class="dot-eyebrow">DOT CONTROL PLANE</span>
          <h1>Distribution & Publishing</h1>
          <p>Manage centralized runtime configuration for dot.screenings4u.com and every managed DOT portal.</p>
        </div>
        <div class="dot-actions">
          <a class="dot-btn" href="dot-portal-control.html">Portal Control</a>
          <a class="dot-btn" href="dot-website.html">DOT Website</a>
          <button class="dot-btn" type="button" id="refreshDistribution">Refresh</button>
          <button class="dot-btn primary" type="button" id="publishAll">Publish All Drafts</button>
        </div>
      </header>
      <div id="distStatus"></div>
      <div id="distBody">
        <div class="dot-card"><div class="dot-empty"><div class="dot-spinner"></div><p>Loading distribution targets…</p></div></div>
      </div>
    </section>`;
}

function targetEditor(target){
  const r = revisions(target);
  const draft = hasDraft(target);
  const targetType = typeLabel(target.target_type);
  const publishLabel = target.domain ? `Publish to ${target.domain}` : 'Publish to all DOT properties';

  return `
    <div class="distribution-editor-head">
      <a class="distribution-back" href="dot-distribution.html">← All distribution targets</a>
    </div>

    <div class="dot-metrics">
      ${metric('Target Type', targetType, 'Distribution scope')}
      ${metric('Published Revision', r.published, 'Currently live')}
      ${metric('Draft Revision', r.draft, draft?'Unpublished changes':'Matches live')}
      ${metric('Status', draft?'Draft Changes':'Published', draft?'Publish required':'Up to date')}
    </div>

    <div class="dot-grid distribution-editor-grid">
      <article class="dot-card" style="grid-column:span 8">
        <div class="dot-card-head">
          <div>
            <h2>${esc(target.label || target.target_key || 'Distribution Target')}</h2>
            <p>${esc(target.domain || 'Global DOT control')} · ${esc(target.target_key || '')}</p>
          </div>
          ${draft ? pill('Draft changes','warn') : pill('Published','ok')}
        </div>
        <div class="dot-card-body">
          <div class="distribution-config-help">
            <strong>Runtime configuration</strong>
            <span>Changes are saved as a draft first. They do not become live until you publish this target.</span>
          </div>

          <div class="dot-field">
            <label for="cfg">Configuration JSON</label>
            <textarea id="cfg" class="distribution-json-editor" spellcheck="false">${esc(JSON.stringify(target.draft_config || {}, null, 2))}</textarea>
            <div class="dot-help">Supported controls include status, title, meta_description, seo_index, banner, custom_css, body_class, favicon_url, and redirect_url.</div>
          </div>

          <div class="dot-actions distribution-editor-actions">
            <button class="dot-btn" type="button" id="formatConfig">Format JSON</button>
            <button class="dot-btn" type="button" id="saveDraft">Save Draft</button>
            <button class="dot-btn primary" type="button" id="publish">${esc(publishLabel)}</button>
          </div>
        </div>
      </article>

      <article class="dot-card" style="grid-column:span 4">
        <div class="dot-card-head"><div><h2>Target Details</h2><p>Current publishing scope.</p></div></div>
        <div class="dot-card-body">
          <div class="dot-detail-grid distribution-detail-grid">
            <div class="dot-detail-item"><span>Target Key</span><strong>${esc(target.target_key || '—')}</strong></div>
            <div class="dot-detail-item"><span>Type</span><strong>${esc(targetType)}</strong></div>
            <div class="dot-detail-item"><span>Domain</span><strong>${esc(target.domain || 'All DOT properties')}</strong></div>
            <div class="dot-detail-item"><span>Published</span><strong>Revision ${r.published}</strong></div>
            <div class="dot-detail-item"><span>Draft</span><strong>Revision ${r.draft}</strong></div>
            <div class="dot-detail-item"><span>State</span><strong>${draft?'Unpublished changes':'Live / synchronized'}</strong></div>
          </div>
        </div>
      </article>
    </div>`;
}

function targetInventory(targets){
  const total = targets.length;
  const portalTargets = targets.filter(t => String(t.target_type).toLowerCase()==='portal').length;
  const websiteTargets = targets.filter(t => String(t.target_type).toLowerCase()==='website').length;
  const pendingTargets = targets.filter(hasDraft).length;
  const types = [...new Set(targets.map(t=>String(t.target_type||'')).filter(Boolean))].sort();

  return `
    <div class="dot-metrics">
      ${metric('Managed Targets', total, 'Centralized distribution targets')}
      ${metric('Portal Targets', portalTargets, 'Customer-facing DOT portals')}
      ${metric('Website Targets', websiteTargets, 'DOT website distribution')}
      ${metric('Draft Changes', pendingTargets, pendingTargets?'Targets waiting to publish':'Everything synchronized')}
    </div>

    <div class="dot-card distribution-targets-card">
      <div class="dot-card-head">
        <div>
          <h2>Managed Distribution Targets</h2>
          <p>Search, filter, review revision state, and open a target to manage its runtime configuration.</p>
        </div>
        <span id="distributionResultCount" class="distribution-result-count">${total} targets</span>
      </div>

      <div class="dot-card-body distribution-toolbar">
        <div class="distribution-filter-grid">
          <div class="dot-field">
            <label for="distributionSearch">Search targets</label>
            <input id="distributionSearch" type="search" placeholder="Name, domain, target key">
          </div>
          <div class="dot-field">
            <label for="distributionType">Target type</label>
            <select id="distributionType">
              <option value="">All target types</option>
              ${types.map(t=>`<option value="${esc(t)}">${esc(typeLabel(t))}</option>`).join('')}
            </select>
          </div>
          <div class="dot-field">
            <label for="distributionState">Publishing state</label>
            <select id="distributionState">
              <option value="">All states</option>
              <option value="published">Published / synchronized</option>
              <option value="draft">Draft changes</option>
            </select>
          </div>
          <div class="distribution-clear-wrap">
            <button class="dot-btn" type="button" id="clearDistributionFilters">Clear Filters</button>
          </div>
        </div>
      </div>

      <div id="distributionTable"></div>
    </div>`;
}

function renderTargetRows(allTargets){
  const q = ($('#distributionSearch')?.value || '').trim().toLowerCase();
  const type = $('#distributionType')?.value || '';
  const state = $('#distributionState')?.value || '';

  const filtered = allTargets.filter(t => {
    const matchesQ = !q || [t.label,t.domain,t.target_key,t.target_type]
      .some(v => String(v||'').toLowerCase().includes(q));
    const matchesType = !type || String(t.target_type||'') === type;
    const draft = hasDraft(t);
    const matchesState = !state || (state==='draft' ? draft : !draft);
    return matchesQ && matchesType && matchesState;
  });

  const count = $('#distributionResultCount');
  if (count) count.textContent = `${filtered.length} of ${allTargets.length} targets`;

  const rows = filtered.map(t => {
    const r = revisions(t);
    const draft = hasDraft(t);
    return `
      <tr>
        <td>
          <strong>${esc(t.label || t.target_key || 'Distribution target')}</strong>
          <small>${esc(t.target_key || '')}</small>
        </td>
        <td>${esc(typeLabel(t.target_type))}</td>
        <td><span class="distribution-domain">${esc(t.domain || 'All DOT properties')}</span></td>
        <td>
          <div class="distribution-revision">
            <strong>${r.published}</strong><span>published</span>
            <span class="distribution-revision-separator">/</span>
            <strong>${r.draft}</strong><span>draft</span>
          </div>
        </td>
        <td>${draft ? pill('Draft changes','warn') : pill('Published','ok')}</td>
        <td>
          <a class="dot-btn small ${draft?'primary':''}" href="dot-distribution.html?target=${encodeURIComponent(t.target_key)}">Manage</a>
        </td>
      </tr>`;
  }).join('');

  $('#distributionTable').innerHTML = `
    <div class="dot-table-wrap">
      <table class="dot-table distribution-table">
        <thead><tr><th>Target</th><th>Type</th><th>Domain</th><th>Revision</th><th>Publishing State</th><th>Management</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6"><div class="dot-empty">No distribution targets match these filters.</div></td></tr>'}</tbody>
      </table>
    </div>`;
}

async function load(){
  const key = qs.get('target');

  if (key){
    const data = await DOTApi.distribution('target',{target_key:key});
    if (!data?.target) throw new Error('The selected distribution target was not found.');
    $('#distBody').innerHTML = targetEditor(data.target);

    $('#formatConfig')?.addEventListener('click',()=>{
      try {
        const config = parseConfig();
        $('#cfg').value = JSON.stringify(config,null,2);
        notice('Configuration JSON formatted. No changes have been saved yet.', false, 'Editor update');
      } catch(e){ notice(e.message,true); }
    });

    $('#saveDraft')?.addEventListener('click',async()=>{
      const btn = $('#saveDraft');
      try{
        btn.disabled = true; btn.textContent = 'Saving…';
        await DOTApi.distribution('save_target_draft',{target_key:key,config:parseConfig()});
        notice('Draft saved. It is not live until you publish this target.');
        await load();
      }catch(e){ notice(e.message,true); }
      finally { if (btn){btn.disabled=false;btn.textContent='Save Draft';} }
    });

    $('#publish')?.addEventListener('click',async()=>{
      const btn = $('#publish');
      try{
        btn.disabled = true; btn.textContent = 'Publishing…';
        const config = parseConfig();
        await DOTApi.distribution('save_target_draft',{target_key:key,config});
        await DOTApi.distribution('publish_target',{target_key:key});
        notice('Published successfully. Connected DOT pages will receive the new revision through the runtime distribution layer.');
        await load();
      }catch(e){ notice(e.message,true); }
      finally { if (btn) btn.disabled=false; }
    });

    return;
  }

  const data = await DOTApi.distribution('inventory');
  const targets = Array.isArray(data?.targets) ? data.targets : [];
  $('#distBody').innerHTML = targetInventory(targets);
  renderTargetRows(targets);

  ['distributionSearch','distributionType','distributionState'].forEach(id=>{
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener(id==='distributionSearch'?'input':'change',()=>renderTargetRows(targets));
  });

  $('#clearDistributionFilters')?.addEventListener('click',()=>{
    $('#distributionSearch').value='';
    $('#distributionType').value='';
    $('#distributionState').value='';
    renderTargetRows(targets);
  });
}

async function publishAll(){
  const btn = $('#publishAll');
  try{
    btn.disabled = true;
    btn.textContent = 'Publishing…';
    const result = await DOTApi.distribution('publish_all');
    notice(`Published ${result?.targets ?? 0} target revisions and ${result?.pages ?? 0} page revisions.`);
    await load();
  }catch(e){ notice(e.message,true); }
  finally{
    btn.disabled = false;
    btn.textContent = 'Publish All Drafts';
  }
}

async function start(){
  const state = await DOTAuth.requireAuth();
  if (!state) return;

  DOTShell.render(state);
  renderShell();

  $('#refreshDistribution')?.addEventListener('click',()=>load().catch(e=>notice(e.message,true)));
  $('#publishAll')?.addEventListener('click',publishAll);

  await load();
}

addEventListener('DOMContentLoaded',()=>{
  start().catch(e=>{
    console.error(e);
    if ($('#distStatus')) notice(e?.message || String(e),true);
  });
},{once:true});
})();
