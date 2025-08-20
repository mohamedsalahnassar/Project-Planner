import { computeSchedule } from '../schedule.js';

export function renderGantt(plan, aggr, eff, getPhase, startDate, options={}){
  const sched = computeSchedule(plan, aggr, eff, getPhase, startDate, options);
  const root = options.container || document.createElement('div');
  root.className = 'gantt-chart';

  // basic rendering using absolute positioning
  const dayMs = 86400000;
  const totalDays = Math.max(1, Math.ceil((sched.chartEnd - sched.chartStart) / dayMs));
  const barHeight = options.barHeight || 10;

  sched.phaseWindows.forEach(pw => {
    // phase summary line
    const phaseDiv = document.createElement('div');
    phaseDiv.className = 'gantt-phase';
    const phaseLabel = document.createElement('span');
    phaseLabel.className = 'gantt-label';
    phaseLabel.textContent = getPhase(pw.ph)?.name || pw.ph;
    phaseDiv.appendChild(phaseLabel);

    const phaseBar = document.createElement('div');
    phaseBar.className = 'gantt-phase-bar';
    phaseBar.style.height = `${barHeight}px`;
    const phaseOffset = Math.floor((pw.start - sched.chartStart) / dayMs);
    const phaseDays = Math.max(1, Math.ceil((pw.end - pw.start) / dayMs));
    phaseBar.style.left = `${(phaseOffset / totalDays) * 100}%`;
    phaseBar.style.width = `${(phaseDays / totalDays) * 100}%`;
    phaseDiv.appendChild(phaseBar);
    root.appendChild(phaseDiv);

    // lanes within this phase
    sched.lanes.forEach(lane => {
      const laneDiv = document.createElement('div');
      laneDiv.className = `gantt-lane ${lane.cls || ''}`;
      const label = document.createElement('span');
      label.className = 'gantt-label';
      label.textContent = lane.name;
      laneDiv.appendChild(label);

      const info = pw.lanes.find(l => l.key === lane.key);
      if(info && info.days){
        const bar = document.createElement('div');
        bar.className = 'gantt-bar';
        bar.style.height = `${barHeight}px`;
        const offset = Math.floor((info.start - sched.chartStart) / dayMs);
        bar.style.left = `${(offset / totalDays) * 100}%`;
        bar.style.width = `${(info.days / totalDays) * 100}%`;
        if(lane.color) bar.style.background = lane.color;
        laneDiv.appendChild(bar);
      }

      root.appendChild(laneDiv);
    });
  });

  return { element: root, schedule: sched };
}
