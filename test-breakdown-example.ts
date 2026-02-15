/**
 * Example test demonstrating the task breakdown functionality
 * This file is for demonstration purposes and shows how the system works
 */

import { breakdownTask } from './src/lib/taskBreakdownUtils';
import { TaskBreakdownInput } from './src/types/taskBreakdown';

// Example 1: Simple feature request
const simpleInput: TaskBreakdownInput = {
  type: 'text',
  content: `
    Implement user authentication system with the following features:
    - User registration and login
    - Password reset functionality
    - OAuth integration with Google and GitHub
    - Session management
    - Security: Rate limiting and password hashing
  `,
};

const result1 = breakdownTask(simpleInput);
console.log('Example 1: Simple Feature Request');
console.log('Epics:', result1.epics.length);
console.log('Tickets:', result1.tickets.length);
console.log('Subtasks:', result1.subtasks.length);
console.log('Dependencies:', result1.dependencies.length);
console.log('Total Effort:', result1.summary.totalEstimatedEffort, 'hours');
console.log('Risk Assessment:', result1.summary.riskAssessment);
console.log('---');

// Example 2: Complex PRD
const complexInput: TaskBreakdownInput = {
  type: 'prd',
  content: `
    Product Requirements: Real-time Analytics Dashboard

    As a product manager, I want to see real-time analytics so that I can make data-driven decisions.

    Features:
    - Dashboard with customizable widgets
    - Real-time data updates using WebSocket
    - Multiple chart types (line, bar, pie)
    - Data filtering and date range selection
    - Export to CSV/PDF
    - Mobile responsive design

    Technical Requirements:
    - Backend API for data aggregation
    - Database optimization for fast queries
    - Caching layer for performance
    - Integration with third-party analytics services

    Risks:
    - Performance concerns with large datasets
    - Complex real-time synchronization
    - Third-party API rate limits
  `,
};

const result2 = breakdownTask(complexInput);
console.log('Example 2: Complex PRD');
console.log('Epics:', result2.epics.length);
console.log('Tickets:', result2.tickets.length);
console.log('Subtasks:', result2.subtasks.length);
console.log('Dependencies:', result2.dependencies.length);
console.log('Total Effort:', result2.summary.totalEstimatedEffort, 'hours');
console.log('Risk Assessment:', result2.summary.riskAssessment);
console.log('Recommended Sprints:', result2.summary.recommendedSprints);
console.log('---');

// Example epic details
if (result2.epics.length > 0) {
  const epic = result2.epics[0];
  console.log('First Epic Details:');
  console.log('  ID:', epic.taskId);
  console.log('  Title:', epic.title);
  console.log('  Priority:', epic.priority);
  console.log('  DoD Items:', epic.definitionOfDone.length);
  console.log('  Test Notes:', epic.testNotes.length);
  console.log('  Risk Flags:', epic.riskFlags.length);
  console.log('  Tags:', epic.tags.join(', '));
}

// Example usage with auto-assignment
import { autoAssignTask, analyzeTeamCapacity } from './src/lib/agentAssignmentUtils';
import { CodingAgent } from './src/types/agent';

const agents: CodingAgent[] = [
  {
    id: '1',
    name: 'Frontend Specialist',
    skills: [
      { id: 's1', category: 'frontend', name: 'Frontend', proficiency: 5 },
      { id: 's2', category: 'design', name: 'Design', proficiency: 4 },
    ],
    performance: {
      tasksCompleted: 50,
      tasksOnTime: 45,
      qualityScore: 92,
    },
    availability: {
      status: 'available',
      currentWorkload: 2,
      capacity: 5,
      hoursPerWeek: 40,
    },
    createdAt: Date.now(),
  },
  {
    id: '2',
    name: 'Backend Engineer',
    skills: [
      { id: 's3', category: 'backend', name: 'Backend', proficiency: 5 },
      { id: 's4', category: 'database', name: 'Database', proficiency: 4 },
    ],
    performance: {
      tasksCompleted: 60,
      tasksOnTime: 58,
      qualityScore: 95,
    },
    availability: {
      status: 'available',
      currentWorkload: 1,
      capacity: 4,
      hoursPerWeek: 40,
    },
    createdAt: Date.now(),
  },
];

// Auto-assign a frontend ticket
const frontendTicket = result2.tickets.find(t => t.tags.includes('frontend'));
if (frontendTicket) {
  const assignedAgent = autoAssignTask(frontendTicket, agents);
  console.log('\nAuto-Assignment Example:');
  console.log('  Ticket:', frontendTicket.title);
  console.log('  Assigned to:', assignedAgent?.name || 'No suitable agent');
}

// Team capacity analysis
const allItems = [...result2.epics, ...result2.tickets, ...result2.subtasks];
const capacity = analyzeTeamCapacity(allItems, agents);
console.log('\nTeam Capacity Analysis:');
console.log('  Total Capacity:', capacity.totalCapacity, 'tasks');
console.log('  Current Workload:', capacity.totalWorkload, 'tasks');
console.log('  Utilization Rate:', (capacity.utilizationRate * 100).toFixed(1) + '%');
console.log('  Overloaded?', capacity.isOverloaded ? 'Yes' : 'No');
console.log('  Recommendations:');
capacity.recommendations.forEach(rec => console.log('    -', rec));
