import {
  TaskBreakdownInput,
  TaskBreakdownResult,
  Epic,
  Ticket,
  Subtask,
  Dependency,
  DefinitionOfDone,
  TestNote,
  RiskFlag,
  RiskLevel
} from '@/types/taskBreakdown';
import { generateId } from './utils';

/**
 * Analyzes input text to identify key components for task breakdown
 */
function analyzeInput(input: TaskBreakdownInput): {
  features: string[];
  technicalRequirements: string[];
  userStories: string[];
  risks: string[];
} {
  const content = input.content.toLowerCase();
  const lines = input.content.split('\n').filter(line => line.trim());

  // Simple keyword-based analysis (in a real system, this would use AI/NLP)
  const features: string[] = [];
  const technicalRequirements: string[] = [];
  const userStories: string[] = [];
  const risks: string[] = [];

  lines.forEach(line => {
    const lowerLine = line.toLowerCase();

    // Identify features
    if (lowerLine.includes('feature') || lowerLine.includes('implement') || lowerLine.includes('add')) {
      features.push(line);
    }

    // Identify user stories
    if (lowerLine.includes('as a') || lowerLine.includes('user') || lowerLine.includes('want')) {
      userStories.push(line);
    }

    // Identify technical requirements
    if (lowerLine.includes('database') || lowerLine.includes('api') ||
        lowerLine.includes('integration') || lowerLine.includes('performance')) {
      technicalRequirements.push(line);
    }

    // Identify risks
    if (lowerLine.includes('risk') || lowerLine.includes('concern') ||
        lowerLine.includes('challenge') || lowerLine.includes('difficult')) {
      risks.push(line);
    }
  });

  // Extract implicit features from common patterns
  if (content.includes('authentication') || content.includes('login')) {
    features.push('User Authentication System');
  }
  if (content.includes('dashboard') || content.includes('analytics')) {
    features.push('Dashboard and Analytics');
  }
  if (content.includes('notification') || content.includes('alert')) {
    features.push('Notification System');
  }
  if (content.includes('search') || content.includes('filter')) {
    features.push('Search and Filter Functionality');
  }

  return { features, technicalRequirements, userStories, risks };
}

/**
 * Determines risk level based on keywords and complexity
 */
function assessRiskLevel(description: string): RiskLevel {
  const lowerDesc = description.toLowerCase();

  if (lowerDesc.includes('security') || lowerDesc.includes('payment') ||
      lowerDesc.includes('data migration') || lowerDesc.includes('breaking change')) {
    return 'critical';
  }
  if (lowerDesc.includes('integration') || lowerDesc.includes('third-party') ||
      lowerDesc.includes('performance') || lowerDesc.includes('scaling')) {
    return 'high';
  }
  if (lowerDesc.includes('new feature') || lowerDesc.includes('refactor')) {
    return 'medium';
  }
  return 'low';
}

/**
 * Generates Definition of Done items based on task type
 */
function generateDoD(title: string, type: 'epic' | 'ticket' | 'subtask'): DefinitionOfDone[] {
  const commonDoD: DefinitionOfDone[] = [
    { id: generateId(), description: 'Code is reviewed and approved', completed: false },
    { id: generateId(), description: 'Tests are passing', completed: false },
    { id: generateId(), description: 'Documentation is updated', completed: false },
  ];

  const lowerTitle = title.toLowerCase();

  if (type === 'epic') {
    return [
      ...commonDoD,
      { id: generateId(), description: 'All child tickets are completed', completed: false },
      { id: generateId(), description: 'End-to-end testing completed', completed: false },
      { id: generateId(), description: 'Stakeholder approval obtained', completed: false },
    ];
  }

  if (lowerTitle.includes('ui') || lowerTitle.includes('frontend')) {
    commonDoD.push({ id: generateId(), description: 'UI matches design specs', completed: false });
    commonDoD.push({ id: generateId(), description: 'Responsive design verified', completed: false });
  }

  if (lowerTitle.includes('api') || lowerTitle.includes('backend')) {
    commonDoD.push({ id: generateId(), description: 'API endpoints documented', completed: false });
    commonDoD.push({ id: generateId(), description: 'Error handling implemented', completed: false });
  }

  if (lowerTitle.includes('database') || lowerTitle.includes('schema')) {
    commonDoD.push({ id: generateId(), description: 'Migration scripts created', completed: false });
    commonDoD.push({ id: generateId(), description: 'Data integrity verified', completed: false });
  }

  return commonDoD;
}

/**
 * Generates test notes based on task description
 */
