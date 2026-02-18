import { BreakdownInput, BreakdownResult, TaskBreakdown, TaskDependency, DefinitionOfDone, TestNote, RiskFlag, TaskType } from '@/types/breakdown';
import { generateId } from './utils';

/**
 * AI-powered task breakdown service
 * This service analyzes input (issues, PRDs, screenshots) and breaks them down into
 * epics, tickets, and subtasks with DoD, test notes, and risk flags
 */

interface ParsedTask {
  type: TaskType;
  title: string;
  description: string;
  dod: string[];
  tests: { description: string; type: string; priority: number }[];
  risks: { description: string; level: string; mitigation?: string }[];
  estimatedHours?: number;
  skills: string[];
  parentTitle?: string;
}

/**
 * Parse the input and extract structured task information
 * In a production system, this would call an LLM API (OpenAI, Anthropic, etc.)
 * For now, we use rule-based parsing and pattern matching
 */
function parseInput(input: BreakdownInput): ParsedTask[] {
  const content = input.content.toLowerCase();
  const tasks: ParsedTask[] = [];

  // Detect if this is a feature request, bug fix, or infrastructure work
  const isFeature = content.includes('feature') || content.includes('implement') || content.includes('add');
  const isBug = content.includes('bug') || content.includes('fix') || content.includes('error');
  const isInfra = content.includes('infrastructure') || content.includes('deployment') || content.includes('devops');

  // Extract main epic from title/description
  const epicTitle = extractMainTitle(input.content);
  const epicDescription = extractDescription(input.content);

  // Create main epic
  const epic: ParsedTask = {
    type: 'epic',
    title: epicTitle,
    description: epicDescription,
    dod: generateEpicDoD(epicTitle, isFeature, isBug, isInfra),
    tests: [],
    risks: identifyRisks(input.content),
    estimatedHours: estimateHours('epic', input.content),
    skills: extractRequiredSkills(input.content),
  };
  tasks.push(epic);

  // Break down into tickets
  const tickets = generateTickets(epicTitle, epicDescription, isFeature, isBug, isInfra);
  tasks.push(...tickets);

  // Generate subtasks for each ticket
  tickets.forEach(ticket => {
    const subtasks = generateSubtasks(ticket);
    tasks.push(...subtasks);
  });

  return tasks;
}

function extractMainTitle(content: string): string {
  // Try to find title in common formats
  const lines = content.split('\n').filter(l => l.trim());

  // Check for markdown header
  const headerMatch = lines.find(l => l.startsWith('#'));
  if (headerMatch) {
    return headerMatch.replace(/^#+\s*/, '').trim();
  }

  // Check for "Title:" prefix
  const titleMatch = lines.find(l => l.toLowerCase().startsWith('title:'));
  if (titleMatch) {
    return titleMatch.replace(/^title:\s*/i, '').trim();
  }

  // Use first non-empty line
  return lines[0]?.trim() || 'Automated Task Breakdown';
}

function extractDescription(content: string): string {
  const lines = content.split('\n');
  // Skip title and get description
  const descStart = lines.findIndex(l =>
    l.toLowerCase().startsWith('description:') ||
    l.toLowerCase().startsWith('## description')
  );

  if (descStart >= 0) {
    return lines.slice(descStart + 1).join('\n').trim();
  }

  // Return content after first line
  return lines.slice(1).join('\n').trim() || 'No detailed description provided';
}

function generateEpicDoD(title: string, isFeature: boolean, isBug: boolean, isInfra: boolean): string[] {
  const dod: string[] = [];

  if (isFeature) {
    dod.push('All user-facing features are implemented and functional');
    dod.push('UI/UX matches design specifications');
    dod.push('Feature is fully tested (unit, integration, e2e)');
  }

  if (isBug) {
    dod.push('Root cause identified and documented');
    dod.push('Fix implemented and verified');
    dod.push('Regression tests added');
  }

  if (isInfra) {
    dod.push('Infrastructure is deployed and stable');
    dod.push('Monitoring and alerts configured');
    dod.push('Documentation updated');
  }

  dod.push('Code reviewed and approved');
  dod.push('All tests passing in CI/CD');
  dod.push('Documentation updated');
  dod.push('Stakeholder sign-off received');

  return dod;
}

function identifyRisks(content: string): { description: string; level: string; mitigation?: string }[] {
  const risks: { description: string; level: string; mitigation?: string }[] = [];
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('database') || lowerContent.includes('migration')) {
    risks.push({
      description: 'Database schema changes may require downtime',
      level: 'high',
      mitigation: 'Use zero-downtime migration strategy with backwards compatibility'
    });
  }

  if (lowerContent.includes('authentication') || lowerContent.includes('security')) {
    risks.push({
      description: 'Security vulnerabilities if not implemented correctly',
      level: 'critical',
      mitigation: 'Security review required, follow OWASP best practices'
    });
  }

  if (lowerContent.includes('api') && lowerContent.includes('breaking')) {
    risks.push({
      description: 'Breaking API changes may affect clients',
      level: 'high',
      mitigation: 'Version the API and provide migration guide'
    });
  }

  if (lowerContent.includes('performance') || lowerContent.includes('scale')) {
    risks.push({
      description: 'Performance issues under high load',
      level: 'medium',
      mitigation: 'Load testing and performance profiling required'
    });
  }

  // Always add a general risk
  if (risks.length === 0) {
    risks.push({
      description: 'Unforeseen technical complexity',
      level: 'low',
      mitigation: 'Regular check-ins and scope review'
    });
  }

  return risks;
}

