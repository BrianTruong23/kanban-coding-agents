import { ParsedIssue, Task, TaskDependency, DependencyType } from '@/types/task';
import { generateId, generateTaskId } from './utils';

/**
 * Parse an issue/PRD text into structured epics, tasks, and subtasks
 * This uses pattern matching and heuristics to identify structure
 */
export function parseIssueText(text: string): ParsedIssue {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const result: ParsedIssue = {
    title: '',
    description: '',
    epics: [],
    dependencies: [],
  };

  let currentEpic: ParsedIssue['epics'][0] | null = null;
  let currentTask: ParsedIssue['epics'][0]['tasks'][0] | null = null;
  let section: 'title' | 'description' | 'content' = 'title';
  let descriptionLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Extract title (first non-empty line or marked with #)
    if (section === 'title') {
      if (line.startsWith('# ')) {
        result.title = line.substring(2).trim();
        section = 'description';
      } else if (!result.title) {
        result.title = line;
        section = 'description';
      }
      continue;
    }

    // Epic detection (## Epic: or ## Feature: or **Epic**)
    if (line.match(/^##\s+(Epic|Feature):/i) || line.match(/^\*\*Epic\*\*/i)) {
      if (currentEpic) {
        result.epics.push(currentEpic);
      }
      currentEpic = {
        title: line.replace(/^##\s+/i, '').replace(/^(Epic|Feature):\s*/i, '').replace(/^\*\*Epic\*\*:\s*/i, '').trim(),
        description: '',
        tasks: [],
      };
      currentTask = null;
      section = 'content';
      continue;
    }

    // Task detection (### Task: or - [ ] or numbered list with task)
    if (line.match(/^###\s+(Task|Ticket):/i) || line.match(/^-\s+\[[\sx]\]/i) || line.match(/^\d+\.\s+/)) {
      if (!currentEpic) {
        // Create a default epic if none exists
        currentEpic = {
          title: 'Main Epic',
          description: result.description,
          tasks: [],
        };
      }

      const taskTitle = line
        .replace(/^###\s+(Task|Ticket):\s*/i, '')
        .replace(/^-\s+\[[\sx]\]\s*/i, '')
        .replace(/^\d+\.\s+/, '')
        .trim();

      currentTask = {
        title: taskTitle,
        description: '',
        definitionOfDone: [],
        testNotes: '',
        riskFlags: [],
        estimatedHours: estimateHours(taskTitle),
        requiredSkills: extractSkills(taskTitle),
        subtasks: [],
      };
      currentEpic.tasks.push(currentTask);
      continue;
    }

    // Subtask detection (#### or indented - [ ])
    if (currentTask && (line.match(/^####\s+/i) || line.match(/^\s{2,}-\s+/))) {
      const subtaskTitle = line.replace(/^####\s*/i, '').replace(/^\s{2,}-\s*/, '').trim();
      currentTask.subtasks = currentTask.subtasks || [];
      currentTask.subtasks.push({
        title: subtaskTitle,
        description: '',
        estimatedHours: estimateHours(subtaskTitle) * 0.5, // Subtasks are smaller
      });
      continue;
    }

    // DoD detection
    if (line.match(/^(DoD|Definition of Done|Acceptance Criteria):/i)) {
      continue; // Skip header
    }
    if (currentTask && line.match(/^-\s+/)) {
      currentTask.definitionOfDone.push(line.replace(/^-\s+/, '').trim());
      continue;
    }

    // Risk flags detection
    if (line.match(/^(Risk|Risks|Risk Flags?):/i)) {
      if (currentTask) {
        const riskText = line.replace(/^(Risk|Risks|Risk Flags?):\s*/i, '').trim();
        if (riskText) {
          currentTask.riskFlags.push(riskText);
        }
      }
      continue;
    }
    if (currentTask && line.match(/^⚠️|^🚩|^RISK:/i)) {
      currentTask.riskFlags.push(line.replace(/^⚠️|^🚩|^RISK:\s*/i, '').trim());
      continue;
    }

    // Test notes detection
    if (line.match(/^(Test|Testing|Test Plan|Test Notes):/i)) {
      if (currentTask) {
        currentTask.testNotes = line.replace(/^(Test|Testing|Test Plan|Test Notes):\s*/i, '').trim();
      }
      continue;
    }

    // Dependencies detection
    if (line.match(/depends on|blocked by|blocks|requires/i)) {
      const dependency = parseDependency(line);
      if (dependency) {
        result.dependencies.push(dependency);
      }
      continue;
    }

    // Regular content
    if (section === 'description' && !currentEpic) {
      descriptionLines.push(line);
    } else if (currentTask && !currentTask.description) {
      currentTask.description = line;
    } else if (currentEpic && !currentEpic.description && currentEpic.tasks.length === 0) {
      currentEpic.description = line;
    }
  }

  // Finalize
  if (currentEpic) {
    result.epics.push(currentEpic);
  }
  result.description = descriptionLines.join('\n');

  // If no epics were created but we have content, create a default epic
  if (result.epics.length === 0 && descriptionLines.length > 0) {
    result.epics.push({
      title: result.title || 'Implementation',
      description: result.description,
      tasks: inferTasksFromDescription(result.description),
    });
  }

  return result;
}

/**
 * Estimate hours based on task complexity keywords
 */
function estimateHours(text: string): number {
  const lower = text.toLowerCase();

  // Complex tasks
  if (lower.match(/implement|build|create|develop|design/i)) {
    if (lower.match(/system|architecture|framework|infrastructure/i)) {
      return 40; // Large features
    }
    if (lower.match(/api|service|component|module/i)) {
      return 16; // Medium features
    }
    return 8; // Basic implementation
  }

  // Simple tasks
  if (lower.match(/fix|update|refactor|improve|optimize/i)) {
    return 4;
  }

  // Documentation/config
  if (lower.match(/document|config|setup|write/i)) {
    return 2;
  }

  return 8; // Default
}

/**
 * Extract required skills from task text
 */
function extractSkills(text: string): string[] {
  const skills: string[] = [];
  const lower = text.toLowerCase();

  const skillMap: Record<string, string[]> = {
    'React': ['react', 'component', 'ui', 'frontend'],
    'Next.js': ['next.js', 'nextjs', 'next'],
    'TypeScript': ['typescript', 'ts', 'type'],
    'Node.js': ['node', 'nodejs', 'backend', 'server'],
    'API Design': ['api', 'rest', 'graphql', 'endpoint'],
    'Database': ['database', 'db', 'sql', 'postgres', 'postgresql'],
    'UI/UX': ['ui', 'ux', 'design', 'interface', 'user experience'],
    'CSS': ['css', 'style', 'styling', 'tailwind'],
    'Docker': ['docker', 'container'],
    'CI/CD': ['ci', 'cd', 'pipeline', 'deploy', 'deployment'],
    'Testing': ['test', 'testing', 'jest', 'cypress'],
    'Mobile': ['mobile', 'ios', 'android', 'react native'],
  };

  for (const [skill, keywords] of Object.entries(skillMap)) {
    if (keywords.some(keyword => lower.includes(keyword))) {
      skills.push(skill);
    }
  }

  return skills.length > 0 ? skills : ['General'];
}

/**
 * Parse dependency from text
 */
function parseDependency(line: string): ParsedIssue['dependencies'][0] | null {
  const lower = line.toLowerCase();
  let type: DependencyType = 'blocks';
  let from = '';
  let to = '';

  if (lower.includes('blocks')) {
    type = 'blocks';
    const parts = line.split(/blocks/i);
    if (parts.length === 2) {
      from = parts[0].trim();
      to = parts[1].trim();
    }
  } else if (lower.includes('depends on') || lower.includes('requires')) {
    type = 'blocks';
    const parts = line.split(/depends on|requires/i);
    if (parts.length === 2) {
      from = parts[1].trim(); // Reverse: what we depend on blocks us
      to = parts[0].trim();
    }
  } else if (lower.includes('relates to')) {
    type = 'relates-to';
    const parts = line.split(/relates to/i);
    if (parts.length === 2) {
      from = parts[0].trim();
      to = parts[1].trim();
    }
  }

  if (from && to) {
    return { from, to, type };
  }
  return null;
}

/**
 * Infer tasks from description text when no explicit structure is provided
 */
function inferTasksFromDescription(description: string): ParsedIssue['epics'][0]['tasks'] {
  const tasks: ParsedIssue['epics'][0]['tasks'] = [];
  const lines = description.split('\n').filter(line => line.trim().length > 0);

  // Look for action verbs
  const actionPattern = /^(implement|build|create|develop|design|fix|update|add|remove|refactor|test|deploy)/i;

  for (const line of lines) {
    if (actionPattern.test(line.trim())) {
      tasks.push({
        title: line.trim(),
        description: '',
        definitionOfDone: ['Implementation complete', 'Code reviewed', 'Tests passing'],
        testNotes: 'Verify functionality works as expected',
        riskFlags: [],
        estimatedHours: estimateHours(line),
        requiredSkills: extractSkills(line),
      });
    }
  }

  // If no tasks found, create a single generic task
  if (tasks.length === 0) {
    tasks.push({
      title: 'Implementation',
      description: description,
      definitionOfDone: ['Implementation complete', 'Code reviewed', 'Tests passing'],
      testNotes: 'Verify functionality works as expected',
      riskFlags: [],
      estimatedHours: 8,
      requiredSkills: ['General'],
    });
  }

  return tasks;
}

/**
 * Convert parsed issue to actual task objects with IDs
 */
export function convertParsedIssueToTasks(
  parsed: ParsedIssue,
  startingTaskNumber: number,
  userId: string
): {
  tasks: Task[];
  dependencies: TaskDependency[];
} {
  const tasks: Task[] = [];
  const dependencies: TaskDependency[] = [];
  const titleToIdMap = new Map<string, string>();
  let taskNumber = startingTaskNumber;

  // Create tasks for each epic
  for (const epic of parsed.epics) {
    const epicId = generateId();
    const epicTaskId = generateTaskId(taskNumber++);

    const epicTask: Task = {
      id: epicId,
      taskId: epicTaskId,
      title: epic.title,
      description: epic.description,
      status: 'backlog',
      taskType: 'epic',
      priority: 4,
      tags: ['epic'],
      definitionOfDone: `All tasks in ${epic.title} are completed`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    tasks.push(epicTask);
    titleToIdMap.set(epic.title.toLowerCase(), epicId);

    // Create tasks under epic
    for (const task of epic.tasks) {
      const taskId = generateId();
      const taskTaskId = generateTaskId(taskNumber++);

      const newTask: Task = {
        id: taskId,
        taskId: taskTaskId,
        title: task.title,
        description: task.description,
        status: 'backlog',
        taskType: 'task',
        parentTaskId: epicId,
        priority: task.riskFlags.length > 0 ? 5 : 3,
        tags: task.requiredSkills.map(s => s.toLowerCase()),
        definitionOfDone: task.definitionOfDone.join('\n'),
        testNotes: task.testNotes,
        riskFlags: task.riskFlags,
        estimatedHours: task.estimatedHours,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      tasks.push(newTask);
      titleToIdMap.set(task.title.toLowerCase(), taskId);

      // Create subtasks
      if (task.subtasks) {
        for (const subtask of task.subtasks) {
          const subtaskId = generateId();
          const subtaskTaskId = generateTaskId(taskNumber++);

          const newSubtask: Task = {
            id: subtaskId,
            taskId: subtaskTaskId,
            title: subtask.title,
            description: subtask.description,
            status: 'backlog',
            taskType: 'subtask',
            parentTaskId: taskId,
            priority: 2,
            tags: [],
            estimatedHours: subtask.estimatedHours,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          tasks.push(newSubtask);
        }
      }
    }
  }

  // Create dependencies
  for (const dep of parsed.dependencies) {
    const fromId = titleToIdMap.get(dep.from.toLowerCase());
    const toId = titleToIdMap.get(dep.to.toLowerCase());

    if (fromId && toId) {
      dependencies.push({
        id: generateId(),
        taskId: toId,
        dependsOnTaskId: fromId,
        dependencyType: dep.type,
        createdAt: Date.now(),
      });
    }
  }

  return { tasks, dependencies };
}

/**
 * Example PRD template for users
 */
export const PRD_TEMPLATE = `# Feature Title

Brief description of the feature or issue.

## Epic: Epic Name
Description of the epic

### Task: Task 1
Description of task 1
DoD:
- Acceptance criteria 1
- Acceptance criteria 2
Test: How to test this task
Risk: Any potential risks

#### Subtask 1.1
#### Subtask 1.2

### Task: Task 2
Description of task 2

## Epic: Another Epic
...

Dependencies:
- Task 1 blocks Task 2
- Task 3 depends on Task 1
`;
