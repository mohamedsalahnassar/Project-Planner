import { load, ensureSprints, state, replaceState, save } from '../data.js';
import { buildProjects } from './projectList.js';
import { initManage } from './manageModal.js';
import { DEFAULT_DATA } from './defaultData.js';
import './vendors.js';

load();
if(!state.projects.length){
  replaceState(JSON.parse(JSON.stringify(DEFAULT_DATA)));
  save();
}
ensureSprints();

window.addEventListener('DOMContentLoaded', () => {
  buildProjects();
  initManage();
});
