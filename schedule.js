import { getTaskPhaseIds } from './data.js';

export function aggregate(plan, tasks, getTeam){
  const team = { ...(getTeam(plan.teamId)?.sizes || {}) };
  const buffer = (plan.bufferPct||0)/100;
  const planPh = (plan.phaseIds||[]).map(id=> String(id));
  const phaseTotals = {};
  for(const pid of planPh){ phaseTotals[pid] = {earliest:null}; }
  tasks.forEach(t=>{
    if(String(t.projectId ?? '') !== String(plan.projectId ?? '')) return;
    const earliestTaskStart = (t.startDate && t.startDate.trim()) ? new Date(t.startDate) : null;
    getTaskPhaseIds(t).forEach(phId=>{
      const pid = String(phId);
      if(!planPh.includes(pid)) return;
      const rec = phaseTotals[pid] || (phaseTotals[pid]={earliest:null});
      (t.efforts||[]).forEach(eff=>{
        const md = +eff.manDays || 0; const plat = eff.platform;
        if(!(plat in rec)) rec[plat] = 0;
        rec[plat] += md;
      });
      if(earliestTaskStart){ rec.earliest = (!rec.earliest || earliestTaskStart < rec.earliest) ? earliestTaskStart : rec.earliest; }
    });
  });
  for(const phId of Object.keys(phaseTotals)){
    for(const k of Object.keys(phaseTotals[phId])){
      if(k==='earliest') continue;
      phaseTotals[phId][k] = +(phaseTotals[phId][k] * (1+buffer)).toFixed(1);
    }
  }
  return { team, buffer, phaseTotals };
}

function duration(md, eng, eff){ if(!eng||eng<=0) return 0; return Math.max(1, Math.ceil(md/(eng*eff))); }
function addDays(d, n){ const x=new Date(d.getTime()); x.setDate(x.getDate()+n); return x; }

export const DEFAULT_STAGGER_DAYS = 5;

export function computeSchedule(plan, aggr, eff, getPhase, startDate, options={}){
  const planStart = new Date(startDate);
  const phases = plan.phaseIds.map(id=> getPhase(id)).filter(Boolean).sort((a,b)=>(a.order||0)-(b.order||0));
  let lanes = plan.lanes && plan.lanes.length ? plan.lanes.map(l=> ({...l})) : null;
  if(!lanes){
    const platformSet = new Set(Object.keys(aggr.team||{}));
    Object.values(aggr.phaseTotals||{}).forEach(rec=>{
      Object.keys(rec).forEach(k=>{ if(k!=='earliest') platformSet.add(k); });
    });
    let laneKeys = Array.from(platformSet);
    laneKeys.sort((a,b)=>{
      if(a==='BE') return -1; if(b==='BE') return 1;
      if(a==='QA') return 1; if(b==='QA') return -1;
      return a.localeCompare(b);
    });
    lanes = laneKeys.map(k=> ({key:k, name:k, cls:k.toLowerCase()}));
  }
  lanes = options.lanes || lanes;
  const qaRule = options.qaStart || 'half'; // 'half' or 'afterFE'
  const stagger = options.staggerDays ?? DEFAULT_STAGGER_DAYS;
  const phaseWindows = [];
  for(const ph of phases){
    const totals = aggr.phaseTotals[ph.id] || {earliest:null};
    let phStart = planStart;
    if(totals.earliest && totals.earliest > phStart) phStart = totals.earliest;
    const laneOut = [];
    const feLanes = lanes.filter(l=> l.key!=='BE' && l.key!=='QA');
    const qaLane = lanes.find(l=> l.key==='QA');
    const beLane = lanes.find(l=> l.key==='BE');
    const startMap = {};
    const dayMap = {};
    if(beLane){
      let beStart = phStart;
      const o = plan.overrides?.[ph.id] || {};
      if(o[beLane.key]) beStart = new Date(o[beLane.key]);
      const beMd = totals[beLane.key] || 0;
      const beDays = beMd>0 ? duration(beMd, aggr.team[beLane.key]||0, eff) : 0;
      startMap[beLane.key]=beStart; dayMap[beLane.key]=beDays;
      if(beDays>0) laneOut.push({key:beLane.key, start:beStart, days:beDays});
    }
    feLanes.forEach(l=>{
      let start = addDays(phStart, stagger);
      const o = plan.overrides?.[ph.id] || {};
      if(o[l.key]) start = new Date(o[l.key]);
      const md = totals[l.key] || 0;
      const days = md>0 ? duration(md, aggr.team[l.key]||0, eff) : 0;
      startMap[l.key]=start; dayMap[l.key]=days;
      if(days>0) laneOut.push({key:l.key, start, days});
    });
    if(qaLane){
      let start = addDays(phStart, stagger);
      const o = plan.overrides?.[ph.id] || {};
      if(o[qaLane.key]) start = new Date(o[qaLane.key]);
      else {
        const feMax = Math.max(0, ...feLanes.map(l=> dayMap[l.key]||0));
        const base = feLanes.length ? startMap[feLanes[0].key] : addDays(phStart, stagger);
        start = qaRule==='afterFE' ? addDays(base, feMax) : addDays(base, Math.floor(feMax*0.5));
      }
      const qaMd = totals[qaLane.key] || 0;
      const days = qaMd>0 ? duration(qaMd, aggr.team[qaLane.key]||0, eff) : 0;
      startMap[qaLane.key]=start; dayMap[qaLane.key]=days;
      if(days>0) laneOut.push({key:qaLane.key, start, days});
    }
    const phEnd = laneOut.reduce((max, l)=>{
      const end = addDays(l.start, l.days);
      return end>max ? end : max;
    }, laneOut[0]?.start || phStart);
    const earliestStart = laneOut.reduce((min, l)=> l.start < min ? l.start : min, laneOut[0]?.start || phStart);
    phaseWindows.push({ ph: ph.id, start: earliestStart, end: phEnd, lanes: laneOut });
  }
  const chartStart = phaseWindows.length ? phaseWindows.reduce((min, pw)=> pw.start < min ? pw.start : min, phaseWindows[0].start) : planStart;
  const chartEnd = phaseWindows.length ? phaseWindows.reduce((max, pw)=> pw.end > max ? pw.end : max, phaseWindows[0].end) : planStart;
  return { chartStart, chartEnd, lanes, phaseWindows };
}
