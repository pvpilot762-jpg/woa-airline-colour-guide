/* WOA Airline Colour Guide. No aircraft assets, paint/render APIs or template state. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const catalogue=window.WOA_CATALOGUE;
  if(!catalogue?.entries?.length||!window.WOA_CATALOGUE_SEARCH){$('schemeAirline').textContent='Catalogue unavailable';$('notice').textContent='Keep all guide files together and reload the page.';return;}
  const entries=catalogue.entries, byId=new Map(entries.map(a=>[a.id,a]));
  const groupRows=new Map((window.WOA_OPERATOR_GROUPS?.records||[]).map(r=>[r.schemeId,r]));
  const groupsFor=a=>[...new Set([a.category,...(groupRows.get(a.id)?.groups||[]),...(a.classifications||[]).filter(g=>!['Active','Classic','Special'].includes(g)),...(a.operatingCategory==='Private/VIP'?['Private','VIP']:[])])];
  const indexed=entries.map(a=>({...a,aliases:[...(a.aliases||[]),...groupsFor(a),...(a.era==='Classic'?['historical','retro']:[])]}));
  const search=window.WOA_CATALOGUE_SEARCH.create(indexed), mobileBrowse=matchMedia('(max-width:800px)');
  let selectedId=byId.has(new URLSearchParams(location.search).get('scheme'))?new URLSearchParams(location.search).get('scheme'):(byId.has('british-airways')?'british-airways':entries[0].id),page=0;
  const quality=a=>a.quality==='official'?'Published digital brand values':a.quality==='documented'?'Documented colour reference':'Approximate colours';
  const selected=()=>byId.get(selectedId);
  const filtered=()=>search.filter({query:$('airlineSearch').value,country:$('countryFilter').value,era:$('eraFilter').value}).filter(a=>!$('operatorFilter').value||groupsFor(a).includes($('operatorFilter').value));
  const schemeURL=id=>{const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('scheme',id);return u;};
  const sourceHTML=s=>`<p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a> — ${esc(s.evidence)}</p>`;
  function drawScheme(){
    const a=selected();$('schemeAirline').textContent=a.airlineName;$('schemeVersion').textContent=a.liveryName;
    $('schemeFacts').innerHTML=[a.country,a.era,...groupsFor(a),a.icao?'ICAO '+a.icao:'ICAO unverified'].map(s=>`<span>${esc(s)}</span>`).join('');
    const sourced=a.provenance.some(p=>/^https:\/\//.test(p.url||''));
    $('evidenceStatus').textContent=a.quality==='official'?'Published digital brand HEX values · not verified aircraft paint specifications':!sourced?'Approximate HEX colours · original colour provenance needs stronger evidence':a.quality==='documented'?'Documented colour reference · aircraft paint equivalence unverified':'Approximate aircraft-livery colours · exact paint HEX values unverified';
    a.colors.forEach((hex,i)=>{$('hex'+(i+1)).textContent=hex;$('swatch'+(i+1)).style.backgroundColor=hex;});
    $('accentLabel').textContent=a.colourEvidence?.slots?.[2]?.role==='optional-woa-adaptation'?'Accent · optional WOA adaptation':'Accent';
    $('paletteSources').innerHTML=`<p>${esc(a.colourBasis)}. WOA slot placement is an adaptation.</p><p>${esc(a.note)}</p>`+a.provenance.map(p=>p.url&&/^https:\/\//.test(p.url)?sourceHTML(p):`<p>${esc(p.title)} — ${esc(p.evidence)}</p>`).join('')+(groupRows.has(a.id)?'<p><strong>Operator classification source; does not verify colours:</strong></p>'+sourceHTML(groupRows.get(a.id).source):'')+`<p>ICAO: ${esc(a.icao||'unverified')}. External source links need internet; these saved notes work offline.</p>`;
    $('schemeLink').href=schemeURL(a.id).href;
  }
  function setNotice(message){clearTimeout(copyText.timer);delete $('notice').dataset.copy;$('notice').textContent=message;}
  function choose(id,{historyEntry=true,announce=true}={}){
    if(!byId.has(id))return;
    const changed=selectedId!==id;selectedId=id;drawScheme();drawResults();
    if(historyEntry&&changed){try{history.pushState({scheme:id},'',schemeURL(id));}catch{/* Some local-file browsers restrict history; the scheme link remains usable. */}}
    if(announce)setNotice(selected().airlineName+' · '+selected().liveryName+' selected. Copy the HEX colours and choose your pattern in WOA.');
  }
  function drawResults(){
    const pageSize=mobileBrowse.matches?6:24,found=filtered();page=Math.max(0,Math.min(page,Math.ceil(found.length/pageSize)-1));const offset=page*pageSize,visible=found.slice(offset,offset+pageSize);
    $('resultCount').textContent=found.length+' matches';$('pageStatus').textContent=found.length?`${offset+1}–${offset+visible.length} of ${found.length}`:'No matches';
    $('previousAirlines').disabled=page===0;$('nextAirlines').disabled=offset+pageSize>=found.length;
    $('coverageNote').textContent=$('operatorFilter').value&&found.length===0?'No sourced entries in this group yet. Clear the group or try another search.':'Search covers airline, operator, country, ICAO and livery version. Operator tags are still being reviewed.';
    $('airlineResults').innerHTML=found.length?visible.map(a=>`<button class="airline-item" data-airline="${esc(a.id)}" aria-pressed="${a.id===selectedId}"><strong>${esc(a.airlineName)}</strong><span class="scheme-name">${esc(a.liveryName)}</span><small>${esc(a.country)} · ${esc(a.era)} · ${esc(quality(a))}</small><div class="mini-swatches" aria-hidden="true">${a.colors.map(hex=>`<span style="background:${hex}"></span>`).join('')}</div></button>`).join(''):'<p class="empty">No matching schemes. Try another name, country, livery or filter. No placeholder entries are added to fill gaps.</p>';
    $('airlineResults').querySelectorAll('[data-airline]').forEach(b=>b.addEventListener('click',()=>{choose(b.dataset.airline);if(mobileBrowse.matches)$('schemeAirline').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});}));
  }
  async function copyText(text,label){
    const feedback=(message,manual=false)=>{
      clearTimeout(copyText.timer);$('notice').textContent=message;$('notice').dataset.copy=manual?'manual':'success';
      if(!manual)copyText.timer=setTimeout(()=>delete $('notice').dataset.copy,5000);
    };
    try{await navigator.clipboard.writeText(text);feedback(label);return;}catch{/* Offline Windows fallback below. */}
    const t=document.createElement('textarea');t.value=text;t.style.cssText='position:fixed;left:0;top:0;opacity:0';document.body.append(t);t.select();let copied=false;
    try{copied=document.execCommand('copy');}catch{/* Offer selectable codes. */}finally{t.remove();}
    feedback(copied?label:'Copy manually: '+text,!copied);
  }
  [...new Set(entries.map(a=>a.country))].sort((a,b)=>a.localeCompare(b)).forEach(country=>{const o=document.createElement('option');o.value=country;o.textContent=country;$('countryFilter').append(o);});
  [...new Set([...(window.WOA_OPERATOR_GROUPS?.groups||['Passenger','Cargo']),...entries.flatMap(groupsFor)])].forEach(group=>{const o=document.createElement('option');o.value=group;o.textContent=group+' ('+entries.filter(a=>groupsFor(a).includes(group)).length+')';$('operatorFilter').append(o);});
  for(const id of ['airlineSearch','countryFilter','eraFilter','operatorFilter'])$(id).addEventListener(id==='airlineSearch'?'input':'change',()=>{page=0;drawResults();});
  $('clearFilters').addEventListener('click',()=>{for(const id of ['airlineSearch','countryFilter','eraFilter','operatorFilter'])$(id).value='';page=0;drawResults();setNotice('Filters cleared. Your selected colour scheme is unchanged.');});
  function showResults(){
    $('libraryHeading').focus({preventScroll:true});
    if(mobileBrowse.matches)$('libraryHeading').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});
  }
  $('searchForm').addEventListener('submit',event=>{event.preventDefault();page=0;drawResults();showResults();});
  function turnPage(delta){page+=delta;drawResults();$('airlineResults').scrollTop=0;if(mobileBrowse.matches)showResults();}
  $('previousAirlines').addEventListener('click',()=>turnPage(-1));$('nextAirlines').addEventListener('click',()=>turnPage(1));
  mobileBrowse.addEventListener('change',()=>{page=0;drawResults();});
  $('surprise').addEventListener('click',()=>{const alternatives=filtered().filter(a=>a.id!==selectedId);if(!alternatives.length){setNotice('No other scheme matches. Clear a filter to try another airline.');return;}choose(alternatives[Math.floor(Math.random()*alternatives.length)].id);});
  for(let i=1;i<=3;i++)$('copyHex'+i).addEventListener('click',()=>copyText(selected().colors[i-1],['Primary','Secondary','Accent'][i-1]+' HEX copied.'));
  $('copyCodes').addEventListener('click',()=>copyText(selected().colors.map((hex,i)=>['Primary','Secondary','Accent'][i]+': '+hex).join('\n'),'All three HEX codes copied.'));
  addEventListener('popstate',()=>choose(byId.has(new URLSearchParams(location.search).get('scheme'))?new URLSearchParams(location.search).get('scheme'):(byId.has('british-airways')?'british-airways':entries[0].id),{historyEntry:false}));
  const eras=entries.reduce((r,a)=>(r[a.era]=(r[a.era]||0)+1,r),{});
  $('catalogueCount').textContent=entries.length.toLocaleString()+' real colour schemes';
  $('catalogueSummary').textContent=entries.length+' schemes · '+eras.Active+' Active · '+eras.Classic+' Classic · '+eras.Special+' Special · '+new Set(entries.map(a=>a.country)).size+' countries/territories. '+entries.filter(a=>a.quality==='approximate').length+' approximate palettes; '+entries.filter(a=>a.quality==='official').length+' published digital-brand references. Expansion is evidence-led; 6,000+ genuine schemes is the research goal, not a claim of current coverage.';
  drawScheme();drawResults();
})();
