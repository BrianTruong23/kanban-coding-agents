import { TaskBreakdownInput, TaskBreakdownResult, BreakdownStrategy } from '@/types/breakdown';
import { Task } from '@/types/task';
import { Epic, EpicStatus } from '@/types/epic';
import { TaskDependency, DependencyType } from '@/types/dependency';

/**
 * Main service for breaking down issues/PRDs/screenshots into structured tasks
 */
export class TaskBreakdownService {
  private strategy: BreakdownStrategy = {
    identify_epic: true,
    create_subtasks: true,
    generate_dod: true,
    assess_risks: true,
    find_dependencies: true,
    suggest_assignments: true,
  };

  /**
   * Break down input into epic, tasks, and dependencies
   */
  async breakdown(input: TaskBreakdownInput): Promise<TaskBreakdownResult> {
    const content = input.content.toLowerCase();

    // Extract epic information
    const epic = this.extractEpic(input);

    // Extract tasks from content
    const tasks = this.extractTasks(input);

    // Generate DoD for each task - disabled (definitionOfDone not in Task type)
    // if (this.strategy.generate_dod) {
    //   tasks.forEach(task => {
    //     task.definitionOfDone = this.generateDoD(task);
    //   });
    // }

    // Assess risk levels - disabled (riskLevel not in Task type)
    // if (this.strategy.assess_risks) {
    //   tasks.forEach(task => {
    //     task.riskLevel = this.assessRisk(task);
    //   });
    // }

    // Find dependencies between tasks
    const dependencies = this.strategy.find_dependencies
      ? this.findDependencies(tasks)
      : [];

    // Suggest agent assignments (placeholder indices)
    const suggestedAgentAssignments = this.strategy.suggest_assignments
      ? this.suggestAssignments(tasks)
      : {};

    return {
      epic,
      tasks,
      dependencies,
      suggestedAgentAssignments,
    };
  }

