import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aggregate, computeSchedule } from '../schedule.js';
import { state, removeEffortType, addEffortType } from '../data.js';

const dayMs = 86400000;
function dummyPhase(id){ return {id, order:1}; }
function getTeam(){ return {sizes:{BE:1,iOS:1,Android:1,Online:1,QA:1}}; }
function sampleTasks(){
  return [{
    projectId:1,
    startDate:'2024-01-01',
    phaseIds:['p1'],
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

test('aggregate counts assignments without phaseIds', () => {
  const plan = {id:'plan', projectId:'proj', teamId:1, phaseIds:['ph']};
  const tasks = [{projectId:'proj', assignments:[{proposalId:'plan', phaseId:'ph'}], efforts:[{platform:'BE', manDays:5}]}];
  const aggr = aggregate(plan, tasks, getTeam);
  assert.strictEqual(aggr.phaseTotals['ph'].BE, 5);
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

  test('computeSchedule allows custom stagger days', () => {
    const plan = {id:1, projectId:1, teamId:1, phaseIds:['p1']};
    const tasks = sampleTasks();
    const aggr = aggregate(plan, tasks, getTeam);
    const sched = computeSchedule(plan, aggr, 1, dummyPhase, '2024-01-01', {staggerDays:2});
    const lanes = sched.phaseWindows[0].lanes;
    const ios = lanes.find(l=>l.key==='iOS');
    const be = lanes.find(l=>l.key==='BE');
    const diffDays = Math.round((ios.start - be.start)/dayMs);
    assert.strictEqual(diffDays, 2);
  });

test('computeSchedule handles custom effort types', () => {
  const plan = {id:1, projectId:1, teamId:1, phaseIds:['p1']};
  const tasks = [{projectId:1, startDate:'2024-01-01', phaseIds:['p1'], efforts:[{platform:'DevOps', manDays:6}]}];
  const aggr = aggregate(plan, tasks, () => ({sizes:{BE:1,DevOps:2}}));
  const sched = computeSchedule(plan, aggr, 1, dummyPhase, '2024-01-01');
  const lane = sched.phaseWindows[0].lanes.find(l=> l.key==='DevOps');
  assert.ok(lane);
  assert.strictEqual(lane.days, 3);
});

test('removeEffortType purges data', () => {
  state.meta.effortTypes = [];
  addEffortType('BE','#000');
  addEffortType('DevOps','#111');
  state.tasks = [{efforts:[{platform:'BE',manDays:1},{platform:'DevOps',manDays:2}]}];
  state.teams = [{sizes:{BE:1,DevOps:2}}];
  state.proposals = [{overrides:{p1:{BE:'2024-01-01',DevOps:'2024-01-02'}}}];
  removeEffortType('DevOps');
  assert.deepStrictEqual(state.meta.effortTypes.map(e=>e.key), ['BE']);
  assert.deepStrictEqual(state.tasks[0].efforts, [{platform:'BE',manDays:1}]);
  assert.deepStrictEqual(state.teams[0].sizes, {BE:1});
  assert.deepStrictEqual(state.proposals[0].overrides.p1, {BE:'2024-01-01'});
});
