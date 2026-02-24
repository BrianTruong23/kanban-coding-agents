// AI-Powered Task Breakdown Service
// This service analyzes issues, PRDs, and screenshots to automatically break down work into epics, tasks, and subtasks

import {
  TaskBreakdownInput,
  TaskBreakdownResult,
  EnhancedTask,
  TaskDependency,
  DefinitionOfDone,
  TestNote,
  RiskFlag,
  TaskType,
  RiskLevel
} from '@/types/breakdown';
import { generateId, generateTaskId } from './utils';

/**
 * Analyzes input text/screenshot and breaks it down into structured tasks
 */
export async function analyzeAndBreakdownTask(
  input: TaskBreakdownInput,
  existingTaskCount: number = 0
): Promise<TaskBreakdownResult> {
  // In a real implementation, this would call an AI service (OpenAI, Anthropic, etc.)
  // For now, we'll use rule-based parsing and pattern matching

  const content = input.content.toLowerCase();
  let taskCounter = existingTaskCount;

  // Detect if this is an epic-level feature
  const isEpic = detectEpicScope(content);

  if (isEpic) {
    return await breakdownAsEpic(input, taskCounter);
  } else {
    return await breakdownAsTask(input, taskCounter);
  }
}

/**
 * Detects if the input describes an epic-level feature
 */
function detectEpicScope(content: string): boolean {
  const epicIndicators = [
    'epic',
    'feature',
    'implement',
    'build',
    'create system',
    'add module',
    'new platform',
    'user authentication',
    'payment system',
    'notification system',
    'dashboard',
    'admin panel',
    'api integration'
  ];

  return epicIndicators.some(indicator => content.includes(indicator));
}

/**
 * Breaks down input as an epic with multiple tasks and subtasks
 */
