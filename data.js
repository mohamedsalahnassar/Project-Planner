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
  }catch(e){}
  return state;
}

export function save(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
}

export function replaceState(newState){
  Object.keys(state).forEach(k=> delete state[k]);
  Object.assign(state, newState);
}

export function getTeam(teamId){ return state.teams.find(t => t.id === teamId); }
export function getPhase(phaseId){ return state.phases.find(p => p.id === phaseId); }
export function getProject(projectId){ return state.projects.find(p => p.id === projectId); }
