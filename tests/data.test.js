import { test } from 'node:test';
import assert from 'node:assert/strict';
import { state, replaceState, assignTaskToPhase, removeTaskFromPhase, getTasksByPhase, getTasksByProject } from '../data.js';

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
