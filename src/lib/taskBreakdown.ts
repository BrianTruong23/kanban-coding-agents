import { Task, TaskBreakdown, TaskDependency, TaskType, RiskLevel } from '@/types/task';
import { generateId, generateTaskId } from './utils';

/**
 * AI-powered Task Breakdown Service
 * This service analyzes issues, PRDs, or screenshots and breaks them down into
 * epics, tickets, and subtasks with DoD, test notes, and risk flags.
 */

export interface BreakdownInput {
  type: 'issue' | 'prd' | 'screenshot';
  content: string; // Issue description, PRD text, or screenshot analysis
  title: string;
  priority?: 1 | 2 | 3 | 4 | 5;
  sprint?: string;
}

export interface BreakdownResult {
  epic: Partial<Task>;
  tickets: Partial<Task>[];
  subtasks: Partial<Task>[];
  dependencies: Array<{
    taskIndex: number;
    dependsOnIndex: number;
    type: 'blocks' | 'related' | 'follows';
  }>;
}

/**
 * Analyzes the input and breaks it down into structured tasks
 * This is a rule-based implementation that can be enhanced with LLM integration
 */
export function analyzeAndBreakdown(input: BreakdownInput): BreakdownResult {
  const content = input.content.toLowerCase();
  const lines = input.content.split('\n').filter(line => line.trim());

  // Create the epic
  const epic: Partial<Task> = {
    title: input.title,
    description: input.content,
    taskType: 'epic',
    priority: input.priority || 3,
    sprint: input.sprint,
    status: 'backlog',
    tags: detectTags(content),
    riskLevel: assessRiskLevel(content),
    riskNotes: extractRiskNotes(content),
    definitionOfDone: generateEpicDoD(input.title),
    estimatedHours: estimateHours(content, 'epic'),
  };

  // Break down into tickets
  const tickets = breakdownIntoTickets(input);

  // Break down tickets into subtasks
  const subtasks = breakdownIntoSubtasks(tickets);

  // Detect dependencies
  const dependencies = detectDependencies(tickets, subtasks);

  return { epic, tickets, subtasks, dependencies };
}

/**
 * Detects relevant tags from content
 */
function detectTags(content: string): string[] {
  const tags: string[] = [];

  const tagPatterns = {
    'frontend': /frontend|ui|user interface|react|component|css|html/i,
    'backend': /backend|api|server|database|endpoint/i,
    'bug': /bug|fix|error|issue|problem/i,
    'feature': /feature|new|add|implement/i,
    'security': /security|auth|authentication|authorization|encrypt/i,
    'performance': /performance|optimize|speed|slow|fast/i,
    'testing': /test|testing|unit test|integration test/i,
    'documentation': /document|docs|readme|guide/i,
    'devops': /devops|ci|cd|deploy|docker|kubernetes/i,
    'database': /database|sql|query|migration|schema/i,
  };

  for (const [tag, pattern] of Object.entries(tagPatterns)) {
    if (pattern.test(content)) {
      tags.push(tag);
    }
  }

  return tags.length > 0 ? tags : ['general'];
}

/**
 * Assesses the risk level based on content
 */
function assessRiskLevel(content: string): RiskLevel {
  const highRiskKeywords = /breaking|critical|security|production|data loss|migration/i;
  const mediumRiskKeywords = /refactor|change|update|modify|database/i;
  const criticalKeywords = /urgent|emergency|down|outage/i;

  if (criticalKeywords.test(content)) return 'critical';
  if (highRiskKeywords.test(content)) return 'high';
  if (mediumRiskKeywords.test(content)) return 'medium';
  return 'low';
}

/**
 * Extracts risk notes from content
 */
function extractRiskNotes(content: string): string | undefined {
  const riskIndicators = [
    'breaking change',
    'affects production',
    'data migration',
    'schema change',
    'requires downtime',
  ];

  const foundRisks = riskIndicators.filter(risk =>
    content.toLowerCase().includes(risk)
  );

  if (foundRisks.length > 0) {
    return `Potential risks: ${foundRisks.join(', ')}`;
  }

  return undefined;
}

/**
 * Generates Definition of Done for an epic
 */
function generateEpicDoD(title: string): string {
  return `- All tickets completed and tested
- Code reviewed and merged
- Documentation updated
- Stakeholder approval received
- Deployed to production`;
}