function extractRequiredSkills(content: string): string[] {
  const skills = new Set<string>();
  const lowerContent = content.toLowerCase();

  // Frontend
  if (lowerContent.includes('react') || lowerContent.includes('ui') || lowerContent.includes('frontend')) {
    skills.add('React');
    skills.add('TypeScript');
    skills.add('CSS');
  }

  // Backend
  if (lowerContent.includes('api') || lowerContent.includes('backend') || lowerContent.includes('server')) {
    skills.add('Node.js');
    skills.add('API Design');
  }

  // Database
  if (lowerContent.includes('database') || lowerContent.includes('sql') || lowerContent.includes('supabase')) {
    skills.add('SQL');
    skills.add('Database Design');
  }

  // DevOps
  if (lowerContent.includes('deploy') || lowerContent.includes('ci') || lowerContent.includes('docker')) {
    skills.add('DevOps');
    skills.add('CI/CD');
  }

  // Testing
  if (lowerContent.includes('test')) {
    skills.add('Testing');
  }

  // Default skills
  if (skills.size === 0) {
    skills.add('TypeScript');
    skills.add('Problem Solving');
  }

  return Array.from(skills);
}

function estimateHours(type: TaskType, content: string): number {
  const complexity = assessComplexity(content);

  switch (type) {
    case 'epic':
      return complexity * 40; // 1-5 weeks
    case 'ticket':
      return complexity * 8; // 1-5 days
    case 'subtask':
      return complexity * 2; // 2-10 hours
    default:
      return 8;
  }
}

function assessComplexity(content: string): number {
  const lowerContent = content.toLowerCase();
  let complexity = 1;

  // Increase complexity based on keywords
  if (lowerContent.includes('database') || lowerContent.includes('migration')) complexity += 1;
  if (lowerContent.includes('authentication') || lowerContent.includes('security')) complexity += 1;
  if (lowerContent.includes('integration') || lowerContent.includes('third-party')) complexity += 1;
  if (lowerContent.includes('refactor') || lowerContent.includes('redesign')) complexity += 1;
  if (lowerContent.includes('performance') || lowerContent.includes('optimization')) complexity += 1;

  return Math.min(complexity, 5);
}

