import { load, ensureSprints } from '../data.js';
import { buildProjects } from './projectList.js';
import { initManage } from './manageModal.js';
import './vendors.js';

load();
ensureSprints();

window.addEventListener('DOMContentLoaded', () => {
  buildProjects();
  initManage();
});