/**
 * Generates Definition of Done for a ticket
 */
function generateTicketDoD(title: string): string {
  return `- Feature implemented and working
- Unit tests written and passing
- Code reviewed and approved
- Manual testing completed
- Documentation updated`;
}

/**
 * Generates Definition of Done for a subtask
 */
function generateSubtaskDoD(title: string): string {
  return `- Task completed as described
- Code reviewed
- Tests passing
- No blocking issues`;
}

/**
 * Estimates hours based on content and type
 */
function estimateHours(content: string, type: TaskType): number {
  const wordCount = content.split(/\s+/).length;
  const complexity = assessComplexity(content);

  let baseHours = 0;
  switch (type) {
    case 'epic':
      baseHours = 40;
      break;
    case 'task':
      baseHours = 8;
      break;
    case 'subtask':
      baseHours = 2;
      break;
  }

  // Adjust based on complexity
  const multiplier = complexity === 'high' ? 1.5 : complexity === 'medium' ? 1.2 : 1;

  return Math.round(baseHours * multiplier);
}

/**
 * Assesses complexity of content
 */
function assessComplexity(content: string): 'low' | 'medium' | 'high' {
  const complexKeywords = /complex|difficult|challenging|integrate|multiple|advanced/i;
  const simpleKeywords = /simple|easy|straightforward|basic|minor/i;

  if (complexKeywords.test(content)) return 'high';
  if (simpleKeywords.test(content)) return 'low';
  return 'medium';
}

/**
 * Breaks down input into tickets
 */
function breakdownIntoTickets(input: BreakdownInput): Partial<Task>[] {
  const content = input.content;
  const tickets: Partial<Task>[] = [];

  // Pattern 1: Look for numbered lists
  const numberedPattern = /^\d+\.\s+(.+)$/gm;
  const numberedMatches = [...content.matchAll(numberedPattern)];

  if (numberedMatches.length > 0) {
    numberedMatches.forEach((match, index) => {
      const title = match[1].trim();
      tickets.push(createTicket(title, input, index));
    });
    return tickets;
  }

  // Pattern 2: Look for bullet points
  const bulletPattern = /^[-*]\s+(.+)$/gm;
  const bulletMatches = [...content.matchAll(bulletPattern)];

  if (bulletMatches.length > 0) {
    bulletMatches.forEach((match, index) => {
      const title = match[1].trim();
      tickets.push(createTicket(title, input, index));
    });
    return tickets;
  }

  // Pattern 3: Look for sections with headers
  const sectionPattern = /^#{1,3}\s+(.+)$/gm;
  const sectionMatches = [...content.matchAll(sectionPattern)];

  if (sectionMatches.length > 0) {
    sectionMatches.forEach((match, index) => {
      const title = match[1].trim();
      tickets.push(createTicket(title, input, index));
    });
    return tickets;
  }

  // Pattern 4: Split by sentences if no clear structure
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);

  if (sentences.length > 1) {
    sentences.slice(0, Math.min(5, sentences.length)).forEach((sentence, index) => {
      const title = sentence.trim().substring(0, 100);
      tickets.push(createTicket(title, input, index));
    });
    return tickets;
  }

  // Default: Create a single ticket
  tickets.push(createTicket(`Implement: ${input.title}`, input, 0));

  return tickets;
}

/**
 * Creates a ticket with appropriate metadata
 */
function createTicket(title: string, input: BreakdownInput, index: number): Partial<Task> {
  const tags = detectTags(title);
  const riskLevel = assessRiskLevel(title);

  return {
    title: title.length > 100 ? title.substring(0, 97) + '...' : title,
    description: `This is ticket ${index + 1} for: ${input.title}`,
    taskType: 'task',
    priority: input.priority || 3,
    sprint: input.sprint,
    status: 'backlog',
    tags,
    riskLevel,
    definitionOfDone: generateTicketDoD(title),
    testNotes: generateTestNotes(title),
    estimatedHours: estimateHours(title, 'task'),
  };
}

/**
 * Generates test notes based on title
 */
