/**
 * Task Breakdown Service
 * Parses issues, PRDs, or screenshots to break down work into epics, stories, and subtasks
 * with DoD, test notes, and risk flags.
 */

import { Epic, Task, TaskDependency, RiskLevel } from '@/types/task';

export interface ParsedInput {
  type: 'issue' | 'prd' | 'screenshot' | 'text';
  content: string;
  title?: string;
}

export interface BreakdownResult {
  epics: Epic[];
  tasks: Task[];
  dependencies: TaskDependency[];
  summary: string;
}

export interface BreakdownTask {
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  definitionOfDone: string[];
  testNotes: string;
  riskLevel: RiskLevel;
  riskNotes?: string;
  estimatedHours?: number;
  epicId?: string;
  parentTaskId?: string;
  taskType: 'epic' | 'story' | 'subtask';
  dependencies?: string[]; // Task titles that this depends on
}

/**
 * Parse and break down input into structured tasks
 */
export async function breakdownTask(input: ParsedInput): Promise<BreakdownResult> {
  // This is a simplified implementation that demonstrates the structure
  // In a real implementation, this would use an AI service (OpenAI, Anthropic, etc.)
  // to intelligently parse and break down the input

  const result: BreakdownResult = {
    epics: [],
    tasks: [],
    dependencies: [],
    summary: ''
  };

  const breakdown = parseInputToBreakdown(input);

  let epicCounter = 1;
  let taskCounter = 1;
  let subtaskCounter = 1;

  // Group tasks by epic
  const epicGroups = groupByEpic(breakdown);

  for (const [epicTitle, epicTasks] of Object.entries(epicGroups)) {
    // Create epic
    const epicId = `epic-${epicCounter}`;
    const epic: Epic = {
      id: epicId,
      epicId: `EPIC-${epicCounter}`,
      title: epicTitle,
      description: `Epic for ${epicTitle}`,
      status: 'planning',
      priority: 3,
      tags: extractTags(epicTitle),
      definitionOfDone: [`All stories in ${epicTitle} are completed`],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    result.epics.push(epic);
    epicCounter++;

    // Create stories and subtasks
    for (const taskDef of epicTasks) {
      if (taskDef.taskType === 'story' || taskDef.taskType === 'epic') {
        const taskId = `task-${taskCounter}`;
        const task: Task = {
          id: taskId,
          taskId: `TASK-${taskCounter}`,
          title: taskDef.title,
          description: taskDef.description,
          status: 'backlog',
          priority: taskDef.priority,
          tags: taskDef.tags,
          definitionOfDone: taskDef.definitionOfDone,
          testNotes: taskDef.testNotes,
          riskLevel: taskDef.riskLevel,
          riskNotes: taskDef.riskNotes,
          parentEpicId: epicId,
          taskType: 'story',
          estimatedHours: taskDef.estimatedHours,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          commentsCount: 0,
          attachmentsCount: 0
        };
        result.tasks.push(task);
        taskCounter++;

        // Create subtasks if any
        if (taskDef.dependencies && taskDef.dependencies.length > 0) {
          for (const subtaskTitle of taskDef.dependencies) {
            const subtaskId = `subtask-${subtaskCounter}`;
            const subtask: Task = {
              id: subtaskId,
              taskId: `TASK-${taskCounter}`,
              title: subtaskTitle,
              description: `Subtask for ${taskDef.title}`,
              status: 'backlog',
              priority: taskDef.priority,
              tags: ['subtask', ...taskDef.tags],
              parentTaskId: taskId,
              parentEpicId: epicId,
              taskType: 'subtask',
              estimatedHours: (taskDef.estimatedHours || 0) / (taskDef.dependencies.length || 1),
              createdAt: Date.now(),
              updatedAt: Date.now(),
              commentsCount: 0,
              attachmentsCount: 0
            };
            result.tasks.push(subtask);
            taskCounter++;
            subtaskCounter++;
          }
        }
      }
    }
  }

  result.summary = `Created ${result.epics.length} epic(s) and ${result.tasks.length} task(s)`;

  return result;
}

/**
 * Parse input text and extract structured breakdown
 */
function parseInputToBreakdown(input: ParsedInput): BreakdownTask[] {
  const tasks: BreakdownTask[] = [];

  // Simple parsing logic - in production, use AI/NLP
  const lines = input.content.split('\n').filter(line => line.trim());

  // Look for common patterns in issues/PRDs
  let currentEpic = 'General';

  for (const line of lines) {
    // Check if line is an epic/feature header
    if (line.match(/^#+\s*(Feature|Epic|User Story):/i)) {
      currentEpic = line.replace(/^#+\s*(Feature|Epic|User Story):\s*/i, '').trim();
      tasks.push({
        title: currentEpic,
        description: `Epic: ${currentEpic}`,
        priority: 3,
        tags: ['epic'],
        definitionOfDone: ['All child tasks completed'],
        testNotes: 'Verify all features work as expected',
        riskLevel: 'medium',
        taskType: 'epic'
      });
    }

    // Check if line is a task (starts with - or *)
    else if (line.match(/^[\-\*]\s+(.+)/)) {
      const taskTitle = line.replace(/^[\-\*]\s+/, '').trim();
      const priority = detectPriority(taskTitle);
      const riskLevel = detectRiskLevel(taskTitle);

      tasks.push({
        title: taskTitle,
        description: `Task: ${taskTitle}`,
        priority,
        tags: extractTags(taskTitle),
        definitionOfDone: generateDoD(taskTitle),
        testNotes: generateTestNotes(taskTitle),
        riskLevel,
        riskNotes: riskLevel !== 'low' ? 'Requires careful implementation' : undefined,
        estimatedHours: estimateHours(taskTitle),
        taskType: 'story',
        epicId: currentEpic
      });
    }
  }

  // If no structured content found, create a single task
  if (tasks.length === 0) {
    tasks.push({
      title: input.title || 'New Task',
      description: input.content,
      priority: 3,
      tags: ['task'],
      definitionOfDone: ['Task completed', 'Code reviewed', 'Tests passing'],
      testNotes: 'Verify functionality works as expected',
      riskLevel: 'low',
      taskType: 'story'
    });
  }

  return tasks;
}

/**
 * Group tasks by epic
 */
function groupByEpic(tasks: BreakdownTask[]): Record<string, BreakdownTask[]> {
  const groups: Record<string, BreakdownTask[]> = {};
  let currentEpic = 'General';

  for (const task of tasks) {
    if (task.taskType === 'epic') {
      currentEpic = task.title;
      if (!groups[currentEpic]) {
        groups[currentEpic] = [];
      }
    } else {
      if (!groups[currentEpic]) {
        groups[currentEpic] = [];
      }
      groups[currentEpic].push(task);
    }
  }

  return groups;
}

/**
 * Extract tags from text
 */
function extractTags(text: string): string[] {
  const tags: string[] = [];
  const lowerText = text.toLowerCase();

  // Technology tags
  if (lowerText.includes('react') || lowerText.includes('frontend') || lowerText.includes('ui')) {
    tags.push('frontend');
  }
  if (lowerText.includes('api') || lowerText.includes('backend') || lowerText.includes('database')) {
    tags.push('backend');
  }
  if (lowerText.includes('test')) {
    tags.push('testing');
  }
  if (lowerText.includes('bug') || lowerText.includes('fix')) {
    tags.push('bug');
  }
  if (lowerText.includes('feature') || lowerText.includes('implement')) {
    tags.push('feature');
  }
  if (lowerText.includes('refactor')) {
    tags.push('refactor');
  }

  return tags.length > 0 ? tags : ['task'];
}

/**
 * Detect priority from text
 */
function detectPriority(text: string): 1 | 2 | 3 | 4 | 5 {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('critical') || lowerText.includes('urgent') || lowerText.includes('p5')) {
    return 5;
  }
  if (lowerText.includes('high') || lowerText.includes('important') || lowerText.includes('p4')) {
    return 4;
  }
  if (lowerText.includes('low') || lowerText.includes('p1')) {
    return 1;
  }
  if (lowerText.includes('p2')) {
    return 2;
  }

  return 3; // Medium by default
}

/**
 * Detect risk level from text
 */
function detectRiskLevel(text: string): RiskLevel {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('critical') || lowerText.includes('security') || lowerText.includes('payment')) {
    return 'critical';
  }
  if (lowerText.includes('risk') || lowerText.includes('complex') || lowerText.includes('migration')) {
    return 'high';
  }
  if (lowerText.includes('simple') || lowerText.includes('minor')) {
    return 'low';
  }

  return 'medium';
}

/**
 * Generate Definition of Done checklist
 */
function generateDoD(title: string): string[] {
  const dod: string[] = ['Implementation complete'];
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes('ui') || lowerTitle.includes('component')) {
    dod.push('UI matches design specifications');
    dod.push('Responsive on all screen sizes');
  }

  if (lowerTitle.includes('api') || lowerTitle.includes('endpoint')) {
    dod.push('API endpoint implemented');
    dod.push('API documentation updated');
  }

  if (!lowerTitle.includes('spike') && !lowerTitle.includes('research')) {
    dod.push('Unit tests written and passing');
    dod.push('Code reviewed and approved');
  }

  dod.push('Merged to main branch');

  return dod;
}

