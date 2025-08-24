import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  calculateTaskDurationWithCapacityChanges, 
  businessDaysBetween,
  computeDailyCapacity,
  findCapacityChangePoints,
  getCapacityForDateRange
} from '../schedule.js';

describe('Capacity-Aware Duration Calculations', () => {
  
  describe('businessDaysBetween', () => {
    it('should calculate business days between two dates correctly', () => {
      // Monday to Friday (5 business days)
      const monday = new Date('2025-08-18'); // Monday
      const friday = new Date('2025-08-22'); // Friday
      assert.strictEqual(businessDaysBetween(monday, friday), 5);
      
      // Monday to next Monday (5 business days, excluding weekend)
      const nextMonday = new Date('2025-08-25'); // Next Monday
      assert.strictEqual(businessDaysBetween(monday, nextMonday), 5);
      
      // Same day should return 0
      assert.strictEqual(businessDaysBetween(monday, monday), 0);
      
      // End before start should return 0
      assert.strictEqual(businessDaysBetween(friday, monday), 0);
    });
    
    it('should handle weekend dates correctly', () => {
      const friday = new Date('2025-08-22'); // Friday
      const sunday = new Date('2025-08-24'); // Sunday
      const monday = new Date('2025-08-25'); // Monday
      
      // Friday to Sunday (0 business days)
      assert.strictEqual(businessDaysBetween(friday, sunday), 0);
      
      // Friday to Monday (1 business day)
      assert.strictEqual(businessDaysBetween(friday, monday), 1);
    });
  });
  
  describe('calculateTaskDurationWithCapacityChanges', () => {
    it('should calculate duration with constant capacity and no buffer', () => {
      const capacitySegments = [
        {
          date: new Date('2025-08-18'),
          capacity: { 'BE': 3, 'iOS': 2 }
        }
      ];
      
      // 30 man-days with 3 BE engineers at 0.8 efficiency, no buffer
      const duration = calculateTaskDurationWithCapacityChanges(30, 'BE', new Date('2025-08-18'), capacitySegments, 0.8, 0);
      const expected = Math.ceil(30 / (3 * 0.8)); // 30 / 2.4 = 12.5 -> 13
      assert.strictEqual(duration, expected);
    });
    
    it('should calculate duration with buffer applied', () => {
      const capacitySegments = [
        {
          date: new Date('2025-08-18'),
          capacity: { 'BE': 3, 'iOS': 2 }
        }
      ];
      
      // 30 man-days with 3 BE engineers at 0.8 efficiency, 20% buffer
      const duration = calculateTaskDurationWithCapacityChanges(30, 'BE', new Date('2025-08-18'), capacitySegments, 0.8, 0.2);
      const adjustedManDays = 30 * 1.2; // 36 man-days
      const expected = Math.ceil(adjustedManDays / (3 * 0.8)); // 36 / 2.4 = 15
      assert.strictEqual(duration, expected);
    });
    
    it('should calculate duration with capacity changes', () => {
      const capacitySegments = [
        {
          date: new Date('2025-08-18'),
          capacity: { 'BE': 3, 'iOS': 2 }
        },
        {
          date: new Date('2025-08-25'),
          capacity: { 'BE': 2, 'iOS': 2 } // BE capacity reduced
        }
      ];
      
      // 30 man-days starting Aug 18 with capacity change on Aug 25, 10% buffer
      const duration = calculateTaskDurationWithCapacityChanges(30, 'BE', new Date('2025-08-18'), capacitySegments, 0.8, 0.1);
      
      // Should be more than simple calculation due to capacity reduction and buffer
      const simpleDuration = Math.ceil((30 * 1.1) / (3 * 0.8)); // 33 / 2.4 = 13.75 -> 14
      assert.ok(duration > simpleDuration, `Duration should be greater than simple calculation. Got: ${duration}, Expected > ${simpleDuration}`);
    });
    
    it('should handle no capacity data gracefully', () => {
      const duration = calculateTaskDurationWithCapacityChanges(30, 'BE', new Date('2025-08-18'), [], 0.8, 0.1);
      const expected = Math.ceil((30 * 1.1) / 0.8); // 33 / 0.8 = 41.25 -> 42
      assert.strictEqual(duration, expected);
    });
    
    it('should handle zero man-days', () => {
      const capacitySegments = [
        {
          date: new Date('2025-08-18'),
          capacity: { 'BE': 3 }
        }
      ];
      
      const duration = calculateTaskDurationWithCapacityChanges(0, 'BE', new Date('2025-08-18'), capacitySegments, 0.8, 0.1);
      assert.strictEqual(duration, 0);
    });
    
    it('should handle negative man-days', () => {
      const capacitySegments = [
        {
          date: new Date('2025-08-18'),
          capacity: { 'BE': 3 }
        }
      ];
      
      const duration = calculateTaskDurationWithCapacityChanges(-10, 'BE', new Date('2025-08-18'), capacitySegments, 0.8, 0.1);
      assert.strictEqual(duration, 0);
    });
    
    it('should handle specialty with no capacity', () => {
      const capacitySegments = [
        {
          date: new Date('2025-08-18'),
          capacity: { 'iOS': 2 } // No BE capacity
        }
      ];
      
      const duration = calculateTaskDurationWithCapacityChanges(30, 'BE', new Date('2025-08-18'), capacitySegments, 0.8, 0.1);
      const expected = Math.ceil((30 * 1.1) / 0.8); // 33 / 0.8 = 41.25 -> 42
      assert.strictEqual(duration, expected);
    });
  });
  
  describe('computeDailyCapacity', () => {
    it('should compute daily capacity correctly with team members', () => {
      const team = {
        memberAssignments: [
          {
            memberId: '1',
            startDate: '2025-08-18',
            endDate: '2025-08-25'
          },
          {
            memberId: '2',
            startDate: '2025-08-20',
            endDate: null // Ongoing
          }
        ]
      };
      
      const teamMembers = [
        { id: '1', specialty: 'BE' },
        { id: '2', specialty: 'BE' }
      ];
      
      const startDate = new Date('2025-08-18');
      const endDate = new Date('2025-08-30');
      
      const capacitySegments = computeDailyCapacity(team, startDate, endDate, teamMembers);
      
      // Should have capacity segments
      assert.ok(capacitySegments.length > 0, 'Should generate capacity segments');
      
      // Check that BE capacity is calculated correctly
      const firstSegment = capacitySegments[0];
      assert.ok(firstSegment.capacity.BE > 0, 'Should have BE capacity');
    });
    
    it('should handle empty team gracefully', () => {
      const team = { memberAssignments: [] };
      const startDate = new Date('2025-08-18');
      const endDate = new Date('2025-08-30');
      
      const capacitySegments = computeDailyCapacity(team, startDate, endDate, []);
      assert.strictEqual(capacitySegments.length, 0);
    });
  });
  
  describe('findCapacityChangePoints', () => {
    it('should find capacity change points correctly', () => {
      const capacitySegments = [
        {
          date: new Date('2025-08-18'),
          capacity: { 'BE': 3, 'iOS': 2 }
        },
        {
          date: new Date('2025-08-25'),
          capacity: { 'BE': 2, 'iOS': 2 } // BE capacity changed
        },
        {
          date: new Date('2025-09-01'),
          capacity: { 'BE': 2, 'iOS': 3 } // iOS capacity changed
        }
      ];
      
      const changePoints = findCapacityChangePoints(capacitySegments);
      assert.strictEqual(changePoints.length, 2);
      assert.strictEqual(changePoints[0].getTime(), new Date('2025-08-25').getTime());
      assert.strictEqual(changePoints[1].getTime(), new Date('2025-09-01').getTime());
    });
    
    it('should handle no capacity changes', () => {
      const capacitySegments = [
        {
          date: new Date('2025-08-18'),
          capacity: { 'BE': 3, 'iOS': 2 }
        },
        {
          date: new Date('2025-08-25'),
          capacity: { 'BE': 3, 'iOS': 2 } // No changes
        }
      ];
      
      const changePoints = findCapacityChangePoints(capacitySegments);
      assert.strictEqual(changePoints.length, 0);
    });
    
    it('should handle empty capacity segments', () => {
      const changePoints = findCapacityChangePoints([]);
      assert.strictEqual(changePoints.length, 0);
    });
  });
  
  describe('getCapacityForDateRange', () => {
    it('should get capacity for a specific date', () => {
      const capacitySegments = [
        {
          date: new Date('2025-08-18'),
          capacity: { 'BE': 3, 'iOS': 2 }
        },
        {
          date: new Date('2025-08-25'),
          capacity: { 'BE': 2, 'iOS': 2 }
        }
      ];
      
      // Get capacity for Aug 20 (should use Aug 18 segment)
      const capacity = getCapacityForDateRange(capacitySegments, new Date('2025-08-20'));
      assert.deepStrictEqual(capacity, { 'BE': 3, 'iOS': 2 });
      
      // Get capacity for Aug 25 (should use Aug 25 segment)
      const capacity2 = getCapacityForDateRange(capacitySegments, new Date('2025-08-25'));
      assert.deepStrictEqual(capacity2, { 'BE': 2, 'iOS': 2 });
    });
    
    it('should handle date before first segment', () => {
      const capacitySegments = [
        {
          date: new Date('2025-08-18'),
          capacity: { 'BE': 3 }
        }
      ];
      
      const capacity = getCapacityForDateRange(capacitySegments, new Date('2025-08-15'));
      assert.deepStrictEqual(capacity, { 'BE': 3 }); // Should use first segment
    });
    
    it('should handle empty capacity segments', () => {
      const capacity = getCapacityForDateRange([], new Date('2025-08-18'));
      assert.deepStrictEqual(capacity, {});
    });
  });
  
  describe('Integration Tests', () => {
    it('should handle realistic capacity scenario with efficiency and buffer', () => {
      // Simulate a team with capacity changes
      const capacitySegments = [
        {
          date: new Date('2025-08-18'), // Monday
          capacity: { 'BE': 3, 'iOS': 2, 'Android': 1 }
        },
        {
          date: new Date('2025-08-25'), // Next Monday
          capacity: { 'BE': 2, 'iOS': 2, 'Android': 1 } // BE engineer left
        },
        {
          date: new Date('2025-09-01'), // Following Monday
          capacity: { 'BE': 2, 'iOS': 3, 'Android': 1 } // iOS engineer joined
        }
      ];
      
      // Test BE work: 45 man-days starting Aug 18, 0.8 efficiency, 15% buffer
      const beDuration = calculateTaskDurationWithCapacityChanges(45, 'BE', new Date('2025-08-18'), capacitySegments, 0.8, 0.15);
      
      // Should be more than simple calculation due to capacity reduction and buffer
      const simpleDuration = Math.ceil((45 * 1.15) / (3 * 0.8)); // 51.75 / 2.4 = 21.56 -> 22
      assert.ok(beDuration > simpleDuration, `BE duration should account for capacity reduction and buffer. Got: ${beDuration}, Expected > ${simpleDuration}`);
      
      // Test iOS work: 30 man-days starting Aug 18, 0.8 efficiency, 10% buffer
      const iosDuration = calculateTaskDurationWithCapacityChanges(30, 'iOS', new Date('2025-08-18'), capacitySegments, 0.8, 0.1);
      
      // Should be less than simple calculation due to capacity increase and buffer
      const simpleIosDuration = Math.ceil((30 * 1.1) / (2 * 0.8)); // 33 / 1.6 = 20.625 -> 21
      assert.ok(iosDuration <= simpleIosDuration, `iOS duration should account for capacity increase and buffer. Got: ${iosDuration}, Expected <= ${simpleIosDuration}`);
    });
    
    it('should handle edge cases correctly', () => {
      // Test with very small efficiency
      const capacitySegments = [
        {
          date: new Date('2025-08-18'),
          capacity: { 'BE': 1 }
        }
      ];
      
      const duration = calculateTaskDurationWithCapacityChanges(10, 'BE', new Date('2025-08-18'), capacitySegments, 0.1, 0.2);
      const expected = Math.ceil((10 * 1.2) / (1 * 0.1)); // 12 / 0.1 = 120
      assert.strictEqual(duration, expected);
      
      // Test with very large buffer
      const duration2 = calculateTaskDurationWithCapacityChanges(10, 'BE', new Date('2025-08-18'), capacitySegments, 0.8, 1.0);
      const expected2 = Math.ceil((10 * 2.0) / (1 * 0.8)); // 20 / 0.8 = 25
      assert.strictEqual(duration2, expected2);
    });
  });
});
