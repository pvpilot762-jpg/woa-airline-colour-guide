/* Offline, pre-normalized search index. Pagination bounds player-facing DOM work. */
(function(root){
  'use strict';
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  function create(entries){
    const rows=entries.map(entry=>({entry,text:normalize([entry.name,entry.airlineName,entry.liveryName,entry.country,entry.icao,...(entry.aliases||[])].join(' '))}));
    return {filter({query='',country='',era='',category=''}={}){
      const terms=normalize(query).split(/\s+/).filter(Boolean);
      return rows.filter(({entry:a,text})=>(!country||a.country===country)&&(!era||a.era===era||a.eraLabel===era)&&(!category||a.category===category)&&terms.every(term=>text.includes(term))).map(row=>row.entry);
    }};
  }
  root.WOA_CATALOGUE_SEARCH={create,normalize};
  if(typeof module!=='undefined')module.exports=root.WOA_CATALOGUE_SEARCH;
})(typeof window==='undefined'?globalThis:window);
