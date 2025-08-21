import { computeSchedule } from '../schedule.js';

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

    // lanes within this phase
    pw.lanes.forEach(info => {
      const laneMeta = sched.lanes.find(l => l.key === info.key) || {key:info.key, name:info.key};
      const laneRow = document.createElement('div');
      laneRow.className = `gantt-lane ${laneMeta.cls || ''}`;
      laneRow.style.display = 'flex';
      laneRow.style.alignItems = 'center';

      const label = document.createElement('span');
      label.className = 'gantt-label';
      label.textContent = laneMeta.name;
      label.style.width = `${labelWidth}px`;
      laneRow.appendChild(label);

      const track = document.createElement('div');
      track.style.position = 'relative';
      track.style.flex = '1';
      track.style.height = `${barHeight}px`;
      laneRow.appendChild(track);

      const bar = document.createElement('div');
      bar.className = 'gantt-bar';
      bar.style.position = 'absolute';
      bar.style.top = '0';
      bar.style.height = '100%';
      const offset = Math.floor((info.start - sched.chartStart) / dayMs);
      bar.style.left = `${(offset / totalDays) * 100}%`;
      bar.style.width = `${(info.days / totalDays) * 100}%`;
      bar.style.background = laneMeta.color || '#888';
      bar.style.borderRadius = '4px';
      track.appendChild(bar);

      group.appendChild(laneRow);
    });

    root.appendChild(group);
  });

  return { element: root, schedule: sched };
}
