import { aggregate, computeSchedule } from '../schedule.js';
import { state, getTeam, getPhase } from '../data.js';
import { effortTypes, effortTypeTitle, fmt, daysBetween, byId } from './utils.js';

export function openDetail(planId){
  const p = state.proposals.find(x=>x.id===planId);
  if(!p) return;
  byId('plansLayer').style.display='none';
  byId('detail').style.display='block';
  const aggr = aggregate(p, state.tasks, getTeam);
  const sched = computeSchedule(p, aggr, state.meta.efficiency, getPhase, state.meta.startDate);
  byId('detail-title').textContent = p.title;
  byId('detail-team').textContent = getTeam(p.teamId)?.name || '—';
  byId('detail-buffer').textContent = p.bufferPct||0;
  const totalDays = Math.max(1, daysBetween(sched.chartStart, sched.chartEnd)+1);
  byId('detail-span').textContent = `${fmt(sched.chartStart)} → ${fmt(sched.chartEnd)} • ${totalDays} days`;
  const th = `<tr><th>Phase</th>${effortTypes().map(k=>`<th>${effortTypeTitle(k)}</th>`).join('')}</tr>`;
  byId('effTable').querySelector('thead').innerHTML = th;
  const tb = byId('effTable').querySelector('tbody'); tb.innerHTML='';
  p.phaseIds.forEach(pid=>{
    const t = aggr.phaseTotals[pid] || {};
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${getPhase(pid)?.name||pid}</td>${effortTypes().map(k=>`<td>${t[k]||0}</td>`).join('')}`;
    tb.appendChild(tr);
  });
}
