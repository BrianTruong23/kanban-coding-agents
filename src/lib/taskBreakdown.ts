import { Task, TaskBreakdownInput, TaskBreakdownResult, TaskType, RiskLevel } from '@/types/task';
import { generateId, generateTaskId } from './utils';

/**
 * Analyzes text content to extract task information
 * This is a simplified version - in production, you might use AI/ML for better parsing
 */
export class TaskBreakdownService {
  private taskCounter: number;

  constructor(startingTaskNumber: number = 0) {
    this.taskCounter = startingTaskNumber;
  }

  /**
   * Main method to break down an issue/PRD into structured tasks
   */
  public breakdownIssue(input: TaskBreakdownInput): TaskBreakdownResult {
    const { title, description, content } = input;

    // Parse the content to extract sections
    const sections = this.parseContent(content);

    // Determine if this should be an epic or just stories
    const needsEpic = this.shouldCreateEpic(sections);

    let epic: Task | undefined;
    const stories: Task[] = [];
    const tasks: Task[] = [];
    const subtasks: Task[] = [];
    const dependencies: TaskBreakdownResult['dependencies'] = [];

    const now = Date.now();

    // Create epic if needed
    if (needsEpic) {
      epic = this.createTask({
        title: title || 'Epic: ' + this.extractTitle(content),
        description: description || this.extractDescription(content),
        type: 'epic',
        priority: this.estimatePriority(content),
        tags: this.extractTags(content),
        now,
      });
    }

    // Extract user stories
    const storyTexts = this.extractStories(content);
    for (const storyText of storyTexts) {
      const story = this.createTask({
        title: this.extractTitle(storyText),
        description: this.extractDescription(storyText),
        type: 'story',
        epicId: epic?.id,
        priority: this.estimatePriority(storyText),
        tags: this.extractTags(storyText),
        definitionOfDone: this.extractDoD(storyText),
        testNotes: this.extractTestNotes(storyText),
        riskFlags: this.identifyRisks(storyText),
        now,
      });
      stories.push(story);

      // Extract tasks from story
      const taskTexts = this.extractTasks(storyText);
      for (const taskText of taskTexts) {
        const task = this.createTask({
          title: this.extractTitle(taskText),
          description: this.extractDescription(taskText),
          type: 'task',
          epicId: epic?.id,
          parentTaskId: story.id,
          priority: this.estimatePriority(taskText),
          tags: this.extractTags(taskText),
          definitionOfDone: this.extractDoD(taskText),
          testNotes: this.extractTestNotes(taskText),
          riskFlags: this.identifyRisks(taskText),
          estimatedEffort: this.estimateEffort(taskText),
          now,
        });
        tasks.push(task);

        // Extract subtasks
        const subtaskTexts = this.extractSubtasks(taskText);
        for (const subtaskText of subtaskTexts) {
          const subtask = this.createTask({
            title: this.extractTitle(subtaskText),
            description: '',
            type: 'subtask',
            parentTaskId: task.id,
            epicId: epic?.id,
            priority: task.priority,
            tags: [],
            estimatedEffort: this.estimateEffort(subtaskText),
            now,
          });
          subtasks.push(subtask);
        }
      }
    }

    // If no explicit stories found, create tasks directly
    if (stories.length === 0) {
      const taskTexts = this.extractTasks(content);
      for (const taskText of taskTexts) {
        const task = this.createTask({
          title: this.extractTitle(taskText),
          description: this.extractDescription(taskText),
          type: 'task',
          epicId: epic?.id,
          priority: this.estimatePriority(taskText),
          tags: this.extractTags(taskText),
          definitionOfDone: this.extractDoD(taskText),
          testNotes: this.extractTestNotes(taskText),
          riskFlags: this.identifyRisks(taskText),
          estimatedEffort: this.estimateEffort(taskText),
          now,
        });
        tasks.push(task);
      }
    }

    // Extract dependencies from content
    dependencies.push(...this.extractDependencies(content, [...stories, ...tasks, ...subtasks]));

    return {
      epic,
      stories,
      tasks,
      subtasks,
      dependencies,
    };
  }

  private createTask(params: {
    title: string;
    description: string;
    type: TaskType;
    epicId?: string;
    parentTaskId?: string;
    priority: 1 | 2 | 3 | 4 | 5;
    tags: string[];
    definitionOfDone?: Task['definitionOfDone'];
    testNotes?: Task['testNotes'];
    riskFlags?: Task['riskFlags'];
    estimatedEffort?: number;
    now: number;
  }): Task {
    return {
      id: generateId(),
      taskId: generateTaskId(++this.taskCounter),
      title: params.title,
      description: params.description,
      status: 'backlog',
      type: params.type,
      epicId: params.epicId,
      parentTaskId: params.parentTaskId,
      priority: params.priority,
      tags: params.tags,
      commentsCount: 0,
      attachmentsCount: 0,
      createdAt: params.now,
      updatedAt: params.now,
      definitionOfDone: params.definitionOfDone,
      testNotes: params.testNotes,
      riskFlags: params.riskFlags,
      estimatedEffort: params.estimatedEffort,
    };
  }

