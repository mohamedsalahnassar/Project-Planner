import { state, save } from '../data.js';
import { byId } from './utils.js';

export function initManage(){
  const manageModal = new bootstrap.Modal('#manageModal');
  byId('btn-manage').onclick = ()=>{ refreshManage(); manageModal.show(); };
  byId('btn-save-manage').onclick = ()=>{ save(); refreshManage(); };
}

export function refreshManage(){
  const filterP = (byId('search-projects').value||'').toLowerCase();
  const tbP = byId('tbl-projects').querySelector('tbody');
  tbP.innerHTML='';
  state.projects.filter(p=> (p.name+' '+p.id).toLowerCase().includes(filterP)).forEach(p=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.name}</td><td>${p.description||''}</td><td><code>${p.id}</code></td>`;
    tbP.appendChild(tr);
  });
}
