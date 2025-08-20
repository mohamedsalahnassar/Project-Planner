import { aggregate, computeSchedule } from '../schedule.js';
import { state, getTeam, getPhase, getProject } from '../data.js';
import { fmt, effortTypes, effortTypeTitle, effortTypeColor, byId } from './utils.js';
import { exportPlanJSON, importPlanJSON } from '../export.js';
import { openDetail } from './planDetail.js';

export function buildProjects(){
  const layer = byId('projectsLayer');
  layer.innerHTML='';
  byId('plansLayer').style.display='none';
  byId('detail').style.display='none';
  state.projects.forEach(pr=>{
    const plans = state.proposals.filter(p=>p.projectId===pr.id);
    const col = document.createElement('div');
    col.className='col-12 col-md-6 col-xl-4';
    col.innerHTML = `<div class="card card-hover h-100"><div class="card-body d-flex flex-column gap-2">
      <h5 class="card-title mb-0">${pr.name}</h5>
      <div class="text-secondary small">${pr.description||''}</div>
      <div class="d-flex justify-content-between align-items-center mt-2">
        <div class="small text-secondary">Plans: <b>${plans.length}</b></div>
        <button class="btn btn-outline-primary btn-sm">Open</button>
      </div>
    </div></div>`;
    col.querySelector('button').onclick = ()=> openProject(pr.id);
    layer.appendChild(col);
  });
}

export function openProject(projectId){
  const pr = getProject(projectId);
  if(!pr) return;
  byId('projectsLayer').innerHTML='';
  byId('plansLayer').style.display='block';
  byId('detail').style.display='none';
  byId('plans-title').textContent = pr.name + ' — Delivery Plans';
  const grid = byId('plansGrid'); grid.innerHTML='';
  const plans = state.proposals.filter(p=>p.projectId===projectId);
  plans.forEach(p=> grid.appendChild(planCard(p)));
  byId('btn-back-projects').onclick = ()=>{ buildProjects(); };
  byId('btn-export-project-pdf').onclick = ()=> console.warn('PDF export not implemented');
  byId('btn-export-project-xlsx-basic').onclick = ()=> console.warn('Excel export not implemented');
}

function planCard(p){
  const aggr = aggregate(p, state.tasks, getTeam);
  const sched = computeSchedule(p, aggr, state.meta.efficiency, getPhase, state.meta.startDate);
  const keys = effortTypes();
  sched.lanes.forEach(l=>{ if(!l.name) l.name = effortTypeTitle(l.key); if(!l.color) l.color = effortTypeColor(l.key); });
  const totals = Object.fromEntries(keys.map(k=>[k,0]));
  Object.values(aggr.phaseTotals).forEach(pt=>{ keys.forEach(k=>{ totals[k]+=(pt[k]||0); }); });
  keys.forEach(k=> totals[k] = +totals[k].toFixed(1));
  const startStr = fmt(sched.chartStart), endStr = fmt(sched.chartEnd);
  const phases = p.phaseIds.map(id=> getPhase(id)?.name||id).join(' · ');
  const col = document.createElement('div'); col.className='col-12 col-md-6';
  col.innerHTML = `<div class="card card-hover h-100" data-plan="${p.id}"><div class="card-body d-flex flex-column gap-2">
    <div class="d-flex justify-content-between align-items-start gap-2">
      <div><h5 class="card-title mb-0">${p.title}</h5><div class="text-secondary small">${p.description||''}</div></div>
      <div class="text-end">
        <div class="small text-secondary">${startStr} → ${endStr}</div>
        <div class="small">Team: <b>${getTeam(p.teamId)?.name||'—'}</b></div>
        <div class="small">Phases: ${phases}</div>
      </div>
    </div>
  </div></div>`;
  col.querySelector('.card').onclick = ()=> openDetail(p.id);
  return col;
}
