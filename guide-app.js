/* WOA Airline Colour Guide. No aircraft assets, paint/render APIs or template state. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const catalogue=window.WOA_CATALOGUE;
  if(!catalogue?.entries?.length||!window.WOA_CATALOGUE_SEARCH){$('schemeAirline').textContent='Catalogue unavailable';$('notice').textContent='Keep all guide files together and reload the page.';return;}
  const entries=catalogue.entries, byId=new Map(entries.map(a=>[a.id,a]));
  const groupRows=new Map((window.WOA_OPERATOR_GROUPS?.records||[]).map(r=>[r.schemeId,r]));
  const groupsFor=a=>[...new Set([a.category,...(groupRows.get(a.id)?.groups||[]),...(a.classifications||[]).filter(g=>!['Active','Classic','Special'].includes(g)),...(a.operatingCategory==='Private/VIP'?['Private','VIP']:[])])];
  const indexed=entries.map(a=>({...a,searchTerms:[...groupsFor(a),...(a.era==='Classic'?['historical','retro']:[])]}));
  const search=window.WOA_CATALOGUE_SEARCH.create(indexed), mobileBrowse=matchMedia('(max-width:800px)');
  const requestedId=new URLSearchParams(location.search).get('scheme'),defaultId=byId.has('british-airways')?'british-airways':entries[0].id;
  let selectedId=byId.has(requestedId)?requestedId:defaultId,page=0,mobileLimit=12,renderedMobile=0,lastBrowse=null,linkedBrowseId=null;
  const quality=a=>a.quality==='official'?'Published digital brand values':a.quality==='documented'?'Documented colour reference':'Approximate colours';
  const selected=()=>byId.get(selectedId);
  let filterKey=null,filterRows=[];
  const filtered=()=>{
    const query=$('airlineSearch').value,country=$('countryFilter').value,era=$('eraFilter').value,operator=$('operatorFilter').value,key=JSON.stringify([query,country,era,operator]);
    if(key!==filterKey){filterRows=search.filter({query,country,era}).filter(a=>!operator||groupsFor(a).includes(operator));filterKey=key;}
    return filterRows;
  };
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
    const changed=selectedId!==id;selectedId=id;drawScheme();updateSelectedCard();
    if(historyEntry&&changed){try{history.pushState({scheme:id},'',schemeURL(id));}catch{/* Some local-file browsers restrict history; the scheme link remains usable. */}}
    if(announce)setNotice(selected().airlineName+' · '+selected().liveryName+' selected. Copy the HEX colours and choose your pattern in WOA.');
  }
  function updateSelectedCard(){
    const list=$('airlineResults');list.querySelectorAll('[aria-pressed="true"]').forEach(b=>b.setAttribute('aria-pressed','false'));
    list.querySelector('[data-airline="'+selectedId+'"]')?.setAttribute('aria-pressed','true');
  }
  function resetBrowse(){page=0;mobileLimit=12;renderedMobile=0;lastBrowse=null;linkedBrowseId=null;}
  function browseRows(){
    const rows=filtered(),index=mobileBrowse.matches&&linkedBrowseId?rows.findIndex(a=>a.id===linkedBrowseId):-1;
    // A distant shared scheme is included first, without rendering hundreds of cards.
    // Every other card retains catalogue order and is appended exactly once.
    return index>=12?[rows[index],...rows.slice(0,index),...rows.slice(index+1)]:rows;
  }
  function locateSelected(){
    resetBrowse();
    if(!filtered().some(a=>a.id===selectedId))for(const id of ['airlineSearch','countryFilter','eraFilter','operatorFilter'])$(id).value='';
    const index=filtered().findIndex(a=>a.id===selectedId);
    if(mobileBrowse.matches)linkedBrowseId=selectedId;else page=Math.max(0,Math.floor(index/24));
    drawResults();
    const card=$('airlineResults').querySelector('[data-airline="'+selectedId+'"]');
    if(card&&!mobileBrowse.matches){const list=$('airlineResults');list.scrollTop+=card.getBoundingClientRect().top-list.getBoundingClientRect().top;}
  }
  function revealScheme({immediate=false}={}){
    $('schemeAirline').focus({preventScroll:true});
    const root=document.documentElement,prior=root.style.scrollBehavior;
    if(immediate)root.style.scrollBehavior='auto';
    $('schemeAirline').scrollIntoView({behavior:immediate||matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});
    if(immediate)root.style.scrollBehavior=prior;
  }
  function drawResults({append=false}={}){
    const mobile=mobileBrowse.matches,found=browseRows();page=Math.max(0,Math.min(page,Math.ceil(found.length/24)-1));
    const offset=mobile?0:page*24,end=Math.min(mobile?mobileLimit:offset+24,found.length),start=mobile&&append?renderedMobile:offset,visible=found.slice(start,end);
    $('resultCount').textContent=found.length+' matches';$('pageStatus').textContent=found.length?`${offset+1}\u2013${end} of ${found.length}`:'No matches';
    $('previousAirlines').disabled=page===0;$('nextAirlines').disabled=end>=found.length;
    $('desktopPages').hidden=mobile;$('mobileMore').hidden=!mobile;$('returnToResults').hidden=!mobile;
    $('mobileResultStatus').textContent=found.length?'Showing '+end+' of '+found.length+' schemes':'No matching schemes';$('loadMore').hidden=end>=found.length;
    $('coverageNote').textContent=$('operatorFilter').value&&found.length===0?'No sourced entries in this group yet. Clear the group or try another search.':'Search covers airline, operator, country, ICAO and livery version. Operator tags are still being reviewed.';
    const html=visible.map(a=>`<button class="airline-item" data-airline="${esc(a.id)}" aria-pressed="${a.id===selectedId}"><strong>${esc(a.airlineName)}</strong><span class="scheme-name">${esc(a.liveryName)}</span><small>${esc(a.country)} \u00b7 ${esc(a.era)} \u00b7 ${esc(quality(a))}</small><div class="mini-swatches" aria-hidden="true">${a.colors.map(hex=>`<span style="background:${hex}"></span>`).join('')}</div></button>`).join('');
    if(mobile&&append)$('airlineResults').insertAdjacentHTML('beforeend',html);
    else $('airlineResults').innerHTML=found.length?html:'<p class="empty"><strong>No matching airlines found.</strong><br>Try another name, country, livery or filter.</p>';
    renderedMobile=mobile?end:0;
  }
  $('airlineResults').addEventListener('click',event=>{
    const card=event.target.closest('[data-airline]');if(!card)return;
    if(mobileBrowse.matches)lastBrowse={id:card.dataset.airline,scrollY};
    choose(card.dataset.airline);
    if(mobileBrowse.matches)$('schemeAirline').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});
  });
  $('loadMore').addEventListener('click',()=>{
    if(!mobileBrowse.matches)return;
    const y=scrollY,firstNew=renderedMobile,root=document.documentElement,prior=root.style.scrollBehavior;
    root.style.scrollBehavior='auto';mobileLimit+=12;drawResults({append:true});
    $('airlineResults').children[firstNew]?.focus({preventScroll:true});window.scrollTo({top:y,behavior:'auto'});root.style.scrollBehavior=prior;
  });
  $('returnToResults').addEventListener('click',event=>{
    event.preventDefault();const card=lastBrowse&&$('airlineResults').querySelector('[data-airline="'+lastBrowse.id+'"]');
    if(card){card.focus({preventScroll:true});window.scrollTo({top:lastBrowse.scrollY,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});}
    else{const selectedCard=$('airlineResults').querySelector('[data-airline="'+selectedId+'"]');if(selectedCard){selectedCard.focus({preventScroll:true});selectedCard.scrollIntoView({behavior:'auto',block:'center'});}else showResults();}
  });
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
  function clearSearchFeedback(){$('searchFeedback').hidden=true;$('searchFeedback').textContent='';}
  for(const id of ['airlineSearch','countryFilter','eraFilter','operatorFilter'])$(id).addEventListener(id==='airlineSearch'?'input':'change',()=>{resetBrowse();clearSearchFeedback();drawResults();});
  $('clearFilters').addEventListener('click',()=>{clearSearchFeedback();for(const id of ['airlineSearch','countryFilter','eraFilter','operatorFilter'])$(id).value='';resetBrowse();drawResults();setNotice('Filters cleared. Your selected colour scheme is unchanged.');});
  function showResults(){
    $('libraryHeading').focus({preventScroll:true});
    $('libraryHeading').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});
  }
  $('searchForm').addEventListener('submit',event=>{
    event.preventDefault();resetBrowse();const matches=filtered();drawResults();
    const feedback=$('searchFeedback');feedback.hidden=false;
    if(matches.length===1||(!event.submitter&&matches.length)){
      const a=matches[0];choose(a.id,{announce:false});
      feedback.textContent=(matches.length===1?'1 matching colour scheme found. Showing ':'Showing best match of '+matches.length+' matching colour schemes: ')+a.airlineName+' \u00b7 '+a.liveryName+'.';
      setNotice(feedback.textContent);
      revealScheme();
    }else{
      feedback.textContent=matches.length?matches.length+' matching colour schemes found. Choose an airline or livery below to see its colours.':'No matching airlines found. Try another search or change your filters. Your previous colour scheme is still selected.';
      showResults();
    }
  });
  $('airlineSearch').addEventListener('keydown',event=>{
    if(event.key==='Enter'&&!event.isComposing){event.preventDefault();$('searchForm').requestSubmit();}
  });
  function turnPage(delta){page+=delta;drawResults();$('airlineResults').scrollTop=0;if(mobileBrowse.matches)showResults();}
  $('previousAirlines').addEventListener('click',()=>turnPage(-1));$('nextAirlines').addEventListener('click',()=>turnPage(1));
  mobileBrowse.addEventListener('change',()=>{locateSelected();});
  $('surprise').addEventListener('click',()=>{const alternatives=filtered().filter(a=>a.id!==selectedId);if(!alternatives.length){setNotice('No other scheme matches. Clear a filter to try another airline.');return;}choose(alternatives[Math.floor(Math.random()*alternatives.length)].id);});
  for(let i=1;i<=3;i++)$('copyHex'+i).addEventListener('click',()=>copyText(selected().colors[i-1],['Primary','Secondary','Accent'][i-1]+' HEX copied.'));
  $('copyCodes').addEventListener('click',()=>copyText(selected().colors.map((hex,i)=>['Primary','Secondary','Accent'][i]+': '+hex).join('\n'),'All three HEX codes copied.'));
  try{history.scrollRestoration='manual';}catch{/* Local-file history support varies. */}
  addEventListener('popstate',()=>{
    const id=new URLSearchParams(location.search).get('scheme');
    clearSearchFeedback();choose(byId.has(id)?id:defaultId,{historyEntry:false});locateSelected();
    if(mobileBrowse.matches)requestAnimationFrame(()=>revealScheme({immediate:true}));
  });
  const eras=entries.reduce((r,a)=>(r[a.era]=(r[a.era]||0)+1,r),{});
  $('catalogueCount').textContent=entries.length.toLocaleString()+' real colour schemes';
  $('catalogueSummary').textContent=entries.length+' schemes · '+eras.Active+' Active · '+eras.Classic+' Classic · '+eras.Special+' Special · '+new Set(entries.map(a=>a.country)).size+' countries/territories. '+entries.filter(a=>a.quality==='approximate').length+' approximate palettes; '+entries.filter(a=>a.quality==='official').length+' published digital-brand references. Expansion is evidence-led; 6,000+ genuine schemes is the research goal, not a claim of current coverage.';
  drawScheme();
  if(byId.has(requestedId)){locateSelected();setNotice(selected().airlineName+' · '+selected().liveryName+' selected from your scheme link.');if(mobileBrowse.matches)requestAnimationFrame(()=>revealScheme({immediate:true}));}
  else drawResults();
})();
