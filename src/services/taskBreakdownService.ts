import { Task, TaskStatus } from '@/types/task';
import { Subtask } from '@/types/subtask';
import { TaskDependency } from '@/types/dependency';
import {
  BreakdownInput,
  TaskBreakdown,
  DefinitionOfDone,
  TestNote,
  RiskFlag,
  RiskLevel
} from '@/types/breakdown';
import { generateId, generateTaskId } from '@/lib/utils';

/**
 * Service for breaking down issues, PRDs, or screenshots into
 * structured tasks with DoD, test notes, and risk flags.
 */
export class TaskBreakdownService {
  /**
   * Analyzes the input and breaks it down into structured tasks
   */
  async breakdownInput(input: BreakdownInput, userId: string): Promise<TaskBreakdown> {
    // In a real implementation, this would call an AI service (OpenAI, Claude, etc.)
    // For now, we'll implement rule-based breakdown as a starting point

    if (input.type === 'screenshot' && input.imageData) {
      return this.breakdownScreenshot(input, userId);
    } else if (input.type === 'prd') {
      return this.breakdownPRD(input, userId);
    } else {
      return this.breakdownIssue(input, userId);
    }
  }

  /**
   * Break down a GitHub issue into tasks
   */
  private async breakdownIssue(input: BreakdownInput, userId: string): Promise<TaskBreakdown> {
    const content = input.content;
    const lines = content.split('\n').filter(line => line.trim());

    // Parse the issue content
    const title = lines[0] || 'Untitled Issue';
    const description = lines.slice(1).join('\n');

    // Identify key sections
    const sections = this.parseSections(content);

    // Generate tasks based on content analysis
    const tasks: Task[] = [];
    const subtasks: Subtask[] = [];
    const dependencies: TaskDependency[] = [];
    const definitionsOfDone = new Map<string, DefinitionOfDone>();
    const testNotes = new Map<string, TestNote[]>();
    const riskFlags = new Map<string, RiskFlag[]>();

    // Create main task
    const mainTaskId = generateId();
    const mainTask: Task = {
      id: mainTaskId,
      taskId: generateTaskId(1),
      title: this.cleanTitle(title),
      description: description,
      status: 'backlog' as TaskStatus,
      priority: this.analyzePriority(content),
      tags: this.extractTags(content),
      commentsCount: 0,
      attachmentsCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    tasks.push(mainTask);

    // Generate DoD for main task
    definitionsOfDone.set(mainTaskId, this.generateDoD(content));

    // Generate test notes
    testNotes.set(mainTaskId, this.generateTestNotes(content));

    // Assess risks
    riskFlags.set(mainTaskId, this.assessRisks(content));

    // Break into subtasks if content is complex
    const generatedSubtasks = this.generateSubtasks(mainTaskId, content);
    subtasks.push(...generatedSubtasks);

    // If there are multiple features mentioned, create separate tasks
    const additionalTasks = this.identifyAdditionalTasks(content, tasks.length + 1, userId);
    tasks.push(...additionalTasks);

    // Generate dependencies
    additionalTasks.forEach((task, idx) => {
      if (idx > 0) {
        dependencies.push({
          id: generateId(),
          sourceTaskId: task.id,
          targetTaskId: additionalTasks[idx - 1].id,
          type: 'blocked-by',
          createdAt: Date.now(),
        });
      }
    });

    return {
      epicTitle: title,
      epicDescription: description,
      tasks,
      subtasks,
      dependencies,
      definitionsOfDone,
      testNotes,
      riskFlags,
    };
  }

  /**
   * Break down a PRD into epics and tasks
   */
  private async breakdownPRD(input: BreakdownInput, userId: string): Promise<TaskBreakdown> {
    const content = input.content;

    const tasks: Task[] = [];
    const subtasks: Subtask[] = [];
    const dependencies: TaskDependency[] = [];
    const definitionsOfDone = new Map<string, DefinitionOfDone>();
    const testNotes = new Map<string, TestNote[]>();
    const riskFlags = new Map<string, RiskFlag[]>();

    // Parse sections from PRD
    const sections = this.parseSections(content);

    let taskCounter = 1;

    // Create tasks for each major section/feature
    for (const section of sections) {
      if (section.level === 1 || section.level === 2) {
        const taskId = generateId();
        const task: Task = {
          id: taskId,
          taskId: generateTaskId(taskCounter++),
          title: section.title,
          description: section.content,
          status: 'backlog' as TaskStatus,
          priority: this.analyzePriority(section.content),
          tags: this.extractTags(section.content),
          commentsCount: 0,
          attachmentsCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        tasks.push(task);

        // Generate DoD, tests, and risks for each task
        definitionsOfDone.set(taskId, this.generateDoD(section.content));
        testNotes.set(taskId, this.generateTestNotes(section.content));
        riskFlags.set(taskId, this.assessRisks(section.content));

        // Generate subtasks
        const taskSubtasks = this.generateSubtasks(taskId, section.content);
        subtasks.push(...taskSubtasks);
      }
    }

    return {
      epicTitle: "PRD Implementation",
      epicDescription: content,
      tasks,
      subtasks,
      dependencies,
      definitionsOfDone,
      testNotes,
      riskFlags,
    };
  }

  /**
   * Break down a screenshot into UI implementation tasks
   */
  private async breakdownScreenshot(input: BreakdownInput, userId: string): Promise<TaskBreakdown> {
    const tasks: Task[] = [];
    const subtasks: Subtask[] = [];
    const definitionsOfDone = new Map<string, DefinitionOfDone>();
    const testNotes = new Map<string, TestNote[]>();
    const riskFlags = new Map<string, RiskFlag[]>();

    // Main UI implementation task
    const mainTaskId = generateId();
    const mainTask: Task = {
      id: mainTaskId,
      taskId: generateTaskId(1),
      title: input.context || 'Implement UI from Screenshot',
      description: 'Implement the user interface based on the provided screenshot',
      status: 'backlog' as TaskStatus,
      priority: 3,
      tags: ['ui', 'frontend', 'design'],
      commentsCount: 0,
      attachmentsCount: 1, // The screenshot
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    tasks.push(main Task);

    // Common UI subtasks
    const uiSubtasks: Subtask[] = [
      {
        id: generateId(),
        parentTaskId: mainTaskId,
        title: 'Create component structure',
        description: 'Set up the basic component hierarchy',
        completed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: generateId(),
        parentTaskId: mainTaskId,
        title: 'Implement layout and styling',
        description: 'Apply CSS/Tailwind to match the screenshot',
        completed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: generateId(),
        parentTaskId: mainTaskId,
        title: 'Add interactivity and state management',
        description: 'Implement user interactions and state',
        completed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: generateId(),
        parentTaskId: mainTaskId,
        title: 'Ensure responsive design',
        description: 'Test and adjust for different screen sizes',
        completed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    subtasks.push(...uiSubtasks);

    // DoD for UI task
    definitionsOfDone.set(mainTaskId, {
      criteria: [
        'UI matches the screenshot pixel-perfectly',
        'All interactive elements are functional',
        'Responsive on mobile, tablet, and desktop',
        'Passes accessibility checks (WCAG 2.1)',
        'Code is clean and follows project conventions',
      ],
    });

    // Test notes for UI
    testNotes.set(mainTaskId, [
      {
        id: generateId(),
        title: 'Visual regression test',
        description: 'Compare rendered output with screenshot',
        testType: 'e2e',
      },
      {
        id: generateId(),
        title: 'Responsive design test',
        description: 'Test on various screen sizes',
        testType: 'manual',
      },
      {
        id: generateId(),
        title: 'Component unit tests',
        description: 'Test component rendering and interactions',
        testType: 'unit',
      },
    ]);

    // Risk assessment
    riskFlags.set(mainTaskId, [
      {
        id: generateId(),
        level: 'medium',
        description: 'Design interpretation may differ from intent',
        mitigation: 'Get design review from stakeholder',
      },
      {
        id: generateId(),
        level: 'low',
        description: 'Screenshot may not show all states',
        mitigation: 'Clarify hover, focus, and error states',
      },
    ]);

    return {
      epicTitle: 'UI Implementation',
      tasks,
      subtasks,
      dependencies: [],
      definitionsOfDone,
      testNotes,
      riskFlags,
    };
  }

  // Helper methods

  private parseSections(content: string): Array<{ level: number; title: string; content: string }> {
    const sections: Array<{ level: number; title: string; content: string }> = [];
    const lines = content.split('\n');

    let currentSection: { level: number; title: string; content: string } | null = null;

    for (const line of lines) {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          level: headerMatch[1].length,
          title: headerMatch[2],
          content: '',
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  private cleanTitle(title: string): string {
    // Remove markdown headers and clean up
    return title.replace(/^#+\s*/, '').trim();
  }

  private analyzePriority(content: string): 1 | 2 | 3 | 4 | 5 {
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('critical') || lowerContent.includes('urgent') || lowerContent.includes('blocker')) {
      return 5;
    }
    if (lowerContent.includes('high priority') || lowerContent.includes('important')) {
      return 4;
    }
    if (lowerContent.includes('low priority') || lowerContent.includes('nice to have')) {
      return 2;
    }

    return 3; // default medium
  }

  private extractTags(content: string): string[] {
    const tags: string[] = [];
    const lowerContent = content.toLowerCase();

    // Technical tags
    if (lowerContent.includes('frontend') || lowerContent.includes('ui') || lowerContent.includes('react')) {
      tags.push('frontend');
    }
    if (lowerContent.includes('backend') || lowerContent.includes('api') || lowerContent.includes('server')) {
      tags.push('backend');
    }
    if (lowerContent.includes('database') || lowerContent.includes('sql')) {
      tags.push('database');
    }
    if (lowerContent.includes('bug') || lowerContent.includes('fix') || lowerContent.includes('error')) {
      tags.push('bug');
    }
    if (lowerContent.includes('feature') || lowerContent.includes('new')) {
      tags.push('feature');
    }
    if (lowerContent.includes('test') || lowerContent.includes('testing')) {
      tags.push('testing');
    }
    if (lowerContent.includes('security') || lowerContent.includes('auth')) {
      tags.push('security');
    }

    return tags;
  }

  private generateDoD(content: string): DefinitionOfDone {
    const criteria: string[] = [
      'All acceptance criteria are met',
      'Code is reviewed and approved',
      'Unit tests are written and passing',
      'Integration tests are passing',
      'Documentation is updated',
      'No critical or high-severity bugs',
    ];

    // Add specific criteria based on content
    if (content.toLowerCase().includes('ui') || content.toLowerCase().includes('frontend')) {
      criteria.push('UI matches design specifications');
      criteria.push('Responsive design is implemented');
    }

    if (content.toLowerCase().includes('api') || content.toLowerCase().includes('backend')) {
      criteria.push('API endpoints are documented');
      criteria.push('Error handling is implemented');
    }

    if (content.toLowerCase().includes('database')) {
      criteria.push('Database migrations are created');
      criteria.push('Data integrity is maintained');
    }

    return { criteria };
  }

  private generateTestNotes(content: string): TestNote[] {
    const notes: TestNote[] = [];

    // Always add unit test note
    notes.push({
      id: generateId(),
      title: 'Unit tests for core functionality',
      description: 'Test individual functions and components in isolation',
      testType: 'unit',
    });

    // Add integration tests
    notes.push({
      id: generateId(),
      title: 'Integration tests',
      description: 'Test how components work together',
      testType: 'integration',
    });

    // Add E2E if it's a user-facing feature
    if (content.toLowerCase().includes('user') || content.toLowerCase().includes('ui')) {
      notes.push({
        id: generateId(),
        title: 'End-to-end user flow test',
        description: 'Test complete user workflows',
        testType: 'e2e',
      });
    }

    return notes;
  }

  private assessRisks(content: string): RiskFlag[] {
    const risks: RiskFlag[] = [];
    const lowerContent = content.toLowerCase();

    // Check for complexity indicators
    if (lowerContent.includes('complex') || lowerContent.includes('difficult')) {
      risks.push({
        id: generateId(),
        level: 'high',
        description: 'High complexity may lead to longer development time',
        mitigation: 'Break down into smaller tasks, conduct technical spike',
      });
    }

    // Check for external dependencies
    if (lowerContent.includes('third-party') || lowerContent.includes('integration') || lowerContent.includes('api')) {
      risks.push({
        id: generateId(),
        level: 'medium',
        description: 'External dependencies may cause delays',
        mitigation: 'Test integrations early, have fallback plans',
      });
    }

    // Check for security concerns
    if (lowerContent.includes('auth') || lowerContent.includes('security') || lowerContent.includes('payment')) {
      risks.push({
        id: generateId(),
        level: 'critical',
        description: 'Security-sensitive feature requires extra care',
        mitigation: 'Conduct security review, penetration testing',
      });
    }

    // Check for database changes
    if (lowerContent.includes('database') || lowerContent.includes('migration') || lowerContent.includes('schema')) {
      risks.push({
        id: generateId(),
        level: 'medium',
        description: 'Database changes may affect existing data',
        mitigation: 'Test migrations thoroughly, have rollback plan',
      });
    }

    // If no specific risks, add a low-risk flag
    if (risks.length === 0) {
      risks.push({
        id: generateId(),
        level: 'low',
        description: 'Standard development task with typical risks',
        mitigation: 'Follow standard development practices',
      });
    }

    return risks;
  }

  private generateSubtasks(parentTaskId: string, content: string): Subtask[] {
    const subtasks: Subtask[] = [];

    // Look for checklist items in the content
    const checklistRegex = /[-*]\s*\[[ x]\]\s*(.+)/gi;
    let match;

    while ((match = checklistRegex.exec(content)) !== null) {
      subtasks.push({
        id: generateId(),
        parentTaskId,
        title: match[1].trim(),
        description: '',
        completed: match[0].includes('[x]'),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // If no checklist found, create default subtasks based on content type
    if (subtasks.length === 0) {
      const lowerContent = content.toLowerCase();

      if (lowerContent.includes('frontend') || lowerContent.includes('ui')) {
        subtasks.push(
          {
            id: generateId(),
            parentTaskId,
            title: 'Design component structure',
            description: '',
            completed: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: generateId(),
            parentTaskId,
            title: 'Implement UI components',
            description: '',
            completed: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: generateId(),
            parentTaskId,
            title: 'Add styling and responsiveness',
            description: '',
            completed: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
        );
      } else if (lowerContent.includes('backend') || lowerContent.includes('api')) {
        subtasks.push(
          {
            id: generateId(),
            parentTaskId,
            title: 'Design API endpoints',
            description: '',
            completed: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: generateId(),
            parentTaskId,
            title: 'Implement business logic',
            description: '',
            completed: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: generateId(),
            parentTaskId,
            title: 'Add error handling and validation',
            description: '',
            completed: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
        );
      }
    }

    return subtasks;
  }

  private identifyAdditionalTasks(content: string, startingTaskNumber: number, userId: string): Task[] {
    const tasks: Task[] = [];

    // Look for numbered lists or bullet points that suggest separate tasks
    const taskPatterns = [
      /\d+\.\s+(.+)/g,  // Numbered lists
      /^-\s+(.+)/gm,     // Bullet points at start of line
    ];

    const foundTasks = new Set<string>();

    for (const pattern of taskPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const taskTitle = match[1].trim();
        // Only add if it looks like a substantial task (more than a few words)
        if (taskTitle.split(' ').length >= 3 && !foundTasks.has(taskTitle)) {
          foundTasks.add(taskTitle);
        }
      }
    }

    // Convert to tasks (limit to avoid creating too many)
    const taskTitles = Array.from(foundTasks).slice(0, 5);
    taskTitles.forEach((title, idx) => {
      tasks.push({
        id: generateId(),
        taskId: generateTaskId(startingTaskNumber + idx),
        title,
        description: '',
        status: 'backlog' as TaskStatus,
        priority: 3,
        tags: this.extractTags(title),
        commentsCount: 0,
        attachmentsCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    return tasks;
  }
}

// Export singleton instance
export const taskBreakdownService = new TaskBreakdownService();