async function breakdownAsEpic(
  input: TaskBreakdownInput,
  startCounter: number
): Promise<TaskBreakdownResult> {
  const content = input.content;
  let taskCounter = startCounter;

  // Create the epic
  const epicId = generateId();
  const epic: Partial<EnhancedTask> = {
    id: epicId,
    taskId: generateTaskId(++taskCounter),
    title: extractTitle(content) || 'New Epic',
    description: content,
    type: 'epic',
    status: 'backlog',
    priority: 3,
    tags: extractTags(content),
    definitionOfDone: generateEpicDoD(content),
    testNotes: [],
    riskFlags: identifyRisks(content, epicId),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  // Break down into tasks
  const tasks = await generateTasksFromEpic(content, epicId, taskCounter);
  taskCounter += tasks.length;

  // Generate subtasks for each task
  const subtasks: Partial<EnhancedTask>[] = [];
  for (const task of tasks) {
    const taskSubtasks = await generateSubtasksFromTask(task, taskCounter);
    subtasks.push(...taskSubtasks);
    taskCounter += taskSubtasks.length;
  }

  // Generate dependencies
  const dependencies = generateDependencies(epic, tasks, subtasks);

  // Generate agent assignments
  const suggestedAgentAssignments = generateAgentAssignments(tasks, subtasks);

  return {
    epic,
    tasks,
    subtasks,
    dependencies,
    suggestedAgentAssignments
  };
}

/**
 * Breaks down input as a single task with subtasks
 */
async function breakdownAsTask(
  input: TaskBreakdownInput,
  startCounter: number
): Promise<TaskBreakdownResult> {
  const content = input.content;
  let taskCounter = startCounter;

  const taskId = generateId();
  const task: Partial<EnhancedTask> = {
    id: taskId,
    taskId: generateTaskId(++taskCounter),
    title: extractTitle(content) || 'New Task',
    description: content,
    type: 'task',
    status: 'backlog',
    priority: determinePriority(content),
    tags: extractTags(content),
    estimatedHours: estimateHours(content),
    definitionOfDone: generateTaskDoD(content),
    testNotes: generateTestNotes(content, taskId),
    riskFlags: identifyRisks(content, taskId),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  // Generate subtasks
  const subtasks = await generateSubtasksFromTask(task, taskCounter);

  return {
    epic: {},
    tasks: [task],
    subtasks,
    dependencies: [],
    suggestedAgentAssignments: generateAgentAssignments([task], subtasks)
  };
}

/**
 * Extracts a title from the content
 */
function extractTitle(content: string): string {
  // Try to find the first line or sentence
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // Remove common prefixes
    const cleaned = firstLine
      .replace(/^(feature|epic|task|issue|ticket):\s*/i, '')
      .replace(/^#\s*/, '');
    return cleaned.length > 100 ? cleaned.substring(0, 100) + '...' : cleaned;
  }
  return 'Untitled Task';
}

/**
 * Extracts tags from content based on keywords
 */
function extractTags(content: string): string[] {
  const tags: string[] = [];
  const contentLower = content.toLowerCase();

  const tagMap: Record<string, string[]> = {
    'frontend': ['react', 'vue', 'angular', 'ui', 'ux', 'css', 'html', 'component'],
    'backend': ['api', 'server', 'database', 'sql', 'endpoint', 'service'],
    'devops': ['deploy', 'ci/cd', 'docker', 'kubernetes', 'infrastructure'],
    'testing': ['test', 'qa', 'quality', 'automation'],
    'security': ['auth', 'security', 'encryption', 'vulnerability'],
    'performance': ['optimize', 'performance', 'speed', 'cache'],
    'bug': ['bug', 'fix', 'issue', 'error', 'broken'],
    'enhancement': ['improve', 'enhance', 'update', 'refactor']
  };

  for (const [tag, keywords] of Object.entries(tagMap)) {
    if (keywords.some(keyword => contentLower.includes(keyword))) {
      tags.push(tag);
    }
  }

  return tags;
}

/**
 * Determines priority based on content
 */
function determinePriority(content: string): 1 | 2 | 3 | 4 | 5 {
  const contentLower = content.toLowerCase();

  if (contentLower.includes('critical') || contentLower.includes('urgent') || contentLower.includes('blocker')) {
    return 5;
  }
  if (contentLower.includes('high priority') || contentLower.includes('important')) {
    return 4;
  }
  if (contentLower.includes('low priority') || contentLower.includes('nice to have')) {
    return 2;
  }

  return 3; // Default medium priority
}

/**
 * Estimates hours based on content complexity
 */
function estimateHours(content: string): number {
  const wordCount = content.split(/\s+/).length;
  const complexity = detectComplexity(content);

  // Base estimation
  let hours = 4;

  if (wordCount > 500) hours += 4;
  if (wordCount > 1000) hours += 8;

  if (complexity === 'high') hours *= 1.5;
  if (complexity === 'low') hours *= 0.5;

  return Math.round(hours);
}

/**
 * Detects complexity level
 */
function detectComplexity(content: string): 'low' | 'medium' | 'high' {
  const contentLower = content.toLowerCase();

  const highComplexityKeywords = ['algorithm', 'optimization', 'architecture', 'distributed', 'scalable', 'migration'];
  const lowComplexityKeywords = ['typo', 'text change', 'color', 'spacing', 'alignment'];

  if (highComplexityKeywords.some(kw => contentLower.includes(kw))) return 'high';
  if (lowComplexityKeywords.some(kw => contentLower.includes(kw))) return 'low';

  return 'medium';
}

/**
 * Generates Definition of Done items for an epic
 */
function generateEpicDoD(content: string): DefinitionOfDone[] {
  const items: DefinitionOfDone[] = [];

  items.push({
    id: generateId(),
    taskId: '',
    description: 'All child tasks completed',
    completed: false,
    order: 0
  });

  items.push({
    id: generateId(),
    taskId: '',
    description: 'Integration testing passed',
    completed: false,
    order: 1
  });

  items.push({
    id: generateId(),
    taskId: '',
    description: 'Documentation updated',
    completed: false,
    order: 2
  });

  items.push({
    id: generateId(),
    taskId: '',
    description: 'Stakeholder approval received',
    completed: false,
    order: 3
  });

  return items;
}

/**
 * Generates Definition of Done items for a task
 */
function generateTaskDoD(content: string): DefinitionOfDone[] {
  const items: DefinitionOfDone[] = [];
  const contentLower = content.toLowerCase();

  items.push({
    id: generateId(),
    taskId: '',
    description: 'Code implemented and reviewed',
    completed: false,
    order: 0
  });

  if (contentLower.includes('test') || contentLower.includes('qa')) {
    items.push({
      id: generateId(),
      taskId: '',
      description: 'Unit tests written and passing',
      completed: false,
      order: 1
    });
  }

  if (contentLower.includes('ui') || contentLower.includes('frontend') || contentLower.includes('component')) {
    items.push({
      id: generateId(),
      taskId: '',
      description: 'UI/UX reviewed and approved',
      completed: false,
      order: 2
    });
  }

  items.push({
    id: generateId(),
    taskId: '',
    description: 'Code merged to main branch',
    completed: false,
    order: 3
  });

  return items;
}

/**
 * Generates test notes for a task
 */
function generateTestNotes(content: string, taskId: string): TestNote[] {
  const notes: TestNote[] = [];
  const contentLower = content.toLowerCase();

  if (contentLower.includes('api') || contentLower.includes('backend')) {
    notes.push({
      id: generateId(),
      taskId,
      description: 'Test API endpoints with various input scenarios',
      type: 'integration',
      completed: false
    });
  }

  if (contentLower.includes('ui') || contentLower.includes('frontend')) {
    notes.push({
      id: generateId(),
      taskId,
      description: 'Test UI interactions and responsive design',
      type: 'e2e',
      completed: false
    });
  }

  if (contentLower.includes('auth') || contentLower.includes('security')) {
    notes.push({
      id: generateId(),
      taskId,
      description: 'Test security and authentication flows',
      type: 'manual',
      completed: false
    });
  }

  // Always add basic unit test
  notes.push({
    id: generateId(),
    taskId,
    description: 'Write and run unit tests for core functionality',
    type: 'unit',
    completed: false
  });

  return notes;
}

/**
 * Identifies potential risks in the task
 */
function identifyRisks(content: string, taskId: string): RiskFlag[] {
  const risks: RiskFlag[] = [];
  const contentLower = content.toLowerCase();

  if (contentLower.includes('migration') || contentLower.includes('breaking change')) {
    risks.push({
      id: generateId(),
      taskId,
      level: 'high',
      description: 'Database migration or breaking changes may affect existing data',
      mitigation: 'Create backup and rollback plan before execution',
      resolved: false,
      createdAt: Date.now()
    });
  }

  if (contentLower.includes('third party') || contentLower.includes('external api')) {
    risks.push({
      id: generateId(),
      taskId,
      level: 'medium',
      description: 'Dependency on external service may cause integration issues',
      mitigation: 'Implement proper error handling and fallback mechanisms',
      resolved: false,
      createdAt: Date.now()
    });
  }

  if (contentLower.includes('performance') || contentLower.includes('scale')) {
    risks.push({
      id: generateId(),
      taskId,
      level: 'medium',
      description: 'Performance implications may require optimization',
      mitigation: 'Conduct performance testing with realistic data volumes',
      resolved: false,
      createdAt: Date.now()
    });
  }

  if (contentLower.includes('security') || contentLower.includes('auth')) {
    risks.push({
      id: generateId(),
      taskId,
      level: 'critical',
      description: 'Security-sensitive implementation requires careful review',
      mitigation: 'Conduct security audit and penetration testing',
      resolved: false,
      createdAt: Date.now()
    });
  }

  return risks;
}

/**
 * Generates tasks from an epic
 */
async function generateTasksFromEpic(
  epicContent: string,
  epicId: string,
  startCounter: number
): Promise<Partial<EnhancedTask>[]> {
  const tasks: Partial<EnhancedTask>[] = [];
  let taskCounter = startCounter;

  // Parse common patterns in epic descriptions
  const commonPhases = [
    { title: 'Requirements and Design', tags: ['design', 'planning'] },
    { title: 'Backend Implementation', tags: ['backend', 'api'] },
    { title: 'Frontend Implementation', tags: ['frontend', 'ui'] },
    { title: 'Testing and QA', tags: ['testing', 'qa'] },
    { title: 'Deployment and Documentation', tags: ['devops', 'docs'] }
  ];

  for (const phase of commonPhases) {
    tasks.push({
      id: generateId(),
      taskId: generateTaskId(++taskCounter),
      title: phase.title,
      description: `${phase.title} for: ${extractTitle(epicContent)}`,
      type: 'task',
      status: 'backlog',
      priority: 3,
      tags: phase.tags,
      epicId,
      parentTaskId: epicId,
      estimatedHours: 8,
      definitionOfDone: generateTaskDoD(phase.title),
      testNotes: [],
      riskFlags: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }

  return tasks;
}

/**
 * Generates subtasks from a task
 */
async function generateSubtasksFromTask(
  task: Partial<EnhancedTask>,
  startCounter: number
): Promise<Partial<EnhancedTask>[]> {
  const subtasks: Partial<EnhancedTask>[] = [];
  let taskCounter = startCounter;

  const taskTitle = task.title?.toLowerCase() || '';

  // Generate subtasks based on task type
  if (taskTitle.includes('backend') || taskTitle.includes('api')) {
    const backendSubtasks = [
      'Design database schema',
      'Create API endpoints',
      'Implement business logic',
      'Add error handling',
      'Write API tests'
    ];

    for (const subtaskTitle of backendSubtasks) {
      subtasks.push(createSubtask(subtaskTitle, task, ++taskCounter));
    }
  } else if (taskTitle.includes('frontend') || taskTitle.includes('ui')) {
    const frontendSubtasks = [
      'Create component structure',
      'Implement UI layout',
      'Add state management',
      'Connect to API',
      'Add responsive design',
      'Write component tests'
    ];

    for (const subtaskTitle of frontendSubtasks) {
      subtasks.push(createSubtask(subtaskTitle, task, ++taskCounter));
    }
  } else if (taskTitle.includes('testing')) {
    const testingSubtasks = [
      'Write unit tests',
      'Create integration tests',
      'Perform manual testing',
      'Fix identified bugs'
    ];

    for (const subtaskTitle of testingSubtasks) {
      subtasks.push(createSubtask(subtaskTitle, task, ++taskCounter));
    }
  } else {
    // Generic subtasks
    const genericSubtasks = [
      'Research and planning',
      'Implementation',
      'Code review',
      'Testing'
    ];

    for (const subtaskTitle of genericSubtasks) {
      subtasks.push(createSubtask(subtaskTitle, task, ++taskCounter));
    }
  }

  return subtasks;
}

/**
 * Helper to create a subtask
 */
function createSubtask(
  title: string,
  parentTask: Partial<EnhancedTask>,
  counter: number
): Partial<EnhancedTask> {
  return {
    id: generateId(),
    taskId: generateTaskId(counter),
    title,
    description: `${title} for: ${parentTask.title}`,
    type: 'subtask',
    status: 'backlog',
    priority: parentTask.priority || 3,
    tags: parentTask.tags || [],
    parentTaskId: parentTask.id,
    epicId: parentTask.epicId,
    estimatedHours: 2,
    definitionOfDone: [{
      id: generateId(),
      taskId: '',
      description: 'Subtask completed and verified',
      completed: false,
      order: 0
    }],
    testNotes: [],
    riskFlags: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

/**
 * Generates dependencies between tasks
 */
function generateDependencies(
  epic: Partial<EnhancedTask>,
  tasks: Partial<EnhancedTask>[],
  subtasks: Partial<EnhancedTask>[]
): Omit<TaskDependency, 'id' | 'createdAt'>[] {
  const dependencies: Omit<TaskDependency, 'id' | 'createdAt'>[] = [];

  // Create sequential dependencies between tasks
  for (let i = 1; i < tasks.length; i++) {
    if (tasks[i].id && tasks[i - 1].id) {
      dependencies.push({
        dependentTaskId: tasks[i].id!,
        dependsOnTaskId: tasks[i - 1].id!,
        type: 'prerequisite'
      });
    }
  }

  // Create dependencies for subtasks within their parent task
  const subtasksByParent = subtasks.reduce((acc, subtask) => {
    const parentId = subtask.parentTaskId!;
    if (!acc[parentId]) acc[parentId] = [];
    acc[parentId].push(subtask);
    return acc;
  }, {} as Record<string, Partial<EnhancedTask>[]>);

  for (const [parentId, parentSubtasks] of Object.entries(subtasksByParent)) {
    for (let i = 1; i < parentSubtasks.length; i++) {
      if (parentSubtasks[i].id && parentSubtasks[i - 1].id) {
        dependencies.push({
          dependentTaskId: parentSubtasks[i].id!,
          dependsOnTaskId: parentSubtasks[i - 1].id!,
          type: 'blocks'
        });
      }
    }
  }

  return dependencies;
}

/**
 * Generates agent assignment suggestions based on task requirements
 */
function generateAgentAssignments(
  tasks: Partial<EnhancedTask>[],
  subtasks: Partial<EnhancedTask>[]
): { taskId: string; agentId: string; confidence: number }[] {
  // This would integrate with the agent skills system
  // For now, return empty array - will be handled by the auto-assignment logic
  return [];
}

/**
 * Parses GitHub issue format
 */
export function parseGitHubIssue(issueText: string): TaskBreakdownInput {
  return {
    source: 'issue',
    content: issueText
  };
}

/**
 * Parses PRD format
 */
export function parsePRD(prdText: string): TaskBreakdownInput {
  return {
    source: 'prd',
    content: prdText
  };
}

/**
 * Analyzes screenshot (placeholder for image analysis)
 */
export async function analyzeScreenshot(imageUrl: string, context?: string): Promise<TaskBreakdownInput> {
  // In a real implementation, this would use vision AI to analyze the screenshot
  return {
    source: 'screenshot',
    content: context || 'Implement features shown in screenshot',
    imageUrl,
    additionalContext: context
  };
}
