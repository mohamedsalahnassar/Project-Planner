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

## 📋 Phase 6 - Plans Listing View Enhancements

### 🎨 UI/UX Improvements
- [ ] Analyze current plans listing layout and identify pain points
- [ ] Design new card-based or table-based layout with better visual hierarchy
- [ ] Add project status indicators (active, completed, draft)
- [ ] Implement sorting and filtering capabilities
- [ ] Add quick action buttons (view, edit, duplicate, delete)
- [ ] Improve responsive design for mobile/tablet views
- [ ] Add search functionality with real-time filtering
- [ ] Include plan metrics (duration, team size, complexity) in cards
- [ ] Add hover effects and smooth transitions
- [ ] Implement pagination or infinite scroll for large lists

### 🎯 Technical Implementation
- [ ] Refactor plans listing HTML structure
- [ ] Update CSS styles for new layout
- [ ] Implement JavaScript for sorting/filtering/search
- [ ] Add plan status calculation logic
- [ ] Create plan metrics calculation functions
- [ ] Implement responsive breakpoints
- [ ] Add accessibility features (ARIA labels, keyboard navigation)

### 🧪 Testing & Quality
- [ ] Write unit tests for new sorting/filtering functions
- [ ] Test responsive behavior across different screen sizes
- [ ] Verify accessibility compliance
- [ ] Performance test with large plan lists
- [ ] Cross-browser compatibility testing

## 📋 Phase 7 - Configurations Panel Enhancements

### 🔄 Tab Organization & Layout
- [ ] Analyze current tab structure and identify logical groupings
- [ ] Rearrange tabs by functionality (Teams → Members → Projects → Plans)
- [ ] Create logical tab clusters with clear separation
- [ ] Add tab icons for better visual identification
- [ ] Implement tab navigation with keyboard support
- [ ] Add tab tooltips explaining each section's purpose

### 🎨 Styling Improvements
- [ ] Improve overall panel visual design
- [ ] Add consistent spacing and padding throughout
- [ ] Implement better color scheme and contrast
- [ ] Add subtle animations and transitions
- [ ] Improve form styling and input validation feedback
- [ ] Add loading states for async operations

### 🔧 Action Button Redesign
- [ ] Replace text-based action buttons with icon-based buttons
- [ ] Design intuitive icon set for CRUD operations (edit, delete, duplicate, etc.)
- [ ] Implement consistent button sizing and positioning
- [ ] Add hover effects and tooltips for icon buttons
- [ ] Ensure proper spacing and alignment of icon buttons
- [ ] Add confirmation dialogs for destructive actions
- [ ] Implement keyboard shortcuts for common actions

### 🧪 Testing & Quality
- [ ] Test all CRUD operations with new icon buttons
- [ ] Verify tab navigation and accessibility
- [ ] Test responsive behavior in panel
- [ ] Performance testing for large datasets
- [ ] Cross-browser compatibility validation

## 📋 Phase 8 - Team Members Module Enhancements

### 🏖️ Leaves Management System
- [ ] Design leave entry interface with start/end date selection
- [ ] Implement leave types (vacation, sick, personal, etc.)
- [ ] Add leave approval workflow (if needed)
- [ ] Create leave calendar visualization
- [ ] Implement leave conflict detection
- [ ] Add leave balance tracking per member
- [ ] Create leave export/import functionality

### ⚡ Capacity Calculation Integration
- [ ] Modify capacity calculation functions to exclude leave dates
- [ ] Update `getTeamSizesForDate` to account for leaves
- [ ] Implement leave-aware scheduling logic
- [ ] Update Gantt chart rendering to show leave periods
- [ ] Add leave indicators in capacity change dots/tooltips
- [ ] Recalculate phase durations when leaves affect capacity
- [ ] Update drag-and-drop logic to consider leaves

### 🚀 Additional Module Improvements
- [ ] Add member skill level/rating system
- [ ] Implement member availability calendar
- [ ] Add member contact information fields
- [ ] Create member performance metrics
- [ ] Add member photo/avatar support
- [ ] Implement member notes/comments system
- [ ] Add member workload visualization
- [ ] Create member assignment history

### 🧪 Testing & Quality
- [ ] Write comprehensive tests for leave management
- [ ] Test capacity calculations with leave periods
- [ ] Verify Gantt chart updates with leaves
- [ ] Test drag-and-drop with leave constraints
- [ ] Performance testing with many leave entries
- [ ] Integration testing with existing scheduling

## 📋 Phase 9 - Export to PDF Enhancements

### 🔧 Gantt Chart Export Fix
- [ ] Identify why Gantt chart is not exporting to PDF
- [ ] Debug SVG rendering in PDF generation
- [ ] Fix chart scaling and positioning in PDF
- [ ] Ensure all chart elements are properly rendered
- [ ] Test with different chart configurations
- [ ] Verify chart export with various data sets

### 📊 Dynamic Plan Details Export
- [ ] Analyze current plan details structure
- [ ] Create dynamic export system that adapts to UI changes
- [ ] Implement recursive component traversal for export
- [ ] Add metadata extraction from DOM elements
- [ ] Create template system for different export layouts
- [ ] Implement conditional content inclusion
- [ ] Add export configuration options

### 🎨 PDF Styling Improvements
- [ ] Redesign PDF layout with better typography
- [ ] Implement consistent color scheme in PDF
- [ ] Add proper spacing and margins
- [ ] Improve table formatting and borders
- [ ] Add company branding/logos (if applicable)
- [ ] Implement responsive PDF layouts
- [ ] Add page headers and footers
- [ ] Optimize font choices and sizes

### 🧪 Testing & Quality
- [ ] Test Gantt chart export with various scenarios
- [ ] Verify dynamic content export accuracy
- [ ] Test PDF generation performance
- [ ] Cross-browser PDF export testing
- [ ] Validate PDF accessibility standards

## 📋 Phase 10 - Releases Module Enhancements

### 📅 Enhanced Release Configuration
- [ ] Add UAT (User Acceptance Testing) start/end dates
- [ ] Implement code freeze date configuration
- [ ] Add release phase definitions (alpha, beta, production)
- [ ] Create release milestone tracking
- [ ] Add release dependencies and blockers
- [ ] Implement release risk assessment
- [ ] Add release approval workflow

### 📊 Plan Details Release Integration
- [ ] Create new release fitment container in plan details
- [ ] Implement phase-to-release mapping logic
- [ ] Add visual indicators for release compatibility
- [ ] Show code freeze readiness for each release
- [ ] Display UAT period overlaps with phases
- [ ] Add release timeline visualization
- [ ] Implement release conflict detection

### 🎯 Release Management Features
- [ ] Add release creation and editing interface
- [ ] Implement release template system
- [ ] Create release calendar view
- [ ] Add release progress tracking
- [ ] Implement release notifications
- [ ] Add release documentation links
- [ ] Create release retrospective features

### 🧪 Testing & Quality
- [ ] Test release date calculations
- [ ] Verify phase-to-release mapping accuracy
- [ ] Test UAT period integrations
- [ ] Performance testing with multiple releases
- [ ] Integration testing with plan scheduling

## 🐛 Known Issues
- None currently

## 📝 Notes
- All core team member management functionality is now working
- UI follows consistent patterns with other CRUD sections
- Tests are passing for all implemented functionality
- **Phase 4 COMPLETE** - Advanced scheduling & chart rendering with comprehensive finalization
- **Phase 5 COMPLETE** - Unified export/import panel with comprehensive functionality
- **Project Status**: Ready for next phase of enhancements! 🚀
