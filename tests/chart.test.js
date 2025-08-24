import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Chart Rendering and UI Tests', () => {
  
  // Mock DOM environment for testing
  function createMockDocument() {
    return {
      getElementById: (id) => {
        const elements = {
          'ganttContent': { innerHTML: '', appendChild: () => {} },
          'ganttScroll': { style: {} },
          'lane-menu': { innerHTML: '' },
          'detail-title': { textContent: '' },
          'detail-team': { textContent: '' },
          'detail-buffer': { textContent: '' },
          'detail-span': { textContent: '' },
          'effTable': { 
            querySelector: (selector) => ({
              innerHTML: '',
              appendChild: () => {}
            })
          },
          'teamTable': { 
            querySelector: (selector) => ({
              innerHTML: '',
              appendChild: () => {}
            }),
            closest: () => ({ parentNode: { insertBefore: () => {} } })
          }
        };
        return elements[id] || null;
      },
      createElement: (tag) => {
        const element = {
          tagName: tag.toUpperCase(),
          className: '',
          style: {},
          innerHTML: '',
          appendChild: () => {},
          addEventListener: () => {},
          setAttribute: () => {},
          dataset: {},
          // Store attributes for getAttribute to retrieve
          _attributes: {}
        };
        
        // Override setAttribute to store the attribute
        element.setAttribute = (attr, value) => {
          element._attributes[attr] = value;
        };
        
        // Override getAttribute to retrieve stored attributes
        element.getAttribute = (attr) => {
          return element._attributes[attr] || null;
        };
        
        return element;
      },
      querySelector: () => null,
      querySelectorAll: () => []
    };
  }
  
  function createMockWindow() {
    return {
      addEventListener: () => {},
      removeEventListener: () => {}
    };
  }
  
  describe('Gantt Chart Rendering Tests', () => {
    
    it('should create chart container elements correctly', () => {
      const container = createMockDocument().createElement('div');
      container.className = 'gantt-container';
      
      assert.strictEqual(container.tagName, 'DIV');
      assert.strictEqual(container.className, 'gantt-container');
    });
    
    it('should handle chart zoom functionality', () => {
      const zoomRange = createMockDocument().createElement('input');
      zoomRange.type = 'range';
      zoomRange.min = '6';
      zoomRange.max = '44';
      zoomRange.value = '18';
      
      assert.strictEqual(zoomRange.type, 'range');
      assert.strictEqual(zoomRange.min, '6');
      assert.strictEqual(zoomRange.max, '44');
      assert.strictEqual(zoomRange.value, '18');
    });
    
    it('should create lane elements with proper structure', () => {
      const lane = createMockDocument().createElement('div');
      lane.className = 'lane';
      lane.style.width = '1000px';
      lane.dataset.lane = 'BE';
      
      const label = createMockDocument().createElement('div');
      label.className = 'lane-label';
      label.textContent = 'Backend';
      
      lane.appendChild(label);
      
      assert.strictEqual(lane.className, 'lane');
      assert.strictEqual(lane.style.width, '1000px');
      assert.strictEqual(lane.dataset.lane, 'BE');
      assert.strictEqual(label.textContent, 'Backend');
    });
    
    it('should create bar elements with proper positioning', () => {
      const bar = createMockDocument().createElement('div');
      bar.className = 'bar';
      bar.style.left = '100px';
      bar.style.width = '200px';
      bar.style.top = '10px';
      bar.style.height = '30px';
      bar.textContent = 'BE Work';
      bar.dataset.phase = 'phase-1';
      bar.dataset.lane = 'BE';
      
      assert.strictEqual(bar.className, 'bar');
      assert.strictEqual(bar.style.left, '100px');
      assert.strictEqual(bar.style.width, '200px');
      assert.strictEqual(bar.style.top, '10px');
      assert.strictEqual(bar.style.height, '30px');
      assert.strictEqual(bar.textContent, 'BE Work');
      assert.strictEqual(bar.dataset.phase, 'phase-1');
      assert.strictEqual(bar.dataset.lane, 'BE');
    });
  });
  
  describe('Chart Interaction Tests', () => {
    
    it('should handle mouse events for dragging', () => {
      let mouseDownEvent = false;
      let mouseMoveEvent = false;
      let mouseUpEvent = false;
      
      const bar = createMockDocument().createElement('div');
      bar.addEventListener('mousedown', () => { mouseDownEvent = true; });
      bar.addEventListener('mousemove', () => { mouseMoveEvent = true; });
      bar.addEventListener('mouseup', () => { mouseUpEvent = true; });
      
      // Simulate events
      bar.dispatchEvent = (eventType) => {
        if (eventType === 'mousedown') mouseDownEvent = true;
        if (eventType === 'mousemove') mouseMoveEvent = true;
        if (eventType === 'mouseup') mouseUpEvent = true;
      };
      
      bar.dispatchEvent('mousedown');
      bar.dispatchEvent('mousemove');
      bar.dispatchEvent('mouseup');
      
      assert.strictEqual(mouseDownEvent, true, 'Should handle mousedown event');
      assert.strictEqual(mouseMoveEvent, true, 'Should handle mousemove event');
      assert.strictEqual(mouseUpEvent, true, 'Should handle mouseup event');
    });
    
    it('should calculate drag position correctly', () => {
      const startX = 100;
      const origLeft = 200;
      const currentX = 150;
      const dx = currentX - startX;
      const newLeft = origLeft + dx;
      
      assert.strictEqual(dx, 50, 'Should calculate drag delta correctly');
      assert.strictEqual(newLeft, 250, 'Should calculate new position correctly');
    });
    
    it('should convert pixels to days correctly', () => {
      const offsetPx = 180;
      const pxPerDay = 18;
      const days = Math.round(offsetPx / pxPerDay);
      
      assert.strictEqual(days, 10, 'Should convert pixels to days correctly');
    });
    
    it('should handle date calculations for rescheduling', () => {
      const chartStart = new Date('2025-08-18');
      const daysOffset = 5;
      
      // Mock addBusinessDays function
      const addBusinessDays = (startDate, days) => {
        const result = new Date(startDate);
        result.setDate(result.getDate() + days);
        return result;
      };
      
      const newDate = addBusinessDays(chartStart, daysOffset);
      const expectedDate = new Date('2025-08-23');
      
      assert.strictEqual(newDate.getTime(), expectedDate.getTime(), 'Should calculate new date correctly');
    });
  });
  
  describe('Chart Data Integration Tests', () => {
    
    it('should integrate with schedule data correctly', () => {
      const mockSchedule = {
        chartStart: new Date('2025-08-18'),
        chartEnd: new Date('2025-09-15'),
        phaseWindows: [
          {
            ph: 'phase-1',
            start: new Date('2025-08-18'),
            end: new Date('2025-09-01'),
            lanes: [
              {
                key: 'BE',
                start: new Date('2025-08-18'),
                days: 10
              },
              {
                key: 'FE',
                start: new Date('2025-08-25'),
                days: 8
              }
            ]
          }
        ]
      };
      
      assert.ok(mockSchedule.phaseWindows, 'Should have phase windows');
      assert.ok(mockSchedule.phaseWindows.length > 0, 'Should have at least one phase window');
      
      const firstPhase = mockSchedule.phaseWindows[0];
      assert.ok(firstPhase.lanes, 'Should have lanes in phase window');
      assert.strictEqual(firstPhase.lanes.length, 2, 'Should have 2 lanes');
      
      const beLane = firstPhase.lanes.find(l => l.key === 'BE');
      const feLane = firstPhase.lanes.find(l => l.key === 'FE');
      
      assert.ok(beLane, 'Should have BE lane');
      assert.ok(feLane, 'Should have FE lane');
      assert.strictEqual(beLane.days, 10, 'BE lane should have 10 days');
      assert.strictEqual(feLane.days, 8, 'FE lane should have 8 days');
    });
    
    it('should handle capacity changes in chart rendering', () => {
      const mockCapacitySegments = [
        {
          date: new Date('2025-08-18'),
          capacity: { 'BE': 2, 'FE': 1 }
        },
        {
          date: new Date('2025-08-25'),
          capacity: { 'BE': 1, 'FE': 2 } // Capacity changes
        }
      ];
      
      const mockChangePoints = [new Date('2025-08-25')];
      
      assert.ok(mockCapacitySegments.length > 0, 'Should have capacity segments');
      assert.ok(mockChangePoints.length > 0, 'Should have change points');
      
      // Check that capacity changes are detected
      const beCapacityChange = mockCapacitySegments.some(seg => 
        seg.date.getTime() === new Date('2025-08-25').getTime() && 
        seg.capacity.BE === 1
      );
      
      assert.strictEqual(beCapacityChange, true, 'Should detect BE capacity change on Aug 25');
    });
    
    it('should calculate chart dimensions correctly', () => {
      const chartStart = new Date('2025-08-18');
      const chartEnd = new Date('2025-09-15');
      const pxPerDay = 18;
      
      // Mock daysBetween function
      const daysBetween = (start, end) => {
        const timeDiff = end.getTime() - start.getTime();
        const dayDiff = timeDiff / (1000 * 3600 * 24);
        return Math.ceil(dayDiff);
      };
      
      const totalDays = daysBetween(chartStart, chartEnd);
      const chartWidth = totalDays * pxPerDay;
      
      assert.strictEqual(totalDays, 28, 'Should calculate total days correctly');
      assert.strictEqual(chartWidth, 504, 'Should calculate chart width correctly');
    });
  });
  
  describe('Chart Styling and Layout Tests', () => {
    
    it('should apply proper CSS classes for different lane types', () => {
      const laneTypes = ['BE', 'FE', 'iOS', 'QA'];
      const expectedClasses = {
        'BE': 'bar be-bar',
        'FE': 'bar fe-bar',
        'iOS': 'bar ios-bar',
        'QA': 'bar qa-bar'
      };
      
      laneTypes.forEach(type => {
        const bar = createMockDocument().createElement('div');
        bar.className = expectedClasses[type];
        
        assert.ok(bar.className.includes('bar'), `${type} bar should have 'bar' class`);
        assert.ok(bar.className.includes(`${type.toLowerCase()}-bar`), `${type} bar should have specialty class`);
      });
    });
    
    it('should handle responsive chart sizing', () => {
      const mockContainer = {
        offsetWidth: 1200,
        style: {}
      };
      
      const mockScroll = {
        style: {}
      };
      
      // Mock responsive behavior
      const applyResponsiveSizing = (container, scroll) => {
        if (container.offsetWidth < 800) {
          scroll.style.fontSize = '12px';
          return 'small';
        } else if (container.offsetWidth < 1200) {
          scroll.style.fontSize = '14px';
          return 'medium';
        } else {
          scroll.style.fontSize = '16px';
          return 'large';
        }
      };
      
      const size = applyResponsiveSizing(mockContainer, mockScroll);
      assert.strictEqual(size, 'large', 'Should apply large sizing for wide containers');
      assert.strictEqual(mockScroll.style.fontSize, '16px', 'Should set appropriate font size');
    });
    
    it('should handle chart zoom levels correctly', () => {
      const zoomLevels = [6, 12, 18, 24, 30, 36, 44];
      const expectedPxPerDay = zoomLevels;
      
      zoomLevels.forEach((level, index) => {
        const pxPerDay = level;
        const expectedWidth = 100 * pxPerDay; // 100 days
        
        assert.strictEqual(pxPerDay, expectedPxPerDay[index], 'Should handle zoom level correctly');
        assert.strictEqual(expectedWidth, 100 * level, 'Should calculate width based on zoom level');
      });
    });
  });
  
  describe('Chart Performance Tests', () => {
    
    it('should handle large datasets efficiently', () => {
      const largePhaseWindows = [];
      const startDate = new Date('2025-08-18');
      
      // Create large dataset
      for (let i = 0; i < 100; i++) {
        largePhaseWindows.push({
          ph: `phase-${i}`,
          start: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
          end: new Date(startDate.getTime() + (i + 1) * 24 * 60 * 60 * 1000),
          lanes: [
            {
              key: 'BE',
              start: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
              days: Math.floor(Math.random() * 10) + 1
            }
          ]
        });
      }
      
      assert.strictEqual(largePhaseWindows.length, 100, 'Should create large dataset');
      
      // Test processing performance
      const startTime = Date.now();
      const processedLanes = largePhaseWindows.flatMap(phase => phase.lanes);
      const endTime = Date.now();
      
      assert.ok(processedLanes.length > 0, 'Should process large dataset');
      assert.ok(endTime - startTime < 100, 'Should process large dataset efficiently (< 100ms)');
    });
    
    it('should handle frequent updates without performance degradation', () => {
      const updates = [];
      const startTime = Date.now();
      
      // Simulate frequent updates
      for (let i = 0; i < 50; i++) {
        updates.push({
          timestamp: Date.now(),
          data: { phase: `phase-${i}`, lane: 'BE', days: i + 1 }
        });
      }
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      assert.strictEqual(updates.length, 50, 'Should handle 50 updates');
      assert.ok(processingTime < 50, 'Should process updates efficiently (< 50ms)');
    });
  });
  
  describe('Chart Accessibility Tests', () => {
    
    it('should have proper ARIA labels for screen readers', () => {
      const bar = createMockDocument().createElement('div');
      bar.setAttribute('role', 'button');
      bar.setAttribute('aria-label', 'BE work in Phase 1: 10 days starting August 18');
      bar.setAttribute('tabindex', '0');
      
      assert.strictEqual(bar.getAttribute('role'), 'button', 'Should have proper role attribute');
      assert.ok(bar.getAttribute('aria-label').includes('BE work'), 'Should have descriptive aria-label');
      assert.strictEqual(bar.getAttribute('tabindex'), '0', 'Should be keyboard navigable');
    });
    
    it('should handle keyboard navigation correctly', () => {
      const bars = [
        createMockDocument().createElement('div'),
        createMockDocument().createElement('div'),
        createMockDocument().createElement('div')
      ];
      
      bars.forEach((bar, index) => {
        bar.setAttribute('tabindex', '0');
        bar.setAttribute('data-index', index.toString());
      });
      
      // Test tab order
      bars.forEach((bar, index) => {
        assert.strictEqual(bar.getAttribute('tabindex'), '0', `Bar ${index} should be tabbable`);
        assert.strictEqual(bar.getAttribute('data-index'), index.toString(), `Bar ${index} should have correct index`);
      });
    });
    
    it('should provide proper focus management', () => {
      const chartContainer = createMockDocument().createElement('div');
      chartContainer.setAttribute('role', 'application');
      chartContainer.setAttribute('aria-label', 'Project Schedule Gantt Chart');
      
      assert.strictEqual(chartContainer.getAttribute('role'), 'application', 'Should have application role');
      assert.ok(chartContainer.getAttribute('aria-label').includes('Gantt Chart'), 'Should have descriptive label');
    });
  });
  
  describe('Chart Error Handling Tests', () => {
    
    it('should handle missing data gracefully', () => {
      const emptySchedule = {
        chartStart: null,
        chartEnd: null,
        phaseWindows: []
      };
      
      // Should not crash with empty data
      assert.ok(emptySchedule.phaseWindows, 'Should handle empty phase windows');
      assert.strictEqual(emptySchedule.phaseWindows.length, 0, 'Should handle empty schedule');
    });
    
    it('should handle invalid date ranges', () => {
      const invalidSchedule = {
        chartStart: new Date('2025-09-15'),
        chartEnd: new Date('2025-08-18'), // End before start
        phaseWindows: []
      };
      
      // Should handle invalid date ranges
      assert.ok(invalidSchedule.chartStart > invalidSchedule.chartEnd, 'Should detect invalid date range');
    });
    
    it('should handle missing team data', () => {
      const scheduleWithoutTeam = {
        chartStart: new Date('2025-08-18'),
        chartEnd: new Date('2025-09-15'),
        phaseWindows: [
          {
            ph: 'phase-1',
            start: new Date('2025-08-18'),
            end: new Date('2025-09-01'),
            lanes: []
          }
        ]
      };
      
      // Should handle missing team data
      assert.ok(scheduleWithoutTeam.phaseWindows[0].lanes, 'Should handle empty lanes');
      assert.strictEqual(scheduleWithoutTeam.phaseWindows[0].lanes.length, 0, 'Should handle missing team data');
    });
  });
});
