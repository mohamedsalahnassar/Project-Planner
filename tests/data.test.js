import { test } from 'node:test';
import assert from 'node:assert/strict';
import { state, replaceState } from '../data.js';

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
