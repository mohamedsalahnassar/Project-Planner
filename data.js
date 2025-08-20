export const STORAGE_KEY = 'project_planner_state';
export const DEFAULT_EFFORT_TYPES = [
  { key: 'iOS', title: 'iOS', color: '#4e79a7', locked: true },
  { key: 'Android', title: 'Android', color: '#59a14f', locked: true },
  { key: 'Online', title: 'Online', color: '#f28e2c', locked: true },
  { key: 'BE', title: 'BE', color: '#9c755f', locked: true },
  { key: 'QA', title: 'QA', color: '#edc948', locked: true }
];

export const state = {
  projects: [],
  proposals: [],
  tasks: [],
  teams: [],
  phases: [],
  sprints: [],
  meta: {
    startDate: new Date().toISOString().slice(0,10),
    efficiency: 1,
    effortTypes: DEFAULT_EFFORT_TYPES.map(e=> ({...e}))
  }
};

export function defaultPlanLanes(){
  return getEffortTypes().map(e=> ({ key: e.key, name: e.title, color: e.color }));
}

function ensurePlanLanes(){
  state.proposals.forEach(p=>{
    if(!Array.isArray(p.lanes)) p.lanes = defaultPlanLanes();
  });
}

export function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw) Object.assign(state, JSON.parse(raw));
    if(!Array.isArray(state.sprints)) state.sprints = [];
    if(Array.isArray(state.meta?.effortTypes)){
      if(typeof state.meta.effortTypes[0] === 'string'){
        const oldList = state.meta.effortTypes;
        state.meta.effortTypes = oldList.map(k => {
          const def = DEFAULT_EFFORT_TYPES.find(d=>d.key===k);
          return def ? { ...def } : { key:k, title:k, color:'#888', locked:false };
        });
      }
    }else{
      state.meta.effortTypes = [];
    }
    const present = new Set(state.meta.effortTypes.map(e=>e.key));
    DEFAULT_EFFORT_TYPES.forEach(d=>{ if(!present.has(d.key)) state.meta.effortTypes.push({...d}); });
    ensurePlanLanes();
  }catch(e){
    console.error('Failed to load saved state', e);
  }
  return state;
}

export function save(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }catch(e){
    console.error('Failed to save state', e);
  }
}

export function replaceState(newState){
  Object.keys(state).forEach(k => delete state[k]);
  Object.assign(state, newState);
  if(!Array.isArray(state.sprints)) state.sprints = [];
  ensurePlanLanes();
}

export function mergeState(newData){
  if(Array.isArray(newData.projects)) newData.projects.forEach(p=> state.projects.push(p));
  if(Array.isArray(newData.proposals)) newData.proposals.forEach(p=>{ if(!Array.isArray(p.lanes)) p.lanes = defaultPlanLanes(); state.proposals.push(p); });
  if(Array.isArray(newData.tasks)) newData.tasks.forEach(t=> state.tasks.push(t));
  if(Array.isArray(newData.teams)) newData.teams.forEach(t=> state.teams.push(t));
  if(Array.isArray(newData.phases)) newData.phases.forEach(ph=> state.phases.push(ph));
  if(Array.isArray(newData.sprints)) newData.sprints.forEach(s=> state.sprints.push(s));
  if(newData.meta) Object.assign(state.meta, newData.meta);
  ensurePlanLanes();
}

export function getEffortTypes(){
  return state.meta.effortTypes || [];
}

export function addEffortType(et){
  const list = getEffortTypes();
  if(list.some(e=>e.key===et.key)) return;
  list.push({key:et.key, title:et.title||et.key, color:et.color||'#888', locked:!!et.locked});
}

export function updateEffortType(key, data){
  const list = getEffortTypes();
  const et = list.find(e=>e.key===key);
  if(!et) return;
  if(data.title !== undefined) et.title = data.title;
  if(data.color !== undefined) et.color = data.color;
}

export function removeEffortType(key){
  const list = getEffortTypes();
  const idx = list.findIndex(e=>e.key===key);
  if(idx === -1 || list[idx].locked) return;
  list.splice(idx,1);
  state.tasks.forEach(t=>{
    t.efforts = (t.efforts||[]).filter(e=> e.platform !== key);
  });
  state.teams.forEach(tm=>{ if(tm.sizes) delete tm.sizes[key]; });
  state.proposals.forEach(p=>{
    if(p.overrides) Object.values(p.overrides).forEach(o=>{ delete o[key]; });
  });
}