  /**
   * Extract epic from input
   */
  private extractEpic(input: TaskBreakdownInput): Omit<Epic, 'id' | 'epicId' | 'createdAt' | 'updatedAt'> {
    const lines = input.content.split('\n').filter(l => l.trim());

    // Try to find title from first line or heading
    let title = lines[0]?.replace(/^#+\s*/, '').trim() || 'Untitled Epic';

    // If title is very long, try to find a shorter heading
    if (title.length > 100) {
      const headingMatch = input.content.match(/^#+\s+(.+?)$/m);
      if (headingMatch) {
        title = headingMatch[1].trim();
      } else {
        title = title.substring(0, 100) + '...';
      }
    }

    // Extract description (everything that's not a task list)
    const description = this.extractDescription(input.content);

    // Determine priority based on keywords
    const priority = this.determinePriority(input.content);

    // Extract tags
    const tags = this.extractTags(input.content);

    // Extract sprint if mentioned
    const sprint = this.extractSprint(input.content);

    return {
      title,
      description,
      status: 'planning' as EpicStatus,
      priority,
      tags,
      sprint,
    };
  }

  /**
   * Extract individual tasks from input
   */
  private extractTasks(input: TaskBreakdownInput): Omit<Task, 'id' | 'taskId' | 'createdAt' | 'updatedAt'>[] {
    const tasks: Omit<Task, 'id' | 'taskId' | 'createdAt' | 'updatedAt'>[] = [];
    const content = input.content;

    // Pattern 1: Markdown list items (- [ ] Task or - Task)
    const listItemPattern = /^[\s]*[-*]\s*(?:\[[ x]\]\s*)?(.+?)$/gm;
    let match;

    while ((match = listItemPattern.exec(content)) !== null) {
      const taskText = match[1].trim();
      if (taskText.length > 5) { // Minimum length to be a valid task
        tasks.push(this.createTaskFromText(taskText));
      }
    }

    // Pattern 2: Numbered lists (1. Task, 2. Task)
    const numberedPattern = /^[\s]*\d+\.\s*(.+?)$/gm;
    while ((match = numberedPattern.exec(content)) !== null) {
      const taskText = match[1].trim();
      if (taskText.length > 5 && !tasks.some(t => t.title === taskText)) {
        tasks.push(this.createTaskFromText(taskText));
      }
    }

    // Pattern 3: "TODO:" or "Task:" prefixed items
    const todoPattern = /(?:TODO|Task|TASK):\s*(.+?)(?:\n|$)/gi;
    while ((match = todoPattern.exec(content)) !== null) {
      const taskText = match[1].trim();
      if (taskText.length > 5 && !tasks.some(t => t.title === taskText)) {
        tasks.push(this.createTaskFromText(taskText));
      }
    }

    // If no tasks found, create generic tasks from sections
    if (tasks.length === 0) {
      tasks.push(...this.createGenericTasks(content));
    }

    return tasks;
  }

  /**
   * Create a task object from text
   */
  private createTaskFromText(text: string): Omit<Task, 'id' | 'taskId' | 'createdAt' | 'updatedAt'> {
    // Clean up the text
    let title = text.replace(/\[.*?\]/g, '').trim();

    // Extract description if there's a colon or dash separator
    let description = '';
    const separatorMatch = title.match(/^(.+?)(?::|-{2,})(.+)$/);
    if (separatorMatch) {
      title = separatorMatch[1].trim();
      description = separatorMatch[2].trim();
    }

    // Determine priority
    const priority = this.determinePriority(text);

    // Extract tags from text
    const tags = this.extractTags(text);

    // Determine status (default to backlog)
    const status = 'backlog' as const;

    return {
      title,
      description,
      status,
      priority,
      tags,
      commentsCount: 0,
      attachmentsCount: 0,
    };
  }

  /**
   * Create generic tasks when no explicit tasks found
   */
  private createGenericTasks(content: string): Omit<Task, 'id' | 'taskId' | 'createdAt' | 'updatedAt'>[] {
    const tasks: Omit<Task, 'id' | 'taskId' | 'createdAt' | 'updatedAt'>[] = [];

    // Look for sections (headers)
    const headerPattern = /^#+\s+(.+?)$/gm;
    let match;

    while ((match = headerPattern.exec(content)) !== null) {
      const header = match[1].trim();
      if (header.length > 5 && header.length < 200) {
        tasks.push(this.createTaskFromText(header));
      }
    }

    // If still no tasks, create a single task from the content
    if (tasks.length === 0) {
      const lines = content.split('\n').filter(l => l.trim());
      const title = lines[0]?.substring(0, 100) || 'Implementation Task';
      const description = lines.slice(1, 5).join(' ').substring(0, 500);

      tasks.push({
        title,
        description,
        status: 'backlog',
        priority: 3,
        tags: [],
        commentsCount: 0,
        attachmentsCount: 0,
      });
    }

    return tasks;
  }

  /**
   * Generate Definition of Done for a task
   */
  private generateDoD(task: Omit<Task, 'id' | 'taskId' | 'createdAt' | 'updatedAt'>): string[] {
    const dod: string[] = [];
    const titleLower = task.title.toLowerCase();
    const descLower = (task.description || '').toLowerCase();
    const combined = titleLower + ' ' + descLower;

    // Code-related DoD
    if (combined.match(/implement|create|add|build|develop|code/)) {
      dod.push('Code implemented and follows project standards');
      dod.push('Code reviewed by at least one team member');
    }

    // Testing DoD
    if (combined.match(/test|testing/) || dod.length > 0) {
      dod.push('Unit tests written and passing');
    }

    // Documentation DoD
    if (combined.match(/document|docs|api|readme/)) {
      dod.push('Documentation updated');
    }

    // UI/Frontend DoD
    if (combined.match(/ui|frontend|component|page|design/)) {
      dod.push('UI matches design specifications');
      dod.push('Responsive on mobile and desktop');
      dod.push('Accessibility standards met');
    }

    // Backend/API DoD
    if (combined.match(/api|endpoint|backend|database|server/)) {
      dod.push('API endpoints tested');
      dod.push('Error handling implemented');
    }

    // Bug fix DoD
    if (combined.match(/bug|fix|issue|error/)) {
      dod.push('Bug fix verified');
      dod.push('Regression testing completed');
    }

    // Generic DoD items
    if (dod.length === 0) {
      dod.push('Task requirements met');
      dod.push('Changes tested');
    }

    dod.push('No breaking changes introduced');

    return dod;
  }

  /**
   * Assess risk level for a task
   */
  private assessRisk(task: Omit<Task, 'id' | 'taskId' | 'createdAt' | 'updatedAt'>): RiskLevel {
    const combined = (task.title + ' ' + (task.description || '')).toLowerCase();

    // Critical risk indicators
    if (combined.match(/database migration|breaking change|security|authentication|payment|production/)) {
      return 'critical';
    }

    // High risk indicators
    if (combined.match(/refactor|migration|api change|architecture|infrastructure|deployment/)) {
      return 'high';
    }

    // Medium risk indicators
    if (combined.match(/integration|third-party|complex|algorithm|performance/)) {
      return 'medium';
    }

    // Default to low risk
    return 'low';
  }

  /**
   * Find dependencies between tasks
   */
  private findDependencies(
    tasks: Omit<Task, 'id' | 'taskId' | 'createdAt' | 'updatedAt'>[]
  ): Omit<TaskDependency, 'id' | 'createdAt'>[] {
    const dependencies: Omit<TaskDependency, 'id' | 'createdAt'>[] = [];

    // Heuristic: Backend/API tasks should come before frontend tasks
    const backendTasks = tasks.filter(t =>
      (t.title + t.description).toLowerCase().match(/api|backend|server|endpoint|database/)
    );
    const frontendTasks = tasks.filter(t =>
      (t.title + t.description).toLowerCase().match(/ui|frontend|component|page|view/)
    );

    // Create dependencies: frontend depends on backend
    frontendTasks.forEach((frontendTask, fIdx) => {
      backendTasks.forEach((backendTask, bIdx) => {
        // Use indices as temporary IDs
        dependencies.push({
          taskId: `temp-${tasks.indexOf(frontendTask)}`,
          dependsOnTaskId: `temp-${tasks.indexOf(backendTask)}`,
          dependencyType: 'blocks' as DependencyType,
        });
      });
    });

    // Heuristic: Setup/configuration tasks come first
    const setupTasks = tasks.filter(t =>
      (t.title + t.description).toLowerCase().match(/setup|configure|initialize|install|prepare/)
    );
    const implementationTasks = tasks.filter(t =>
      !setupTasks.includes(t) &&
      (t.title + t.description).toLowerCase().match(/implement|create|build|develop/)
    );

    implementationTasks.forEach((implTask) => {
      setupTasks.forEach((setupTask) => {
        if (implTask !== setupTask) {
          dependencies.push({
            taskId: `temp-${tasks.indexOf(implTask)}`,
            dependsOnTaskId: `temp-${tasks.indexOf(setupTask)}`,
            dependencyType: 'blocks' as DependencyType,
          });
        }
      });
    });

    return dependencies;
  }

  /**
   * Suggest agent assignments based on task content
   */
  private suggestAssignments(
    tasks: Omit<Task, 'id' | 'taskId' | 'createdAt' | 'updatedAt'>[]
  ): Record<number, string> {
    const assignments: Record<number, string> = {};

    tasks.forEach((task, index) => {
      const combined = (task.title + ' ' + (task.description || '')).toLowerCase();

      // These are skill-based suggestions that will be resolved with actual agent IDs later
      if (combined.match(/react|ui|frontend|component|design/)) {
        assignments[index] = 'skill:React';
      } else if (combined.match(/api|backend|server|database|node/)) {
        assignments[index] = 'skill:Backend';
      } else if (combined.match(/devops|deploy|ci|cd|docker|kubernetes/)) {
        assignments[index] = 'skill:DevOps';
      } else if (combined.match(/mobile|ios|android|react native/)) {
        assignments[index] = 'skill:Mobile';
      } else if (combined.match(/test|testing|qa/)) {
        assignments[index] = 'skill:Testing';
      } else {
        assignments[index] = 'skill:Full Stack';
      }
    });

    return assignments;
  }

  /**
   * Extract description from content
   */
  private extractDescription(content: string): string {
    const lines = content.split('\n');
    const descriptionLines: string[] = [];

    let startCollecting = false;
    for (const line of lines) {
      const trimmed = line.trim();

      // Skip title line
      if (!startCollecting && trimmed.match(/^#+/)) {
        startCollecting = true;
        continue;
      }

      // Stop at task lists
      if (trimmed.match(/^[-*]\s*(?:\[[ x]\])?\s*.+/) || trimmed.match(/^\d+\.\s*.+/)) {
        break;
      }

      if (startCollecting && trimmed) {
        descriptionLines.push(trimmed);
      }
    }

    return descriptionLines.slice(0, 10).join(' ').substring(0, 500);
  }

  /**
   * Determine priority based on keywords
   */
  private determinePriority(text: string): 1 | 2 | 3 | 4 | 5 {
    const lower = text.toLowerCase();

    if (lower.match(/critical|urgent|blocker|asap|emergency/)) {
      return 5;
    }
    if (lower.match(/high|important|priority/)) {
      return 4;
    }
    if (lower.match(/low|minor|nice.*have/)) {
      return 2;
    }
    if (lower.match(/trivial|optional/)) {
      return 1;
    }

    return 3; // Default medium priority
  }

  /**
   * Extract tags from text
   */
  private extractTags(text: string): string[] {
    const tags: string[] = [];
    const lower = text.toLowerCase();

    // Technical tags
    if (lower.match(/frontend|ui|ux|design/)) tags.push('frontend');
    if (lower.match(/backend|server|api/)) tags.push('backend');
    if (lower.match(/database|sql|query/)) tags.push('database');
    if (lower.match(/bug|fix|error/)) tags.push('bug');
    if (lower.match(/feature|enhancement/)) tags.push('feature');
    if (lower.match(/test|testing|qa/)) tags.push('testing');
    if (lower.match(/docs|documentation/)) tags.push('documentation');
    if (lower.match(/security|auth|authentication/)) tags.push('security');
    if (lower.match(/performance|optimization|speed/)) tags.push('performance');
    if (lower.match(/mobile|ios|android/)) tags.push('mobile');

    // Extract hashtags
    const hashtagMatches = text.match(/#(\w+)/g);
    if (hashtagMatches) {
      tags.push(...hashtagMatches.map(t => t.substring(1).toLowerCase()));
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Extract sprint information
   */
  private extractSprint(text: string): string | undefined {
    const sprintMatch = text.match(/sprint[\s:]*(\d+|[A-Z]\w*\s*\d+)/i);
    if (sprintMatch) {
      return sprintMatch[0].trim();
    }

    return undefined;
  }
}

// Export singleton instance
export const taskBreakdownService = new TaskBreakdownService();
