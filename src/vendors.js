const XLSX_SOURCES = [
  "https://unpkg.com/xlsx@0.19.3/dist/xlsx.full.min.js",
  "https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.19.3/xlsx.full.min.js"
];
const XPOP_SOURCES = [
  "https://cdn.jsdelivr.net/npm/xlsx-populate/browser/xlsx-populate.min.js",
  "https://unpkg.com/xlsx-populate/browser/xlsx-populate.min.js"
];
const CHART_SOURCES = [
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.3/chart.umd.min.js",
  "https://unpkg.com/chart.js@4.4.3/dist/chart.umd.min.js"
];

function loadScript(src){
  return new Promise((resolve, reject)=>{
    const s=document.createElement('script');
    s.src=src; s.async=true; s.type='text/javascript'; s.crossOrigin='anonymous';
    s.onload=()=>resolve(src); s.onerror=()=>reject(src);
    document.head.appendChild(s);
  });
}

async function ensure(list, key){
  if(window[key]) return true;
  for(const src of list){
    try{ await loadScript(src); if(window[key]) return true; }catch(e){}
  }
  return !!window[key];
}

export const ensureXLSX = ()=> ensure(XLSX_SOURCES, 'XLSX');
export const ensureXPOP = ()=> ensure(XPOP_SOURCES, 'XlsxPopulate');
export const ensureCHART = ()=> ensure(CHART_SOURCES, 'Chart');

Object.assign(window, { ensureXLSX, ensureXPOP, ensureCHART });
