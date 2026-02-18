/**
 * AI-Powered Task Breakdown Service
 *
 * This service takes an issue/PRD/screenshot and breaks it down into:
 * - Epics (high-level features)
 * - Tickets (user stories with DoD)
 * - Subtasks (granular implementation tasks)
 * - Dependencies between tasks
 * - Risk flags and test notes
 */

import { BreakdownInput, BreakdownResult, GeneratedEpic, GeneratedTicket, GeneratedSubtask, GeneratedDependency } from '@/types/orchestration';

/**
 * Main function to break down a requirement into structured tasks
 */
export async function breakdownRequirement(input: BreakdownInput): Promise<BreakdownResult> {
  const startTime = Date.now();

  try {
    // In a real implementation, this would call an LLM API (OpenAI, Anthropic, etc.)
    // For now, we'll use a rule-based approach with templates

    const result = await analyzeAndBreakdown(input);

    const processingTime = Date.now() - startTime;
    console.log(`Breakdown completed in ${processingTime}ms`);

    return result;
  } catch (error) {
    console.error('Error breaking down requirement:', error);
    throw new Error('Failed to break down requirement');
  }
}

/**
 * Analyzes the input and generates structured breakdown
 */
async function analyzeAndBreakdown(input: BreakdownInput): Promise<BreakdownResult> {
  // Parse the input content
  const content = input.content.toLowerCase();

  // Detect the type of requirement
  const isFeature = content.includes('implement') || content.includes('add') || content.includes('create');
  const isBugFix = content.includes('fix') || content.includes('bug') || content.includes('issue');
  const isRefactor = content.includes('refactor') || content.includes('improve') || content.includes('optimize');

  // Generate breakdown based on content analysis
  const epics: GeneratedEpic[] = [];
  const tickets: GeneratedTicket[] = [];
  const subtasks: GeneratedSubtask[] = [];
  const dependencies: GeneratedDependency[] = [];

  // Example breakdown logic (would be LLM-powered in production)
  if (isFeature) {
    // For feature requests, create epic -> tickets -> subtasks
    const epic = createFeatureEpic(input.content);
    epics.push(epic);

    const featureTickets = createFeatureTickets(input.content, 0);
    tickets.push(...featureTickets);

    // Create subtasks for each ticket
    featureTickets.forEach((ticket, ticketIndex) => {
      const taskSubtasks = createSubtasksForTicket(ticket, ticketIndex);
      subtasks.push(...taskSubtasks);
    });

    // Create dependencies between tickets
    if (tickets.length > 1) {
      dependencies.push(...createFeatureDependencies(tickets.length));
    }
  } else if (isBugFix) {
    // For bug fixes, usually just tickets with subtasks
    const bugTickets = createBugTickets(input.content);
    tickets.push(...bugTickets);

    bugTickets.forEach((ticket, ticketIndex) => {
      const taskSubtasks = createSubtasksForTicket(ticket, ticketIndex);
      subtasks.push(...taskSubtasks);
    });
  } else {
    // Generic breakdown
    const genericTickets = createGenericTickets(input.content);
    tickets.push(...genericTickets);

    genericTickets.forEach((ticket, ticketIndex) => {
      const taskSubtasks = createSubtasksForTicket(ticket, ticketIndex);
      subtasks.push(...taskSubtasks);
    });
  }

  return {
    epics,
    tickets,
    subtasks,
    dependencies,
  };
}

/**
 * Creates an epic for a feature request
 */
function createFeatureEpic(content: string): GeneratedEpic {
  const title = extractTitle(content);

  return {
    title: `Epic: ${title}`,
    description: content,
    priority: 3,
    tags: ['feature', 'epic'],
  };
}

/**
 * Creates tickets for a feature
 */
