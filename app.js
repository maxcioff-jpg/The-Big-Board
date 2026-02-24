(function(){
const D = window.MARC_DATA;
const LS = {
  theme:'cf_theme', watchlist:'cf_watchlist', sourceFilters:'cf_source_filters', selectedTicker:'cf_selected_ticker', presets:'cf_scanner_presets', alerts:'cf_alert_rules'
};
const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
const getTheme = ()=> localStorage.getItem(LS.theme) || D.settings.defaultTheme || 'dark';
const setTheme = t => { document.documentElement.setAttribute('data-theme', t); localStorage.setItem(LS.theme, t); redrawAllCanvases(); };
const readJSON = (k,f)=> { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? f; } catch { return f; } };
const writeJSON = (k,v)=> localStorage.setItem(k, JSON.stringify(v));
const getWatchlist = ()=> readJSON(LS.watchlist, ['NVDA','AAPL']);
const setWatchlist = arr => writeJSON(LS.watchlist, [...new Set(arr)]);
const getSourceFilters = ()=> readJSON(LS.sourceFilters, ['public','sec_filing']);
const setSourceFilters = arr => writeJSON(LS.sourceFilters, arr);
const getPresets = ()=> readJSON(LS.presets, D.scannerPresets);
const setPresets = p => writeJSON(LS.presets, p);
const getAlertRules = ()=> readJSON(LS.alerts, []);
const setAlertRules = r => writeJSON(LS.alerts, r);

function scoreClass(n){ return n>=80?'score-high':(n>=65?'score-med':''); }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":'&#39;'}[m])); }

function baseShell(page, inner){
  return `<div class="app">
    <div class="topbar">
      <div class="brand">
        <div class="brand-badge">C</div>
        <div class="brand-meta"><div>${D.app.publicName} <span class="tiny">(${D.app.internalCodename} ${D.app.version})</span></div><div class="sub">${D.app.tagline}</div></div>
      </div>
      <div class="searchbar">
        <input id="globalSearch" class="search-input" placeholder="Search ticker/company or command (press / or Ctrl+K)" autocomplete="off" />
        <div id="suggestions" class="suggestions"></div>
      </div>
      <div class="toolbar">
        <button class="btn small" id="cmdBtn">⌘ Command</button>
        <button class="btn small" id="themeBtn">${getTheme()==='dark'?'🌙':'☀️'}</button>
      </div>
    </div>
    <div class="nav">
      <a class="${page==='dashboard'?'active':''}" href="index.html">Dashboard</a>
      <a class="${page==='scanner'?'active':''}" href="scanner.html">Scanner</a>
      <a class="${page==='ticker'?'active':''}" href="ticker.html">Ticker</a>
      <a class="${page==='settings'?'active':''}" href="settings.html">Settings</a>
    </div>
    ${inner}
    <div class="mobile-bottom-nav">
      <a class="${page==='dashboard'?'active':''}" href="index.html">Home</a>
      <a class="${page==='scanner'?'active':''}" href="scanner.html">Scanner</a>
      <a class="${page==='ticker'?'active':''}" href="ticker.html">Ticker</a>
      <a class="${page==='settings'?'active':''}" href="settings.html">Settings</a>
    </div>
  </div>
  ${commandPaletteMarkup()}`;
}

function commandPaletteMarkup(){
  return `<div class="command-overlay" id="cmdOverlay"><div class="command">
    <div class="command-head"><input id="cmdInput" class="search-input" placeholder="Try: AAPL news, go ticker NVDA, scanner rvol>2" autocomplete="off" /></div>
    <div class="command-results" id="cmdResults"></div>
  </div></div>`;
}

function attachCommon(){
  setTheme(getTheme());
  $('#themeBtn')?.addEventListener('click', ()=> { const t = getTheme()==='dark'?'light':'dark'; setTheme(t); $('#themeBtn').textContent = t==='dark'?'🌙':'☀️'; });
  setupSearch();
  setupCommandPalette();
}

function setupSearch(){
  const input = $('#globalSearch'), box = $('#suggestions'); if(!input||!box) return;
  let current=[]; let active=-1;
  const render = () => {
    const q = input.value.trim().toLowerCase();
    if(!q){ box.style.display='none'; box.innerHTML=''; return; }
    if(q.includes(' ') || q.startsWith('go ') || q.startsWith('scanner ')) {
      current = commandMatches(q).slice(0,5);
      box.innerHTML = current.map((r,i)=>`<div class="suggestion ${i===active?'active':''}" data-i="${i}"><div><strong>${escapeHtml(r.label)}</strong><div class="tiny">${escapeHtml(r.desc)}</div></div><div class="tiny">${escapeHtml(r.type)}</div></div>`).join('');
      box.style.display='block';
      $$('.suggestion', box).forEach(el=>el.addEventListener('mousedown',e=>{e.preventDefault(); current[+el.dataset.i].run();}));
      return;
    }
    current = D.universe.filter(u=>u.ticker.toLowerCase().startsWith(q)||u.name.toLowerCase().includes(q)).sort((a,b)=>a.ticker.localeCompare(b.ticker)).slice(0,5);
    box.innerHTML = current.length ? current.map((u,i)=>`<div class="suggestion ${i===active?'active':''}" data-i="${i}"><div><strong>${u.ticker}</strong> <span class="tiny">${u.name}</span></div><div class="tiny">${u.sector}</div></div>`).join('') : `<div class="suggestion"><div>No ticker matches</div><div class="tiny">Open command palette</div></div>`;
    box.style.display='block';
    $$('.suggestion', box).forEach(el=>el.addEventListener('mousedown',e=>{e.preventDefault(); const u=current[+el.dataset.i]; if(u) openTicker(u.ticker);}));
  };
  input.addEventListener('input', ()=> { active=-1; render(); });
  input.addEventListener('keydown', e=>{
    if(e.key==='/' && document.activeElement!==input) return;
    if(box.style.display!=='block') return;
    if(e.key==='ArrowDown'){e.preventDefault(); active=Math.min(active+1, (current.length||1)-1); render();}
    else if(e.key==='ArrowUp'){e.preventDefault(); active=Math.max(active-1,0); render();}
    else if(e.key==='Enter'){e.preventDefault(); if(current[active]) current[active].run ? current[active].run() : openTicker(current[active].ticker); else if(current[0]) current[0].run ? current[0].run() : openTicker(current[0].ticker); }
    else if(e.key==='Escape'){ box.style.display='none'; }
  });
  document.addEventListener('click', e=>{ if(!e.target.closest('.searchbar')) box.style.display='none'; });
  document.addEventListener('keydown', e=> { if((e.key==='/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName))){ e.preventDefault(); input.focus(); } if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); openCommandPalette(); } });
}

function commandMatches(q){
  const uq = q.toUpperCase();
  const m = [];
  const t = D.universe.find(u=>uq.includes(u.ticker));
  if(t) m.push({label:`Go ticker ${t.ticker}`, desc:t.name, type:'nav', run:()=>openTicker(t.ticker)});
  if(t) m.push({label:`${t.ticker} news`, desc:'Open ticker page + focus news tab', type:'command', run:()=>{ localStorage.setItem(LS.selectedTicker,t.ticker); localStorage.setItem('cf_ticker_tab','news'); location.href='ticker.html'; }});
  m.push({label:'Scanner rvol>2', desc:'Filter scanner for relative volume > 2.0', type:'scanner', run:()=>{ localStorage.setItem('cf_scanner_query','rvol>2'); location.href='scanner.html'; }});
  m.push({label:'Scanner semis momentum', desc:'Load preset', type:'preset', run:()=>{ localStorage.setItem('cf_scanner_query','sector:Technology rvol>1.8 signal>75'); location.href='scanner.html'; }});
  return m;
}
function setupCommandPalette(){
  $('#cmdBtn')?.addEventListener('click', openCommandPalette);
  const ov = $('#cmdOverlay'); if(!ov) return;
  ov.addEventListener('click', e=>{ if(e.target===ov) closeCommandPalette(); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeCommandPalette(); });
}
function openCommandPalette(){
  const ov = $('#cmdOverlay'); if(!ov) return; ov.style.display='flex';
  const input = $('#cmdInput'); const results = $('#cmdResults'); let active=0; let current=[];
  const render = ()=>{
    const q = (input.value||'').trim();
    current = q ? commandMatches(q) : [
      {label:'Go Dashboard', desc:'Market overview + alerts', type:'nav', run:()=> location.href='index.html'},
      {label:'Go Scanner', desc:'Opportunity ranking + presets', type:'nav', run:()=> location.href='scanner.html'},
      {label:'Go Ticker NVDA', desc:'Open default deep dive', type:'nav', run:()=> openTicker('NVDA')},
      {label:'Open Settings', desc:'News permissions + source preferences', type:'nav', run:()=> location.href='settings.html'}
    ];
    results.innerHTML = current.map((c,i)=>`<div class="cmd-item ${i===active?'active':''}" data-i="${i}"><strong>${escapeHtml(c.label)}</strong><div class="tiny">${escapeHtml(c.desc)} · ${escapeHtml(c.type)}</div></div>`).join('');
    $$('.cmd-item', results).forEach(el=>el.addEventListener('mousedown',e=>{ e.preventDefault(); current[+el.dataset.i].run(); closeCommandPalette(); }));
  };
  input.value=''; render(); input.focus();
  input.oninput = ()=>{active=0; render();};
  input.onkeydown = (e)=>{
    if(e.key==='ArrowDown'){ e.preventDefault(); active=Math.min(active+1,current.length-1); render(); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); active=Math.max(active-1,0); render(); }
    else if(e.key==='Enter'){ e.preventDefault(); current[active]?.run(); closeCommandPalette(); }
  };
}
function closeCommandPalette(){ const ov = $('#cmdOverlay'); if(ov) ov.style.display='none'; }

function openTicker(symbol){ localStorage.setItem(LS.selectedTicker, symbol); location.href='ticker.html'; }

function drawLine(canvas, series, {fill=false}={}){
  if(!canvas||!series?.length) return; const dpr = window.devicePixelRatio||1; const w = canvas.clientWidth||300, h = canvas.clientHeight||160; canvas.width=Math.floor(w*dpr); canvas.height=Math.floor(h*dpr); const ctx = canvas.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,w,h);
  const cs = getComputedStyle(document.documentElement); const border=cs.getPropertyValue('--border').trim(); const accent=cs.getPropertyValue('--accent').trim(); const pad=18; const min=Math.min(...series), max=Math.max(...series), range=(max-min)||1;
  ctx.strokeStyle=border; ctx.lineWidth=1; for(let i=0;i<4;i++){ let y=pad+(h-2*pad)*(i/3); ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(w-pad,y); ctx.stroke(); }
  const pts=series.map((v,i)=>[pad+(w-2*pad)*(i/Math.max(series.length-1,1)), h-pad-((v-min)/range)*(h-2*pad)]);
  if(fill){ ctx.beginPath(); pts.forEach((p,i)=> i?ctx.lineTo(...p):ctx.moveTo(...p)); ctx.lineTo(w-pad,h-pad); ctx.lineTo(pad,h-pad); ctx.closePath(); const g=ctx.createLinearGradient(0,pad,0,h-pad); g.addColorStop(0,'rgba(100,210,255,.22)'); g.addColorStop(1,'rgba(100,210,255,.02)'); ctx.fillStyle=g; ctx.fill(); }
  ctx.beginPath(); pts.forEach((p,i)=> i?ctx.lineTo(...p):ctx.moveTo(...p)); ctx.strokeStyle=accent; ctx.lineWidth=2; ctx.stroke();
}
function drawSpark(canvas, series){ if(!canvas) return; const dpr=window.devicePixelRatio||1; const w=canvas.clientWidth||100,h=canvas.clientHeight||30; canvas.width=w*dpr; canvas.height=h*dpr; const ctx=canvas.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,w,h); const cs=getComputedStyle(document.documentElement); const accent=cs.getPropertyValue('--accent').trim(); const min=Math.min(...series),max=Math.max(...series),range=(max-min)||1; ctx.strokeStyle=accent; ctx.lineWidth=1.6; ctx.beginPath(); series.forEach((v,i)=>{ const x=(w-2)*(i/Math.max(series.length-1,1))+1; const y=(h-3)-((v-min)/range)*(h-6); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke(); }
function drawBars(el, bars){ el.innerHTML = `<div class="bar-list">${bars.map(b=>`<div class="bar"><div>${b.name}</div><div class="bar-track"><div class="bar-fill" style="width:${b.val}%"></div></div><div>${b.val}</div></div>`).join('')}</div>`; }
function redrawAllCanvases(){ $$('.js-line').forEach(c=>drawLine(c, JSON.parse(c.dataset.series), {fill:c.dataset.fill==='1'})); $$('.js-spark').forEach(c=>drawSpark(c, JSON.parse(c.dataset.series))); }

function attachWatchButtons(){
  $$('.watch-toggle').forEach(btn=>{
    const symbol = btn.dataset.ticker;
    const update = ()=> { const wl = getWatchlist(); const on = wl.includes(symbol); btn.textContent = on ? '★ Watchlisted' : '☆ Add Watchlist'; btn.classList.toggle('active', on); };
    update();
    btn.onclick = ()=> { let wl = getWatchlist(); wl = wl.includes(symbol) ? wl.filter(t=>t!==symbol) : [...wl, symbol]; setWatchlist(wl); update(); renderWatchlistMini(); };
  });
}

function sourceBadge(n){ if(n==='Primary') return 'primary'; if(n==='Premium') return 'warn'; return 'good'; }
function levelBadge(level){ return level==='high'?'danger':(level==='med'?'warn':'primary'); }

function filterNews(){
  const active = getSourceFilters();
  return D.news.filter(n=> active.includes(n.source_type));
}

function renderNewsList(el, opts={limit:null}){
  const rows = filterNews().slice(0, opts.limit || 999);
  el.innerHTML = `<div class="list">${rows.map(n=>`<div class="item"><div class="meta"><span class="badge ${sourceBadge(n.credibility)}">${n.source}</span><span class="badge">${n.time}</span><span class="badge">${n.ticker}</span><span class="badge">Impact ${n.impact}</span><span class="badge">Novelty ${n.novelty}</span><span class="badge ${n.source_type==='premium_connected'?'warn':'good'}">${n.source_type.replace('_',' ')}</span></div><div><strong>${n.headline}</strong></div><div class="tiny">${n.summary}</div></div>`).join('')}</div>`;
}

function sourceFilterControls(){
  const active = getSourceFilters();
  return `<div class="segmented" id="sourceSegments">${D.settings.sourceFilters.map(s=>`<button class="seg ${active.includes(s)?'active':''}" data-source="${s}">${s}</button>`).join('')}</div>`;
}
function attachSourceFilterControls(root=document){
  $('#sourceSegments',root)?.addEventListener('click', e=>{
    const btn = e.target.closest('.seg'); if(!btn) return;
    const source = btn.dataset.source; let active = getSourceFilters();
    active = active.includes(source) ? active.filter(s=>s!==source) : [...active, source];
    if(!active.length) active = [source];
    setSourceFilters(active); location.reload();
  });
}

function scannerRowsFiltered(query){
  let rows = [...D.scanner.rows]; const q=(query||'').toLowerCase();
  if(!q) return rows;
  const rvol = q.match(/rvol>(\d+(?:\.\d+)?)/); if(rvol) rows = rows.filter(r=>r.rvol > parseFloat(rvol[1]));
  const signal = q.match(/signal>(\d+)/); if(signal) rows = rows.filter(r=>r.signal > parseInt(signal[1],10));
  const sector = q.match(/sector:([a-z]+)/); if(sector) rows = rows.filter(r=>r.sector.toLowerCase().includes(sector[1]));
  if(q.includes('semi')) rows = rows.filter(r=>/semi|technology/i.test(r.catalyst) || /technology/i.test(r.sector));
  return rows;
}

function scannerTableMarkup(rows){
  return `<div class="table-wrap"><table><thead><tr>${D.scanner.columns.map(c=>`<th>${c}</th>`).join('')}<th>Actions</th></tr></thead><tbody>
  ${rows.map(r=>{ const tk = D.tickers[r.ticker]||D.tickers.AAPL; return `<tr>
    <td>${r.rank}</td><td><a href="ticker.html" data-open-ticker="${r.ticker}">${r.ticker}</a></td><td>${r.company}</td>
    <td><span class="score-pill ${scoreClass(r.signal)}">${r.signal}</span></td><td>${r.confidence}</td><td>${r.catalyst}</td><td>${r.rvol}</td><td>${r.regimeFit}</td><td>${r.risk}</td><td>${r.sector}</td>
    <td><div class="row-actions"><button class="icon-btn watch-toggle" data-ticker="${r.ticker}"></button><button class="icon-btn open-ticker" data-ticker="${r.ticker}">Open</button><canvas class="sparkline js-spark" data-series='${JSON.stringify(tk.price)}'></canvas></div></td>
  </tr>`; }).join('')}
  </tbody></table></div>`;
}

function attachTickerLinks(root=document){
  $$('[data-open-ticker]', root).forEach(a=>a.addEventListener('click', e=>{ e.preventDefault(); openTicker(a.dataset.openTicker); }));
  $$('.open-ticker', root).forEach(b=>b.addEventListener('click', ()=>openTicker(b.dataset.ticker)));
}

function renderWatchlistMini(){
  const el = $('#watchlistMini'); if(!el) return;
  const wl = getWatchlist();
  if(!wl.length){ el.innerHTML = `<div class='tiny'>No watchlist names yet. Add from scanner or ticker page.</div>`; return; }
  el.innerHTML = wl.map(t=>`<span class="badge primary" style="cursor:pointer" data-ticker="${t}">${t}</span>`).join(' ');
  $$('[data-ticker]', el).forEach(x=>x.addEventListener('click', ()=>openTicker(x.dataset.ticker)));
}

function renderDashboard(){
  document.body.innerHTML = baseShell('dashboard', `
    <div class="grid cols-12">
      <div class="card span-12"><div class="hero"><div><h1>${D.app.publicName} Dashboard</h1><div class="muted">Public-news-first market intelligence prototype with watchlists, command search, source filters, scanner presets, alerts builder UI, and deploy blueprint.</div></div><div class="filter-row"><a class="btn" href="scanner.html">Open Scanner</a><a class="btn" href="ticker.html">Open Ticker</a><a class="btn" href="settings.html">Settings</a></div></div></div>
      <div class="card span-8"><div class="card-h"><div class="title">Market Overview</div><span class="badge good">${D.marketOverview.regime}</span></div><div class="card-b"><div class="stats">${D.marketOverview.stats.map(s=>`<div class="stat"><div class="tiny">${s.label}</div><div class="v">${s.value}</div><div class="tiny">${s.delta}</div></div>`).join('')}</div><div style="margin-top:12px"><canvas class="chart js-line" data-series='${JSON.stringify(D.marketOverview.marketSeries)}' data-fill="1"></canvas></div><div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">${D.marketOverview.riskFlags.map(f=>`<span class="badge warn">⚠ ${f}</span>`).join('')}</div></div></div>
      <div class="card span-4"><div class="card-h"><div class="title">News Source Policy</div></div><div class="card-b"><div class="badge good">Public reliable sources (default)</div><div class="tiny" style="margin-top:8px">Future premium support through user-entitled source linking (Bloomberg / WSJ concept path).</div><div style="margin-top:10px">${sourceFilterControls()}</div><div id="watchlistMini" style="margin-top:12px"></div></div></div>
      <div class="card span-12"><div class="card-h"><div class="title">Dashboard Workspace</div><div class="tiny">Clickable tabs</div></div><div class="subtabs" id="dashTabs"><button class="subtab active" data-tab="scanner">Scanner Snapshot</button><button class="subtab" data-tab="news">News Feed</button><button class="subtab" data-tab="alerts">Alerts</button><button class="subtab" data-tab="builder">Alerts Builder</button></div><div class="card-b"><div class="panel active" id="p-scanner"></div><div class="panel" id="p-news"></div><div class="panel" id="p-alerts"></div><div class="panel" id="p-builder"></div></div></div>
      <div class="card span-12"><div class="card-h"><div class="title">MARC 1.3 Deployment Blueprint (Where the code should live)</div><span class="badge primary">CatalystFlow-ready</span></div><div class="card-b" id="blueprintBlock"></div></div>
    </div>`);
  attachCommon();
  attachSourceFilterControls();
  renderWatchlistMini();
  const query = localStorage.getItem('cf_scanner_query')||'';
  $('#p-scanner').innerHTML = `<div class='tiny' style='margin-bottom:8px'>Scanner snapshot query: ${escapeHtml(query||'none')}</div>${scannerTableMarkup(scannerRowsFiltered(query).slice(0,6))}`;
  renderNewsList($('#p-news'), {limit:5});
  $('#p-alerts').innerHTML = `<div class='list'>${D.alerts.map(a=>`<div class='item'><div class='meta'><span class='badge ${levelBadge(a.level)}'>${a.level.toUpperCase()}</span><span class='badge'>${a.time}</span><span class='badge'>${a.ticker}</span></div><div>${a.text}</div></div>`).join('')}</div>`;
  $('#p-builder').innerHTML = alertsBuilderMarkup();
  $('#dashTabs').addEventListener('click', e=>{ const b=e.target.closest('.subtab'); if(!b) return; $$('.subtab').forEach(x=>x.classList.toggle('active', x===b)); $$('.panel').forEach(p=>p.classList.remove('active')); $('#p-'+b.dataset.tab).classList.add('active'); if(b.dataset.tab==='builder') attachAlertsBuilder(); });
  attachTickerLinks(); attachWatchButtons(); redrawAllCanvases(); attachAlertsBuilder();
  $('#blueprintBlock').innerHTML = deploymentBlueprintMarkup();
}

function alertsBuilderMarkup(){
  const rules = getAlertRules();
  return `<div class='two-col'>
    <div>
      <div class='three-col'>
        <div><label class='tiny'>Ticker</label><input class='input' id='alertTicker' placeholder='NVDA or AAPL' /></div>
        <div><label class='tiny'>Trigger Type</label><select id='alertType'><option>Signal score</option><option>RVOL</option><option>News impact</option><option>Regime shift</option></select></div>
        <div><label class='tiny'>Threshold</label><input class='input' id='alertThreshold' placeholder='e.g., >80 or >2.0' /></div>
      </div>
      <div style='margin-top:10px'><label class='tiny'>Delivery</label><div class='segmented' id='alertDeliverySeg'><button class='seg active' data-del='App'>App</button><button class='seg' data-del='Email'>Email</button><button class='seg' data-del='Webhook'>Webhook</button></div></div>
      <div style='margin-top:10px'><label class='tiny'>Notes</label><textarea id='alertNotes' placeholder='Optional rule notes, risk guardrails, watchlist context'></textarea></div>
      <div style='margin-top:10px;display:flex;gap:8px;flex-wrap:wrap'><button class='btn' id='saveAlertRule'>Save Alert Rule</button><button class='btn' id='clearAlertRules'>Clear All Rules</button></div>
      <div class='tiny' style='margin-top:8px'>UI-only builder for MARC 1.3 prototype (local storage). Ready to wire to backend later.</div>
    </div>
    <div>
      <div class='title' style='margin-bottom:8px'>Saved Alert Rules</div>
      <div id='alertRulesList'>${rules.length?rules.map((r,i)=>`<div class='item'><div class='meta'><span class='badge'>${r.ticker||'ALL'}</span><span class='badge'>${r.type}</span><span class='badge'>${r.threshold}</span><span class='badge'>${r.delivery}</span></div><div class='tiny'>${escapeHtml(r.notes||'No notes')}</div><div style='margin-top:6px'><button class='icon-btn del-alert' data-i='${i}'>Delete</button></div></div>`).join(''):`<div class='tiny'>No rules saved yet.</div>`}</div>
    </div>
  </div>`;
}
function attachAlertsBuilder(){
  const save = $('#saveAlertRule'); if(!save) return;
  let delivery='App';
  $('#alertDeliverySeg')?.addEventListener('click', e=>{ const b=e.target.closest('.seg'); if(!b) return; delivery=b.dataset.del; $$('.seg', $('#alertDeliverySeg')).forEach(x=>x.classList.toggle('active', x===b)); });
  save.onclick = ()=> {
    const rule = {ticker:($('#alertTicker').value||'').toUpperCase().trim(), type:$('#alertType').value, threshold:$('#alertThreshold').value.trim(), delivery, notes:$('#alertNotes').value.trim()};
    const rules = getAlertRules(); rules.unshift(rule); setAlertRules(rules); $('#p-builder').innerHTML = alertsBuilderMarkup(); attachAlertsBuilder();
  };
  $('#clearAlertRules')?.addEventListener('click', ()=> { setAlertRules([]); $('#p-builder').innerHTML = alertsBuilderMarkup(); attachAlertsBuilder(); });
  $$('.del-alert').forEach(b=>b.onclick=()=>{ const rules=getAlertRules(); rules.splice(+b.dataset.i,1); setAlertRules(rules); $('#p-builder').innerHTML = alertsBuilderMarkup(); attachAlertsBuilder(); });
}

function renderScanner(){
  const savedQuery = localStorage.getItem('cf_scanner_query') || '';
  document.body.innerHTML = baseShell('scanner', `
    <div class='grid cols-12'>
      <div class='card span-12'><div class='hero'><div><h1>Scanner</h1><div class='muted'>Ranked opportunities with source-aware context, presets, watchlist actions, and command-query support.</div></div></div></div>
      <div class='card span-3'><div class='card-h'><div class='title'>Presets</div></div><div class='card-b'><div class='list' id='presetList'></div><div style='margin-top:10px'><input id='newPresetName' class='input' placeholder='Preset name' /><textarea id='newPresetQuery' placeholder='Query expression'></textarea><button id='savePresetBtn' class='btn' style='margin-top:8px'>Save Current as Preset</button></div></div></div>
      <div class='card span-9'><div class='card-h'><div class='title'>Scanner Results</div><div class='filter-row'>${sourceFilterControls()}</div></div><div class='card-b'><div class='three-col'><div><label class='tiny'>Query</label><input id='scannerQuery' class='input' value='${escapeHtml(savedQuery)}' placeholder='e.g., rvol>2 signal>75 sector:tech' /></div><div><label class='tiny'>Sort</label><select id='scannerSort'><option value='signal'>Signal</option><option value='confidence'>Confidence</option><option value='rvol'>RVOL</option></select></div><div><label class='tiny'>Actions</label><div class='filter-row'><button class='btn' id='applyScanner'>Apply</button><button class='btn' id='clearScanner'>Clear</button></div></div></div><div id='scannerTable' style='margin-top:12px'></div></div></div>
    </div>`);
  attachCommon(); attachSourceFilterControls();
  const renderTable = ()=> {
    let rows = scannerRowsFiltered($('#scannerQuery').value);
    const sort = $('#scannerSort').value; rows.sort((a,b)=> (b[sort]-a[sort]));
    $('#scannerTable').innerHTML = scannerTableMarkup(rows);
    attachTickerLinks($('#scannerTable')); attachWatchButtons(); redrawAllCanvases();
    localStorage.setItem('cf_scanner_query', $('#scannerQuery').value);
  };
  $('#applyScanner').onclick = renderTable; $('#clearScanner').onclick = ()=> { $('#scannerQuery').value=''; renderTable(); };
  $('#scannerQuery').addEventListener('keydown', e=> { if(e.key==='Enter') renderTable(); });
  $('#presetList').innerHTML = getPresets().map((p,i)=>`<div class='item'><div><strong>${escapeHtml(p.name)}</strong></div><div class='tiny'>${escapeHtml(p.query)}</div><div style='margin-top:6px' class='row-actions'><button class='icon-btn use-preset' data-i='${i}'>Use</button><button class='icon-btn del-preset' data-i='${i}'>Delete</button></div></div>`).join('');
  $$('.use-preset').forEach(b=>b.onclick=()=>{ const p=getPresets()[+b.dataset.i]; $('#scannerQuery').value=p.query; renderTable(); });
  $$('.del-preset').forEach(b=>b.onclick=()=>{ const p=getPresets(); p.splice(+b.dataset.i,1); setPresets(p); renderScanner(); });
  $('#savePresetBtn').onclick = ()=> { const name=$('#newPresetName').value.trim() || `Custom ${new Date().toLocaleTimeString()}`; const query=$('#newPresetQuery').value.trim() || $('#scannerQuery').value.trim(); if(!query) return; const p=getPresets(); p.unshift({name,query}); setPresets(p); renderScanner(); };
  renderTable();
}

function renderTicker(){
  const symbol = localStorage.getItem(LS.selectedTicker) || 'NVDA';
  const t = D.tickers[symbol] || D.tickers.NVDA;
  const activeTab = localStorage.getItem('cf_ticker_tab') || 'overview';
  document.body.innerHTML = baseShell('ticker', `
    <div class='grid cols-12'>
      <div class='card span-12'><div class='hero'><div><h1>${t.ticker} · ${t.company}</h1><div class='muted'>${t.sector}</div></div><div class='filter-row'><span class='badge good'>Signal ${t.score}</span><span class='badge primary'>Confidence ${t.confidence}</span><span class='badge'>Regime Fit ${t.regimeFit}</span><button class='btn watch-toggle' data-ticker='${t.ticker}'></button></div></div></div>
      <div class='card span-8'><div class='card-h'><div class='title'>Price / Volume Widgets</div></div><div class='card-b'><canvas class='chart js-line' data-series='${JSON.stringify(t.price)}' data-fill='1'></canvas><div style='margin-top:12px'><canvas class='chart js-line mini' data-series='${JSON.stringify(t.volume)}'></canvas></div></div></div>
      <div class='card span-4'><div class='card-h'><div class='title'>Factor Breakdown</div></div><div class='card-b' id='factorBars'></div></div>
      <div class='card span-12'><div class='card-h'><div class='title'>Ticker Workspace</div></div><div class='subtabs' id='tickerTabs'><button class='subtab ${activeTab==='overview'?'active':''}' data-tab='overview'>Overview</button><button class='subtab ${activeTab==='news'?'active':''}' data-tab='news'>News</button><button class='subtab ${activeTab==='alerts'?'active':''}' data-tab='alerts'>Alerts</button></div><div class='card-b'><div class='panel ${activeTab==='overview'?'active':''}' id='ticker-overview'></div><div class='panel ${activeTab==='news'?'active':''}' id='ticker-news'></div><div class='panel ${activeTab==='alerts'?'active':''}' id='ticker-alerts'></div></div></div>
    </div>`);
  attachCommon(); drawBars($('#factorBars'), t.factors); attachWatchButtons(); redrawAllCanvases();
  $('#ticker-overview').innerHTML = `<div class='two-col'><div><div class='title' style='margin-bottom:8px'>Catalyst / Flow Thesis</div><ul>${t.thesis.map(x=>`<li>${x}</li>`).join('')}</ul></div><div class='kv'><div class='cell'><div class='tiny'>Signal Score</div><div style='font-weight:800'>${t.score}</div></div><div class='cell'><div class='tiny'>Confidence</div><div style='font-weight:800'>${t.confidence}</div></div><div class='cell'><div class='tiny'>Regime Fit</div><div style='font-weight:800'>${t.regimeFit}</div></div><div class='cell'><div class='tiny'>Watchlist</div><div id='watchStateCell' class='tiny'></div></div></div></div>`;
  const tickerNews = filterNews().filter(n=> n.ticker===t.ticker || n.ticker==='SPY').slice(0,5);
  renderNewsList($('#ticker-news'));
  if(tickerNews.length) $('#ticker-news').innerHTML = `<div class='list'>${tickerNews.map(n=>`<div class='item'><div class='meta'><span class='badge ${sourceBadge(n.credibility)}'>${n.source}</span><span class='badge'>${n.time}</span><span class='badge'>${n.ticker}</span><span class='badge'>Impact ${n.impact}</span></div><div><strong>${n.headline}</strong></div><div class='tiny'>${n.summary}</div></div>`).join('')}</div>`;
  $('#ticker-alerts').innerHTML = `<div class='list'>${D.alerts.filter(a=>a.ticker===t.ticker || a.ticker==='SPY').map(a=>`<div class='item'><div class='meta'><span class='badge ${levelBadge(a.level)}'>${a.level}</span><span class='badge'>${a.time}</span></div><div>${a.text}</div></div>`).join('') || '<div class="tiny">No active alerts for this ticker in sample feed.</div>'}</div>`;
  const syncWatchCell = ()=> { $('#watchStateCell').textContent = getWatchlist().includes(t.ticker) ? 'On watchlist' : 'Not on watchlist'; };
  syncWatchCell();
  $('#tickerTabs').addEventListener('click', e=>{ const b=e.target.closest('.subtab'); if(!b) return; $$('#tickerTabs .subtab').forEach(x=>x.classList.toggle('active',x===b)); ['overview','news','alerts'].forEach(id=> $('#ticker-'+id).classList.toggle('active', id===b.dataset.tab)); localStorage.setItem('cf_ticker_tab', b.dataset.tab); });
}

function renderSettings(){
  document.body.innerHTML = baseShell('settings', `
    <div class='grid cols-12'>
      <div class='card span-12'><div class='hero'><div><h1>Settings & Source Permissions</h1><div class='muted'>Prototype settings page for public vs premium-connected news controls, saved UI preferences, and future entitlement placeholders.</div></div></div></div>
      <div class='card span-6'><div class='card-h'><div class='title'>News Source Access</div></div><div class='card-b'>${sourceFilterControls()}<div style='margin-top:10px' class='list'><div class='item'><div class='meta'><span class='badge good'>Public</span></div><div>Reliable business news and primary SEC filings available by default.</div></div><div class='item'><div class='meta'><span class='badge warn'>Premium-connected</span></div><div>Future Bloomberg / Wall Street Journal partner integration if user has valid subscription entitlement.</div><div class='tiny' style='margin-top:6px'>Placeholder only in MARC 1.3 UI prototype.</div></div><div class='item'><div class='meta'><span class='badge primary'>SEC-only mode</span></div><div>Use primary filings/news source filter for high-trust event monitoring workflows.</div></div></div></div></div>
      <div class='card span-6'><div class='card-h'><div class='title'>App Preferences</div></div><div class='card-b'><div class='three-col'><div><label class='tiny'>Theme</label><select id='prefTheme'><option value='dark'>Dark</option><option value='light'>Light</option></select></div><div><label class='tiny'>Default Ticker</label><input id='prefTicker' class='input' placeholder='NVDA' value='${escapeHtml(localStorage.getItem(LS.selectedTicker)||'NVDA')}' /></div><div><label class='tiny'>Alert Digest</label><select id='prefDigest'><option>Off</option><option>Daily</option><option>Market Close</option></select></div></div><div style='margin-top:10px'><label class='tiny'>Premium Source Linking Placeholder</label><textarea readonly>Bloomberg: Not linked (prototype)
Wall Street Journal: Not linked (prototype)
Entitlement check: UI placeholder only</textarea></div><div style='margin-top:10px' class='filter-row'><button class='btn' id='savePrefs'>Save Preferences</button><button class='btn' id='resetDemo'>Reset Demo State</button></div></div></div>
      <div class='card span-12'><div class='card-h'><div class='title'>Infrastructure Placement (Summary)</div></div><div class='card-b'>${deploymentBlueprintSummary()}</div></div>
    </div>`);
  attachCommon(); attachSourceFilterControls();
  $('#prefTheme').value = getTheme();
  $('#savePrefs').onclick = ()=> { setTheme($('#prefTheme').value); localStorage.setItem(LS.selectedTicker, ($('#prefTicker').value||'NVDA').toUpperCase()); alert('Prototype preferences saved locally.'); };
  $('#resetDemo').onclick = ()=> { [LS.watchlist,LS.sourceFilters,LS.presets,LS.alerts,'cf_scanner_query','cf_ticker_tab'].forEach(k=>localStorage.removeItem(k)); location.reload(); };
}

function deploymentBlueprintSummary(){
  return `<ul>
    <li><strong>Frontend:</strong> Next.js on Vercel for fast UI shipping and iteration.</li>
    <li><strong>API + workers:</strong> Python FastAPI + AWS ECS/Fargate for ingestion/scanner/alerts jobs.</li>
    <li><strong>Data:</strong> Managed Postgres + Redis + S3/Parquet for historical feature storage.</li>
    <li><strong>Repo:</strong> GitHub monorepo with apps/web, apps/api, apps/worker, shared packages.</li>
  </ul>`;
}
function deploymentBlueprintMarkup(){
  return `
    <div class='footer-section'>
      <h3>Recommended stack (best balance of speed + scale)</h3>
      <ul>
        <li><strong>Frontend (UI / website):</strong> Next.js on <strong>Vercel</strong></li>
        <li><strong>Backend API (market/news endpoints):</strong> <strong>FastAPI (Python)</strong> on <strong>AWS ECS/Fargate</strong></li>
        <li><strong>Background workers (scanner/news/alerts jobs):</strong> <strong>AWS Fargate tasks</strong></li>
        <li><strong>Database:</strong> Managed <strong>Postgres</strong></li>
        <li><strong>Cache / fast alert queue:</strong> <strong>Redis</strong></li>
        <li><strong>Historical data + feature storage:</strong> <strong>S3 + Parquet</strong></li>
        <li><strong>Code repo:</strong> <strong>GitHub monorepo</strong></li>
        <li><strong>Monitoring:</strong> CloudWatch + Sentry</li>
        <li><strong>CI/CD:</strong> GitHub Actions</li>
      </ul>
      <h3>Why this is the best place for the code</h3>
      <ul>
        <li>Frontend needs fast deployment and UI iteration (Vercel).</li>
        <li>Backend/workers need long-running compute for news ingestion, scanners, and alerts (Fargate).</li>
        <li>Data storage needs scalable historical archives and fast querying (S3/Parquet + Postgres + Redis).</li>
      </ul>
      <h3>Code organization (monorepo)</h3>
      <div class='codeblock'>catalystflow/
  apps/
    web/                  # Next.js frontend (Vercel)
    api/                  # FastAPI backend (AWS)
    worker/               # ingestion/scanner/alerts jobs
  packages/
    ui-components/        # shared UI components
    shared-types/         # schemas/types
    market-core/          # indicators/scoring logic
    news-core/            # source normalization/tagging
  data/
    sample/               # JSON demo data
  infra/
    docker/
    terraform/            # later (infra as code)
  docs/
    architecture/
    product/</div>
      <h3>Source entitlements (future Bloomberg / WSJ path)</h3>
      <ul>
        <li><code>source_type = public | premium_connected | sec_filing</code></li>
        <li><code>access_scope = global | user_entitled_only</code></li>
        <li><code>display_mode = headline_only | summary_allowed | full_text_if_entitled</code></li>
      </ul>
      <h3>Build order (practical)</h3>
      <ol>
        <li>Deploy UI prototype on Vercel</li>
        <li>Build FastAPI endpoints with sample JSON</li>
        <li>Add worker jobs for scanner/news processing</li>
        <li>Add Postgres + Redis</li>
        <li>Replace sample JSON with real public data/news providers</li>
        <li>Add entitlement logic before premium integrations</li>
      </ol>
    </div>`;
}

window.CATALYSTFLOW_APP = { renderDashboard, renderScanner, renderTicker, renderSettings };
})();