function generateTestNotes(title: string, description: string): TestNote[] {
  const testNotes: TestNote[] = [];
  const combined = (title + ' ' + description).toLowerCase();

  // Unit tests - always recommended
  testNotes.push({
    id: generateId(),
    category: 'unit',
    description: 'Unit tests for core functionality',
    estimatedEffort: 2,
  });

  // Integration tests for API/database work
  if (combined.includes('api') || combined.includes('endpoint') || combined.includes('database')) {
    testNotes.push({
      id: generateId(),
      category: 'integration',
      description: 'Integration tests for API endpoints and database operations',
      estimatedEffort: 3,
    });
  }

  // E2E tests for user-facing features
  if (combined.includes('ui') || combined.includes('user') || combined.includes('page')) {
    testNotes.push({
      id: generateId(),
      category: 'e2e',
      description: 'End-to-end tests for user workflows',
      estimatedEffort: 4,
    });
  }

  // Performance tests for critical paths
  if (combined.includes('performance') || combined.includes('optimization') || combined.includes('scale')) {
    testNotes.push({
      id: generateId(),
      category: 'performance',
      description: 'Performance tests to verify optimization goals',
      estimatedEffort: 3,
    });
  }

  // Manual testing for complex UX
  if (combined.includes('ux') || combined.includes('design') || combined.includes('interaction')) {
    testNotes.push({
      id: generateId(),
      category: 'manual',
      description: 'Manual UX testing for interaction flows',
      estimatedEffort: 2,
    });
  }

  return testNotes;
}

/**
 * Generates risk flags based on task analysis
 */
function generateRiskFlags(title: string, description: string): RiskFlag[] {
  const riskFlags: RiskFlag[] = [];
  const combined = (title + ' ' + description).toLowerCase();

  if (combined.includes('security') || combined.includes('authentication') || combined.includes('authorization')) {
    riskFlags.push({
      id: generateId(),
      level: 'critical',
      description: 'Security implications - requires security review',
      mitigation: 'Conduct security audit before deployment',
      identified: true,
    });
  }

  if (combined.includes('breaking change') || combined.includes('migration')) {
    riskFlags.push({
      id: generateId(),
      level: 'high',
      description: 'Breaking changes may affect existing users',
      mitigation: 'Plan rollback strategy and communicate changes',
      identified: true,
    });
  }

  if (combined.includes('third-party') || combined.includes('integration') || combined.includes('external')) {
    riskFlags.push({
      id: generateId(),
      level: 'medium',
      description: 'Dependency on external services',
      mitigation: 'Implement fallback mechanisms and error handling',
      identified: true,
    });
  }

  if (combined.includes('performance') || combined.includes('optimization')) {
    riskFlags.push({
      id: generateId(),
      level: 'medium',
      description: 'Performance targets may be challenging to meet',
      mitigation: 'Set up performance monitoring and benchmarking',
      identified: true,
    });
  }

  return riskFlags;
}

/**
 * Estimates effort for a task based on complexity indicators
 */
function estimateEffort(title: string, description: string, type: 'epic' | 'ticket' | 'subtask'): number {
  const combined = (title + ' ' + description).toLowerCase();
  let baseEffort = type === 'epic' ? 40 : type === 'ticket' ? 8 : 2;

  // Complexity multipliers
  if (combined.includes('complex') || combined.includes('advanced')) baseEffort *= 1.5;
  if (combined.includes('simple') || combined.includes('basic')) baseEffort *= 0.7;
  if (combined.includes('integration') || combined.includes('third-party')) baseEffort *= 1.3;
  if (combined.includes('new') || combined.includes('from scratch')) baseEffort *= 1.4;
  if (combined.includes('refactor') || combined.includes('update')) baseEffort *= 0.8;

  return Math.round(baseEffort);
}

/**
 * Main function to break down a task/PRD/issue into epics, tickets, and subtasks
 */
