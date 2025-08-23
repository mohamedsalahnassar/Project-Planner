# Team Member Management Migration

This document describes the migration from numeric team sizes to a member-based team structure in the Project Planner application.

## Overview

The application has been updated to replace the old numeric team size fields (e.g., `team.sizes.BE = 3`) with a new member-based structure that tracks individual team members with their specialties, start dates, and optional end dates.

## Key Changes

### 1. Data Structure Changes

**Old Structure:**
```javascript
{
  id: "team-base",
  name: "Base Squad",
  sizes: {
    BE: 3,
    iOS: 2,
    Android: 2,
    Online: 2,
    QA: 3
  }
}
```

**New Structure:**
```javascript
{
  id: "team-base",
  name: "Base Squad",
  members: [
    {
      id: "member-1",
      name: "John Doe",
      specialty: "BE",
      startDate: "2025-08-13",
      endDate: null
    },
    {
      id: "member-2",
      name: "Jane Smith",
      specialty: "iOS",
      startDate: "2025-08-13",
      endDate: null
    }
    // ... more members
  ]
}
```

### 2. New Functions

#### `getTeamSizes(team)`
Returns the current team capacity based on active members (startDate <= now < endDate or no endDate).

#### `getTeamSizesForDate(team, targetDate)`
Returns team capacity for a specific date, useful for historical analysis and future planning.

#### `createDefaultTeam()`
Creates a new team with sample members for all specialties.

### 3. UI Updates

- **Team Management**: Teams can now be created and edited with individual member details
- **Member Management**: Add, edit, and remove team members with validation
- **Enhanced Team Table**: Shows both member details and computed capacity
- **Date-based Filtering**: Members are automatically filtered based on start/end dates

### 4. Scheduling Updates

The scheduling algorithm now:
- Computes team capacity dynamically from member lists
- Respects member start and end dates
- Automatically adjusts project timelines based on available capacity

## Migration Steps

### For Existing Data

1. **Automatic Migration**: Existing teams with numeric sizes will continue to work
2. **Manual Migration**: Use the team management UI to convert to member-based structure
3. **Data Validation**: All new teams require member information

### For New Teams

1. Use the "Add Team" button in the configuration panel
2. Add individual members with their specialties and start dates
3. Optionally set end dates for temporary team members

## Benefits

1. **Individual Tracking**: Know exactly who is on the team and when
2. **Dynamic Capacity**: Team size changes automatically based on member availability
3. **Better Planning**: Account for team member start dates and departures
4. **Resource Management**: Track individual contributions and specialties
5. **Historical Analysis**: Understand team capacity changes over time

## API Changes

### Team Object
- `sizes` field is deprecated (maintained for backward compatibility)
- `members` array is now the primary data structure

### Functions
- `aggregate()` now takes an optional `targetDate` parameter
- Team capacity is computed dynamically from member data

## Testing

All existing tests have been updated to work with the new structure. New tests verify:
- Member management functions
- Date-based capacity calculation
- Team size computation
- Validation and error handling

## Backward Compatibility

- Existing teams with numeric sizes continue to work
- Old data structures are automatically handled
- Gradual migration is supported

## Future Enhancements

1. **Member Skills**: Track multiple specialties per member
2. **Availability**: Part-time and flexible work arrangements
3. **Cost Tracking**: Associate costs with individual members
4. **Performance Metrics**: Track individual and team productivity
5. **Resource Allocation**: Optimize team assignments across projects

## Files Modified

- `data.js` - Core data structure and helper functions
- `schedule.js` - Scheduling algorithm updates
- `export.js` - Import/export functionality
- `Project_Planner_App.html` - UI updates and team management
- `tests/` - Updated test suite
- `team-member-demo.html` - Demo of new functionality

## Usage Examples

### Creating a New Team
```javascript
const team = {
  id: 'team-new',
  name: 'New Team',
  members: [
    {
      id: 'member-1',
      name: 'Alice Developer',
      specialty: 'BE',
      startDate: '2025-01-01'
    }
  ]
};
```

### Getting Team Capacity
```javascript
// Current capacity
const currentSizes = getTeamSizes(team);

// Capacity for a specific date
const futureSizes = getTeamSizesForDate(team, '2025-06-01');
```

### Adding a Member
```javascript
team.members.push({
  id: 'member-2',
  name: 'Bob Tester',
  specialty: 'QA',
  startDate: '2025-02-01'
});
```

## Support

For questions or issues with the migration, please refer to the test suite or create an issue in the project repository.