function generateTestNotes(title: string): string {
  const testNotes: string[] = [];

  if (/frontend|ui|component/i.test(title)) {
    testNotes.push('- Test UI rendering and interactions');
    testNotes.push('- Verify responsive design');
    testNotes.push('- Check accessibility');
  }

  if (/backend|api|endpoint/i.test(title)) {
    testNotes.push('- Test API endpoints with various inputs');
    testNotes.push('- Verify error handling');
    testNotes.push('- Check authentication/authorization');
  }

  if (/database|query|schema/i.test(title)) {
    testNotes.push('- Test database queries');
    testNotes.push('- Verify data integrity');
    testNotes.push('- Check migration rollback');
  }

  if (testNotes.length === 0) {
    testNotes.push('- Write unit tests');
    testNotes.push('- Perform integration testing');
    testNotes.push('- Manual testing in dev environment');
  }

  return testNotes.join('\n');
}

/**
 * Breaks down tickets into subtasks
 */
function breakdownIntoSubtasks(tickets: Partial<Task>[]): Partial<Task>[] {
  const subtasks: Partial<Task>[] = [];

  tickets.forEach((ticket, ticketIndex) => {
    const title = ticket.title || '';
    const tags = ticket.tags || [];

    // Generate 2-4 subtasks per ticket based on tags and content
    const ticketSubtasks = generateSubtasksForTicket(title, tags, ticketIndex);
    subtasks.push(...ticketSubtasks);
  });

  return subtasks;
}

/**
 * Generates subtasks for a specific ticket
 */
function generateSubtasksForTicket(
  title: string,
  tags: string[],
  ticketIndex: number
): Partial<Task>[] {
  const subtasks: Partial<Task>[] = [];

  // Common subtasks for all tickets
  subtasks.push({
    title: `Research and design approach for: ${title.substring(0, 50)}`,
    description: 'Research best practices and design the implementation approach',
    taskType: 'subtask',
    priority: 3,
    status: 'backlog',
    tags: ['research'],
    definitionOfDone: generateSubtaskDoD('Research'),
    estimatedHours: 1,
  });

  // Tag-specific subtasks
  if (tags.includes('frontend') || tags.includes('ui')) {
    subtasks.push({
      title: `Create UI components for: ${title.substring(0, 50)}`,
      description: 'Build the necessary UI components',
      taskType: 'subtask',
      priority: 3,
      status: 'backlog',
      tags: ['frontend'],
      definitionOfDone: generateSubtaskDoD('UI'),
      estimatedHours: 3,
    });
  }

  if (tags.includes('backend') || tags.includes('api')) {
    subtasks.push({
      title: `Implement backend logic for: ${title.substring(0, 50)}`,
      description: 'Develop the backend API and business logic',
      taskType: 'subtask',
      priority: 3,
      status: 'backlog',
      tags: ['backend'],
      definitionOfDone: generateSubtaskDoD('Backend'),
      estimatedHours: 4,
    });
  }

  if (tags.includes('database')) {
    subtasks.push({
      title: `Create database schema/queries for: ${title.substring(0, 50)}`,
      description: 'Design and implement database changes',
      taskType: 'subtask',
      priority: 3,
      status: 'backlog',
      tags: ['database'],
      definitionOfDone: generateSubtaskDoD('Database'),
      estimatedHours: 2,
    });
  }

  // Always add testing subtask
  subtasks.push({
    title: `Write tests for: ${title.substring(0, 50)}`,
    description: 'Write unit and integration tests',
    taskType: 'subtask',
    priority: 3,
    status: 'backlog',
    tags: ['testing'],
    definitionOfDone: generateSubtaskDoD('Testing'),
    testNotes: '- Unit tests with >80% coverage\n- Integration tests for key flows',
    estimatedHours: 2,
  });

  return subtasks;
}

/**
 * Detects dependencies between tasks
 */