const iso = d => d.toISOString().slice(0,10);

export function ensureSprints(startArg, endArg){
  let start, end;
  const day = 24 * 60 * 60 * 1000;
  if(typeof startArg === 'string' || startArg instanceof Date){
    const sd = new Date(startArg);
    start = Date.UTC(sd.getUTCFullYear(), sd.getUTCMonth(), sd.getUTCDate());
    const ed = endArg ? new Date(endArg) : new Date(sd);
    if(!endArg) ed.setUTCFullYear(sd.getUTCFullYear() + 2);
    end = Date.UTC(ed.getUTCFullYear(), ed.getUTCMonth(), ed.getUTCDate());
  }else{
    const now = new Date();
    const sYear = startArg ?? now.getUTCFullYear();
    const eYear = endArg ?? (sYear + 2);
    start = Date.UTC(sYear,0,1);
    end = Date.UTC(eYear,11,31);
  }

  state.sprints = [];
  const quarterCounts = {};
  for(let t=start; t<=end; t+=14*day){
    const sStart = new Date(t);
    const sEnd = new Date(t + 13*day);
    const year = sStart.getUTCFullYear();
    const yearShort = String(year).slice(2);
    const quarter = Math.floor(sStart.getUTCMonth()/3)+1;
    const key = `${year}-Q${quarter}`;
    const num = (quarterCounts[key]||0)+1; quarterCounts[key]=num;
    const name = `EVBUXCORE-Y${yearShort}-Q${quarter}-S${num}`;
    state.sprints.push({ id:`SPR-${iso(sStart)}`, name, start: iso(sStart), end: iso(sEnd) });
  }
  save();
}

export function resetSprints(startArg, endArg){
  ensureSprints(startArg, endArg);
}

export function getTeam(teamId){ return state.teams.find(t => t.id === teamId); }
export function getPhase(phaseId){ return state.phases.find(p => p.id === phaseId); }
export function getProject(projectId){ return state.projects.find(p => p.id === projectId); }

// Task ↔ Phase linking helpers
export function assignTaskToPhase(taskId, phaseId){
  const task = state.tasks.find(t => t.id === taskId);
  if(!task) return;
  const pid = phaseId != null ? String(phaseId) : '';
  const arr = task.phaseIds || (task.phaseIds = []);
  if(!arr.includes(pid)) arr.push(pid);
  const proposals = state.proposals.filter(p =>
    String(p.projectId ?? '') === String(task.projectId ?? '') &&
    (p.phaseIds || []).some(id => String(id) === pid)
  );
  task.assignments = task.assignments || [];
  proposals.forEach(p => {
    if(!task.assignments.some(a => a.proposalId === p.id && String(a.phaseId) === pid)){
      task.assignments.push({proposalId: p.id, phaseId: pid});
    }
  });
}

export function removeTaskFromPhase(taskId, phaseId){
  const task = state.tasks.find(t => t.id === taskId);
  if(!task) return;
  const pid = phaseId != null ? String(phaseId) : '';
  task.phaseIds = (task.phaseIds || []).filter(id => String(id) !== pid);
  const projIds = state.proposals
    .filter(p => String(p.projectId ?? '') === String(task.projectId ?? ''))
    .map(p => p.id);
  task.assignments = (task.assignments || []).filter(a =>
    !(projIds.includes(a.proposalId) && String(a.phaseId) === pid)
  );
}

export function getTaskPhaseIds(task){
  const set = new Set((task.phaseIds || []).map(id => String(id)));
  (task.assignments || []).forEach(a => set.add(String(a.phaseId)));
  return Array.from(set);
}

export function getTasksByPhase(projectId, phaseId){
  const pid = projectId != null ? String(projectId) : '';
  const phid = phaseId != null ? String(phaseId) : '';
  return state.tasks.filter(t =>
    String(t.projectId ?? '') === pid &&
    getTaskPhaseIds(t).some(id => id === phid)
  );
}

export function getTasksByProject(projectId){
  const pid = projectId != null ? String(projectId) : '';
  return state.tasks.filter(t => String(t.projectId ?? '') === pid);
}
