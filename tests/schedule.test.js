import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aggregate, computeSchedule } from '../schedule.js';

const dayMs = 86400000;
function dummyPhase(id){ return {id, order:1}; }
function getTeam(){ return {sizes:{BE:1,iOS:1,Android:1,Online:1,QA:1}}; }
function sampleTasks(){
  return [{
    projectId:1,
    startDate:'2024-01-01',
    assignments:[{proposalId:1, phaseId:'p1'}],
    efforts:[{platform:'BE', manDays:10},{platform:'QA', manDays:2},{platform:'iOS', manDays:4}]
  }];
}

test('aggregate applies buffer and handles zero team members', () => {
  const plan = {id:1, projectId:1, teamId:1, phaseIds:['p1'], bufferPct:10};
  const tasks = sampleTasks();
  const getZeroTeam = () => ({sizes:{BE:0,iOS:1,Android:1,Online:1,QA:1}});
  const aggr = aggregate(plan, tasks, getZeroTeam);
  assert.strictEqual(aggr.phaseTotals['p1'].BE, 11);
  assert.strictEqual(aggr.team.BE, 0);
});

test('computeSchedule supports QA after FE rule', () => {
  const plan = {id:1, projectId:1, teamId:1, phaseIds:['p1']};
  const tasks = sampleTasks();
  const aggr = aggregate({...plan, bufferPct:0}, tasks, getTeam);
  const sched = computeSchedule(plan, aggr, 1, dummyPhase, '2024-01-01', {qaStart:'afterFE'});
  const lanes = sched.phaseWindows[0].lanes;
  const ios = lanes.find(l=>l.key==='iOS');
  const qa = lanes.find(l=>l.key==='QA');
  const diffDays = Math.round((qa.start - ios.start)/dayMs);
  assert.strictEqual(diffDays, ios.days);
});

test('computeSchedule respects overrides', () => {
  const plan = {id:1, projectId:1, teamId:1, phaseIds:['p1'], overrides:{'p1':{QA:'2024-01-10'}}};
  const tasks = sampleTasks();
  const aggr = aggregate(plan, tasks, getTeam);
  const sched = computeSchedule(plan, aggr, 1, dummyPhase, '2024-01-01');
  const qa = sched.phaseWindows[0].lanes.find(l=>l.key==='QA');
  assert.strictEqual(qa.start.toISOString().slice(0,10), '2024-01-10');
});
