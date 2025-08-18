export const STORAGE_KEY = 'project_planner_state';
export const state = {
  projects: [],
  proposals: [],
  tasks: [],
  teams: [],
  phases: [],
  meta: {
    startDate: new Date().toISOString().slice(0,10),
    efficiency: 1,
    effortTypes: ['BE','iOS','Android','Online','QA']
  }
};

export function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw) Object.assign(state, JSON.parse(raw));
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
}

export function removeEffortType(key){
  const list = state.meta.effortTypes || [];
  const idx = list.indexOf(key);
  if(idx === -1) return;
  list.splice(idx, 1);
  state.tasks.forEach(t => {
    t.efforts = (t.efforts || []).filter(e => e.platform !== key);
  });
  state.teams.forEach(tm => {
    if(tm.sizes) delete tm.sizes[key];
  });
  state.proposals.forEach(p => {
    if(p.overrides) Object.values(p.overrides).forEach(o => { delete o[key]; });
  });
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
