import {
  BreakdownTask,
  TaskBreakdownRequest,
  TaskBreakdownResult,
  TaskDependency,
  DefinitionOfDone,
  TestNote,
  RiskFlag,
  TaskType,
  RiskLevel,
} from '@/types/breakdown';
import { generateId } from './utils';

interface ParsedTask {
  title: string;
  description: string;
  type: TaskType;
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  estimatedHours?: number;
  definitionOfDone: string[];
  testNotes: { description: string; type: 'unit' | 'integration' | 'e2e' | 'manual' }[];
  riskFlags: { level: RiskLevel; description: string; mitigation?: string }[];
  dependencies?: string[]; // Titles of tasks this depends on
}

export class TaskBreakdownService {
  private static taskCounter = {
    epic: 0,
    ticket: 0,
    subtask: 0,
  };

  private static generateTaskId(type: TaskType): string {
    const prefix = type === 'epic' ? 'EPIC' : type === 'ticket' ? 'TICKET' : 'SUB';
    this.taskCounter[type]++;
    return `${prefix}-${this.taskCounter[type]}`;
  }

  static parseIssue(content: string): ParsedTask[] {
    const tasks: ParsedTask[] = [];

    // Simple parsing logic - in a real application, you'd use AI/LLM here
    const lines = content.split('\n').filter(line => line.trim());

    // Look for epic-level indicators
    const hasEpicKeywords = /epic|feature|initiative|project/i.test(content);

    // Extract tasks from bullet points or numbered lists
    const taskPattern = /^[\*\-\d]+[\.\)]\s+(.+)/;
    let currentEpic: ParsedTask | null = null;

    for (const line of lines) {
      const match = line.match(taskPattern);
      if (match) {
        const taskText = match[1].trim();

        // Determine task type and priority based on keywords
        const isHighPriority = /urgent|critical|blocker|asap/i.test(taskText);
        const isBug = /bug|fix|issue|error/i.test(taskText);
        const isFeature = /feature|implement|add|create/i.test(taskText);

        const task: ParsedTask = {
          title: taskText,
          description: taskText,
          type: hasEpicKeywords && !currentEpic ? 'epic' : 'ticket',
          priority: isHighPriority ? 5 : isBug ? 4 : 3,
          tags: this.extractTags(taskText),
          estimatedHours: this.estimateHours(taskText),
          definitionOfDone: this.generateDoD(taskText, isBug ? 'bug' : 'feature'),
          testNotes: this.generateTestNotes(taskText, isBug),
          riskFlags: this.identifyRisks(taskText),
        };

        if (task.type === 'epic') {
          currentEpic = task;
        }

        tasks.push(task);
      }
    }

    // If no structured tasks found, create one from the content
    if (tasks.length === 0) {
      const isBug = /bug|fix|issue|error/i.test(content);
      tasks.push({
        title: content.split('\n')[0].substring(0, 100),
        description: content,
        type: 'ticket',
        priority: 3,
        tags: this.extractTags(content),
        estimatedHours: this.estimateHours(content),
        definitionOfDone: this.generateDoD(content, isBug ? 'bug' : 'feature'),
        testNotes: this.generateTestNotes(content, isBug),
        riskFlags: this.identifyRisks(content),
      });
    }