function generateTickets(epicTitle: string, epicDescription: string, isFeature: boolean, isBug: boolean, isInfra: boolean): ParsedTask[] {
  const tickets: ParsedTask[] = [];

  if (isFeature) {
    // Backend ticket
    tickets.push({
      type: 'ticket',
      title: `Backend: ${epicTitle}`,
      description: 'Implement backend services, APIs, and database changes',
      parentTitle: epicTitle,
      dod: [
        'API endpoints implemented',
        'Database schema updated',
        'Unit tests passing',
        'API documentation updated'
      ],
      tests: [
        { description: 'Unit tests for business logic', type: 'unit', priority: 5 },
        { description: 'Integration tests for API endpoints', type: 'integration', priority: 4 }
      ],
      risks: [
        { description: 'Database migration issues', level: 'medium' }
      ],
      estimatedHours: 16,
      skills: ['Node.js', 'TypeScript', 'SQL', 'API Design']
    });

    // Frontend ticket
    tickets.push({
      type: 'ticket',
      title: `Frontend: ${epicTitle}`,
      description: 'Implement user interface and client-side logic',
      parentTitle: epicTitle,
      dod: [
        'UI components implemented',
        'State management working',
        'Component tests passing',
        'UI matches design specs'
      ],
      tests: [
        { description: 'Component unit tests', type: 'unit', priority: 5 },
        { description: 'E2E user flow tests', type: 'e2e', priority: 4 }
      ],
      risks: [
        { description: 'Browser compatibility issues', level: 'low' }
      ],
      estimatedHours: 16,
      skills: ['React', 'TypeScript', 'CSS', 'Testing']
    });

    // Testing & QA ticket
    tickets.push({
      type: 'ticket',
      title: `Testing: ${epicTitle}`,
      description: 'Comprehensive testing and quality assurance',
      parentTitle: epicTitle,
      dod: [
        'All test scenarios documented',
        'Integration tests passing',
        'E2E tests passing',
        'Manual QA completed'
      ],
      tests: [
        { description: 'End-to-end user flows', type: 'e2e', priority: 5 },
        { description: 'Cross-browser testing', type: 'manual', priority: 3 }
      ],
      risks: [],
      estimatedHours: 8,
      skills: ['Testing', 'QA']
    });
  } else if (isBug) {
    tickets.push({
      type: 'ticket',
      title: `Investigation: ${epicTitle}`,
      description: 'Investigate root cause and create reproduction steps',
      parentTitle: epicTitle,
      dod: [
        'Root cause identified',
        'Reproduction steps documented',
        'Fix approach defined'
      ],
      tests: [],
      risks: [],
      estimatedHours: 4,
      skills: ['Debugging', 'Problem Solving']
    });

    tickets.push({
      type: 'ticket',
      title: `Fix: ${epicTitle}`,
      description: 'Implement fix and add regression tests',
      parentTitle: epicTitle,
      dod: [
        'Fix implemented',
        'Regression tests added',
        'Manual verification completed'
      ],
      tests: [
        { description: 'Regression test for bug', type: 'unit', priority: 5 }
      ],
      risks: [],
      estimatedHours: 8,
      skills: ['TypeScript', 'Testing']
    });
  } else if (isInfra) {
    tickets.push({
      type: 'ticket',
      title: `Infrastructure: ${epicTitle}`,
      description: 'Set up and configure infrastructure',
      parentTitle: epicTitle,
      dod: [
        'Infrastructure provisioned',
        'Configuration applied',
        'Monitoring set up'
      ],
      tests: [
        { description: 'Infrastructure smoke tests', type: 'integration', priority: 4 }
      ],
      risks: [
        { description: 'Deployment failures', level: 'high' }
      ],
      estimatedHours: 12,
      skills: ['DevOps', 'CI/CD']
    });
  } else {
    // Generic breakdown
    tickets.push({
      type: 'ticket',
      title: `Implementation: ${epicTitle}`,
      description: 'Core implementation work',
      parentTitle: epicTitle,
      dod: [
        'Core functionality implemented',
        'Tests passing',
        'Code reviewed'
      ],
      tests: [
        { description: 'Unit tests', type: 'unit', priority: 5 }
      ],
      risks: [],
      estimatedHours: 16,
      skills: ['TypeScript', 'Problem Solving']
    });
  }

  return tickets;
}

function generateSubtasks(ticket: ParsedTask): ParsedTask[] {
  const subtasks: ParsedTask[] = [];

  // Generate 2-4 subtasks per ticket
  const taskCount = Math.floor(Math.random() * 3) + 2;

  for (let i = 0; i < taskCount; i++) {
    subtasks.push({
      type: 'subtask',
      title: `${ticket.title} - Task ${i + 1}`,
      description: `Subtask ${i + 1} for ${ticket.title}`,
      parentTitle: ticket.title,
      dod: [
        'Code implemented',
        'Tests written',
        'PR created'
      ],
      tests: [],
      risks: [],
      estimatedHours: Math.ceil((ticket.estimatedHours || 8) / taskCount),
      skills: ticket.skills
    });
  }

  return subtasks;
}

