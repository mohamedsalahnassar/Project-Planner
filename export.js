export function exportPlanJSON(plan){
  return JSON.stringify(plan, null, 2);
}

export function importPlanJSON(json){
  const obj = JSON.parse(json);
  if(!obj || typeof obj !== 'object') throw new Error('Invalid JSON');
  if(!obj.id || !Array.isArray(obj.phaseIds)) throw new Error('Missing required fields');
  return obj;
}

export function validateColumns(row, required){
  const missing = required.filter(col => !(col in row));
  if(missing.length){
    throw new Error(`Missing columns: ${missing.join(', ')}`);
  }
}
