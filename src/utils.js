import { state } from '../data.js';

export function byId(id){ return document.getElementById(id); }
export function fmt(d){ return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'}); }
export function daysBetween(a,b){ return Math.ceil((b-a)/86400000); }

export function effortTypes(){
  return (state.meta.effortTypes||[]).map(e=>e.key);
}
export function effortTypeTitle(k){
  return (state.meta.effortTypes||[]).find(e=>e.key===k)?.title || k;
}
export function effortTypeColor(k){
  return (state.meta.effortTypes||[]).find(e=>e.key===k)?.color || '#888';
}
