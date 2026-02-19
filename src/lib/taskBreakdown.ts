import { Task, TaskStatus } from '@/types/task';
import {
  BreakdownInput,
  BreakdownResult,
  TaskBreakdown,
  TaskDependency,
  DefinitionOfDone,
  TestNote,
  RiskFlag,
  TaskLevel
} from '@/types/breakdown';
import { generateId, generateTaskId } from './utils';

interface ParsedTask {
  title: string;
  description: string;
  level: TaskLevel;
  parentId?: string;
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  estimatedHours?: number;
  dod: string[];
  tests: { description: string; type: 'unit' | 'integration' | 'e2e' | 'manual' | 'performance' }[];
  risks: { description: string; level: 'low' | 'medium' | 'high' | 'critical'; mitigation?: string }[];
  dependencies: string[]; // titles of tasks this depends on
}

/**
 * Analyzes input and breaks it down into structured tasks
 * This is a rule-based implementation. In production, you could enhance this with:
 * - OpenAI/Anthropic API for intelligent parsing
 * - Screenshot OCR and analysis
 * - GitHub Issues API integration
 */
export class TaskBreakdownService {
  /**
   * Main entry point for task breakdown
   */
  async breakdownTask(input: BreakdownInput, userId: string, existingTasks: Task[]): Promise<BreakdownResult> {
    const parsedTasks = await this.parseInput(input);
    const taskMap = new Map<string, Task>();
    const breakdownMap = new Map<string, TaskBreakdown>();

    // Generate task IDs
    let maxTaskNumber = 0;
    existingTasks.forEach(task => {
      if (task.taskId) {
        const match = task.taskId.match(/TASK-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxTaskNumber) maxTaskNumber = num;
        }
      }
    });

    // Create tasks and breakdowns
    const epics: TaskBreakdown[] = [];
    const tickets: TaskBreakdown[] = [];
    const subtasks: TaskBreakdown[] = [];

