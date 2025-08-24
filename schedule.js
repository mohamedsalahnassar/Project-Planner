import { getTaskPhaseIds, getTeamSizesForDate, getTeamSizes } from './data.js';

// Compute daily capacity (per business day) for a team between startDate and endDate
export function computeDailyCapacity(team, startDate, endDate, teamMembers = []){
  if(!team || !Array.isArray(team.memberAssignments)) return [];
  
  const segments = [];
  let cur = new Date(startDate);
  const end = new Date(endDate);
  
  function isWeekend(d){ const k=d.getDay(); return k===0||k===6; }
  
  while(cur <= end){
    if(!isWeekend(cur)){
      const dayCap = {};
      
      team.memberAssignments.forEach(a=>{
        if(!a || !a.startDate) return;
        
        const s = new Date(a.startDate);
        const e = a.endDate ? new Date(a.endDate) : null;
        
        if(s <= cur && (!e || cur < e)){
          // Get specialty from team member data
          const member = teamMembers.find(m => m.id === a.memberId);
          if (member && member.specialty) {
            dayCap[member.specialty] = (dayCap[member.specialty]||0) + 1;
          }
        }
      });
      
      // Only add segment if there's capacity
      if (Object.keys(dayCap).length > 0) {
        segments.push({ date: new Date(cur), capacity: dayCap });
      }
    }
    cur.setDate(cur.getDate()+1);
  }
  return segments;
}

// Identify dates where any specialty capacity changes
export function findCapacityChangePoints(capacitySegments){
  const points = [];
  for(let i=1;i<capacitySegments.length;i++){
    const prev = capacitySegments[i-1]?.capacity || {};
    const curr = capacitySegments[i]?.capacity || {};
    const keys = new Set([...Object.keys(prev), ...Object.keys(curr)]);
    for(const k of keys){
      if((prev[k]||0) !== (curr[k]||0)){ points.push(capacitySegments[i].date); break; }
    }
  }
  return points;
}

// Helper to get capacity for a date range (use capacity of the range start)
export function getCapacityForDateRange(capacitySegments, startDate){
  if (!capacitySegments || capacitySegments.length === 0) return {};
  
  // Find the last segment whose date <= startDate
  let selectedSegment = null;
  for (let i = capacitySegments.length - 1; i >= 0; i--) {
    if (capacitySegments[i].date <= startDate) {
      selectedSegment = capacitySegments[i];
      break;
    }
  }
  
  // If no segment found, use the first available segment
  if (!selectedSegment && capacitySegments.length > 0) {
    selectedSegment = capacitySegments[0];
  }
  
  return selectedSegment ? selectedSegment.capacity : {};
}