/**
 * Generate test notes
 */
function generateTestNotes(title: string): string {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes('ui') || lowerTitle.includes('component')) {
    return 'Test UI interactions, verify responsiveness, check accessibility';
  }
  if (lowerTitle.includes('api') || lowerTitle.includes('endpoint')) {
    return 'Test API endpoints with various inputs, verify error handling';
  }
  if (lowerTitle.includes('database')) {
    return 'Verify data integrity, test migrations, check query performance';
  }

  return 'Verify functionality works as expected, test edge cases';
}

/**
 * Estimate hours for task
 */
function estimateHours(title: string): number {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes('spike') || lowerTitle.includes('research')) {
    return 4;
  }
  if (lowerTitle.includes('simple') || lowerTitle.includes('minor')) {
    return 2;
  }
  if (lowerTitle.includes('complex') || lowerTitle.includes('refactor')) {
    return 16;
  }
  if (lowerTitle.includes('migration') || lowerTitle.includes('integration')) {
    return 20;
  }

  return 8; // Default estimate
}

/**
 * Parse GitHub issue format
 */
export function parseGitHubIssue(issueBody: string): ParsedInput {
  return {
    type: 'issue',
    content: issueBody,
    title: extractIssueTitle(issueBody)
  };
}

/**
 * Extract title from issue body
 */
function extractIssueTitle(body: string): string {
  const lines = body.split('\n');
  for (const line of lines) {
    if (line.trim() && !line.startsWith('#')) {
      return line.trim();
    }
  }
  return 'New Issue';
}