    return tasks;
  }

  static parsePRD(content: string): ParsedTask[] {
    const tasks: ParsedTask[] = [];

    // PRD typically has sections like Requirements, User Stories, etc.
    const sections = content.split(/#{1,3}\s+/);

    for (const section of sections) {
      if (!section.trim()) continue;

      const lines = section.split('\n').filter(line => line.trim());
      const sectionTitle = lines[0];

      // Check if this is a requirements or user stories section
      if (/requirement|user story|feature|epic/i.test(sectionTitle)) {
        const sectionTasks = this.parseIssue(section);
        tasks.push(...sectionTasks);
      }
    }

    if (tasks.length === 0) {
      // Treat entire PRD as an epic
      tasks.push({
        title: content.split('\n')[0].substring(0, 100),
        description: content,
        type: 'epic',
        priority: 3,
        tags: ['prd', ...this.extractTags(content)],
        estimatedHours: this.estimateHours(content) * 2, // PRDs typically larger
        definitionOfDone: this.generateDoD(content, 'feature'),
        testNotes: this.generateTestNotes(content, false),
        riskFlags: this.identifyRisks(content),
      });
    }

    return tasks;
  }

  static parseScreenshot(description: string): ParsedTask[] {
    // For screenshots, we'd typically use vision AI
    // For now, create a task based on the description
    return [{
      title: `Implement UI from screenshot: ${description.substring(0, 50)}`,
      description: `Implement the user interface shown in the screenshot. ${description}`,
      type: 'ticket',
      priority: 3,
      tags: ['frontend', 'ui', 'screenshot'],
      estimatedHours: 8,
      definitionOfDone: [
        'UI matches screenshot design',
        'Responsive layout implemented',
        'All interactive elements functional',
        'Accessibility requirements met',
      ],
      testNotes: [
        { description: 'Visual regression testing', type: 'e2e' as const },
        { description: 'Cross-browser compatibility check', type: 'manual' as const },
      ],
      riskFlags: [
        {
          level: 'medium' as RiskLevel,
          description: 'Design interpretation may vary',
          mitigation: 'Get design review before implementation',
        },
      ],
    }];
  }

  static async breakdownTask(request: TaskBreakdownRequest): Promise<TaskBreakdownResult> {
    let parsedTasks: ParsedTask[];

    switch (request.type) {
      case 'issue':
        parsedTasks = this.parseIssue(request.content);
        break;
      case 'prd':
        parsedTasks = this.parsePRD(request.content);
        break;
      case 'screenshot':
        parsedTasks = this.parseScreenshot(request.content);
        break;
      default:
        parsedTasks = this.parseIssue(request.content);
    }

    // Convert parsed tasks to BreakdownTask objects
    const epics: BreakdownTask[] = [];
    const tickets: BreakdownTask[] = [];
    const subtasks: BreakdownTask[] = [];
    const dependencies: TaskDependency[] = [];
    const taskMap = new Map<string, BreakdownTask>();

    for (const parsed of parsedTasks) {
      const breakdownTask: BreakdownTask = {
        id: generateId(),
        taskId: this.generateTaskId(parsed.type),
        title: parsed.title,
        description: parsed.description,
        type: parsed.type,
        status: 'backlog',
        priority: parsed.priority,
        tags: parsed.tags,
        estimatedHours: parsed.estimatedHours,
        definitionOfDone: parsed.definitionOfDone.map((desc, idx) => ({
          id: generateId(),
          description: desc,
          completed: false,
        })),
        testNotes: parsed.testNotes.map((note, idx) => ({
          id: generateId(),
          description: note.description,
          type: note.type,
        })),
        riskFlags: parsed.riskFlags.map((risk, idx) => ({
          id: generateId(),
          level: risk.level,
          description: risk.description,
          mitigation: risk.mitigation,
        })),
        dependencies: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      taskMap.set(breakdownTask.title, breakdownTask);

      switch (parsed.type) {
        case 'epic':
          epics.push(breakdownTask);
          break;
        case 'ticket':
          tickets.push(breakdownTask);
          break;
        case 'subtask':
          subtasks.push(breakdownTask);
          break;
      }
    }

    // Generate dependencies based on task order and relationships
    this.generateDependencies(parsedTasks, taskMap, dependencies);

    // Generate subtasks for complex tickets
    this.generateSubtasks(tickets, subtasks, dependencies, taskMap);

    return {
      requestId: request.id,
      epics,
      tickets,
      subtasks,
      dependencies,
      suggestedAssignments: new Map(),
      createdAt: Date.now(),
    };
  }

  private static extractTags(text: string): string[] {
    const tags: string[] = [];

    if (/frontend|ui|react|component/i.test(text)) tags.push('frontend');
    if (/backend|api|server|database/i.test(text)) tags.push('backend');
    if (/bug|fix|issue/i.test(text)) tags.push('bug');
    if (/feature|implement|add/i.test(text)) tags.push('feature');
    if (/test|testing|qa/i.test(text)) tags.push('testing');
    if (/urgent|critical|blocker/i.test(text)) tags.push('urgent');
    if (/security|auth|permission/i.test(text)) tags.push('security');
    if (/performance|optimization/i.test(text)) tags.push('performance');

    return tags;
  }

  private static estimateHours(text: string): number {
    // Simple heuristic - in real app, use ML model
    const complexity = text.length;

    if (complexity < 100) return 2;
    if (complexity < 300) return 5;
    if (complexity < 600) return 8;
    if (complexity < 1000) return 13;
    return 21;
  }

  private static generateDoD(text: string, type: 'bug' | 'feature'): string[] {
    const baseDoD = [
      'Code review completed',
      'All tests passing',
      'Documentation updated',
    ];

    if (type === 'bug') {
      return [
        'Bug reproduced and root cause identified',
        'Fix implemented and verified',
        ...baseDoD,
        'Regression tests added',
      ];
    } else {
      return [
        'Requirements met and verified',
        'Feature implemented according to spec',
        ...baseDoD,
        'User acceptance testing completed',
      ];
    }
  }

  private static generateTestNotes(text: string, isBug: boolean): ParsedTask['testNotes'] {
    const notes: ParsedTask['testNotes'] = [];

    if (/frontend|ui|component/i.test(text)) {
      notes.push({ description: 'Component unit tests', type: 'unit' });
      notes.push({ description: 'UI integration tests', type: 'integration' });
    }

    if (/backend|api/i.test(text)) {
      notes.push({ description: 'API endpoint tests', type: 'unit' });
      notes.push({ description: 'Integration tests with database', type: 'integration' });
    }

    if (isBug) {
      notes.push({ description: 'Regression test for bug', type: 'unit' });
    }

    notes.push({ description: 'Manual testing checklist', type: 'manual' });
    notes.push({ description: 'End-to-end user flow', type: 'e2e' });

    return notes;
  }

  private static identifyRisks(text: string): ParsedTask['riskFlags'] {
    const risks: ParsedTask['riskFlags'] = [];

    if (/database|migration|schema/i.test(text)) {
      risks.push({
        level: 'high',
        description: 'Database changes require careful migration planning',
        mitigation: 'Create rollback plan and test on staging',
      });
    }

    if (/security|auth|permission/i.test(text)) {
      risks.push({
        level: 'high',
        description: 'Security implications require thorough review',
        mitigation: 'Security team review and penetration testing',
      });
    }

    if (/urgent|critical|blocker/i.test(text)) {
      risks.push({
        level: 'medium',
        description: 'Time pressure may impact quality',
        mitigation: 'Ensure adequate testing and review despite urgency',
      });
    }

    if (/performance|optimization/i.test(text)) {
      risks.push({
        level: 'medium',
        description: 'Performance changes need benchmarking',
        mitigation: 'Establish metrics and monitor impact',
      });
    }

    return risks;
  }

  private static generateDependencies(
    parsedTasks: ParsedTask[],
    taskMap: Map<string, BreakdownTask>,
    dependencies: TaskDependency[]
  ): void {
    // Sequential dependencies for tasks in order
    for (let i = 1; i < parsedTasks.length; i++) {
      const currentTask = taskMap.get(parsedTasks[i].title);
      const previousTask = taskMap.get(parsedTasks[i - 1].title);

      if (currentTask && previousTask) {
        // Only create dependency if tasks are related
        if (parsedTasks[i].type !== 'epic' && parsedTasks[i - 1].type !== 'epic') {
          dependencies.push({
            id: generateId(),
            dependsOn: previousTask.id,
            type: 'related',
          });
        }
      }
    }
  }

  private static generateSubtasks(
    tickets: BreakdownTask[],
    subtasks: BreakdownTask[],
    dependencies: TaskDependency[],
    taskMap: Map<string, BreakdownTask>
  ): void {
    // Generate subtasks for tickets with high complexity
    for (const ticket of tickets) {
      if ((ticket.estimatedHours || 0) > 8) {
        const hasBackend = ticket.tags.includes('backend');
        const hasFrontend = ticket.tags.includes('frontend');

        if (hasBackend && hasFrontend) {
          // Create frontend and backend subtasks
          const backendSubtask: BreakdownTask = {
            ...ticket,
            id: generateId(),
            taskId: this.generateTaskId('subtask'),
            title: `Backend: ${ticket.title}`,
            type: 'subtask',
            parentId: ticket.id,
            tags: ['backend'],
            estimatedHours: Math.floor((ticket.estimatedHours || 0) * 0.6),
          };

          const frontendSubtask: BreakdownTask = {
            ...ticket,
            id: generateId(),
            taskId: this.generateTaskId('subtask'),
            title: `Frontend: ${ticket.title}`,
            type: 'subtask',
            parentId: ticket.id,
            tags: ['frontend'],
            estimatedHours: Math.floor((ticket.estimatedHours || 0) * 0.4),
          };

          subtasks.push(backendSubtask, frontendSubtask);

          // Frontend depends on backend
          dependencies.push({
            id: generateId(),
            dependsOn: backendSubtask.id,
            type: 'blocks',
          });
        }
      }
    }
  }
}
