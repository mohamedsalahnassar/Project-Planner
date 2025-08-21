import { computeSchedule } from '../schedule.js';

export function renderGantt(plan, aggr, eff, getPhase, startDate, options={}){
  const sched = computeSchedule(plan, aggr, eff, getPhase, startDate, options);
  const root = options.container || document.createElement('div');
  root.className = 'gantt-chart';

  const pxPerDay = options.pxPerDay || 18;
  const fontSize = Math.max(8, Math.min(16, Math.round(pxPerDay * 0.75)));
  root.style.fontSize = fontSize + 'px';
  const laneHeight = options.laneHeight || 52;
  const barHeight = Math.floor(laneHeight / 2);

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
      bar.style.top = `${(laneHeight - barHeight) / 2}px`;
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
      bar.style.top = `${(laneHeight - barHeight) / 2}px`;
      bar.style.height = `${barHeight}px`;
      bar.style.fontSize = '0.75em';
      laneDiv.appendChild(bar);
    });
    root.appendChild(laneDiv);
  }

  sched.lanes.forEach(lane => {
    const laneDiv = document.createElement('div');
    laneDiv.className = `gantt-lane ${lane.cls || ''}`;
    laneDiv.style.height = laneHeight + 'px';
    const label = document.createElement('span');
    label.className = 'gantt-label';
    label.textContent = lane.name;
    laneDiv.appendChild(label);

    sched.phaseWindows.forEach(pw => {
      const info = pw.lanes.find(l => l.key === lane.key);
      if(!info || !info.days) return;
      const bar = document.createElement('div');
      bar.className = 'gantt-bar';
      const offset = Math.floor((info.start - sched.chartStart) / dayMs);
      bar.style.left = `${(offset / totalDays) * 100}%`;
      bar.style.width = `${(info.days / totalDays) * 100}%`;
      if(lane.color) bar.style.background = lane.color;
      bar.style.top = `${(laneHeight - barHeight) / 2}px`;
      bar.style.height = `${barHeight}px`;
      laneDiv.appendChild(bar);
    });

    root.appendChild(laneDiv);
  });

  return { element: root, schedule: sched };
}
