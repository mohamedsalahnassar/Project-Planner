import { computeSchedule } from '../schedule.js';

// Assign a row index to each segment so that overlapping bars
// are displayed on separate lines. Mutates each segment with `row`.
export function stackOverlaps(segs){
  const dayMs = 86400000;
  const sorted = segs.slice().sort((a,b)=> a.start - b.start);
  const rowEnd = [];
  sorted.forEach(s => {
    const end = new Date(s.start.getTime() + (s.days || 0) * dayMs);
    let placed = false;
    for(let i=0;i<rowEnd.length;i++){
      if(s.start >= rowEnd[i]){ rowEnd[i] = end; s.row = i; placed=true; break; }
    }
    if(!placed){ rowEnd.push(end); s.row = rowEnd.length-1; }
  });
  return sorted;
}

export function renderGantt(plan, aggr, eff, getPhase, startDate, options={}){
  const sched = computeSchedule(plan, aggr, eff, getPhase, startDate, options);
  const root = options.container || document.createElement('div');
  root.className = 'gantt-chart';
  root.style.display = 'flex';
  root.style.flexDirection = 'column';
  root.style.gap = '4px';

  const dayMs = 86400000;
  const totalDays = Math.max(1, Math.ceil((sched.chartEnd - sched.chartStart) / dayMs));
  const barHeight = options.barHeight || 6;
  const labelWidth = options.labelWidth || 120;

  sched.phaseWindows.forEach(pw => {
    const group = document.createElement('div');
    group.className = 'gantt-phase-group';

    // phase summary line
    const phaseRow = document.createElement('div');
    phaseRow.className = 'gantt-phase';
    phaseRow.style.display = 'flex';
    phaseRow.style.alignItems = 'center';

    const phaseLabel = document.createElement('span');
    phaseLabel.className = 'gantt-label';
    phaseLabel.textContent = getPhase(pw.ph)?.name || pw.ph;
    phaseLabel.style.width = `${labelWidth}px`;
    phaseRow.appendChild(phaseLabel);

    const phaseTrack = document.createElement('div');
    phaseTrack.style.position = 'relative';
    phaseTrack.style.flex = '1';
    phaseTrack.style.height = `${barHeight}px`;
    phaseRow.appendChild(phaseTrack);

    const phaseBar = document.createElement('div');
    phaseBar.className = 'gantt-phase-bar';
    phaseBar.style.position = 'absolute';
    phaseBar.style.top = '0';
    phaseBar.style.height = '100%';
    const phaseOffset = Math.floor((pw.start - sched.chartStart) / dayMs);
    const phaseDays = Math.max(1, Math.ceil((pw.end - pw.start) / dayMs));
    phaseBar.style.left = `${(phaseOffset / totalDays) * 100}%`;
    phaseBar.style.width = `${(phaseDays / totalDays) * 100}%`;
    phaseBar.style.background = '#6fa8dc';
    phaseBar.style.borderRadius = '4px';
    phaseTrack.appendChild(phaseBar);

    group.appendChild(phaseRow);

    // group lanes by key to allow multiple bars per lane
    const laneGroups = {};
    pw.lanes.forEach(l => { (laneGroups[l.key] ||= []).push(l); });
    Object.entries(laneGroups).forEach(([key, segs]) => {
      const laneMeta = sched.lanes.find(l => l.key === key) || {key, name:key};
      // assign rows for overlapping segments
      const stacked = stackOverlaps(segs.map(s => ({...s})));
      const rows = Math.max(1, ...stacked.map(s => s.row+1));

      const laneRow = document.createElement('div');
      laneRow.className = `gantt-lane ${laneMeta.cls || ''}`;
      laneRow.style.display = 'flex';
      laneRow.style.alignItems = 'flex-start';

      const label = document.createElement('span');
      label.className = 'gantt-label';
      label.textContent = laneMeta.name;
      label.style.width = `${labelWidth}px`;
      laneRow.appendChild(label);

      const track = document.createElement('div');
      track.style.position = 'relative';
      track.style.flex = '1';
      track.style.height = `${rows * barHeight}px`;
      laneRow.appendChild(track);

      stacked.forEach(info => {
        const bar = document.createElement('div');
        bar.className = 'gantt-bar';
        bar.style.position = 'absolute';
        bar.style.top = `${info.row * barHeight}px`;
        bar.style.height = `${barHeight}px`;
        const offset = Math.floor((info.start - sched.chartStart) / dayMs);
        bar.style.left = `${(offset / totalDays) * 100}%`;
        bar.style.width = `${(info.days / totalDays) * 100}%`;
        bar.style.background = laneMeta.color || '#888';
        bar.style.borderRadius = '4px';
        track.appendChild(bar);
      });

      group.appendChild(laneRow);
    });

    root.appendChild(group);
  });

  return { element: root, schedule: sched };
}