// New function: Calculate task duration considering capacity changes during the work period
export function calculateTaskDurationWithCapacityChanges(manDays, specialty, startDate, capacitySegments, efficiency = 1.0, buffer = 0){
  if (!manDays || manDays <= 0) return 0;
  
  // Apply buffer to man-days
  const adjustedManDays = manDays * (1 + buffer);
  
  if (!capacitySegments || capacitySegments.length === 0) {
    // Fallback to simple calculation if no capacity data
    return Math.max(1, Math.ceil(adjustedManDays / efficiency));
  }
  
  // Find the capacity segment that contains the start date
  // A segment contains a date if: segment.date <= startDate < next_segment.date
  let startSegment = null;
  for (let i = 0; i < capacitySegments.length; i++) {
    const segment = capacitySegments[i];
    const nextSegment = capacitySegments[i + 1];
    
    if (segment.date <= startDate && (!nextSegment || startDate < nextSegment.date)) {
      startSegment = segment;
      break;
    }
  }
  
  if (!startSegment) {
    // If no segment found, use the first available segment
    const firstSegment = capacitySegments[0];
    if (firstSegment && firstSegment.capacity[specialty]) {
      return Math.max(1, Math.ceil(adjustedManDays / (firstSegment.capacity[specialty] * efficiency)));
    }
    // No capacity found for this specialty, fall back to simple calculation
    return Math.max(1, Math.ceil(adjustedManDays / efficiency));
  }
  
  // Get initial capacity for the specialty
  const initialCapacity = startSegment.capacity[specialty] || 0;
  if (initialCapacity <= 0) {
    // No capacity for this specialty at start date, fall back to simple calculation
    return Math.max(1, Math.ceil(adjustedManDays / efficiency));
  }
  
  // Check if this specialty has constant capacity throughout all segments
  let hasConstantCapacity = true;
  let constantCapacity = initialCapacity;
  
  for (const segment of capacitySegments) {
    if (segment.capacity[specialty] !== constantCapacity) {
      hasConstantCapacity = false;
      break;
    }
  }
  
  // If capacity is constant for this specialty, use simple calculation
  if (hasConstantCapacity && constantCapacity > 0) {
    return Math.max(1, Math.ceil(adjustedManDays / (constantCapacity * efficiency)));
  }
  
  // Simple calculation: if only one segment, use simple formula
  if (capacitySegments.length === 1) {
    return Math.max(1, Math.ceil(adjustedManDays / (initialCapacity * efficiency)));
  }
  
  // For capacity changes, we need to iterate through segments
  let remainingManDays = adjustedManDays;
  let currentDate = new Date(startDate);
  let totalDays = 0;
  
  // Find the starting segment index
  const startIndex = capacitySegments.findIndex(seg => seg === startSegment);
  
  // Iterate through capacity segments to calculate actual duration
  for (let i = startIndex; i < capacitySegments.length; i++) {
    const segment = capacitySegments[i];
    const segmentStart = new Date(segment.date);
    
    // Skip segments before our start date
    if (segmentStart < currentDate) continue;
    
    // Get capacity for this specialty in this segment
    const capacity = segment.capacity[specialty] || 0;
    if (capacity <= 0) continue; // No capacity in this segment
    
    // Calculate segment end date
    let segmentEnd;
    if (i < capacitySegments.length - 1) {
      segmentEnd = new Date(capacitySegments[i + 1].date);
    } else {
      // For the last segment, extend it far enough to complete the work
      segmentEnd = new Date(currentDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year fallback
    }
    
    // Calculate business days in this segment
    const businessDaysInSegment = businessDaysBetween(currentDate, segmentEnd);
    if (businessDaysInSegment <= 0) continue;
    
    // Calculate how many man-days we can complete in this segment
    const manDaysPossible = businessDaysInSegment * capacity * efficiency;
    
    if (manDaysPossible >= remainingManDays) {
      // We can complete the work in this segment
      const daysNeeded = Math.ceil(remainingManDays / (capacity * efficiency));
      totalDays += daysNeeded;
      break;
    } else {
      // Complete what we can in this segment
      remainingManDays -= manDaysPossible;
      totalDays += businessDaysInSegment;
      currentDate = new Date(segmentEnd);
    }
  }
  
  // If we couldn't complete the work with available capacity, estimate remaining days
  if (remainingManDays > 0) {
    const lastSegment = capacitySegments[capacitySegments.length - 1];
    if (lastSegment && lastSegment.capacity[specialty]) {
      const additionalDays = Math.ceil(remainingManDays / (lastSegment.capacity[specialty] * efficiency));
      totalDays += additionalDays;
    }
  }
  
  return Math.max(1, totalDays);
}

// Helper function for business days calculation (moved from computeSchedule)
export function businessDaysBetween(start, end) {
  if (end <= start) return 0;
  
  let count = 0;
  const current = new Date(start);
  
  // Set time to start of day for accurate comparison
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);
  
  // Count business days from start to end (exclusive of end date)
  // We need to iterate while current < endDate, not <=
  while (current < endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

// Split phase windows by capacity change points
export function splitPhasesByCapacity(phaseWindows, changePoints, capacitySegments){
  if(!Array.isArray(phaseWindows) || !Array.isArray(changePoints) || changePoints.length===0) return phaseWindows;
  const out = [];
  phaseWindows.forEach(pw =>{
    const phStart = new Date(pw.start);
    const phEnd = new Date(pw.end);
    const relevant = changePoints.filter(d => d>=phStart && d<=phEnd).sort((a,b)=>a-b);
    if(relevant.length===0){
      out.push({ ...pw, segments:[{ start: phStart, end: phEnd, capacity: getCapacityForDateRange(capacitySegments, phStart) }] });
      return;
    }
    const points = [phStart, ...relevant, phEnd];
    const segs = [];
    for(let i=0;i<points.length-1;i++){
      const s = points[i];
      const e = points[i+1];
      if(s < e){
        segs.push({ start: new Date(s), end: new Date(e), capacity: getCapacityForDateRange(capacitySegments, s) });
      }
    }
    out.push({ ...pw, segments: segs });
  });
  return out;
}

export function aggregate(plan, tasks, getTeam, targetDate = null, teamMembers = []){
  const team = getTeam(plan.teamId);
  const teamSizes = targetDate ? getTeamSizesForDate(team, targetDate) : getTeamSizes(team);
  const buffer = (plan.bufferPct||0)/100;
  const planPh = (plan.phaseIds||[]).map(id=> String(id));
  const phaseTotals = {};
  for(const pid of planPh){ phaseTotals[pid] = {earliest:null}; }
  tasks.forEach(t=>{
    if(String(t.projectId ?? '') !== String(plan.projectId ?? '')) return;
    const earliestTaskStart = (t.startDate && t.startDate.trim()) ? new Date(t.startDate) : null;
    getTaskPhaseIds(t).forEach(phId=>{
      const pid = String(phId);
      if(!planPh.includes(pid)) return;
      const rec = phaseTotals[pid] || (phaseTotals[pid]={earliest:null});
      (t.efforts||[]).forEach(eff=>{
        const md = +eff.manDays || 0; const plat = eff.platform;
        if(!(plat in rec)) rec[plat] = 0;
        rec[plat] += md;
      });
      if(earliestTaskStart){ rec.earliest = (!rec.earliest || earliestTaskStart < rec.earliest) ? earliestTaskStart : rec.earliest; }
    });
  });
  for(const phId of Object.keys(phaseTotals)){
    for(const k of Object.keys(phaseTotals[phId])){
      if(k==='earliest') continue;
      phaseTotals[phId][k] = +(phaseTotals[phId][k] * (1+buffer)).toFixed(1);
    }
  }

  // Capacity-aware additions: compute daily capacity and change points
  let capacitySegments = [];
  let changePoints = [];
  if(team && Array.isArray(team.memberAssignments) && team.memberAssignments.length){
    // Determine date range from assignments
    let earliest = null; let latest = null;
    team.memberAssignments.forEach(a=>{
      if(a?.startDate){ const d=new Date(a.startDate); if(!earliest || d<earliest) earliest=d; }
      if(a?.endDate){ const d=new Date(a.endDate); if(!latest || d>latest) latest=d; }
    });
    if(!earliest){ earliest = new Date(); }
    if(!latest){
      // Estimate latest based on total effort / current capacity
      const totalEffort = Object.values(phaseTotals).reduce((sum, rec)=> sum + Object.entries(rec).reduce((s,[k,v])=> k==='earliest'?s:s+(+v||0),0), 0);
      const totalCap = Object.values(teamSizes).reduce((s,n)=> s + (+n||0), 0) || 1;
      const days = Math.ceil(totalEffort / totalCap);
      latest = new Date(earliest.getTime()); latest.setDate(latest.getDate()+days+30); // +buffer
    }
    capacitySegments = computeDailyCapacity(team, earliest, latest, teamMembers);
    changePoints = findCapacityChangePoints(capacitySegments);
  }

  return { team: teamSizes, buffer, phaseTotals, capacitySegments, changePoints };
}

export function duration(md, eng, eff, startDate = null, capacitySegments = null, specialty = null, buffer = 0){ 
  if(!eng||eng<=0) return 0; 
  
  // Use capacity-aware calculation if we have the required data
  if (startDate && capacitySegments && specialty) {
    return calculateTaskDurationWithCapacityChanges(md, specialty, startDate, capacitySegments, eff, buffer);
  }
  
  // Fall back to simple calculation with buffer
  const adjustedManDays = md * (1 + buffer);
  return Math.max(1, Math.ceil(adjustedManDays/(eng*eff))); 
}
function addBusinessDays(d, n){
  const x = new Date(d.getTime());
  if(n >= 0){
    let added = 0;
    while(added < n){
      x.setDate(x.getDate()+1);
      const day = x.getDay();
      if(day !== 0 && day !== 6) added++;
    }
  }else{
    let added = 0;
    while(added > n){
      x.setDate(x.getDate()-1);
      const day = x.getDay();
      if(day !== 0 && day !== 6) added--;
    }
  }
  return x;
}

export const DEFAULT_STAGGER_DAYS = 5;

export function computeSchedule(plan, aggr, eff, getPhase, startDate, options={}){
  const planStart = new Date(startDate);
  const phases = plan.phaseIds.map(id=> getPhase(id)).filter(Boolean).sort((a,b)=>(a.order||0)-(b.order||0));
  let lanes = plan.lanes && plan.lanes.length ? plan.lanes.map(l=> ({...l})) : null;
  if(!lanes){
    const platformSet = new Set(Object.keys(aggr.team||{}));
    Object.values(aggr.phaseTotals||{}).forEach(rec=>{
      Object.keys(rec).forEach(k=>{ if(k!=='earliest') platformSet.add(k); });
    });
    let laneKeys = Array.from(platformSet);
    laneKeys.sort((a,b)=>{
      if(a==='BE') return -1; if(b==='BE') return 1;
      if(a==='QA') return 1; if(b==='QA') return -1;
      return a.localeCompare(b);
    });
    lanes = laneKeys.map(k=> ({key:k, name:k, cls:k.toLowerCase()}));
  }
  lanes = options.lanes || lanes;
  const qaRule = options.qaStart || 'half'; // 'half' or 'afterFE'
  const stagger = options.staggerDays ?? DEFAULT_STAGGER_DAYS;
  const phaseWindows = [];
  let prevEnd = null;
  
  for(const ph of phases){
    const totals = aggr.phaseTotals[ph.id] || {earliest:null};
    let phStart = prevEnd ? addBusinessDays(prevEnd, 1) : planStart;
    if(totals.earliest && totals.earliest > phStart) phStart = totals.earliest;
    const laneOut = [];
    const feLanes = lanes.filter(l=> l.key!=='BE' && l.key!=='QA');
    const qaLane = lanes.find(l=> l.key==='QA');
    const beLane = lanes.find(l=> l.key==='BE');
    const startMap = {};
    const dayMap = {};
    if(beLane){
      let beStart = phStart;
      const o = plan.overrides?.[ph.id] || {};
      if(o[beLane.key]) beStart = new Date(o[beLane.key]);
      const beDays = duration(totals[beLane.key]||0, aggr.team[beLane.key]||0, eff, beStart, aggr.capacitySegments, beLane.key, aggr.buffer);
      startMap[beLane.key]=beStart; dayMap[beLane.key]=beDays;
      laneOut.push({key:beLane.key, start:beStart, days:beDays});
    }
    feLanes.forEach(l=>{
      let start = addBusinessDays(phStart, stagger);
      const o = plan.overrides?.[ph.id] || {};
      if(o[l.key]) start = new Date(o[l.key]);
      const days = duration(totals[l.key]||0, aggr.team[l.key]||0, eff, start, aggr.capacitySegments, l.key, aggr.buffer);
      startMap[l.key]=start; dayMap[l.key]=days;
      laneOut.push({key:l.key, start, days});
    });
    if(qaLane){
      let start = addBusinessDays(phStart, stagger);
      const o = plan.overrides?.[ph.id] || {};
      if(o[qaLane.key]) start = new Date(o[qaLane.key]);
      else {
        const feMax = Math.max(0, ...feLanes.map(l=> dayMap[l.key]||0));
        const base = feLanes.length ? startMap[feLanes[0].key] : addBusinessDays(phStart, stagger);
        start = qaRule==='afterFE' ? addBusinessDays(base, feMax) : addBusinessDays(base, Math.floor(feMax*0.5));
      }
      const days = duration(totals[qaLane.key]||0, aggr.team[qaLane.key]||0, eff, start, aggr.capacitySegments, qaLane.key, aggr.buffer);
      startMap[qaLane.key]=start; dayMap[qaLane.key]=days;
      laneOut.push({key:qaLane.key, start, days});
    }
    const phEnd = laneOut.reduce((max, l)=>{
      const end = addBusinessDays(l.start, Math.max(1, l.days) - 1);
      return end>max ? end : max;
    }, laneOut[0]?.start || phStart);
    const earliestStart = laneOut.reduce((min, l)=> l.start < min ? l.start : min, laneOut[0]?.start || phStart);
    phaseWindows.push({ ph: ph.id, start: earliestStart, end: phEnd, lanes: laneOut });
    prevEnd = phEnd;
  }
  const chartStart = phaseWindows.length ? phaseWindows[0].start : planStart;
  const chartEnd = phaseWindows.length ? phaseWindows[phaseWindows.length-1].end : planStart;

  // Do not alter existing lanes; only compute split views for consumers
  const splitPhaseWindows = (aggr.changePoints && aggr.changePoints.length)
    ? splitPhasesByCapacity(phaseWindows, aggr.changePoints, aggr.capacitySegments||[])
    : phaseWindows;

  return { chartStart, chartEnd, lanes, phaseWindows, splitPhaseWindows, capacitySegments: aggr.capacitySegments||[], changePoints: aggr.changePoints||[] };
}

// New function: Dynamically reschedule a specific lane when start date changes
export function rescheduleLane(plan, aggr, eff, getPhase, startDate, phaseId, specialty, newStartDate) {
  // Create a copy of the plan with the new start date override
  const planCopy = { ...plan };
  if (!planCopy.overrides) planCopy.overrides = {};
  if (!planCopy.overrides[phaseId]) planCopy.overrides[phaseId] = {};
  
  // Set the new start date for this specialty in this phase
  planCopy.overrides[phaseId][specialty] = newStartDate;
  
  // Recompute the schedule with the new start date
  const newSchedule = computeSchedule(planCopy, aggr, eff, getPhase, startDate);
  
  return newSchedule;
}

// Helper function to update plan overrides and recalculate schedule
export function updatePlanOverride(plan, phaseId, specialty, newStartDate) {
  if (!plan.overrides) plan.overrides = {};
  if (!plan.overrides[phaseId]) plan.overrides[phaseId] = {};
  
  plan.overrides[phaseId][specialty] = newStartDate;
  return plan;
}