    parsedTasks.forEach((parsed) => {
      maxTaskNumber++;
      const taskId = generateId();

      // Create Task object
      const task: Task = {
        id: taskId,
        taskId: generateTaskId(maxTaskNumber),
        title: parsed.title,
        description: parsed.description,
        status: 'backlog' as TaskStatus,
        priority: parsed.priority,
        tags: parsed.tags,
        commentsCount: 0,
        attachmentsCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      taskMap.set(parsed.title, task);

      // Create TaskBreakdown
      const breakdown: TaskBreakdown = {
        id: generateId(),
        userId,
        taskId: taskId,
        level: parsed.level,
        estimatedHours: parsed.estimatedHours,
        definitionOfDone: parsed.dod.map((criteria, idx) => ({
          id: generateId(),
          criteria,
          completed: false,
        })),
        testNotes: parsed.tests.map(test => ({
          id: generateId(),
          description: test.description,
          testType: test.type,
          priority: 3,
        })),
        riskFlags: parsed.risks.map(risk => ({
          id: generateId(),
          description: risk.description,
          level: risk.level,
          mitigation: risk.mitigation,
          acknowledged: false,
        })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Set parent relationships
      if (parsed.parentId) {
        const parentTask = Array.from(taskMap.values()).find(t => t.title === parsed.parentId);
        if (parentTask) {
          if (parsed.level === 'ticket') {
            breakdown.epicId = parentTask.id;
          } else if (parsed.level === 'subtask') {
            breakdown.ticketId = parentTask.id;
          }
        }
      }

      breakdownMap.set(parsed.title, breakdown);

      if (parsed.level === 'epic') epics.push(breakdown);
      else if (parsed.level === 'ticket') tickets.push(breakdown);
      else subtasks.push(breakdown);
    });

    // Create dependencies
    const dependencies: TaskDependency[] = [];
    parsedTasks.forEach((parsed) => {
      const fromTask = taskMap.get(parsed.title);
      if (!fromTask) return;

      parsed.dependencies.forEach((depTitle) => {
        const toTask = taskMap.get(depTitle);
        if (toTask) {
          dependencies.push({
            id: generateId(),
            fromTaskId: fromTask.id,
            toTaskId: toTask.id,
            type: 'requires',
            createdAt: Date.now(),
          });
        }
      });
    });

    return {
      epics,
      tickets,
      subtasks,
      dependencies,
      suggestedAgentAssignments: new Map(),
    };
  }

  /**
   * Parse input into structured tasks
   * This uses pattern matching. In production, use AI for better parsing.
   */
  private async parseInput(input: BreakdownInput): Promise<ParsedTask[]> {
    const tasks: ParsedTask[] = [];

    if (input.source === 'text') {
      tasks.push(...this.parseTextInput(input.content));
    } else if (input.source === 'issue') {
      tasks.push(...this.parseIssueInput(input.content));
    } else if (input.source === 'prd') {
      tasks.push(...this.parsePRDInput(input.content));
    }

    return tasks;
  }

  /**
   * Parse plain text input
   */
  private parseTextInput(content: string): ParsedTask[] {
    const tasks: ParsedTask[] = [];
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);

    let currentEpic: string | undefined;
    let currentTicket: string | undefined;

    for (const line of lines) {
      // Epic detection (starts with # or "Epic:")
      if (line.match(/^#\s+(.+)/) || line.toLowerCase().startsWith('epic:')) {
        const title = line.replace(/^#\s+/, '').replace(/^epic:\s*/i, '').trim();
        currentEpic = title;
        tasks.push(this.createDefaultTask(title, 'epic'));
      }
      // Ticket detection (starts with ## or "Ticket:" or "-")
      else if (line.match(/^##\s+(.+)/) || line.toLowerCase().startsWith('ticket:') || line.match(/^-\s+(.+)/)) {
        const title = line.replace(/^##\s+/, '').replace(/^-\s+/, '').replace(/^ticket:\s*/i, '').trim();
        currentTicket = title;
        tasks.push(this.createDefaultTask(title, 'ticket', currentEpic));
      }
      // Subtask detection (starts with * or •)
      else if (line.match(/^[*•]\s+(.+)/)) {
        const title = line.replace(/^[*•]\s+/, '').trim();
        tasks.push(this.createDefaultTask(title, 'subtask', currentTicket));
      }
    }

    // If no structure found, create a single epic
    if (tasks.length === 0 && content.trim()) {
      tasks.push(this.createDefaultTask(content.substring(0, 100), 'epic'));
    }

    return tasks;
  }

  /**
   * Parse GitHub issue format
   */
  private parseIssueInput(content: string): ParsedTask[] {
    // Similar to text parsing but with issue-specific patterns
    return this.parseTextInput(content);
  }

  /**
   * Parse PRD (Product Requirements Document)
   */
  private parsePRDInput(content: string): ParsedTask[] {
    // Look for sections like Requirements, Features, User Stories
    return this.parseTextInput(content);
  }

  /**
   * Create a default task structure
   */
  private createDefaultTask(title: string, level: TaskLevel, parentId?: string): ParsedTask {
    // Determine priority based on keywords
    let priority: 1 | 2 | 3 | 4 | 5 = 3;
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('critical') || lowerTitle.includes('urgent')) {
      priority = 5;
    } else if (lowerTitle.includes('high priority') || lowerTitle.includes('important')) {
      priority = 4;
    } else if (lowerTitle.includes('low priority') || lowerTitle.includes('nice to have')) {
      priority = 2;
    }

    // Extract tags from keywords
    const tags: string[] = [];
    if (lowerTitle.includes('frontend') || lowerTitle.includes('ui') || lowerTitle.includes('ux')) {
      tags.push('frontend');
    }
    if (lowerTitle.includes('backend') || lowerTitle.includes('api') || lowerTitle.includes('database')) {
      tags.push('backend');
    }
    if (lowerTitle.includes('bug') || lowerTitle.includes('fix')) {
      tags.push('bug');
    }
    if (lowerTitle.includes('feature') || lowerTitle.includes('implement')) {
      tags.push('feature');
    }
    if (lowerTitle.includes('test')) {
      tags.push('testing');
    }

    // Generate default DoD based on level
    const dod: string[] = [];
    if (level === 'epic') {
      dod.push('All tickets completed');
      dod.push('Acceptance criteria met');
      dod.push('Documentation updated');
    } else if (level === 'ticket') {
      dod.push('Implementation complete');
      dod.push('Tests passing');
      dod.push('Code reviewed');
    } else {
      dod.push('Implementation complete');
      dod.push('Tested locally');
    }

    // Generate default tests
    const tests: { description: string; type: 'unit' | 'integration' | 'e2e' | 'manual' | 'performance' }[] = [];
    if (tags.includes('frontend')) {
      tests.push({ description: 'Component renders correctly', type: 'unit' });
      tests.push({ description: 'User interaction works as expected', type: 'e2e' });
    }
    if (tags.includes('backend')) {
      tests.push({ description: 'API endpoints return correct data', type: 'integration' });
      tests.push({ description: 'Database operations work correctly', type: 'unit' });
    }

    // Generate default risks
    const risks: { description: string; level: 'low' | 'medium' | 'high' | 'critical'; mitigation?: string }[] = [];
    if (priority >= 4) {
      risks.push({
        description: 'High priority task may block other work',
        level: 'medium',
        mitigation: 'Ensure early communication with team',
      });
    }
    if (tags.includes('database')) {
      risks.push({
        description: 'Database migration may cause downtime',
        level: 'medium',
        mitigation: 'Plan migration during low-traffic period',
      });
    }

    // Estimate hours based on level
    let estimatedHours: number | undefined;
    if (level === 'epic') {
      estimatedHours = 40; // ~1 week
    } else if (level === 'ticket') {
      estimatedHours = 8; // ~1 day
    } else {
      estimatedHours = 2; // ~2 hours
    }

    return {
      title,
      description: `Auto-generated description for: ${title}`,
      level,
      parentId,
      priority,
      tags,
      estimatedHours,
      dod,
      tests,
      risks,
      dependencies: [],
    };
  }

  /**
   * Analyze dependencies between tasks
   */
  analyzeDependencies(tasks: ParsedTask[]): void {
    // Simple keyword-based dependency detection
    // In production, use NLP or AI to detect dependencies

    for (let i = 0; i < tasks.length; i++) {
      for (let j = 0; j < tasks.length; j++) {
        if (i === j) continue;

        const task = tasks[i];
        const potentialDep = tasks[j];

        // If task mentions "after" or "depends on" another task
        if (task.description.toLowerCase().includes(potentialDep.title.toLowerCase())) {
          if (!task.dependencies.includes(potentialDep.title)) {
            task.dependencies.push(potentialDep.title);
          }
        }
      }
    }
  }
}

export const taskBreakdownService = new TaskBreakdownService();
