import assert from 'node:assert/strict';
import { test } from 'node:test';
import { stackOverlaps } from '../ui/gantt.js';

test('stackOverlaps assigns rows to avoid overlap', () => {
  const segs = [
    {start: new Date('2024-01-01'), days:2},
    {start: new Date('2024-01-02'), days:2}, // overlaps with first
    {start: new Date('2024-01-04'), days:1}  // after overlap, back to first row
  ];
  const res = stackOverlaps(segs);
  assert.deepStrictEqual(res.map(s=> s.row), [0,1,0]);
});