export function breakdownTask(input: TaskBreakdownInput): TaskBreakdownResult {
  const analysis = analyzeInput(input);
  const epics: Epic[] = [];
  const tickets: Ticket[] = [];
  const subtasks: Subtask[] = [];
  const dependencies: Dependency[] = [];

  let epicCounter = 1;
  let ticketCounter = 1;
  let subtaskCounter = 1;

  // Create epics from major features
  const uniqueFeatures = Array.from(new Set(analysis.features));
  uniqueFeatures.forEach((feature, idx) => {
    const epicId = generateId();
    const epic: Epic = {
      id: epicId,
      type: 'epic',
      taskId: `EPIC-${epicCounter++}`,
      title: feature,
      description: `Implementation of ${feature}`,
      status: 'not-started',
      priority: idx === 0 ? 5 : idx === 1 ? 4 : 3,
      tags: ['epic', ...extractTags(feature)],
      definitionOfDone: generateDoD(feature, 'epic'),
      testNotes: generateTestNotes(feature, ''),
      riskFlags: generateRiskFlags(feature, ''),
      estimatedEffort: estimateEffort(feature, '', 'epic'),
      businessValue: `Delivers core functionality for ${feature}`,
      acceptanceCriteria: [
        `Users can access ${feature} functionality`,
        'All related features work as expected',
        'No critical bugs reported',
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    epics.push(epic);

    // Create tickets for each epic
    const ticketsForEpic = generateTicketsForEpic(epic, ticketCounter);
    ticketsForEpic.forEach(ticket => {
      tickets.push(ticket);
      ticketCounter++;

      // Add dependency from ticket to epic
      dependencies.push({
        id: generateId(),
        fromItemId: ticket.id,
        toItemId: epicId,
        type: 'blocks',
        description: `${ticket.taskId} must be completed for ${epic.taskId}`,
      });

      // Create subtasks for complex tickets
      const subtasksForTicket = generateSubtasksForTicket(ticket, subtaskCounter);
      subtasksForTicket.forEach(subtask => {
        subtasks.push(subtask);
        subtaskCounter++;

        // Add dependency from subtask to ticket
        dependencies.push({
          id: generateId(),
          fromItemId: subtask.id,
          toItemId: ticket.id,
          type: 'blocks',
        });
      });
    });
  });

  // If no features detected, create a general breakdown
  if (epics.length === 0) {
    const epicId = generateId();
    const epic: Epic = {
      id: epicId,
      type: 'epic',
      taskId: `EPIC-${epicCounter++}`,
      title: 'Implementation from Requirements',
      description: input.content.substring(0, 200),
      status: 'not-started',
      priority: 4,
      tags: ['epic', 'requirements'],
      definitionOfDone: generateDoD('Implementation', 'epic'),
      testNotes: generateTestNotes('Implementation', input.content),
      riskFlags: generateRiskFlags('Implementation', input.content),
      estimatedEffort: estimateEffort('Implementation', input.content, 'epic'),
      businessValue: 'Delivers requested functionality',
      acceptanceCriteria: ['Requirements are met', 'Testing completed'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    epics.push(epic);

    // Create default tickets
    const defaultTickets = [
      { title: 'Setup and Architecture', tags: ['setup', 'architecture'] },
      { title: 'Core Implementation', tags: ['development', 'core'] },
      { title: 'Testing and Quality Assurance', tags: ['testing', 'qa'] },
      { title: 'Documentation and Deployment', tags: ['documentation', 'deployment'] },
    ];

    defaultTickets.forEach(({ title, tags }) => {
      const ticketId = generateId();
      const ticket: Ticket = {
        id: ticketId,
        type: 'ticket',
        parentId: epicId,
        taskId: `TICKET-${ticketCounter++}`,
        title,
        description: `${title} for ${epic.title}`,
        status: 'not-started',
        priority: 3,
        tags: ['ticket', ...tags],
        definitionOfDone: generateDoD(title, 'ticket'),
        testNotes: generateTestNotes(title, ''),
        riskFlags: generateRiskFlags(title, ''),
        estimatedEffort: estimateEffort(title, '', 'ticket'),
        storyPoints: 5,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      tickets.push(ticket);

      dependencies.push({
        id: generateId(),
        fromItemId: ticketId,
        toItemId: epicId,
        type: 'blocks',
      });
    });
  }

  // Calculate summary
  const totalEstimatedEffort = [...epics, ...tickets, ...subtasks]
    .reduce((sum, item) => sum + (item.estimatedEffort || 0), 0);

  const criticalRisks = [...epics, ...tickets, ...subtasks]
    .flatMap(item => item.riskFlags)
    .filter(risk => risk.level === 'critical' || risk.level === 'high');

  const riskAssessment = criticalRisks.length > 0
    ? `High risk: ${criticalRisks.length} critical/high risk items identified`
    : 'Low to medium risk project';

  const recommendedSprints = Math.ceil(totalEstimatedEffort / 80); // Assuming 80 hours per sprint

  return {
    epics,
    tickets,
    subtasks,
    dependencies,
    summary: {
      totalEstimatedEffort,
      riskAssessment,
      recommendedSprints,
    },
  };
}

/**
 * Helper function to generate tickets for an epic
 */
function generateTicketsForEpic(epic: Epic, startCounter: number): Ticket[] {
  const tickets: Ticket[] = [];
  const title = epic.title.toLowerCase();

  // Common ticket patterns based on feature type
  const ticketTemplates: { title: string; tags: string[] }[] = [];

  if (title.includes('authentication') || title.includes('login')) {
    ticketTemplates.push(
      { title: 'User Registration and Login UI', tags: ['frontend', 'ui'] },
      { title: 'Authentication API Endpoints', tags: ['backend', 'api'] },
      { title: 'Session Management', tags: ['backend', 'security'] },
      { title: 'Password Reset Flow', tags: ['feature', 'security'] }
    );
  } else if (title.includes('dashboard') || title.includes('analytics')) {
    ticketTemplates.push(
      { title: 'Dashboard Layout and Components', tags: ['frontend', 'ui'] },
      { title: 'Data Aggregation API', tags: ['backend', 'api'] },
      { title: 'Charts and Visualizations', tags: ['frontend', 'data-viz'] },
      { title: 'Real-time Updates', tags: ['feature', 'websocket'] }
    );
  } else if (title.includes('notification')) {
    ticketTemplates.push(
      { title: 'Notification UI Components', tags: ['frontend', 'ui'] },
      { title: 'Notification Service', tags: ['backend', 'service'] },
      { title: 'Email Integration', tags: ['integration', 'email'] },
      { title: 'Push Notification Support', tags: ['feature', 'mobile'] }
    );
  } else {
    // Generic tickets
    ticketTemplates.push(
      { title: `${epic.title} - Frontend Implementation`, tags: ['frontend', 'ui'] },
      { title: `${epic.title} - Backend Implementation`, tags: ['backend', 'api'] },
      { title: `${epic.title} - Integration and Testing`, tags: ['testing', 'integration'] }
    );
  }

  ticketTemplates.forEach((template, idx) => {
    const ticket: Ticket = {
      id: generateId(),
      type: 'ticket',
      parentId: epic.id,
      taskId: `TICKET-${startCounter + idx}`,
      title: template.title,
      description: `Implementation of ${template.title} for ${epic.title}`,
      status: 'not-started',
      priority: epic.priority,
      tags: ['ticket', ...template.tags],
      definitionOfDone: generateDoD(template.title, 'ticket'),
      testNotes: generateTestNotes(template.title, ''),
      riskFlags: generateRiskFlags(template.title, ''),
      estimatedEffort: estimateEffort(template.title, '', 'ticket'),
      storyPoints: Math.ceil(estimateEffort(template.title, '', 'ticket') / 2),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    tickets.push(ticket);
  });

  return tickets;
}

/**
 * Helper function to generate subtasks for a ticket
 */
function generateSubtasksForTicket(ticket: Ticket, startCounter: number): Subtask[] {
  const subtasks: Subtask[] = [];
  const title = ticket.title.toLowerCase();

  // Only create subtasks for complex tickets (estimated > 6 hours)
  if ((ticket.estimatedEffort || 0) < 6) {
    return subtasks;
  }

  const subtaskTemplates: string[] = [];

  if (title.includes('ui') || title.includes('frontend') || title.includes('component')) {
    subtaskTemplates.push(
      'Create component structure',
      'Implement styling and layout',
      'Add user interactions',
      'Connect to backend API'
    );
  } else if (title.includes('api') || title.includes('backend') || title.includes('endpoint')) {
    subtaskTemplates.push(
      'Define API schema',
      'Implement route handlers',
      'Add validation and error handling',
      'Write API tests'
    );
  } else {
    subtaskTemplates.push(
      'Research and design approach',
      'Implement core functionality',
      'Add error handling',
      'Write tests'
    );
  }

  subtaskTemplates.forEach((templateTitle, idx) => {
    const subtask: Subtask = {
      id: generateId(),
      type: 'subtask',
      parentId: ticket.id,
      taskId: `SUB-${startCounter + idx}`,
      title: templateTitle,
      description: `${templateTitle} for ${ticket.title}`,
      status: 'not-started',
      priority: ticket.priority,
      tags: ['subtask'],
      definitionOfDone: generateDoD(templateTitle, 'subtask'),
      testNotes: [],
      riskFlags: [],
      estimatedEffort: Math.ceil((ticket.estimatedEffort || 8) / subtaskTemplates.length),
      checklistItem: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    subtasks.push(subtask);
  });

  return subtasks;
}

/**
 * Extract relevant tags from text
 */
function extractTags(text: string): string[] {
  const tags: string[] = [];
  const lower = text.toLowerCase();

  const tagMap: { [key: string]: string } = {
    'frontend': 'frontend',
    'ui': 'frontend',
    'react': 'frontend',
    'backend': 'backend',
    'api': 'backend',
    'server': 'backend',
    'database': 'database',
    'db': 'database',
    'auth': 'security',
    'security': 'security',
    'test': 'testing',
    'testing': 'testing',
    'mobile': 'mobile',
    'notification': 'notification',
    'dashboard': 'analytics',
  };

  Object.keys(tagMap).forEach(keyword => {
    if (lower.includes(keyword)) {
      tags.push(tagMap[keyword]);
    }
  });

  return Array.from(new Set(tags));
}
