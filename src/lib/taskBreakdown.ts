import { Task, TaskDependency, TaskBreakdownInput, TaskBreakdownResult } from '@/types/task';
import { generateId, generateTaskId } from './utils';

/**
 * Task Breakdown Service
 * This service analyzes issue descriptions, PRDs, or screenshots
 * and breaks them down into epics, tasks, and subtasks with DoD and risk flags
 */

interface ParsedTask {
  title: string;
  description: string;
  type: 'epic' | 'task' | 'subtask';
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  definitionOfDone: string[];
  testNotes?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  riskDescription?: string;
  estimatedHours?: number;
  parentIndex?: number; // for linking subtasks to tasks
  epicIndex?: number; // for linking tasks to epics
  dependencies?: number[]; // indices of tasks this depends on
}

/**
 * Parse issue/PRD content and extract tasks
 * This is a rule-based parser that identifies common patterns
 */
function parseContent(content: string, contentType: string): ParsedTask[] {
  const tasks: ParsedTask[] = [];
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);

  let currentEpic: ParsedTask | null = null;
  let currentTask: ParsedTask | null = null;
  let epicIndex = -1;
  let taskIndex = -1;
  let inDoD = false;
  let inTestNotes = false;
  let inRisk = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Epic detection (# or Epic:)
    if (line.match(/^#\s+(.+)/) || line.match(/^Epic:\s*(.+)/i)) {
      const match = line.match(/^#\s+(.+)/) || line.match(/^Epic:\s*(.+)/i);
      if (match) {
        if (currentEpic) tasks.push(currentEpic);
        epicIndex = tasks.length;
        currentEpic = {
          title: match[1],
          description: '',
          type: 'epic',
          priority: 3,
          tags: ['epic'],
          definitionOfDone: [],
        };
        currentTask = null;
        inDoD = false;
        inTestNotes = false;
        inRisk = false;
      }
    }
    // Task detection (## or Task: or - [ ])
    else if (line.match(/^##\s+(.+)/) || line.match(/^Task:\s*(.+)/i) || line.match(/^-\s*\[\s*\]\s*(.+)/)) {
      const match = line.match(/^##\s+(.+)/) || line.match(/^Task:\s*(.+)/i) || line.match(/^-\s*\[\s*\]\s*(.+)/);
      if (match) {
        if (currentTask) tasks.push(currentTask);
        if (currentEpic && !tasks.includes(currentEpic)) tasks.push(currentEpic);

        taskIndex = tasks.length;
        currentTask = {
          title: match[1],
          description: '',
          type: 'task',
          priority: detectPriority(match[1]),
          tags: detectTags(match[1]),
          definitionOfDone: [],
          epicIndex: currentEpic ? epicIndex : undefined,
        };
        inDoD = false;
        inTestNotes = false;
        inRisk = false;
      }
    }
    // Subtask detection (### or Subtask: or numbered list under task)
    else if (line.match(/^###\s+(.+)/) || line.match(/^Subtask:\s*(.+)/i) || (currentTask && line.match(/^\d+\.\s+(.+)/))) {
      const match = line.match(/^###\s+(.+)/) || line.match(/^Subtask:\s*(.+)/i) || line.match(/^\d+\.\s+(.+)/);
      if (match) {
        const subtask: ParsedTask = {
          title: match[1],
          description: '',
          type: 'subtask',
          priority: currentTask?.priority || 3,
          tags: currentTask?.tags || [],
          definitionOfDone: [],
          parentIndex: currentTask ? taskIndex : undefined,
          epicIndex: currentEpic ? epicIndex : undefined,
        };
        tasks.push(subtask);
      }
    }
    // DoD detection
    else if (line.match(/^(DoD|Definition of Done):/i)) {
      inDoD = true;
      inTestNotes = false;
      inRisk = false;
    }
    // Test Notes detection
    else if (line.match(/^(Test|Testing|Test Notes):/i)) {
      inDoD = false;
      inTestNotes = true;
      inRisk = false;
    }
    // Risk detection
    else if (line.match(/^Risk:/i)) {
      inDoD = false;
      inTestNotes = false;
      inRisk = true;
    }
    // Priority detection
    else if (line.match(/^Priority:\s*(high|medium|low|critical|\d)/i)) {
      const match = line.match(/^Priority:\s*(high|medium|low|critical|\d)/i);
      if (match && currentTask) {
        currentTask.priority = parsePriority(match[1]);
      }
    }
    // Estimate detection
    else if (line.match(/^Estimate:\s*(\d+\.?\d*)\s*(hours?|h)/i)) {
      const match = line.match(/^Estimate:\s*(\d+\.?\d*)/i);
      if (match && currentTask) {
        currentTask.estimatedHours = parseFloat(match[1]);
      }
    }
    // Content lines
    else if (line.startsWith('-') || line.startsWith('*')) {
      const content = line.replace(/^[-*]\s*/, '');
      if (inDoD && currentTask) {
        currentTask.definitionOfDone.push(content);
      } else if (inTestNotes && currentTask) {
        currentTask.testNotes = (currentTask.testNotes || '') + content + '\n';
      } else if (inRisk && currentTask) {
        currentTask.riskDescription = (currentTask.riskDescription || '') + content + '\n';
        currentTask.riskLevel = detectRiskLevel(content);
      } else if (currentTask) {
        currentTask.description += content + '\n';
      } else if (currentEpic) {
        currentEpic.description += content + '\n';
      }
    }
    // Regular description lines
    else {
      if (currentTask && !inDoD && !inTestNotes && !inRisk) {
        currentTask.description += line + '\n';
      } else if (currentEpic && !currentTask) {
        currentEpic.description += line + '\n';
      }
    }
  }

  // Push remaining tasks
  if (currentTask) tasks.push(currentTask);
  if (currentEpic && !tasks.includes(currentEpic)) tasks.push(currentEpic);

  // If no explicit structure found, create a default task structure
  if (tasks.length === 0 && content.trim()) {
    tasks.push({
      title: extractTitleFromContent(content),
      description: content,
      type: 'task',
      priority: 3,
      tags: detectTags(content),
      definitionOfDone: generateDefaultDoD(content),
      riskLevel: detectRiskLevel(content),
    });
  }

  return tasks;
}

function detectPriority(text: string): 1 | 2 | 3 | 4 | 5 {
  const lower = text.toLowerCase();
  if (lower.includes('critical') || lower.includes('urgent') || lower.includes('p1')) return 5;
  if (lower.includes('high') || lower.includes('important') || lower.includes('p2')) return 4;
  if (lower.includes('medium') || lower.includes('p3')) return 3;
  if (lower.includes('low') || lower.includes('p4')) return 2;
  return 3;
}

function parsePriority(text: string): 1 | 2 | 3 | 4 | 5 {
  const lower = text.toLowerCase();
  if (lower.includes('critical') || text === '5') return 5;
  if (lower.includes('high') || text === '4') return 4;
  if (lower.includes('medium') || text === '3') return 3;
  if (lower.includes('low') || text === '2') return 2;
  if (text === '1') return 1;
  return 3;
}

function detectTags(text: string): string[] {
  const tags: string[] = [];
  const lower = text.toLowerCase();

  // Technical areas
  if (lower.match(/frontend|ui|ux|react|vue|angular/)) tags.push('frontend');
  if (lower.match(/backend|api|server|database/)) tags.push('backend');
  if (lower.match(/database|db|sql|postgres|mongo/)) tags.push('database');
  if (lower.match(/devops|deploy|ci\/cd|docker|kubernetes/)) tags.push('devops');
  if (lower.match(/mobile|ios|android|react native/)) tags.push('mobile');
  if (lower.match(/test|testing|qa|quality/)) tags.push('testing');

  // Task types
  if (lower.match(/bug|fix|error|issue/)) tags.push('bug');
  if (lower.match(/feature|new|add/)) tags.push('feature');
  if (lower.match(/refactor|improve|optimize/)) tags.push('refactor');
  if (lower.match(/document|docs|readme/)) tags.push('documentation');

  return tags;
}

function detectRiskLevel(text: string): 'low' | 'medium' | 'high' | 'critical' | undefined {
  const lower = text.toLowerCase();
  if (lower.match(/critical risk|severe|breaking change|data loss/)) return 'critical';
  if (lower.match(/high risk|security|performance/)) return 'high';
  if (lower.match(/medium risk|complex|dependencies/)) return 'medium';
  if (lower.match(/low risk|simple|straightforward/)) return 'low';
  return undefined;
}

function extractTitleFromContent(content: string): string {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length === 0) return 'New Task';

  // Take first line, limit to 100 chars
  const firstLine = lines[0].trim();
  return firstLine.length > 100 ? firstLine.substring(0, 97) + '...' : firstLine;
}

function generateDefaultDoD(content: string): string[] {
  const dod: string[] = [];
  const lower = content.toLowerCase();

  // Always include these
  dod.push('Code is written and tested');
  dod.push('Code review completed');

  // Conditional DoD based on content
  if (lower.includes('test') || lower.includes('qa')) {
    dod.push('Unit tests written and passing');
  }
  if (lower.includes('document') || lower.includes('docs')) {
    dod.push('Documentation updated');
  }
  if (lower.includes('deploy') || lower.includes('release')) {
    dod.push('Successfully deployed to environment');
  }

  return dod;
}

function detectDependencies(tasks: ParsedTask[]): Map<number, number[]> {
  const dependencies = new Map<number, number[]>();

  tasks.forEach((task, index) => {
    const deps: number[] = [];
    const lower = task.description.toLowerCase();

    // Look for explicit dependency mentions
    tasks.forEach((otherTask, otherIndex) => {
      if (index !== otherIndex) {
        // Check if this task mentions the other task
        if (lower.includes(otherTask.title.toLowerCase()) ||
            lower.includes(`depends on ${otherTask.title.toLowerCase()}`)) {
          deps.push(otherIndex);
        }
      }
    });

    // Subtasks depend on their parent tasks
    if (task.parentIndex !== undefined) {
      deps.push(task.parentIndex);
    }

    // Tasks in an epic might depend on earlier tasks in the same epic
    if (task.epicIndex !== undefined && task.type === 'task') {
      const epicTasks = tasks
        .map((t, i) => ({ task: t, index: i }))
        .filter(({ task: t }) => t.epicIndex === task.epicIndex && t.type === 'task');

      const currentTaskIndexInEpic = epicTasks.findIndex(({ index: i }) => i === index);
      if (currentTaskIndexInEpic > 0) {
        // Optionally depend on previous task in epic (logical flow)
        // deps.push(epicTasks[currentTaskIndexInEpic - 1].index);
      }
    }

    if (deps.length > 0) {
      dependencies.set(index, deps);
    }
  });

  return dependencies;
}

/**
 * Main function to break down a task description into structured tasks
 */
export async function breakdownTask(input: TaskBreakdownInput): Promise<TaskBreakdownResult> {
  const parsedTasks = parseContent(input.content, input.contentType);
  const dependencyMap = detectDependencies(parsedTasks);

  const result: TaskBreakdownResult = {
    epics: [],
    tasks: [],
    subtasks: [],
    dependencies: [],
    summary: '',
  };

  // Generate IDs and convert to Task objects
  const taskIdMap = new Map<number, string>(); // map from index to generated ID
  let taskCounter = 1;

  parsedTasks.forEach((parsed, index) => {
    const taskId = generateId();
    taskIdMap.set(index, taskId);

    const task: Task = {
      id: taskId,
      taskId: generateTaskId(taskCounter++),
      title: parsed.title,
      description: parsed.description.trim(),
      status: 'backlog',
      priority: parsed.priority,
      tags: parsed.tags,
      taskType: parsed.type,
      definitionOfDone: parsed.definitionOfDone,
      testNotes: parsed.testNotes?.trim(),
      riskLevel: parsed.riskLevel,
      riskDescription: parsed.riskDescription?.trim(),
      estimatedHours: parsed.estimatedHours,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Link to parent/epic
    if (parsed.parentIndex !== undefined) {
      task.parentTaskId = taskIdMap.get(parsed.parentIndex);
    }
    if (parsed.epicIndex !== undefined) {
      task.epicId = taskIdMap.get(parsed.epicIndex);
    }

    // Categorize by type
    if (parsed.type === 'epic') {
      result.epics.push(task);
    } else if (parsed.type === 'task') {
      result.tasks.push(task);
    } else {
      result.subtasks.push(task);
    }
  });

  // Create dependencies
  dependencyMap.forEach((deps, taskIndex) => {
    const taskId = taskIdMap.get(taskIndex);
    if (!taskId) return;

    deps.forEach(depIndex => {
      const depTaskId = taskIdMap.get(depIndex);
      if (!depTaskId) return;

      result.dependencies.push({
        id: generateId(),
        taskId,
        dependsOnTaskId: depTaskId,
        dependencyType: 'blocks',
        createdAt: Date.now(),
      });
    });
  });

  // Generate summary
  const totalTasks = result.epics.length + result.tasks.length + result.subtasks.length;
  result.summary = `Breakdown complete: ${result.epics.length} epic(s), ${result.tasks.length} task(s), ${result.subtasks.length} subtask(s). Total: ${totalTasks} items with ${result.dependencies.length} dependencies.`;

  return result;
}

/**
 * Analyze image/screenshot (placeholder for future OCR/vision integration)
 */
export async function analyzeScreenshot(imageData: string | File): Promise<string> {
  // TODO: Integrate with vision API (e.g., Claude Vision, GPT-4 Vision)
  // For now, return a placeholder
  return 'Screenshot analysis not yet implemented. Please provide text description.';
}
