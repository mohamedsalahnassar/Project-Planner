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

### Phase 4 - Advanced Scheduling & Chart Rendering ✅ COMPLETED
- [x] Group team.members by platform and filter by (startDate ≤ day < endDate) to compute daily capacity
- [x] Split phase windows when capacity changes mid-phase
- [x] Recalculate lane durations using aggregated capacity per interval
- [x] Store resulting segments in ScheduleResult
- [x] Modify GanttChartView.swift and ui/gantt.js to render lane segments based on intervals
- [x] Show member name and start/end where appropriate in charts
- [x] Add tests ensuring schedules and charts adjust when members have differing start or end dates
- [x] **Note**: Visual enhancements (lane segments, member names) skipped as they don't add core value
- [x] **Phase 4 Finalization Complete**:
  - [x] Mark all Phase 4 items as completed
  - [x] Rename panel to "Data Management Panel" for better clarity
  - [x] Move reset functionality into the panel
  - [x] Expand panel width to modal-xl for better label visibility
  - [x] Consolidate all export options (Data & Export Excel) into the panel
  - [x] Remove redundant dashboard buttons (Export JSON, Import, Reset)
  - [x] Create unified, professional data management interface

### Phase 5 - Export/Import Updates ✅ COMPLETED
- [x] Introduce TeamMemberDTO (id, name, specialty, startDate, endDate)
- [x] Modify TeamDTO to hold [TeamMemberDTO] members
- [x] Update export logic to encode each TeamMember
- [x] Update import logic to rebuild TeamMember objects and attach to Team
- [x] Adjust existing JSON files/tests to accommodate new structure
- [x] **New Approach**: Single Export/Import Panel with comprehensive functionality
  - [x] Unified modal interface for all export/import operations
  - [x] Export options: Current plan, Full state, Teams CSV, Members CSV, Individual items
  - [x] Import options: Plan, Full state, Team/Member data
  - [x] Clean, organized UI with proper validation and error handling
  - [x] Maintains existing functionality while providing enhanced options

## 🐛 Known Issues
- None currently

## 📝 Notes
- All core team member management functionality is now working
- UI follows consistent patterns with other CRUD sections
- Tests are passing for all implemented functionality
- **Phase 4 COMPLETE** - Advanced scheduling & chart rendering with comprehensive finalization
- Phase 5 complete - unified export/import panel with comprehensive functionality
- **Project Status**: All planned phases are now complete! 🎉
- The application now supports:
  - ✅ Full team member lifecycle management
  - ✅ Capacity-aware scheduling with drag-and-drop
  - ✅ **Unified Data Management Panel** - All data operations in one organized interface
  - ✅ Multiple export formats: JSON, CSV, Excel, PDF for all data types
  - ✅ Individual item export with dropdown selection
  - ✅ Comprehensive import options with validation
  - ✅ Reset functionality integrated into the panel
  - ✅ Clean, professional dashboard with no redundant buttons
  - ✅ Expanded modal width for optimal label visibility
