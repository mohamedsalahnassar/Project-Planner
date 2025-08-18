import assert from 'node:assert/strict';
import { test } from 'node:test';
import { importPlanJSON, validateColumns } from '../export.js';

test('importPlanJSON requires id and name', () => {
  assert.throws(() => importPlanJSON('{}'));
});

test('validateColumns throws for missing fields', () => {
  assert.throws(() => validateColumns({id:1}, ['id','name']));
});