function detectDependencies(
  tickets: Partial<Task>[],
  subtasks: Partial<Task>[]
): Array<{ taskIndex: number; dependsOnIndex: number; type: 'blocks' | 'related' | 'follows' }> {
  const dependencies: Array<{
    taskIndex: number;
    dependsOnIndex: number;
    type: 'blocks' | 'related' | 'follows';
  }> = [];

  // Backend typically blocks frontend
  const backendIndices = tickets
    .map((t, i) => ({ task: t, index: i }))
    .filter(({ task }) => task.tags?.includes('backend'))
    .map(({ index }) => index);

  const frontendIndices = tickets
    .map((t, i) => ({ task: t, index: i }))
    .filter(({ task }) => task.tags?.includes('frontend'))
    .map(({ index }) => index);

  backendIndices.forEach(backendIdx => {
    frontendIndices.forEach(frontendIdx => {
      if (backendIdx !== frontendIdx) {
        dependencies.push({
          taskIndex: frontendIdx,
          dependsOnIndex: backendIdx,
          type: 'blocks',
        });
      }
    });
  });

  // Database changes block backend
  const dbIndices = tickets
    .map((t, i) => ({ task: t, index: i }))
    .filter(({ task }) => task.tags?.includes('database'))
    .map(({ index }) => index);

  dbIndices.forEach(dbIdx => {
    backendIndices.forEach(backendIdx => {
      if (dbIdx !== backendIdx) {
        dependencies.push({
          taskIndex: backendIdx,
          dependsOnIndex: dbIdx,
          type: 'blocks',
        });
      }
    });
  });

  // Sequential tasks follow each other
  for (let i = 1; i < Math.min(tickets.length, 3); i++) {
    if (!dependencies.some(d => d.taskIndex === i)) {
      dependencies.push({
        taskIndex: i,
        dependsOnIndex: i - 1,
        type: 'follows',
      });
    }
  }

  return dependencies;
}

/**
 * Converts breakdown result to actual tasks with IDs
 */
export function convertToTasks(
  breakdown: BreakdownResult,
  startTaskNumber: number,
  userId: string
): TaskBreakdown {
  const now = Date.now();

  // Create epic
  const epic: Task = {
    id: generateId(),
    taskId: generateTaskId(startTaskNumber),
    title: breakdown.epic.title || 'Untitled Epic',
    description: breakdown.epic.description || '',
    status: breakdown.epic.status || 'backlog',
    taskType: 'epic',
    priority: breakdown.epic.priority || 3,
    tags: breakdown.epic.tags || [],
    sprint: breakdown.epic.sprint,
    riskLevel: breakdown.epic.riskLevel || 'low',
    riskNotes: breakdown.epic.riskNotes,
    definitionOfDone: breakdown.epic.definitionOfDone,
    estimatedHours: breakdown.epic.estimatedHours,
    createdAt: now,
    updatedAt: now,
  };

  // Create tickets
  const tickets: Task[] = breakdown.tickets.map((ticket, index) => ({
    id: generateId(),
    taskId: generateTaskId(startTaskNumber + 1 + index),
    title: ticket.title || 'Untitled Ticket',
    description: ticket.description || '',
    status: ticket.status || 'backlog',
    taskType: 'task',
    parentTaskId: epic.id,
    priority: ticket.priority || 3,
    tags: ticket.tags || [],
    sprint: ticket.sprint,
    riskLevel: ticket.riskLevel || 'low',
    riskNotes: ticket.riskNotes,
    definitionOfDone: ticket.definitionOfDone,
    testNotes: ticket.testNotes,
    estimatedHours: ticket.estimatedHours,
    createdAt: now,
    updatedAt: now,
  }));

  // Create subtasks
  const subtasksPerTicket = Math.floor(breakdown.subtasks.length / tickets.length) || 1;
  const subtasks: Task[] = breakdown.subtasks.map((subtask, index) => {
    const parentTicketIndex = Math.floor(index / subtasksPerTicket);
    const parentTicket = tickets[Math.min(parentTicketIndex, tickets.length - 1)];

    return {
      id: generateId(),
      taskId: generateTaskId(startTaskNumber + 1 + tickets.length + index),
      title: subtask.title || 'Untitled Subtask',
      description: subtask.description || '',
      status: subtask.status || 'backlog',
      taskType: 'subtask',
      parentTaskId: parentTicket.id,
      priority: subtask.priority || 3,
      tags: subtask.tags || [],
      sprint: subtask.sprint,
      definitionOfDone: subtask.definitionOfDone,
      testNotes: subtask.testNotes,
      estimatedHours: subtask.estimatedHours,
      createdAt: now,
      updatedAt: now,
    };
  });

  // Create dependencies
  const dependencies: TaskDependency[] = breakdown.dependencies.map(dep => ({
    id: generateId(),
    taskId: tickets[dep.taskIndex]?.id || tickets[0].id,
    dependsOnTaskId: tickets[dep.dependsOnIndex]?.id || tickets[0].id,
    dependencyType: dep.type,
    createdAt: now,
  }));

  return { epic, tickets, subtasks, dependencies };
}
