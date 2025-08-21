import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderGantt } from '../ui/gantt.js';
import { aggregate } from '../schedule.js';

function dummyPhase(id){ return {id, name:id, order:1}; }
function getTeam(){ return {sizes:{BE:1}}; }

const plan = {
  id:1,
  projectId:1,
  teamId:1,
  phaseIds:['p1','p2'],
  lanes:[{key:'BE', name:'BE', color:'#ff0000'}]
};

const tasks = [
  {projectId:1, startDate:'2024-01-01', phaseIds:['p1'], efforts:[{platform:'BE', manDays:5}]},
  {projectId:1, startDate:'2024-01-15', phaseIds:['p2'], efforts:[{platform:'BE', manDays:3}]}
];

test('renderGantt outputs lane tasks and dependencies', () => {
  const aggr = aggregate(plan, tasks, getTeam);
  const stub = {
    config:{},
    parsed:null,
    links:[],
    events:[],
    plugins: () => {},
    ext:{ zoom:{ init: () => {} } },
    init: () => {},
    clearAll: () => {},
    parse: data => { stub.parsed = data; },
    addLink: link => { stub.links.push(link); },
    attachEvent: (name) => { stub.events.push(name); }
  };

  const res = renderGantt(plan, aggr, 1, dummyPhase, '2024-01-01', {gantt:stub, container:{}, onTaskUpdate:()=>{}});

  assert.strictEqual(stub.config.start_date.toISOString(), res.schedule.chartStart.toISOString());
  const lane = stub.parsed.data.find(t => t.id === 'lane_BE');
  assert.ok(lane, 'lane group created');
  assert.strictEqual(lane.color, '#ff0000');
  assert.strictEqual(stub.links.length, 1);
  assert.ok(stub.events.includes('onAfterTaskUpdate'));
});