  private parseContent(content: string): Record<string, string[]> {
    const sections: Record<string, string[]> = {};
    const lines = content.split('\n');
    let currentSection = 'main';

    for (const line of lines) {
      const trimmed = line.trim();

      // Check if this is a section header
      if (trimmed.match(/^#{1,3}\s+/)) {
        currentSection = trimmed.replace(/^#{1,3}\s+/, '').toLowerCase();
        sections[currentSection] = [];
      } else if (trimmed) {
        if (!sections[currentSection]) {
          sections[currentSection] = [];
        }
        sections[currentSection].push(trimmed);
      }
    }

    return sections;
  }

  private shouldCreateEpic(sections: Record<string, string[]>): boolean {
    // Create epic if there are multiple major sections or complex requirements
    const sectionCount = Object.keys(sections).length;
    return sectionCount > 3;
  }

  private extractTitle(text: string): string {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length === 0) return 'Untitled Task';

    // Look for markdown headers or first non-empty line
    const headerMatch = lines[0].match(/^#{1,6}\s+(.+)$/);
    if (headerMatch) return headerMatch[1];

    // Get first line or sentence
    const firstLine = lines[0].trim();
    return firstLine.length > 80 ? firstLine.substring(0, 77) + '...' : firstLine;
  }

  private extractDescription(text: string): string {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length <= 1) return '';

    // Skip first line (title) and return rest
    return lines.slice(1).join('\n').trim();
  }

  private extractStories(content: string): string[] {
    const stories: string[] = [];

    // Look for user story patterns
    const userStoryRegex = /(?:as a|as an)\s+.+?(?=as a|as an|$)/gis;
    const matches = content.match(userStoryRegex);
    if (matches) {
      stories.push(...matches);
    }

    // Look for story headers
    const storyHeaders = content.match(/^#{2,3}\s+story:?\s*.+$/gim);
    if (storyHeaders && storyHeaders.length > 0) {
      // Split content by story headers
      const parts = content.split(/^#{2,3}\s+story:?\s*/gim);
      stories.push(...parts.slice(1));
    }

    return stories;
  }

  private extractTasks(text: string): string[] {
    const tasks: string[] = [];

    // Look for bullet points or numbered lists
    const lines = text.split('\n');
    let currentTask = '';

    for (const line of lines) {
      const trimmed = line.trim();

      // Check for task markers
      if (trimmed.match(/^[-*]\s+/) || trimmed.match(/^\d+\.\s+/)) {
        if (currentTask) tasks.push(currentTask);
        currentTask = trimmed.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '');
      } else if (currentTask && trimmed && !trimmed.match(/^#{1,6}\s+/)) {
        currentTask += '\n' + trimmed;
      }
    }

    if (currentTask) tasks.push(currentTask);

    // If no tasks found, treat whole text as one task
    if (tasks.length === 0 && text.trim()) {
      tasks.push(text.trim());
    }

    return tasks;
  }

  private extractSubtasks(text: string): string[] {
    const subtasks: string[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      // Look for indented items or checkbox items
      if (trimmed.match(/^\s{2,}[-*]\s+/) || trimmed.match(/^[-*]\s+\[[ x]\]/)) {
        subtasks.push(trimmed.replace(/^\s+/, '').replace(/^[-*]\s+\[[ x]\]\s*/, ''));
      }
    }

    return subtasks;
  }

  private extractTags(text: string): string[] {
    const tags: string[] = [];
    const lowerText = text.toLowerCase();

    // Technology/domain tags
    const tagPatterns = [
      { pattern: /\b(frontend|ui|ux|react|vue|angular)\b/, tag: 'frontend' },
      { pattern: /\b(backend|api|server|database|sql)\b/, tag: 'backend' },
      { pattern: /\b(bug|fix|issue|error)\b/, tag: 'bug' },
      { pattern: /\b(feature|enhancement|new)\b/, tag: 'feature' },
      { pattern: /\b(urgent|critical|high.?priority)\b/, tag: 'urgent' },
      { pattern: /\b(test|testing|qa)\b/, tag: 'testing' },
      { pattern: /\b(devops|deploy|ci.?cd|infrastructure)\b/, tag: 'devops' },
      { pattern: /\b(mobile|ios|android)\b/, tag: 'mobile' },
      { pattern: /\b(design|ui.?ux|mockup)\b/, tag: 'design' },
    ];

    for (const { pattern, tag } of tagPatterns) {
      if (pattern.test(lowerText)) {
        tags.push(tag);
      }
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  private estimatePriority(text: string): 1 | 2 | 3 | 4 | 5 {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('critical') || lowerText.includes('urgent') || lowerText.includes('asap')) {
      return 5;
    }
    if (lowerText.includes('high priority') || lowerText.includes('important')) {
      return 4;
    }
    if (lowerText.includes('low priority') || lowerText.includes('nice to have')) {
      return 2;
    }
    if (lowerText.includes('optional') || lowerText.includes('future')) {
      return 1;
    }

    return 3; // Default medium priority
  }

  private extractDoD(text: string): Task['definitionOfDone'] | undefined {
    const criteria: string[] = [];

    // Look for DoD section
    const dodMatch = text.match(/definition of done:?\s*\n((?:[-*]\s+.+\n?)+)/i);
    if (dodMatch) {
      const items = dodMatch[1].match(/[-*]\s+(.+)/g);
      if (items) {
        criteria.push(...items.map(item => item.replace(/^[-*]\s+/, '').trim()));
      }
    }

    // Look for acceptance criteria
    const acMatch = text.match(/acceptance criteria:?\s*\n((?:[-*]\s+.+\n?)+)/i);
    if (acMatch) {
      const items = acMatch[1].match(/[-*]\s+(.+)/g);
      if (items) {
        criteria.push(...items.map(item => item.replace(/^[-*]\s+/, '').trim()));
      }
    }

    if (criteria.length === 0) return undefined;

    return { criteria };
  }

  private extractTestNotes(text: string): Task['testNotes'] | undefined {
    const testCases: string[] = [];
    let expectedBehavior: string | undefined;
    const edgeCases: string[] = [];

    // Look for test section
    const testMatch = text.match(/test(?:ing|s)?:?\s*\n((?:[-*]\s+.+\n?)+)/i);
    if (testMatch) {
      const items = testMatch[1].match(/[-*]\s+(.+)/g);
      if (items) {
        testCases.push(...items.map(item => item.replace(/^[-*]\s+/, '').trim()));
      }
    }

    // Look for edge cases
    const edgeMatch = text.match(/edge cases?:?\s*\n((?:[-*]\s+.+\n?)+)/i);
    if (edgeMatch) {
      const items = edgeMatch[1].match(/[-*]\s+(.+)/g);
      if (items) {
        edgeCases.push(...items.map(item => item.replace(/^[-*]\s+/, '').trim()));
      }
    }

    if (testCases.length === 0 && edgeCases.length === 0) return undefined;

    return {
      testCases: testCases.length > 0 ? testCases : undefined,
      edgeCases: edgeCases.length > 0 ? edgeCases : undefined,
      automatedTests: text.toLowerCase().includes('automated test'),
    };
  }

  private identifyRisks(text: string): Task['riskFlags'] | undefined {
    const risks: Task['riskFlags'] = [];
    const lowerText = text.toLowerCase();

    // Check for risk keywords
    if (lowerText.includes('complex') || lowerText.includes('difficult')) {
      risks.push({
        level: 'medium',
        description: 'Complex implementation identified',
        createdAt: Date.now(),
      });
    }

    if (lowerText.includes('dependency') || lowerText.includes('depends on')) {
      risks.push({
        level: 'medium',
        description: 'Has external dependencies',
        createdAt: Date.now(),
      });
    }

    if (lowerText.includes('security') || lowerText.includes('authentication')) {
      risks.push({
        level: 'high',
        description: 'Security-sensitive implementation',
        mitigation: 'Requires security review',
        createdAt: Date.now(),
      });
    }

    if (lowerText.includes('performance') || lowerText.includes('optimization')) {
      risks.push({
        level: 'medium',
        description: 'Performance considerations required',
        createdAt: Date.now(),
      });
    }

    if (lowerText.includes('breaking change') || lowerText.includes('migration')) {
      risks.push({
        level: 'high',
        description: 'Breaking change - requires migration strategy',
        createdAt: Date.now(),
      });
    }

    return risks.length > 0 ? risks : undefined;
  }

  private estimateEffort(text: string): number | undefined {
    const lowerText = text.toLowerCase();

    // Look for explicit time estimates
    const hourMatch = text.match(/(\d+)\s*hours?/i);
    if (hourMatch) return parseInt(hourMatch[1]);

    const dayMatch = text.match(/(\d+)\s*days?/i);
    if (dayMatch) return parseInt(dayMatch[1]) * 8;

    // Estimate based on complexity indicators
    let effort = 2; // Default 2 hours

    if (lowerText.includes('simple') || lowerText.includes('quick')) effort = 1;
    if (lowerText.includes('complex') || lowerText.includes('large')) effort = 8;
    if (lowerText.includes('very complex') || lowerText.includes('major')) effort = 16;

    return effort;
  }

  private extractDependencies(content: string, allTasks: Task[]): TaskBreakdownResult['dependencies'] {
    const dependencies: TaskBreakdownResult['dependencies'] = [];

    // Look for dependency keywords in content
    const dependencyPattern = /depends on|blocked by|requires|after/gi;

    // For now, return empty - in production you'd parse references between tasks
    // This would require more sophisticated parsing or explicit task references

    return dependencies;
  }
}

/**
 * Quick helper to break down a simple text input
 */
export function quickBreakdown(text: string, startingTaskNumber: number = 0): TaskBreakdownResult {
  const service = new TaskBreakdownService(startingTaskNumber);
  return service.breakdownIssue({
    title: '',
    description: '',
    type: 'text',
    content: text,
  });
}
