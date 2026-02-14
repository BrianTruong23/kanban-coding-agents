import {
  BreakdownInput,
  BreakdownResult,
  Epic,
  Story,
  TaskBreakdown,
  TaskDependency,
  RiskLevel,
  TaskType,
} from '@/types/breakdown';
import { generateId } from './utils';

/**
 * AI-Powered Task Breakdown Service
 *
 * This service analyzes issues, PRDs, or screenshots and breaks them down into
 * structured epics, stories, tasks, and subtasks with DoD, test notes, and risk flags.
 */

export class TaskBreakdownService {
  /**
   * Analyzes input and generates a structured breakdown
   */
  async analyzeAndBreakdown(input: BreakdownInput): Promise<BreakdownResult> {
    // In a production system, this would call an AI service (OpenAI, Claude, etc.)
    // For now, we'll implement a rule-based breakdown with intelligent parsing

    const breakdown = this.parseInput(input);
    const dependencies = this.identifyDependencies(breakdown.tasks);
    const summary = this.generateSummary(breakdown, dependencies);

    return {
      ...breakdown,
      dependencies,
      summary,
      generatedAt: Date.now(),
    };
  }

  /**
   * Parse input content and create structured breakdown
   */
  private parseInput(input: BreakdownInput): Omit<BreakdownResult, 'dependencies' | 'summary' | 'generatedAt'> {
    const content = input.content.toLowerCase();

    // Detect if this is a large feature (epic) or smaller work item
    const isEpic = this.detectEpic(content);
    const complexity = this.assessComplexity(content);

    if (isEpic) {
      return this.createEpicBreakdown(input);
    } else {
      return this.createStoryBreakdown(input, complexity);
    }
  }

  /**
   * Detect if input describes an epic-level feature
   */
  private detectEpic(content: string): boolean {
    const epicIndicators = [
      'implement', 'build', 'create system', 'develop platform',
      'authentication system', 'user management', 'payment system',
      'dashboard', 'admin panel', 'api', 'integration'
    ];

    return epicIndicators.some(indicator => content.includes(indicator));
  }

  /**
   * Assess complexity of the work
   */
  private assessComplexity(content: string): 'simple' | 'moderate' | 'complex' {
    const complexIndicators = ['integration', 'authentication', 'security', 'database', 'api', 'realtime'];
    const matchCount = complexIndicators.filter(indicator => content.includes(indicator)).length;

    if (matchCount >= 3) return 'complex';
    if (matchCount >= 1) return 'moderate';
    return 'simple';
  }

