import { Task, TaskBreakdown, TaskBreakdownInput, TaskDependency, TaskType } from '@/types/task';
import { generateId, generateTaskId } from './utils';

/**
 * AI Task Breakdown Service
 *
 * This service breaks down issues, PRDs, or screenshots into structured task hierarchies.
 *
 * Current implementation uses rule-based logic. In production, this would integrate
 * with an LLM API (OpenAI, Anthropic, etc.) to intelligently parse and break down tasks.
 */

interface BreakdownRule {
  keywords: string[];
  taskType: TaskType;
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  estimatedHours?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

const BREAKDOWN_RULES: BreakdownRule[] = [
  // Frontend tasks
  { keywords: ['ui', 'frontend', 'react', 'component', 'page', 'design'], taskType: 'task', priority: 3, tags: ['frontend'], estimatedHours: 8 },
  { keywords: ['form', 'input', 'validation'], taskType: 'task', priority: 3, tags: ['frontend', 'validation'], estimatedHours: 6 },

  // Backend tasks
  { keywords: ['api', 'backend', 'database', 'server', 'endpoint'], taskType: 'task', priority: 3, tags: ['backend'], estimatedHours: 10 },
  { keywords: ['authentication', 'auth', 'login', 'security'], taskType: 'task', priority: 5, tags: ['backend', 'security'], estimatedHours: 16, riskLevel: 'high' },

  // Testing
  { keywords: ['test', 'testing', 'unit test', 'e2e'], taskType: 'subtask', priority: 4, tags: ['testing'], estimatedHours: 4 },

  // DevOps
  { keywords: ['deploy', 'ci/cd', 'docker', 'infrastructure'], taskType: 'task', priority: 4, tags: ['devops'], estimatedHours: 12, riskLevel: 'medium' },
];

/**
 * Mock AI function to break down a task description into structured tasks
 * In production, this would call an LLM API
 */
function analyzeTasks(content: string): { title: string; description: string; type: TaskType }[] {
  const lowerContent = content.toLowerCase();
  const sentences = content.split(/[.\n]+/).filter(s => s.trim().length > 10);

  const tasks: { title: string; description: string; type: TaskType }[] = [];

  // Detect if this is an epic (large feature)
  const isEpic = lowerContent.includes('epic') ||
                 lowerContent.includes('feature:') ||
                 sentences.length > 5;

  if (isEpic) {
    // Extract epic title
    const epicTitle = sentences[0]?.trim() || 'New Feature Epic';
    tasks.push({
      title: epicTitle,
      description: content,
      type: 'epic'
    });
  }

  // Extract individual tasks from content
  const taskPatterns = [
    /(?:implement|create|build|add|develop|design)\s+([^.,\n]+)/gi,
    /(?:task|story|ticket):\s*([^.,\n]+)/gi,
    /[-*]\s+([^.,\n]+)/g,
  ];

  taskPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const taskTitle = match[1].trim();
      if (taskTitle.length > 5 && taskTitle.length < 100) {
        tasks.push({
          title: taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1),
          description: `Implement: ${taskTitle}`,
          type: 'task'
        });
      }
    }
  });

  // If no tasks detected, create a basic breakdown
  if (tasks.length === 0) {
    tasks.push({
      title: 'Analyze Requirements',
      description: 'Review and analyze the requirements in detail',
      type: 'task'
    });
    tasks.push({
      title: 'Implement Solution',
      description: content,
      type: 'task'
    });
    tasks.push({
      title: 'Test and Validate',
      description: 'Test the implementation and validate against requirements',
      type: 'task'
    });
  }

  return tasks.slice(0, 10); // Limit to 10 tasks
}

/**
 * Apply intelligent defaults based on task content
 */
