export const STORAGE_KEY = 'project_planner_state';
export const state = {
  projects: [],
  proposals: [],
  tasks: [],
  teams: [],
  phases: [],
  meta: { startDate: new Date().toISOString().slice(0,10), efficiency: 1 }
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

export function getTeam(teamId){ return state.teams.find(t => t.id === teamId); }
export function getPhase(phaseId){ return state.phases.find(p => p.id === phaseId); }
export function getProject(projectId){ return state.projects.find(p => p.id === projectId); }

// Task ↔ Phase linking helpers
export function assignTaskToPhase(taskId, phaseId){
  const task = state.tasks.find(t => t.id === taskId);
  if(!task) return;
  const arr = task.phaseIds || (task.phaseIds = []);
  if(!arr.includes(phaseId)) arr.push(phaseId);
}

export function removeTaskFromPhase(taskId, phaseId){
  const task = state.tasks.find(t => t.id === taskId);
  if(!task || !task.phaseIds) return;
  task.phaseIds = task.phaseIds.filter(id => id !== phaseId);
}

export function getTasksByPhase(projectId, phaseId){
  return state.tasks.filter(t => t.projectId === projectId && (t.phaseIds || []).includes(phaseId));
}

export function getTasksByProject(projectId){
  return state.tasks.filter(t => t.projectId === projectId);
}
