/* Offline, pre-normalized search index. Pagination bounds player-facing DOM work. */
(function(root){
  'use strict';
  const normalize=value=>String(value||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/\./g,'').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
  function create(entries){
    const rows=entries.map((entry,order)=>({entry,order,airline:normalize(entry.airlineName||entry.name),livery:normalize(entry.liveryName),aliases:(entry.aliases||[]).map(normalize),text:normalize([entry.name,entry.airlineName,entry.liveryName,entry.country,entry.icao,...(entry.aliases||[]),...(entry.searchTerms||[])].join(' '))}));
    return {filter({query='',country='',era='',category=''}={}){
      const phrase=normalize(query),terms=phrase.split(/\s+/).filter(Boolean);
      const found=rows.filter(({entry:a,text})=>(!country||a.country===country)&&(!era||a.era===era||a.eraLabel===era)&&(!category||a.category===category)&&terms.every(term=>text.includes(term)));
      // Stable ties preserve the saved scheme order; relevance never discards matches.
      const rank=row=>row.airline===phrase?0:row.airline.startsWith(phrase)?1:row.airline.includes(phrase)?2:[row.livery,...row.aliases].some(field=>terms.every(term=>field.includes(term)))?3:4;
      return (phrase?found.map(row=>({row,rank:rank(row)})).sort((a,b)=>a.rank-b.rank||a.row.order-b.row.order).map(({row})=>row):found).map(row=>row.entry);
    }};
  }
  root.WOA_CATALOGUE_SEARCH={create,normalize};
  if(typeof module!=='undefined')module.exports=root.WOA_CATALOGUE_SEARCH;
})(typeof window==='undefined'?globalThis:window);
