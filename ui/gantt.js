import { computeSchedule } from '../schedule.js';

export function renderGantt(plan, aggr, eff, getPhase, startDate, options={}){
  const sched = computeSchedule(plan, aggr, eff, getPhase, startDate, options);
  const root = options.container || document.createElement('div');
  root.className = 'gantt-chart';

  const pxPerDay = options.pxPerDay || 18;
  const fontSize = Math.max(8, Math.min(16, Math.round(pxPerDay * 0.75)));
  root.style.fontSize = fontSize + 'px';
  const laneHeight = options.laneHeight || 44;
  const lanePad = options.lanePad || Math.max(2, Math.floor(laneHeight * 0.1));
  const barHeight = laneHeight - lanePad * 2;

  // basic rendering using absolute positioning
  const dayMs = 86400000;
  const totalDays = Math.max(1, Math.ceil((sched.chartEnd - sched.chartStart) / dayMs));

  if(options.showReleases !== false && Array.isArray(options.releases) && options.releases.length){
    const laneDiv = document.createElement('div');
    laneDiv.className = 'gantt-lane releases';
    laneDiv.style.height = laneHeight + 'px';
    const label = document.createElement('span');
    label.className = 'gantt-label';
    label.textContent = 'Releases';
    laneDiv.appendChild(label);
    options.releases.forEach(r => {
      const start = new Date(r.codeFreeze);
      const end = new Date(r.releaseDate);
      const sOff = Math.max(0, Math.floor((start - sched.chartStart) / dayMs));
      const eOff = Math.floor((end - sched.chartStart) / dayMs);
      const bar = document.createElement('div');
      bar.className = 'gantt-bar';
      bar.style.left = `${(sOff / totalDays) * 100}%`;
      bar.style.width = `${((eOff - sOff + 1) / totalDays) * 100}%`;
      bar.style.background = r.color || '#6f42c1';
      bar.textContent = r.version || '';
      bar.style.top = lanePad + 'px';
      bar.style.height = `${barHeight}px`;
      laneDiv.appendChild(bar);
    });
    root.appendChild(laneDiv);
  }

  if(options.showSprints !== false && Array.isArray(options.sprints) && options.sprints.length){
    const laneDiv = document.createElement('div');
    laneDiv.className = 'gantt-lane sprints';
    laneDiv.style.height = laneHeight + 'px';
    const label = document.createElement('span');
    label.className = 'gantt-label';
    label.textContent = 'Sprints';
    laneDiv.appendChild(label);
    options.sprints.forEach(s => {
      const start = new Date(s.start);
      const end = new Date(s.end);
      const sOff = Math.max(0, Math.floor((start - sched.chartStart) / dayMs));
      const eOff = Math.floor((end - sched.chartStart) / dayMs);
      const bar = document.createElement('div');
      bar.className = 'gantt-bar';
      bar.style.left = `${(sOff / totalDays) * 100}%`;
      bar.style.width = `${((eOff - sOff + 1) / totalDays) * 100}%`;
      bar.style.background = s.color || '#dc3545';
      bar.textContent = s.name || '';
      bar.style.top = lanePad + 'px';
      bar.style.height = `${barHeight}px`;
      bar.style.fontSize = '0.75em';
      laneDiv.appendChild(bar);
    });
    root.appendChild(laneDiv);
  }

  {
    const laneDiv = document.createElement('div');
    laneDiv.className = 'gantt-lane phases';
    laneDiv.style.height = laneHeight + 'px';
    const label = document.createElement('span');
    label.className = 'gantt-label';
    label.textContent = 'Phases';
    laneDiv.appendChild(label);
    sched.phaseWindows.forEach(w => {
      const sOff = Math.floor((w.start - sched.chartStart) / dayMs);
      const eOff = Math.floor((w.end - sched.chartStart) / dayMs);
      const bar = document.createElement('div');
      bar.className = 'gantt-bar';
      bar.style.left = `${(sOff / totalDays) * 100}%`;
      bar.style.width = `${((eOff - sOff + 1) / totalDays) * 100}%`;
      bar.style.background = '#6c757d';
      bar.style.color = '#fff';
      bar.style.fontSize = '0.75em';
      bar.textContent = getPhase(w.ph)?.name || w.ph;
      bar.style.top = lanePad + 'px';
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
      trackEnd[t] = startMs + b.info.days * dayMs;
    });
    const trackCount = trackEnd.length || 1;
    laneDiv.style.height = (lanePad * (trackCount + 1) + barHeight * trackCount) + 'px';

    bars.forEach(b => {
      const bar = document.createElement('div');
      bar.className = 'gantt-bar';
      const offset = Math.floor((b.info.start - sched.chartStart) / dayMs);
      bar.style.left = `${(offset / totalDays) * 100}%`;
      bar.style.width = `${(b.info.days / totalDays) * 100}%`;
      if(lane.color) bar.style.background = lane.color;
      bar.style.top = (lanePad + b.track * (barHeight + lanePad)) + 'px';
      bar.style.height = `${barHeight}px`;
      laneDiv.appendChild(bar);
    });

    root.appendChild(laneDiv);
  });

  return { element: root, schedule: sched };
}