function createTaskBreakdown(parsedTask: ParsedTask, userId: string): TaskBreakdown {
  const now = Date.now();

  return {
    id: generateId(),
    userId,
    taskType: parsedTask.type,
    title: parsedTask.title,
    description: parsedTask.description,
    definitionOfDone: parsedTask.dod.map((criteria, idx) => ({
      id: generateId(),
      criteria,
      completed: false
    })),
    testNotes: parsedTask.tests.map(test => ({
      id: generateId(),
      description: test.description,
      type: test.type as 'unit' | 'integration' | 'e2e' | 'manual' | 'performance',
      priority: test.priority
    })),
    riskFlags: parsedTask.risks.map(risk => ({
      id: generateId(),
      description: risk.description,
      level: risk.level as 'low' | 'medium' | 'high' | 'critical',
      mitigation: risk.mitigation,
      status: 'open' as const
    })),
    estimatedHours: parsedTask.estimatedHours,
    skillsRequired: parsedTask.skills,
    createdAt: now,
    updatedAt: now
  };
}

function generateDependencies(tasks: TaskBreakdown[]): TaskDependency[] {
  const dependencies: TaskDependency[] = [];

  // Group tasks by type and parent
  const epics = tasks.filter(t => t.taskType === 'epic');
  const tickets = tasks.filter(t => t.taskType === 'ticket');
  const subtasks = tasks.filter(t => t.taskType === 'subtask');

  // Epic -> Tickets dependencies
  epics.forEach(epic => {
    const relatedTickets = tickets.filter(t =>
      t.title.includes(epic.title) || t.description.includes(epic.title)
    );

    relatedTickets.forEach(ticket => {
      dependencies.push({
        id: generateId(),
        fromTaskId: ticket.id,
        toTaskId: epic.id,
        type: 'requires',
        createdAt: Date.now()
      });
    });
  });

  // Ticket -> Subtasks dependencies
  tickets.forEach(ticket => {
    const relatedSubtasks = subtasks.filter(st =>
      st.title.includes(ticket.title)
    );

    relatedSubtasks.forEach(subtask => {
      dependencies.push({
        id: generateId(),
        fromTaskId: subtask.id,
        toTaskId: ticket.id,
        type: 'requires',
        createdAt: Date.now()
      });
    });
  });

  // Backend blocks Frontend
  const backendTicket = tickets.find(t => t.title.toLowerCase().includes('backend'));
  const frontendTicket = tickets.find(t => t.title.toLowerCase().includes('frontend'));

  if (backendTicket && frontendTicket) {
    dependencies.push({
      id: generateId(),
      fromTaskId: frontendTicket.id,
      toTaskId: backendTicket.id,
      type: 'blocks',
      createdAt: Date.now()
    });
  }

  return dependencies;
}

/**
 * Main function to break down a task
 */
export async function breakdownTask(input: BreakdownInput, userId: string): Promise<BreakdownResult> {
  try {
    // Parse the input
    const parsedTasks = parseInput(input);

    // Convert to TaskBreakdown objects
    const allTasks = parsedTasks.map(pt => createTaskBreakdown(pt, userId));

    // Separate by type
    const epics = allTasks.filter(t => t.taskType === 'epic');
    const tickets = allTasks.filter(t => t.taskType === 'ticket');
    const subtasks = allTasks.filter(t => t.taskType === 'subtask');

    // Generate dependencies
    const dependencies = generateDependencies(allTasks);

    // Create summary
    const summary = `Breakdown complete: ${epics.length} epic(s), ${tickets.length} ticket(s), ${subtasks.length} subtask(s) created with ${dependencies.length} dependencies identified.`;

    return {
      epics,
      tickets,
      subtasks,
      dependencies,
      summary
    };
  } catch (error) {
    console.error('Error breaking down task:', error);
    throw new Error('Failed to break down task');
  }
}