function applyTaskDefaults(title: string, description: string, type: TaskType): Partial<Task> {
  const combined = (title + ' ' + description).toLowerCase();

  let priority: 1 | 2 | 3 | 4 | 5 = 3;
  let tags: string[] = [];
  let estimatedHours = 8;
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let definitionOfDone: string[] = [
    'Code implemented and reviewed',
    'Tests written and passing',
    'Documentation updated'
  ];

  // Apply rules
  for (const rule of BREAKDOWN_RULES) {
    if (rule.keywords.some(keyword => combined.includes(keyword))) {
      priority = Math.max(priority, rule.priority) as 1 | 2 | 3 | 4 | 5;
      tags = [...new Set([...tags, ...rule.tags])];
      estimatedHours = rule.estimatedHours || estimatedHours;
      riskLevel = rule.riskLevel || riskLevel;
    }
  }

  // Priority keywords
  if (combined.includes('urgent') || combined.includes('critical') || combined.includes('security')) {
    priority = 5;
    riskLevel = 'high';
  }
  if (combined.includes('bug') || combined.includes('fix')) {
    priority = 4;
    tags.push('bug');
  }

  // Add task type specific DoD
  if (type === 'epic') {
    definitionOfDone = [
      'All child stories completed',
      'Integration testing passed',
      'Documentation complete',
      'Stakeholder acceptance obtained'
    ];
    estimatedHours = 0; // Epics don't have direct estimates
  } else if (type === 'subtask') {
    definitionOfDone = [
      'Subtask completed',
      'Code reviewed',
      'Parent task updated'
    ];
    estimatedHours = Math.floor(estimatedHours / 2);
  }

  // Risk assessment
  if (combined.includes('migration') || combined.includes('refactor') || combined.includes('breaking')) {
    riskLevel = 'high';
  }

  return {
    priority,
    tags,
    estimatedHours,
    riskLevel,
    definitionOfDone,
    testNotes: tags.includes('testing') ? 'Ensure comprehensive test coverage' : 'Add unit tests for new functionality'
  };
}

/**
 * Main task breakdown function
 */
export async function breakdownTask(input: TaskBreakdownInput, existingTaskCount: number): Promise<TaskBreakdown> {
  const { content, type: inputType } = input;

  // Simulate API delay (in production this would be an actual LLM API call)
  await new Promise(resolve => setTimeout(resolve, 500));

  // Analyze and extract tasks
  const analyzedTasks = analyzeTasks(content);

  const breakdown: TaskBreakdown = {
    stories: [],
    tasks: [],
    subtasks: [],
    dependencies: []
  };

  let taskCounter = existingTaskCount;

  // Process each analyzed task
  analyzedTasks.forEach((analyzed, index) => {
    const defaults = applyTaskDefaults(analyzed.title, analyzed.description, analyzed.type);

    const task: Task = {
      id: generateId(),
      taskId: generateTaskId(++taskCounter),
      title: analyzed.title,
      description: analyzed.description,
      status: 'backlog',
      priority: defaults.priority || 3,
      tags: defaults.tags || [],
      taskType: analyzed.type,
      definitionOfDone: defaults.definitionOfDone,
      testNotes: defaults.testNotes,
      riskLevel: defaults.riskLevel,
      estimatedHours: defaults.estimatedHours,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (analyzed.type === 'epic') {
      breakdown.epic = task;
    } else if (analyzed.type === 'story') {
      breakdown.stories.push(task);
      if (breakdown.epic) {
        task.parentId = breakdown.epic.id;
      }
    } else if (analyzed.type === 'subtask') {
      breakdown.subtasks.push(task);
    } else {
      breakdown.tasks.push(task);
      if (breakdown.epic) {
        task.parentId = breakdown.epic.id;
      }
    }
  });

  // Create dependencies between sequential tasks
  if (breakdown.tasks.length > 1) {
    for (let i = 1; i < breakdown.tasks.length; i++) {
      const currentTask = breakdown.tasks[i];
      const previousTask = breakdown.tasks[i - 1];

      // Check if there's a logical dependency
      if (shouldCreateDependency(previousTask, currentTask)) {
        breakdown.dependencies.push({
          id: generateId(),
          taskId: currentTask.id,
          dependsOnTaskId: previousTask.id,
          dependencyType: 'blocked_by',
          createdAt: Date.now()
        });
      }
    }
  }

  // Link subtasks to their parent tasks
  breakdown.subtasks.forEach((subtask, index) => {
    const parentTask = breakdown.tasks[index % breakdown.tasks.length];
    if (parentTask) {
      subtask.parentId = parentTask.id;
    }
  });

  return breakdown;
}

/**
 * Determine if a dependency should be created between tasks
 */
function shouldCreateDependency(task1: Task, task2: Task): boolean {
  const t1 = (task1.title + ' ' + task1.description).toLowerCase();
  const t2 = (task2.title + ' ' + task2.description).toLowerCase();

  // Backend before frontend
  if (task1.tags.includes('backend') && task2.tags.includes('frontend')) {
    return true;
  }

  // Database before API
  if (t1.includes('database') && t2.includes('api')) {
    return true;
  }

  // Implementation before testing
  if (!task1.tags.includes('testing') && task2.tags.includes('testing')) {
    return true;
  }

  // Design before implementation
  if (t1.includes('design') && !t2.includes('design')) {
    return true;
  }

  return false;
}

/**
 * Get recommended agent for a task based on skills matching
 * This is a placeholder for the auto-assignment feature
 */
export function getRecommendedAgentId(task: Task, agents: any[]): string | undefined {
  // This will be implemented in the agent assignment service
  return undefined;
}
