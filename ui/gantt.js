import { computeSchedule } from '../schedule.js';

export function renderGantt(plan, aggr, eff, getPhase, startDate, options={}){
  const sched = computeSchedule(plan, aggr, eff, getPhase, startDate, options);
  const root = options.container || document.createElement('div');
  root.className = 'gantt-chart';

  const pxPerDay = options.pxPerDay || 18;
  const fontSize = Math.max(8, Math.min(16, Math.round(pxPerDay * 0.75))) * (options.fontScale||1);
  root.style.fontSize = fontSize + 'px';
  const laneHeight = options.laneHeight || 44;
  const lanePad = options.lanePad || Math.max(2, Math.floor(laneHeight * 0.1));
  const barHeight = laneHeight - lanePad * 2;

  // basic rendering using absolute positioning and business-day math
  const dayMs = 86400000;
  function addBusinessDays(d, n){
    const x = new Date(d.getTime());
    if(n >= 0){
      let added = 0;
      while(added < n){ x.setDate(x.getDate()+1); const day=x.getDay(); if(day!==0 && day!==6) added++; }
    }else{
      let added = 0;
      while(added > n){ x.setDate(x.getDate()-1); const day=x.getDay(); if(day!==0 && day!==6) added--; }
    }
    return x;
  }
  function businessDaysBetween(a,b){
    const start = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const end = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    if(end <= start) return 0;
    const msPerDay = 86400000;
    const diffDays = Math.floor((end - start) / msPerDay);
    const fullWeeks = Math.floor(diffDays / 7);
    let business = diffDays - fullWeeks * 2;
    const rem = diffDays % 7;
    const startDay = start.getDay();
    for(let i=0;i<rem;i++){
      const day = (startDay + i + 1) % 7; // days after start
      if(day === 0 || day === 6) business--;
    }
    return business < 0 ? 0 : business;
  }
  // chartEnd is inclusive; convert to an exclusive offset of business days
  const totalDays = Math.max(1, businessDaysBetween(sched.chartStart, addBusinessDays(sched.chartEnd,1)));

  if(options.showReleases !== false && Array.isArray(options.releases) && options.releases.length){
    const laneDiv = document.createElement('div');
    laneDiv.className = 'gantt-lane releases';
    const label = document.createElement('span');
    label.className = 'gantt-label';
    label.textContent = 'Releases';
    laneDiv.appendChild(label);
    const bars = [];
    options.releases.forEach(r => {
      const start = new Date(r.codeFreeze);
      const end = new Date(r.releaseDate);
      const sOff = Math.max(0, businessDaysBetween(sched.chartStart, start));
      const eOff = businessDaysBetween(sched.chartStart, addBusinessDays(end,1));
      bars.push({start:start.getTime(), end:end.getTime(), sOff, eOff, rel:r});
    });
    bars.sort((a,b)=>a.start-b.start);
    const trackEnd=[];
    bars.forEach(b=>{ let t=0; while(t<trackEnd.length && b.start<trackEnd[t]) t++; b.track=t; trackEnd[t]=addBusinessDays(new Date(b.end),1).getTime(); });
    const step = barHeight*0.5;
    const trackCount=trackEnd.length||1;
    laneDiv.style.height = (lanePad*2 + barHeight + (trackCount-1)*step)+'px';
    bars.forEach(b=>{
      const bar = document.createElement('div');
      bar.className = 'gantt-bar';
      bar.style.left = `${(b.sOff / totalDays) * 100}%`;
      bar.style.width = `${((b.eOff - b.sOff) / totalDays) * 100}%`;
      bar.style.background = b.rel.color || '#6f42c1';
      bar.textContent = b.rel.version || '';
      bar.style.top = (lanePad + b.track*step)+'px';
      bar.style.height = `${barHeight}px`;
      laneDiv.appendChild(bar);
    });
    root.appendChild(laneDiv);
  }

  if(options.showSprints !== false && Array.isArray(options.sprints) && options.sprints.length){
    const laneDiv = document.createElement('div');
    laneDiv.className = 'gantt-lane sprints';
    const label = document.createElement('span');
    label.className = 'gantt-label';
    label.textContent = 'Sprints';
    laneDiv.appendChild(label);
    const bars = [];
    options.sprints.forEach(s => {
      const start = new Date(s.start);
      const end = new Date(s.end);
      const sOff = Math.max(0, businessDaysBetween(sched.chartStart, start));
      const eOff = businessDaysBetween(sched.chartStart, addBusinessDays(end,1));
      bars.push({start:start.getTime(), end:end.getTime(), sOff, eOff, spr:s});
    });
    bars.sort((a,b)=>a.start-b.start);
    const trackEnd=[];
    bars.forEach(b=>{ let t=0; while(t<trackEnd.length && b.start<trackEnd[t]) t++; b.track=t; trackEnd[t]=addBusinessDays(new Date(b.end),1).getTime(); });
    const step = barHeight*0.5;
    const trackCount=trackEnd.length||1;
    laneDiv.style.height = (lanePad*2 + barHeight + (trackCount-1)*step)+'px';
    bars.forEach(b=>{
      const bar = document.createElement('div');
      bar.className = 'gantt-bar';
      bar.style.left = `${(b.sOff / totalDays) * 100}%`;
      bar.style.width = `${((b.eOff - b.sOff) / totalDays) * 100}%`;
      bar.style.background = b.spr.color || '#dc3545';
      bar.textContent = b.spr.name || '';
      bar.style.top = (lanePad + b.track*step)+'px';
      bar.style.height = `${barHeight}px`;
      bar.style.fontSize = '0.75em';
      laneDiv.appendChild(bar);
    });
    root.appendChild(laneDiv);
  }

  {
    const laneDiv = document.createElement('div');
    laneDiv.className = 'gantt-lane phases';
    const label = document.createElement('span');
    label.className = 'gantt-label';
    label.textContent = 'Phases';
    laneDiv.appendChild(label);
    const bars = [];
    sched.phaseWindows.forEach(w => {
      const sOff = businessDaysBetween(sched.chartStart, w.start);
      const eOff = businessDaysBetween(sched.chartStart, addBusinessDays(w.end,1));
      bars.push({start:w.start.getTime(), end:w.end.getTime(), sOff, eOff, ph:w.ph});
    });
    bars.sort((a,b)=>a.start-b.start);
    const trackEnd=[];
    bars.forEach(b=>{ let t=0; while(t<trackEnd.length && b.start<trackEnd[t]) t++; b.track=t; trackEnd[t]=addBusinessDays(new Date(b.end),1).getTime(); });
    const step = barHeight*0.5;
    const trackCount=trackEnd.length||1;
    laneDiv.style.height = (lanePad*2 + barHeight + (trackCount-1)*step)+'px';
    bars.forEach(b=>{
      const bar = document.createElement('div');
      bar.className = 'gantt-bar';
      bar.style.left = `${(b.sOff / totalDays) * 100}%`;
      // phase bars should end at the last effort; use the exclusive offset difference
      bar.style.width = `${((b.eOff - b.sOff) / totalDays) * 100}%`;
      bar.style.background = '#6c757d';
      bar.style.color = '#fff';
      bar.style.fontSize = '0.75em';
      bar.textContent = getPhase(b.ph)?.name || b.ph;
      bar.style.top = (lanePad + b.track*step)+'px';
      bar.style.height = `${barHeight}px`;
      laneDiv.appendChild(bar);
    });
    root.appendChild(laneDiv);
  }

  // Minimal Capacity Changes lane (read-only, non-intrusive)
  if (Array.isArray(sched.splitPhaseWindows) && sched.splitPhaseWindows.length) {
    const laneDiv = document.createElement('div');
    laneDiv.className = 'gantt-lane capacity-changes';
    const label = document.createElement('span');
    label.className = 'gantt-label';
    label.textContent = 'Capacity Changes';
    laneDiv.appendChild(label);

    // Collect bars for capacity change segments (segments after the first per phase)
    const bars = [];
    sched.splitPhaseWindows.forEach(pw => {
      if (!pw.segments || pw.segments.length <= 1) return;
      pw.segments.forEach((seg, idx) => {
        if (idx === 0) return; // only show changes
        const sOff = Math.max(0, businessDaysBetween(sched.chartStart, seg.start));
        const eOff = businessDaysBetween(sched.chartStart, addBusinessDays(seg.end, 1));
        bars.push({ start: seg.start.getTime(), end: seg.end.getTime(), sOff, eOff, seg });
      });
    });

    bars.sort((a,b)=> a.start - b.start);

    // Simple track layout to avoid overlaps
    const trackEnd = [];
    bars.forEach(b => { let t=0; while(t<trackEnd.length && b.start < trackEnd[t]) t++; b.track=t; trackEnd[t]=addBusinessDays(new Date(b.end),1).getTime(); });
    const step = barHeight * 0.5;
    const trackCount = trackEnd.length || 1;
    laneDiv.style.height = (lanePad*2 + barHeight + (trackCount-1)*step)+'px';

    bars.forEach(b => {
      const bar = document.createElement('div');
      bar.className = 'gantt-bar';
      bar.style.left = `${(b.sOff / totalDays) * 100}%`;
      bar.style.width = `${((b.eOff - b.sOff) / totalDays) * 100}%`;
      bar.style.background = '#ffc107';
      bar.style.border = '2px dashed #dc3545';
      bar.style.color = '#000';
      bar.style.fontSize = '0.75em';
      bar.textContent = 'Capacity change';
      bar.style.top = (lanePad + b.track*step)+'px';
      bar.style.height = `${barHeight}px`;
      laneDiv.appendChild(bar);
    });

    root.appendChild(laneDiv);
  }

  sched.lanes.forEach(lane => {
    const laneDiv = document.createElement('div');
    laneDiv.className = `gantt-lane ${lane.cls || ''}`;
    const label = document.createElement('span');
    label.className = 'gantt-label';
    label.textContent = lane.name;
    laneDiv.appendChild(label);

    const bars = [];
    sched.phaseWindows.forEach(pw => {
      const info = pw.lanes.find(l => l.key === lane.key);
      if(!info || !info.days) return;
      bars.push({ info, phase: pw.ph });
    });

    const trackEnd = [];
    bars.forEach(b => {
      const startMs = b.info.start.getTime();
      let t = 0;
      while(t < trackEnd.length && startMs < trackEnd[t]) t++;
      b.track = t;
      trackEnd[t] = addBusinessDays(b.info.start, b.info.days).getTime();
    });
    const step = barHeight*0.5;
    const trackCount = trackEnd.length || 1;
    laneDiv.style.height = (lanePad*2 + barHeight + (trackCount-1)*step) + 'px';

    bars.forEach(b => {
      const bar = document.createElement('div');
      bar.className = 'gantt-bar';
      const offset = businessDaysBetween(sched.chartStart, b.info.start);
      bar.style.left = `${(offset / totalDays) * 100}%`;
      bar.style.width = `${(b.info.days / totalDays) * 100}%`;
      if(lane.color) bar.style.background = lane.color;
      bar.style.top = (lanePad + b.track * step) + 'px';
      bar.style.height = `${barHeight}px`;
      laneDiv.appendChild(bar);
    });

    root.appendChild(laneDiv);
  });

  return { element: root, schedule: sched };
}