function createFeatureTickets(content: string, epicIndex: number): GeneratedTicket[] {
  const tickets: GeneratedTicket[] = [];

  // Detect if it mentions frontend/backend/database
  const hasFrontend = content.toLowerCase().includes('ui') ||
                      content.toLowerCase().includes('interface') ||
                      content.toLowerCase().includes('frontend') ||
                      content.toLowerCase().includes('page') ||
                      content.toLowerCase().includes('component');

  const hasBackend = content.toLowerCase().includes('api') ||
                     content.toLowerCase().includes('backend') ||
                     content.toLowerCase().includes('server') ||
                     content.toLowerCase().includes('endpoint');

  const hasDatabase = content.toLowerCase().includes('database') ||
                      content.toLowerCase().includes('data') ||
                      content.toLowerCase().includes('schema') ||
                      content.toLowerCase().includes('table');

  // Database schema ticket (if needed)
  if (hasDatabase) {
    tickets.push({
      epicIndex,
      title: 'Design and implement database schema',
      description: 'Create database tables, relationships, and migrations for the feature',
      priority: 5,
      tags: ['database', 'backend'],
      definitionOfDone: [
        'Database schema designed and reviewed',
        'Migration scripts created',
        'Database indexes optimized',
        'Data validation constraints added',
      ],
      testNotes: 'Test migrations on clean database and with existing data',
      riskLevel: 'high',
      riskDescription: 'Database schema changes can affect existing data',
      storyPoints: 5,
      estimatedHours: 8,
      suggestedSkills: ['Database Design', 'SQL', 'Migrations'],
    });
  }

  // Backend API ticket (if needed)
  if (hasBackend) {
    tickets.push({
      epicIndex,
      title: 'Implement backend API endpoints',
      description: 'Create REST API endpoints for the feature with proper validation and error handling',
      priority: 4,
      tags: ['backend', 'api'],
      definitionOfDone: [
        'API endpoints implemented',
        'Input validation added',
        'Error handling implemented',
        'API documentation updated',
        'Unit tests written',
      ],
      testNotes: 'Test all endpoints with valid and invalid inputs. Check error responses.',
      riskLevel: 'medium',
      riskDescription: 'API changes may affect existing integrations',
      storyPoints: 8,
      estimatedHours: 12,
      suggestedSkills: ['API Development', 'Node.js', 'Validation'],
    });
  }

  // Frontend UI ticket (if needed)
  if (hasFrontend) {
    tickets.push({
      epicIndex,
      title: 'Build frontend user interface',
      description: 'Create UI components and integrate with backend API',
      priority: 3,
      tags: ['frontend', 'ui'],
      definitionOfDone: [
        'UI components created',
        'Component tests written',
        'Accessibility requirements met',
        'Responsive design implemented',
        'Error states handled',
      ],
      testNotes: 'Test on different screen sizes and browsers. Verify accessibility.',
      riskLevel: 'low',
      riskDescription: 'UI changes are relatively isolated',
      storyPoints: 5,
      estimatedHours: 10,
      suggestedSkills: ['React', 'TypeScript', 'CSS', 'UI/UX'],
    });
  }

  // Integration and testing ticket
  if (tickets.length > 1) {
    tickets.push({
      epicIndex,
      title: 'Integration testing and deployment',
      description: 'End-to-end testing and deployment of the complete feature',
      priority: 3,
      tags: ['testing', 'deployment'],
      definitionOfDone: [
        'E2E tests written and passing',
        'Integration tests completed',
        'Feature deployed to staging',
        'Documentation updated',
        'Team demo completed',
      ],
      testNotes: 'Perform full user flow testing. Check integration with existing features.',
      riskLevel: 'medium',
      riskDescription: 'Integration issues may arise',
      storyPoints: 3,
      estimatedHours: 6,
      suggestedSkills: ['Testing', 'DevOps', 'Documentation'],
    });
  }

  // If no specific tickets were created, create a generic implementation ticket
  if (tickets.length === 0) {
    tickets.push({
      epicIndex,
      title: extractTitle(content),
      description: content,
      priority: 3,
      tags: ['feature'],
      definitionOfDone: [
        'Feature implemented',
        'Tests written',
        'Documentation updated',
        'Code reviewed',
      ],
      testNotes: 'Test the feature thoroughly',
      riskLevel: 'medium',
      storyPoints: 5,
      estimatedHours: 8,
      suggestedSkills: [],
    });
  }

  return tickets;
}

/**
 * Creates tickets for bug fixes
 */
function createBugTickets(content: string): GeneratedTicket[] {
  const title = extractTitle(content);

  return [{
    title: `Fix: ${title}`,
    description: content,
    priority: 4,
    tags: ['bug', 'fix'],
    definitionOfDone: [
      'Bug root cause identified',
      'Fix implemented',
      'Regression tests added',
      'Fix verified in staging',
      'No new bugs introduced',
    ],
    testNotes: 'Verify the bug is fixed and no regression occurred',
    riskLevel: 'medium',
    riskDescription: 'Bug fixes may have unintended side effects',
    storyPoints: 3,
    estimatedHours: 4,
    suggestedSkills: ['Debugging', 'Testing'],
  }];
}

/**
 * Creates generic tickets
 */
function createGenericTickets(content: string): GeneratedTicket[] {
  const title = extractTitle(content);

  return [{
    title,
    description: content,
    priority: 3,
    tags: ['task'],
    definitionOfDone: [
      'Task completed',
      'Tests written',
      'Code reviewed',
    ],
    testNotes: 'Test the changes',
    storyPoints: 3,
    estimatedHours: 4,
    suggestedSkills: [],
  }];
}

/**
 * Creates subtasks for a ticket
 */
