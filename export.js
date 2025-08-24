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

// Helper function to export team with member assignments
export function exportTeamJSON(team){
  return JSON.stringify(team, null, 2);
}

// Helper function to import team with member assignments
export function importTeamJSON(json){
  const obj = JSON.parse(json);
  if(!obj || typeof obj !== 'object') throw new Error('Invalid JSON');
  if(!obj.id || !obj.name) throw new Error('Missing required team fields');
  
  // Ensure memberAssignments array exists and has required fields
  if(!Array.isArray(obj.memberAssignments)) {
    obj.memberAssignments = [];
  } else {
    obj.memberAssignments.forEach(assignment => {
      if(!assignment.id || !assignment.memberId || !assignment.startDate) {
        throw new Error('Invalid team member assignment data');
      }
    });
  }
  
  return obj;
}

// Helper function to validate team member assignment data
export function validateTeamMemberAssignment(assignment){
  if(!assignment.id || !assignment.memberId || !assignment.startDate) {
    throw new Error('Invalid team member assignment data');
  }
  
  // Validate dates
  const startDate = new Date(assignment.startDate);
  if(isNaN(startDate.getTime())) {
    throw new Error('Invalid start date');
  }
  
  if(assignment.endDate) {
    const endDate = new Date(assignment.endDate);
    if(isNaN(endDate.getTime())) {
      throw new Error('Invalid end date');
    }
    if(endDate <= startDate) {
      throw new Error('End date must be after start date');
    }
  }
  
  return true;
}

// Helper function to export team member
export function exportTeamMemberJSON(member){
  return JSON.stringify(member, null, 2);
}

// Helper function to import team member
export function importTeamMemberJSON(json){
  const obj = JSON.parse(json);
  if(!obj || typeof obj !== 'object') throw new Error('Invalid JSON');
  if(!obj.id || !obj.name || !obj.specialty) throw new Error('Missing required team member fields');
  return obj;
}
