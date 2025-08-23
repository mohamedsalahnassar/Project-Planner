# Project Planner - Team Member Management TODO

## ✅ Completed Tasks

### Phase 1 - Team Member Integration
- [x] Remove numeric fields in Team and expose computed dictionary/sizes getter
- [x] Adjust default team creation to seed with sample members
- [x] Change team records to hold members array instead of sizes
- [x] Provide helper functions to compute size per specialty from members
- [x] Update UI helpers and consumer code to use these helpers
- [x] Modify plan/member UI to display and edit optional endDate
- [x] Migrate sample data to include reasonable end-date defaults

### Phase 2 - UI/Scheduling Enhancements
- [x] Ensure calculations and charts consider team member start/end dates
- [x] Reorder UI layout: Phase schedule table under chart, then effort breakdown and team capacity
- [x] Make all tables under chart collapsible, collapsed by default with persistence
- [x] Use effort corresponding color to identify resources in team members table

### Phase 3 - Team Member CRUD Refactor
- [x] Refactor team members implementation into its own CRUD under configurations panel
- [x] Allow adding team member by specifying name and specialty
- [x] Team member assignable to multiple squads (teams) at the same time
- [x] Add team member to team within Teams CRUD with start date and optional end date
- [x] Prevent adding same member again for same period on same team
- [x] Fix missing getAllTeamMembers and related function imports
- [x] Fix missing openEditModal and closeEditModal functions
- [x] Fix undefined specialty dropdown in team member modal
- [x] Add "Add All Available Members" button to team editor
- [x] Add duplicate functionality for team members
- [x] Validate that member names are unique
- [x] Update table structure to match other CRUDs (actions aligned right, text instead of icons)

## 🔄 In Progress
- None currently

## 📋 Pending Tasks

### Phase 4 - Advanced Scheduling & Chart Rendering
- [ ] Group team.members by platform and filter by (startDate ≤ day < endDate) to compute daily capacity
- [ ] Split phase windows when capacity changes mid-phase
- [ ] Recalculate lane durations using aggregated capacity per interval
- [ ] Store resulting segments in ScheduleResult
- [ ] Modify GanttChartView.swift and ui/gantt.js to render lane segments based on intervals
- [ ] Show member name and start/end where appropriate in charts
- [ ] Add tests ensuring schedules and charts adjust when members have differing start or end dates

### Phase 5 - Export/Import Updates
- [ ] Introduce TeamMemberDTO (id, name, specialty, startDate, endDate)
- [ ] Modify TeamDTO to hold [TeamMemberDTO] members
- [ ] Update export logic to encode each TeamMember
- [ ] Update import logic to rebuild TeamMember objects and attach to Team
- [ ] Adjust existing JSON files/tests to accommodate new structure

## 🐛 Known Issues
- None currently

## 📝 Notes
- All core team member management functionality is now working
- UI follows consistent patterns with other CRUD sections
- Tests are passing for all implemented functionality
- Ready for advanced scheduling and chart rendering features