function createSubtasksForTicket(ticket: GeneratedTicket, ticketIndex: number): GeneratedSubtask[] {
  const subtasks: GeneratedSubtask[] = [];

  // Create subtasks based on ticket type
  if (ticket.tags.includes('database')) {
    subtasks.push(
      {
        ticketIndex,
        title: 'Design database schema',
        description: 'Create ERD and define table structures',
        orderIndex: 0,
        estimatedMinutes: 120,
      },
      {
        ticketIndex,
        title: 'Write migration scripts',
        description: 'Create SQL migration files',
        orderIndex: 1,
        estimatedMinutes: 90,
      },
      {
        ticketIndex,
        title: 'Test migrations',
        description: 'Test migrations on dev environment',
        orderIndex: 2,
        estimatedMinutes: 60,
      }
    );
  } else if (ticket.tags.includes('api') || ticket.tags.includes('backend')) {
    subtasks.push(
      {
        ticketIndex,
        title: 'Define API interface',
        description: 'Create API specification and types',
        orderIndex: 0,
        estimatedMinutes: 90,
      },
      {
        ticketIndex,
        title: 'Implement API endpoints',
        description: 'Write endpoint handlers and business logic',
        orderIndex: 1,
        estimatedMinutes: 240,
      },
      {
        ticketIndex,
        title: 'Add validation and error handling',
        description: 'Implement input validation and error responses',
        orderIndex: 2,
        estimatedMinutes: 120,
      },
      {
        ticketIndex,
        title: 'Write unit tests',
        description: 'Create unit tests for API endpoints',
        orderIndex: 3,
        estimatedMinutes: 180,
      }
    );
  } else if (ticket.tags.includes('frontend') || ticket.tags.includes('ui')) {
    subtasks.push(
      {
        ticketIndex,
        title: 'Create component structure',
        description: 'Set up component files and basic structure',
        orderIndex: 0,
        estimatedMinutes: 60,
      },
      {
        ticketIndex,
        title: 'Implement UI logic',
        description: 'Add state management and event handlers',
        orderIndex: 1,
        estimatedMinutes: 180,
      },
      {
        ticketIndex,
        title: 'Style components',
        description: 'Apply CSS and make responsive',
        orderIndex: 2,
        estimatedMinutes: 120,
      },
      {
        ticketIndex,
        title: 'Add accessibility features',
        description: 'Implement ARIA labels and keyboard navigation',
        orderIndex: 3,
        estimatedMinutes: 90,
      }
    );
  } else {
    // Generic subtasks
    subtasks.push(
      {
        ticketIndex,
        title: 'Research and planning',
        description: 'Research approach and create implementation plan',
        orderIndex: 0,
        estimatedMinutes: 60,
      },
      {
        ticketIndex,
        title: 'Implementation',
        description: 'Implement the feature',
        orderIndex: 1,
        estimatedMinutes: 180,
      },
      {
        ticketIndex,
        title: 'Testing',
        description: 'Write and run tests',
        orderIndex: 2,
        estimatedMinutes: 90,
      }
    );
  }

  return subtasks;
}

/**
 * Creates dependencies for feature tickets
 */
function createFeatureDependencies(ticketCount: number): GeneratedDependency[] {
  const dependencies: GeneratedDependency[] = [];

  // Typical dependency: database -> backend -> frontend -> integration
  // Assuming tickets are in that order
  for (let i = 1; i < ticketCount; i++) {
    dependencies.push({
      sourceType: 'ticket',
      sourceIndex: i,
      targetType: 'ticket',
      targetIndex: i - 1,
      dependencyType: 'blocks',
      reason: 'Requires completion of previous component',
    });
  }

  return dependencies;
}

/**
 * Extracts a title from content (first line or sentence)
 */
function extractTitle(content: string): string {
  // Remove markdown formatting
  let title = content.replace(/[#*_`]/g, '').trim();

  // Get first line or first sentence
  const firstLine = title.split('\n')[0];
  const firstSentence = title.split('.')[0];

  title = firstLine.length < firstSentence.length ? firstLine : firstSentence;

  // Truncate if too long
  if (title.length > 100) {
    title = title.substring(0, 97) + '...';
  }

  return title || 'Untitled Task';
}

/**
 * Validates the generated breakdown
 */
export function validateBreakdown(result: BreakdownResult): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for at least one ticket
  if (result.tickets.length === 0) {
    errors.push('Breakdown must include at least one ticket');
  }

  // Validate epic references
  result.tickets.forEach((ticket, idx) => {
    if (ticket.epicIndex !== undefined && ticket.epicIndex >= result.epics.length) {
      errors.push(`Ticket ${idx} references non-existent epic ${ticket.epicIndex}`);
    }
  });

  // Validate subtask references
  result.subtasks.forEach((subtask, idx) => {
    if (subtask.ticketIndex >= result.tickets.length) {
      errors.push(`Subtask ${idx} references non-existent ticket ${subtask.ticketIndex}`);
    }
  });

  // Validate dependencies
  result.dependencies.forEach((dep, idx) => {
    const maxIndex = dep.sourceType === 'epic' ? result.epics.length :
                    dep.sourceType === 'ticket' ? result.tickets.length :
                    result.subtasks.length;

    if (dep.sourceIndex >= maxIndex) {
      errors.push(`Dependency ${idx} has invalid source index`);
    }

    const maxTargetIndex = dep.targetType === 'epic' ? result.epics.length :
                          dep.targetType === 'ticket' ? result.tickets.length :
                          result.subtasks.length;

    if (dep.targetIndex >= maxTargetIndex) {
      errors.push(`Dependency ${idx} has invalid target index`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
