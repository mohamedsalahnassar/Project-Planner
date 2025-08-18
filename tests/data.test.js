import { test } from 'node:test';
import assert from 'node:assert/strict';
import { state, replaceState, assignTaskToPhase, removeTaskFromPhase, getTasksByPhase } from '../data.js';

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
  assert.deepEqual(state.tasks[0].phaseIds, ['p1','p2']);
  removeTaskFromPhase(1, 'p1');
  assert.deepEqual(state.tasks[0].phaseIds, ['p2']);
  const res = getTasksByPhase(2, 'p2');
  assert.equal(res.length, 1);
});
