import { computeSchedule } from '../schedule.js';

export function renderGantt(plan, aggr, eff, getPhase, startDate, options){
  const sched = computeSchedule(plan, aggr, eff, getPhase, startDate, options);
  return sched; // placeholder for real rendering logic
}
