import { test } from 'node:test';
import assert from 'node:assert/strict';
import { state, replaceState, assignTaskToPhase, removeTaskFromPhase, getTasksByPhase, getTasksByProject, mergeState, ensureSprints, addRelease, updateRelease, removeRelease } from '../data.js';

globalThis.localStorage = {
  getItem(){ return null; },
  setItem(){},
};

test('replaceState swaps state object contents', () => {
  const initial = {
    projects: [{ id: 1 }],
    proposals: [],
    tasks: [],
    teams: [],
    phases: [],
    meta: {}
  };
  replaceState(initial);
  assert.equal(state.projects.length, 1);

  const next = {
    projects: [],
    proposals: [],
    tasks: [],
    teams: [],
    phases: [],
    meta: {}
  };
  replaceState(next);
  assert.equal(state.projects.length, 0);
});

test('assignTaskToPhase handles multiple phases without duplicates', () => {
  replaceState({
    projects: [],
    proposals: [],
    tasks: [{id:1, projectId:2}],
    teams: [],
    phases: [],
    meta: {}
  });
  assignTaskToPhase(1, 'p1');
  assignTaskToPhase(1, 'p1'); // duplicate ignored
  assignTaskToPhase(1, 'p2');
  assignTaskToPhase(1, 3); // numeric id stored as string
  assert.deepEqual(state.tasks[0].phaseIds, ['p1','p2','3']);
  removeTaskFromPhase(1, 'p1');
  removeTaskFromPhase(1, 3); // accepts numeric removal
  assert.deepEqual(state.tasks[0].phaseIds, ['p2']);
  const res = getTasksByPhase(2, 'p2');
  assert.equal(res.length, 1);
  });

test('getTasksByProject filters tasks by project', () => {
  replaceState({
    projects: [],
    proposals: [],
    tasks: [{id:1, projectId:'a'}, {id:2, projectId:'b'}],
    teams: [],
    phases: [],
    meta: {}
  });
  const res = getTasksByProject('a');
  assert.equal(res.length, 1);
  assert.equal(res[0].id, 1);
});

test('assignTaskToPhase synchronizes assignments with project proposals', () => {
  replaceState({
    projects:[{id:'p'}],
    proposals:[{id:'plan1', projectId:'p', phaseIds:['ph1']},{id:'plan2', projectId:'p', phaseIds:['ph2']}],
    tasks:[{id:'t1', projectId:'p'}],
    teams:[], phases:[], meta:{},
  });
  assignTaskToPhase('t1','ph1');
  assert.deepEqual(state.tasks[0].assignments, [{proposalId:'plan1', phaseId:'ph1'}]);
  assignTaskToPhase('t1','ph2');
  assert.equal(state.tasks[0].assignments.length,2);
  removeTaskFromPhase('t1','ph1');
  assert.deepEqual(state.tasks[0].assignments, [{proposalId:'plan2', phaseId:'ph2'}]);
});

test('getTasksByProject matches numeric and string ids', () => {
  replaceState({
    projects: [],
    proposals: [],
    tasks: [{id:1, projectId:1}, {id:2, projectId:'2'}],
    teams: [],
    phases: [],
    meta: {},
  });
  assert.equal(getTasksByProject(1).length, 1);
  const res = getTasksByProject('2');
  assert.equal(res.length, 1);
  assert.equal(res[0].id, 2);
});

test('getTasksByPhase matches numeric and string ids', () => {
  replaceState({
    projects: [],
    proposals: [],
    tasks: [
      {id:1, projectId:1, phaseIds:[1]},
      {id:2, projectId:'1', phaseIds:['2']},
    ],
    teams: [],
    phases: [],
    meta: {},
  });
  const r1 = getTasksByPhase(1, '1');
  assert.equal(r1.length, 1);
  assert.equal(r1[0].id, 1);
  const r2 = getTasksByPhase('1', 2);
  assert.equal(r2.length, 1);
  assert.equal(r2[0].id, 2);
});

test('getTasksByPhase uses assignments when phaseIds missing', () => {
  replaceState({
    projects:[{id:'p'}],
    proposals:[{id:'plan', projectId:'p', phaseIds:['ph']}],
    tasks:[{id:'t', projectId:'p', assignments:[{proposalId:'plan', phaseId:'ph'}]}],
    teams:[], phases:[], meta:{},
  });
  const res = getTasksByPhase('p','ph');
  assert.equal(res.length,1);
  assert.equal(res[0].id,'t');
});

test('mergeState appends projects without removing existing', () => {
  replaceState({ projects:[{id:'a'}], proposals:[], tasks:[], teams:[], phases:[], sprints:[], meta:{} });
  mergeState({ projects:[{id:'b'}], proposals:[], tasks:[], teams:[], phases:[], sprints:[], meta:{} });
  assert.equal(state.projects.length,2);
  assert.ok(state.projects.find(p=>p.id==='a'));
  assert.ok(state.projects.find(p=>p.id==='b'));
});

test('ensureSprints defaults to current year and +2', () => {
  replaceState({ projects:[], proposals:[], tasks:[], teams:[], phases:[], sprints:[], meta:{} });
  ensureSprints();
  assert.ok(state.sprints.length > 0);
  const firstYear = new Date(state.sprints[0].start).getUTCFullYear();
  const lastYear = new Date(state.sprints[state.sprints.length - 1].start).getUTCFullYear();
  const nowYear = new Date().getUTCFullYear();
  assert.equal(firstYear, nowYear);
  assert.equal(lastYear, nowYear + 2);
});

test('ensureSprints uses provided start and end years', () => {
  replaceState({ projects:[], proposals:[], tasks:[], teams:[], phases:[], sprints:[], meta:{} });
  ensureSprints(2020, 2021);
  assert.ok(state.sprints.length > 0);
  const firstYear = new Date(state.sprints[0].start).getUTCFullYear();
  const lastYear = new Date(state.sprints[state.sprints.length - 1].start).getUTCFullYear();
  assert.equal(firstYear, 2020);
  assert.equal(lastYear, 2021);
});

test('ensureSprints accepts custom start date', () => {
  replaceState({ projects:[], proposals:[], tasks:[], teams:[], phases:[], sprints:[], meta:{} });
  ensureSprints('2024-03-04');
  assert.equal(state.sprints[0].start, '2024-03-04');
  const lastYear = new Date(state.sprints[state.sprints.length - 1].start).getUTCFullYear();
  assert.equal(lastYear, 2026);
});

test('release CRUD functions manage state.releases', () => {
  replaceState({ projects:[], proposals:[], tasks:[], teams:[], phases:[], sprints:[], releases:[], meta:{} });
  addRelease({id:'rel1', version:'1.0', codeFreeze:'2024-01-01', releaseDate:'2024-01-15'});
  assert.equal(state.releases.length, 1);
  updateRelease('rel1', {version:'1.1'});
  assert.equal(state.releases[0].version, '1.1');
  removeRelease('rel1');
  assert.equal(state.releases.length, 0);
});
