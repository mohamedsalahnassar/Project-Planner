import { computeSchedule } from '../schedule.js';

const dayMs = 86400000;

/**
 * Render a Gantt chart using dhtmlxGantt. This replaces the previous
 * hand-crafted DOM renderer and plugs directly into the dhtmlx engine.
 *
 * @param {object} plan   Plan object containing phases and lane metadata.
 * @param {object} aggr   Aggregated effort data from schedule.aggregate.
 * @param {number} eff    Team efficiency multiplier.
 * @param {Function} getPhase Callback returning phase metadata by id.
 * @param {string|Date} startDate Schedule start date.
 * @param {object} options  Additional options:
 *   - container: DOM element to render into.
 *   - gantt: optional gantt instance (for testing).
 *   - onTaskUpdate: callback invoked after a task is moved/edited.
 */
export function renderGantt(plan, aggr, eff, getPhase, startDate, options = {}) {
  const sched = computeSchedule(plan, aggr, eff, getPhase, startDate, options);
  const container = options.container || document.createElement('div');
  const g = options.gantt || (typeof window !== 'undefined' ? window.gantt : null);
  if (!g) throw new Error('dhtmlxGantt is required');

  // prepare gantt config
  g.config.start_date = sched.chartStart;
  g.config.end_date = sched.chartEnd;
  if (g.plugins) {
    g.plugins({
      drag_timeline: true,
      marker: true,
      export_api: true,
      undo: true,
      zoom: true
    });
  }
  if (g.ext?.zoom) {
    g.ext.zoom.init({
      levels: [
        { name: 'day', scale_height: 27, min_column_width: 30, scales: [{ unit: 'day', step: 1, format: '%d %M' }] },
        { name: 'week', scale_height: 50, min_column_width: 50, scales: [{ unit: 'week', step: 1, format: 'Week %W' }] },
        { name: 'month', scale_height: 50, min_column_width: 70, scales: [{ unit: 'month', step: 1, format: '%F %Y' }] }
      ]
    });
  }

  g.init(container);
  g.clearAll();

  const tasks = [];
  const links = [];
  const prevByLane = {};

  // lane groups
  sched.lanes.forEach(l => {
    tasks.push({
      id: `lane_${l.key}`,
      text: l.name,
      type: 'project',
      open: true,
      color: l.color || undefined
    });
  });

  // phases for each lane
  sched.phaseWindows.forEach(pw => {
    pw.lanes.forEach(li => {
      if (!li.days) return;
      const laneMeta = sched.lanes.find(x => x.key === li.key) || {};
      const id = `${li.key}_${pw.ph}`;
      const text = getPhase(pw.ph)?.name || pw.ph;
      tasks.push({
        id,
        text,
        start_date: li.start,
        duration: li.days,
        parent: `lane_${li.key}`,
        color: laneMeta.color || undefined,
        lane: li.key,
        phase: pw.ph
      });
      if (prevByLane[li.key]) {
        links.push({ id: `link_${prevByLane[li.key]}_${id}`, source: prevByLane[li.key], target: id, type: '0' });
      }
      prevByLane[li.key] = id;
    });
  });

  g.parse({ data: tasks, links: [] });
  links.forEach(l => g.addLink && g.addLink(l));

  if (options.onTaskUpdate) {
    g.attachEvent('onAfterTaskUpdate', (id, item) => options.onTaskUpdate(id, item));
    g.attachEvent('onAfterTaskAdd', (id, item) => options.onTaskUpdate(id, item));
    g.attachEvent('onAfterTaskDelete', id => options.onTaskUpdate(id, null));
  }

  return { element: container, schedule: sched, gantt: g };
}

