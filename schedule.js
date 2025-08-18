export function aggregate(plan, tasks, getTeam){
  const team = getTeam(plan.teamId)?.sizes || {BE:0,iOS:0,Android:0,Online:0,QA:0};
  const buffer = (plan.bufferPct||0)/100;
  const phaseTotals = {};
  for(const pid of plan.phaseIds){ phaseTotals[pid] = {BE:0,iOS:0,Android:0,Online:0,QA:0,earliest:null}; }
  tasks.forEach(t=>{
    if(t.projectId !== plan.projectId) return;
    const earliestTaskStart = (t.startDate && t.startDate.trim()) ? new Date(t.startDate) : null;
    (t.phaseIds||[]).forEach(phId=>{
      if(!plan.phaseIds.includes(phId)) return;
      const rec = phaseTotals[phId] || (phaseTotals[phId]={BE:0,iOS:0,Android:0,Online:0,QA:0,earliest:null});
      (t.efforts||[]).forEach(eff=>{
        const md = +eff.manDays || 0; const plat = eff.platform;
        if(plat in rec){ rec[plat] = (rec[plat]||0) + md; }
      });
      if(earliestTaskStart){ rec.earliest = (!rec.earliest || earliestTaskStart < rec.earliest) ? earliestTaskStart : rec.earliest; }
    });
  });
  for(const phId of Object.keys(phaseTotals)) ["BE","iOS","Android","Online","QA"].forEach(k=> phaseTotals[phId][k] = +(phaseTotals[phId][k] * (1+buffer)).toFixed(1));
  return { team, buffer, phaseTotals };
}

function duration(md, eng, eff){ if(!eng||eng<=0) return 0; return Math.max(1, Math.ceil(md/(eng*eff))); }
function addDays(d, n){ const x=new Date(d.getTime()); x.setDate(x.getDate()+n); return x; }

export const DEFAULT_STAGGER_DAYS = 5;

export function computeSchedule(plan, aggr, eff, getPhase, startDate, options={}){
  const planStart = new Date(startDate);
  const phases = plan.phaseIds.map(id=> getPhase(id)).filter(Boolean).sort((a,b)=>(a.order||0)-(b.order||0));
  const defaultLanes = [
    {key:'BE', name:'Backend', cls:'be'},
    {key:'iOS', name:'iOS', cls:'ios'},
    {key:'Android', name:'Android', cls:'android'},
    {key:'Online', name:'Online/Web', cls:'web'},
    {key:'QA', name:'QA (Manual)', cls:'qa'}
  ];
  const lanes = options.lanes || defaultLanes;
  const qaRule = options.qaStart || 'half'; // 'half' or 'afterFE'
  const stagger = options.staggerDays ?? DEFAULT_STAGGER_DAYS;
  const phaseWindows = [];
  let prevEnd = null;
  for(const ph of phases){
    const totals = aggr.phaseTotals[ph.id] || {BE:0,iOS:0,Android:0,Online:0,QA:0,earliest:null};
    let phStart = prevEnd ? addDays(prevEnd, 1) : planStart;
    if(totals.earliest && totals.earliest > phStart) phStart = totals.earliest;
    const beDays = duration(totals.BE, aggr.team.BE, eff);
    const iosDays = duration(totals.iOS, aggr.team.iOS, eff);
    const andDays = duration(totals.Android, aggr.team.Android, eff);
    const webDays = duration(totals.Online, aggr.team.Online, eff);
    const feMax = Math.max(iosDays, andDays, webDays);
    let beStart = phStart;
    let iosStart = addDays(phStart, stagger);
    let andStart = addDays(phStart, stagger);
    let webStart = addDays(phStart, stagger);
    let qaStart = qaRule==='afterFE' ? addDays(iosStart, feMax) : addDays(iosStart, Math.floor(feMax*0.5));
    const o = plan.overrides?.[ph.id] || {};
    if(o.BE) beStart = new Date(o.BE);
    if(o.iOS) iosStart = new Date(o.iOS);
    if(o.Android) andStart = new Date(o.Android);
    if(o.Online) webStart = new Date(o.Online);
    if(o.QA) qaStart = new Date(o.QA);
    const beEnd = addDays(beStart, beDays);
    const iosEnd = addDays(iosStart, iosDays);
    const andEnd = addDays(andStart, andDays);
    const webEnd = addDays(webStart, webDays);
    const qaEnd = addDays(qaStart, duration(totals.QA, aggr.team.QA, eff));
    const phEnd = new Date(Math.max(beEnd, iosEnd, andEnd, webEnd, qaEnd));
    phaseWindows.push({
      ph: ph.id,
      start: phStart,
      end: phEnd,
      lanes: [
        {key:'BE', start: beStart, days: beDays},
        {key:'iOS', start: iosStart, days: iosDays},
        {key:'Android', start: andStart, days: andDays},
        {key:'Online', start: webStart, days: webDays},
        {key:'QA', start: qaStart, days: duration(totals.QA, aggr.team.QA, eff)}
      ]
    });
    prevEnd = phEnd;
  }
  const chartStart = phaseWindows.length ? phaseWindows[0].start : planStart;
  const chartEnd = phaseWindows.length ? phaseWindows[phaseWindows.length-1].end : planStart;
  return { chartStart, chartEnd, lanes, phaseWindows };
}