  /**
   * Create epic-level breakdown
   */
  private createEpicBreakdown(input: BreakdownInput): Omit<BreakdownResult, 'dependencies' | 'summary' | 'generatedAt'> {
    const epicId = generateId();
    const taskIdCounter = { current: 1 };

    const epic: Epic = {
      id: epicId,
      title: this.extractTitle(input.content),
      description: input.content,
      acceptanceCriteria: this.generateAcceptanceCriteria(input.content),
      stories: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Generate stories based on common development phases
    const storyTemplates = this.identifyStoryTemplates(input.content);
    const stories: Story[] = [];
    const allTasks: TaskBreakdown[] = [];

    storyTemplates.forEach(template => {
      const storyId = generateId();
      const tasks = this.generateTasksForStory(template, storyId, taskIdCounter, input.content);

      const story: Story = {
        id: storyId,
        epicId,
        title: template.title,
        description: template.description,
        acceptanceCriteria: template.acceptanceCriteria,
        tasks,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      stories.push(story);
      allTasks.push(...tasks);
    });

    epic.stories = stories;

    return {
      epics: [epic],
      stories,
      tasks: allTasks,
    };
  }

  /**
   * Create story-level breakdown
   */
  private createStoryBreakdown(input: BreakdownInput, complexity: 'simple' | 'moderate' | 'complex'): Omit<BreakdownResult, 'dependencies' | 'summary' | 'generatedAt'> {
    const storyId = generateId();
    const taskIdCounter = { current: 1 };

    const story: Story = {
      id: storyId,
      title: this.extractTitle(input.content),
      description: input.content,
      acceptanceCriteria: this.generateAcceptanceCriteria(input.content),
      tasks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const taskCount = complexity === 'complex' ? 5 : complexity === 'moderate' ? 3 : 1;
    const tasks = this.generateGenericTasks(storyId, taskIdCounter, input.content, taskCount);
    story.tasks = tasks;

    return {
      epics: [],
      stories: [story],
      tasks,
    };
  }

  /**
   * Extract title from content
   */
  private extractTitle(content: string): string {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      // Remove common prefixes
      return firstLine
        .replace(/^(issue|feature|bug|task):\s*/i, '')
        .replace(/^#+\s*/, '')
        .substring(0, 100);
    }
    return 'Untitled';
  }

  /**
   * Generate acceptance criteria
   */
  private generateAcceptanceCriteria(content: string): string[] {
    const criteria: string[] = [];

    // Look for explicit acceptance criteria
    const acMatch = content.match(/acceptance criteria:?\s*\n((?:[-*]\s*.+\n?)+)/i);
    if (acMatch) {
      const items = acMatch[1].split('\n').filter(line => line.trim());
      criteria.push(...items.map(item => item.replace(/^[-*]\s*/, '').trim()));
    }

    // Generate default criteria if none found
    if (criteria.length === 0) {
      criteria.push('Feature is implemented according to specifications');
      criteria.push('All tests pass');
      criteria.push('Code is reviewed and approved');
      criteria.push('Documentation is updated');
    }

    return criteria;
  }

  /**
   * Identify story templates based on content
   */
  private identifyStoryTemplates(content: string): Array<{
    title: string;
    description: string;
    acceptanceCriteria: string[];
    phase: string;
  }> {
    const templates = [];

    // Check for different aspects
    if (this.needsBackend(content)) {
      templates.push({
        title: 'Backend API Development',
        description: 'Implement backend services and API endpoints',
        acceptanceCriteria: [
          'API endpoints are created and documented',
          'Database schema is designed and implemented',
          'API tests are written and passing',
        ],
        phase: 'backend',
      });
    }

    if (this.needsFrontend(content)) {
      templates.push({
        title: 'Frontend UI Development',
        description: 'Build user interface components',
        acceptanceCriteria: [
          'UI components are implemented',
          'Responsive design is verified',
          'UI matches design specifications',
        ],
        phase: 'frontend',
      });
    }

    if (this.needsDatabase(content)) {
      templates.push({
        title: 'Database Setup',
        description: 'Design and implement database schema',
        acceptanceCriteria: [
          'Schema is designed',
          'Migrations are created',
          'Indexes are optimized',
        ],
        phase: 'database',
      });
    }

    if (this.needsTesting(content)) {
      templates.push({
        title: 'Testing & Quality Assurance',
        description: 'Implement comprehensive testing',
        acceptanceCriteria: [
          'Unit tests are written',
          'Integration tests are passing',
          'Edge cases are covered',
        ],
        phase: 'testing',
      });
    }

    // Always add integration as final step for complex features
    if (templates.length > 1) {
      templates.push({
        title: 'Integration & Deployment',
        description: 'Integrate all components and deploy',
        acceptanceCriteria: [
          'All components are integrated',
          'End-to-end tests pass',
          'Documentation is complete',
        ],
        phase: 'integration',
      });
    }

    return templates;
  }

  private needsBackend(content: string): boolean {
    return /api|endpoint|server|backend|service|authentication|authorization/.test(content.toLowerCase());
  }

  private needsFrontend(content: string): boolean {
    return /ui|frontend|component|page|interface|dashboard|form|button/.test(content.toLowerCase());
  }

  private needsDatabase(content: string): boolean {
    return /database|db|schema|table|migration|sql|query/.test(content.toLowerCase());
  }

  private needsTesting(content: string): boolean {
    return /test|qa|quality/.test(content.toLowerCase()) || this.needsBackend(content) || this.needsFrontend(content);
  }

  /**
   * Generate tasks for a story
   */
  private generateTasksForStory(
    template: { title: string; description: string; phase: string },
    storyId: string,
    taskIdCounter: { current: number },
    originalContent: string
  ): TaskBreakdown[] {
    const tasks: TaskBreakdown[] = [];
    const phase = template.phase;

    switch (phase) {
      case 'backend':
        tasks.push(
          this.createTask('Design API endpoints and data models', storyId, taskIdCounter, 4, 'high', ['backend', 'api'], 8),
          this.createTask('Implement API endpoints', storyId, taskIdCounter, 3, 'medium', ['backend', 'api'], 16),
          this.createTask('Write API tests', storyId, taskIdCounter, 3, 'low', ['backend', 'testing'], 6)
        );
        break;
      case 'frontend':
        tasks.push(
          this.createTask('Create UI components', storyId, taskIdCounter, 3, 'medium', ['frontend', 'react'], 12),
          this.createTask('Implement state management', storyId, taskIdCounter, 4, 'medium', ['frontend', 'state'], 8),
          this.createTask('Add responsive styling', storyId, taskIdCounter, 2, 'low', ['frontend', 'css'], 6)
        );
        break;
      case 'database':
        tasks.push(
          this.createTask('Design database schema', storyId, taskIdCounter, 5, 'high', ['database', 'design'], 8),
          this.createTask('Create migrations', storyId, taskIdCounter, 3, 'medium', ['database', 'migration'], 4),
          this.createTask('Optimize queries and indexes', storyId, taskIdCounter, 4, 'medium', ['database', 'optimization'], 6)
        );
        break;
      case 'testing':
        tasks.push(
          this.createTask('Write unit tests', storyId, taskIdCounter, 3, 'low', ['testing', 'unit'], 8),
          this.createTask('Write integration tests', storyId, taskIdCounter, 4, 'medium', ['testing', 'integration'], 12),
          this.createTask('Perform manual QA', storyId, taskIdCounter, 2, 'low', ['testing', 'qa'], 4)
        );
        break;
      case 'integration':
        tasks.push(
          this.createTask('Integrate frontend and backend', storyId, taskIdCounter, 4, 'high', ['integration'], 8),
          this.createTask('End-to-end testing', storyId, taskIdCounter, 4, 'medium', ['testing', 'e2e'], 6),
          this.createTask('Deploy to staging', storyId, taskIdCounter, 3, 'medium', ['devops', 'deployment'], 4)
        );
        break;
    }

    return tasks;
  }

  /**
   * Generate generic tasks
   */
  private generateGenericTasks(
    storyId: string,
    taskIdCounter: { current: number },
    content: string,
    count: number
  ): TaskBreakdown[] {
    const tasks: TaskBreakdown[] = [];

    tasks.push(
      this.createTask('Analyze requirements and plan approach', storyId, taskIdCounter, 3, 'medium', ['planning'], 4)
    );

    if (count >= 2) {
      tasks.push(
        this.createTask('Implement core functionality', storyId, taskIdCounter, 4, 'high', ['implementation'], 12)
      );
    }

    if (count >= 3) {
      tasks.push(
        this.createTask('Write tests and documentation', storyId, taskIdCounter, 3, 'low', ['testing', 'documentation'], 6)
      );
    }

    if (count >= 4) {
      tasks.push(
        this.createTask('Code review and refinement', storyId, taskIdCounter, 2, 'low', ['review'], 4)
      );
    }

    if (count >= 5) {
      tasks.push(
        this.createTask('Deploy and monitor', storyId, taskIdCounter, 3, 'medium', ['deployment'], 4)
      );
    }

    return tasks;
  }

  /**
   * Create a task with all metadata
   */
  private createTask(
    title: string,
    storyId: string,
    taskIdCounter: { current: number },
    priority: 1 | 2 | 3 | 4 | 5,
    riskLevel: RiskLevel,
    tags: string[],
    estimatedHours: number = 8
  ): TaskBreakdown {
    const taskId = `TASK-${taskIdCounter.current++}`;
    const requiredSkills = this.inferSkillsFromTags(tags);

    return {
      id: generateId(),
      storyId,
      taskId,
      title,
      description: `Complete: ${title}`,
      type: 'task',
      priority,
      estimatedHours,
      definitionOfDone: {
        criteria: [
          'Implementation is complete',
          'Code follows project standards',
          'Tests are passing',
          'Changes are documented',
        ],
        testNotes: [
          'Verify functionality works as expected',
          'Test edge cases',
        ],
      },
      testNotes: [
        'Test happy path',
        'Test error handling',
        'Verify with different inputs',
      ],
      riskLevel,
      riskDescription: riskLevel === 'high' || riskLevel === 'critical'
        ? 'Complex implementation may require additional time or resources'
        : undefined,
      dependencies: [],
      requiredSkills,
      tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * Infer required skills from tags
   */
  private inferSkillsFromTags(tags: string[]): string[] {
    const skillMap: Record<string, string[]> = {
      frontend: ['React', 'TypeScript', 'CSS'],
      backend: ['Node.js', 'API Design', 'TypeScript'],
      database: ['SQL', 'Database Design', 'PostgreSQL'],
      testing: ['Jest', 'Testing', 'QA'],
      devops: ['Docker', 'CI/CD', 'Deployment'],
      api: ['REST API', 'API Design'],
      react: ['React', 'TypeScript'],
      state: ['State Management', 'React'],
    };

    const skills = new Set<string>();
    tags.forEach(tag => {
      const tagSkills = skillMap[tag.toLowerCase()] || [];
      tagSkills.forEach(skill => skills.add(skill));
    });

    return Array.from(skills);
  }

  /**
   * Identify dependencies between tasks
   */
  private identifyDependencies(tasks: TaskBreakdown[]): TaskDependency[] {
    const dependencies: TaskDependency[] = [];

    // Rule-based dependency detection
    tasks.forEach((task, index) => {
      // Database setup should come before API implementation
      if (task.tags.includes('api') || task.tags.includes('backend')) {
        const dbTask = tasks.find(t => t.tags.includes('database'));
        if (dbTask && dbTask.taskId !== task.taskId) {
          dependencies.push({
            id: generateId(),
            taskId: task.taskId,
            dependsOn: dbTask.taskId,
            type: 'blocks',
            createdAt: Date.now(),
          });
        }
      }

      // Frontend depends on API
      if (task.tags.includes('frontend') && !task.tags.includes('design')) {
        const apiTask = tasks.find(t => t.tags.includes('api') || t.tags.includes('backend'));
        if (apiTask && apiTask.taskId !== task.taskId) {
          dependencies.push({
            id: generateId(),
            taskId: task.taskId,
            dependsOn: apiTask.taskId,
            type: 'blocks',
            createdAt: Date.now(),
          });
        }
      }

      // Testing depends on implementation
      if (task.tags.includes('testing') && !task.title.toLowerCase().includes('plan')) {
        const implTask = tasks.find(t =>
          (t.tags.includes('implementation') || t.title.toLowerCase().includes('implement'))
          && t.taskId !== task.taskId
        );
        if (implTask) {
          dependencies.push({
            id: generateId(),
            taskId: task.taskId,
            dependsOn: implTask.taskId,
            type: 'blocks',
            createdAt: Date.now(),
          });
        }
      }

      // Integration depends on both frontend and backend
      if (task.tags.includes('integration')) {
        const frontendTask = tasks.find(t => t.tags.includes('frontend') && t.taskId !== task.taskId);
        const backendTask = tasks.find(t => t.tags.includes('backend') && t.taskId !== task.taskId);

        if (frontendTask) {
          dependencies.push({
            id: generateId(),
            taskId: task.taskId,
            dependsOn: frontendTask.taskId,
            type: 'blocks',
            createdAt: Date.now(),
          });
        }

        if (backendTask) {
          dependencies.push({
            id: generateId(),
            taskId: task.taskId,
            dependsOn: backendTask.taskId,
            type: 'blocks',
            createdAt: Date.now(),
          });
        }
      }
    });

    return dependencies;
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(
    breakdown: Omit<BreakdownResult, 'dependencies' | 'summary' | 'generatedAt'>,
    dependencies: TaskDependency[]
  ) {
    const { epics, stories, tasks } = breakdown;

    const totalSubtasks = tasks.reduce((sum, task) => sum + (task.subtasks?.length || 0), 0);
    const estimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
    const highRiskTasks = tasks.filter(task =>
      task.riskLevel === 'high' || task.riskLevel === 'critical'
    ).length;

    return {
      totalEpics: epics.length,
      totalStories: stories.length,
      totalTasks: tasks.length,
      totalSubtasks,
      estimatedHours,
      highRiskTasks,
    };
  }
}

// Export singleton instance
export const taskBreakdownService = new TaskBreakdownService();
