import { TaskBreakdownInput, TaskBreakdownResult, BreakdownAnalysis } from '@/types/task-breakdown';
import { Task } from '@/types/task';
import { Epic, Subtask, DefinitionOfDone, TestNote, RiskFlag } from '@/types/epic';
import { TaskRequirement } from '@/types/agent-skills';

/**
 * AI-powered task breakdown service
 * This service analyzes issues, PRDs, or screenshots and breaks them down into
 * actionable tasks with DoD, test notes, and risk flags.
 *
 * Note: This is a placeholder implementation. In production, you would integrate
 * with an LLM service like OpenAI, Anthropic Claude, or a local LLM.
 */
export class TaskBreakdownService {
  /**
   * Analyzes the input to determine complexity and recommended breakdown
   */
  async analyzeComplexity(input: TaskBreakdownInput): Promise<BreakdownAnalysis> {
    // In production, this would call an LLM to analyze the content
    // For now, we'll use a simple heuristic-based approach

    const contentLength = input.content.length;
    const hasImage = Boolean(input.imageUrl);

    let complexity: BreakdownAnalysis['complexity'] = 'simple';
    let taskCount = 1;
    let subtaskCount = 0;

    if (contentLength > 1000 || hasImage) {
      complexity = 'moderate';
      taskCount = 3;
      subtaskCount = 2;
    }

    if (contentLength > 2000) {
      complexity = 'complex';
      taskCount = 5;
      subtaskCount = 3;
    }

    if (contentLength > 5000) {
      complexity = 'very-complex';
      taskCount = 8;
      subtaskCount = 4;
    }

    // Extract technical stack from content (simple keyword matching)
    const techStack = this.extractTechnicalStack(input.content);
    const skills = this.extractRequiredSkills(input.content);

    return {
      complexity,
      estimatedEffort: taskCount * 5, // Rough estimate: 5 hours per task
      recommendedSplit: {
        epicCount: complexity === 'very-complex' ? 1 : 0,
        taskCount,
        subtaskCount,
      },
      technicalStack: techStack,
      requiredSkills: skills,
    };
  }

  /**
   * Breaks down the input into structured tasks, epics, and related metadata
   */
  async breakdownTask(
    input: TaskBreakdownInput,
    userId: string
  ): Promise<TaskBreakdownResult> {
    const analysis = await this.analyzeComplexity(input);

    // Generate epic if complexity warrants it
    let epic: Epic | undefined;
    if (analysis.recommendedSplit.epicCount > 0) {
      epic = this.generateEpic(input, analysis);
    }

    // Generate tasks
    const tasks = this.generateTasks(input, analysis, epic?.id);

    // Generate subtasks for each task
    const subtasks: Subtask[] = [];
    tasks.forEach(task => {
      const taskSubtasks = this.generateSubtasks(task, analysis);
      subtasks.push(...taskSubtasks);
    });

    // Generate DoD criteria
    const definitionsOfDone: DefinitionOfDone[] = [];
    tasks.forEach(task => {
      const dod = this.generateDoD(task);
      definitionsOfDone.push(...dod);
    });

    // Generate test notes
    const testNotes: TestNote[] = [];
    tasks.forEach(task => {
      const notes = this.generateTestNotes(task);
      testNotes.push(...notes);
    });

    // Generate risk flags
    const riskFlags: RiskFlag[] = [];
    tasks.forEach(task => {
      const risks = this.generateRiskFlags(task, analysis);
      riskFlags.push(...risks);
    });

    // Generate task requirements
    const requirements: TaskRequirement[] = [];
    tasks.forEach(task => {
      const reqs = this.generateTaskRequirements(task, analysis);
      requirements.push(...reqs);
    });

    return {
      epic,
      tasks,
      subtasks,
      definitionsOfDone,
      testNotes,
      riskFlags,
      requirements,
      suggestedAssignments: [], // Will be populated by auto-assignment service
    };
  }

  private generateEpic(input: TaskBreakdownInput, analysis: BreakdownAnalysis): Epic {
    const now = Date.now();
    return {
      id: this.generateId(),
      epicId: `EPIC-${Math.floor(Math.random() * 1000)}`,
      title: this.extractTitle(input.content),
      description: input.content.substring(0, 500),
      status: 'planning',
      priority: this.determinePriority(analysis),
      createdAt: now,
      updatedAt: now,
    };
  }

  private generateTasks(
    input: TaskBreakdownInput,
    analysis: BreakdownAnalysis,
    epicId?: string
  ): Task[] {
    const tasks: Task[] = [];
    const taskCount = analysis.recommendedSplit.taskCount;

    for (let i = 0; i < taskCount; i++) {
      const now = Date.now();
      tasks.push({
        id: this.generateId(),
        taskId: `TASK-${Math.floor(Math.random() * 10000)}`,
        title: this.generateTaskTitle(input, i, taskCount),
        description: this.generateTaskDescription(input, i, taskCount),
        status: 'backlog',
        priority: this.determinePriority(analysis),
        tags: this.generateTags(input, analysis),
        createdAt: now,
        updatedAt: now,
      });
    }

    return tasks;
  }

  private generateSubtasks(task: Task, analysis: BreakdownAnalysis): Subtask[] {
    const subtasks: Subtask[] = [];
    const count = Math.min(analysis.recommendedSplit.subtaskCount, 5);

    for (let i = 0; i < count; i++) {
      const now = Date.now();
      subtasks.push({
        id: this.generateId(),
        taskId: task.id,
        title: `Subtask ${i + 1} for ${task.title}`,
        description: `Implementation step ${i + 1}`,
        status: 'pending',
        order: i,
        createdAt: now,
        updatedAt: now,
      });
    }

    return subtasks;
  }

  private generateDoD(task: Task): DefinitionOfDone[] {
    const dod: DefinitionOfDone[] = [];
    const criteria = [
      'Code is written and follows project standards',
      'Unit tests are written and passing',
      'Code review is completed',
      'Documentation is updated',
      'No critical bugs or security issues',
    ];

    criteria.forEach((criterion, index) => {
      const now = Date.now();
      dod.push({
        id: this.generateId(),
        taskId: task.id,
        criteria: criterion,
        isCompleted: false,
        order: index,
        createdAt: now,
        updatedAt: now,
      });
    });

    return dod;
  }

  private generateTestNotes(task: Task): TestNote[] {
    const notes: TestNote[] = [];
    const testTypes: TestNote['type'][] = ['unit', 'integration'];

    testTypes.forEach((type) => {
      const now = Date.now();
      notes.push({
        id: this.generateId(),
        taskId: task.id,
        type,
        description: `${type} tests for ${task.title}`,
        isPassed: false,
        createdAt: now,
        updatedAt: now,
      });
    });

    return notes;
  }

  private generateRiskFlags(task: Task, analysis: BreakdownAnalysis): RiskFlag[] {
    const risks: RiskFlag[] = [];

    // Add complexity-based risks
    if (analysis.complexity === 'complex' || analysis.complexity === 'very-complex') {
      const now = Date.now();
      risks.push({
        id: this.generateId(),
        taskId: task.id,
        severity: analysis.complexity === 'very-complex' ? 'high' : 'medium',
        category: 'technical',
        description: 'High complexity may require additional time and expertise',
        mitigation: 'Break down into smaller tasks, involve senior developers',
        status: 'identified',
        createdAt: now,
        updatedAt: now,
      });
    }

    return risks;
  }

  private generateTaskRequirements(
    task: Task,
    analysis: BreakdownAnalysis
  ): TaskRequirement[] {
    const requirements: TaskRequirement[] = [];

    analysis.requiredSkills.forEach((skill) => {
      skill.skills.forEach((skillName) => {
        const now = Date.now();
        requirements.push({
          id: this.generateId(),
          taskId: task.id,
          skillCategory: skill.category as TaskRequirement['skillCategory'],
          skillName,
          requiredProficiency: skill.proficiency as 1 | 2 | 3 | 4 | 5,
          importance: 'required',
          createdAt: now,
        });
      });
    });

    return requirements;
  }

  private extractTechnicalStack(content: string): string[] {
    const stack: string[] = [];
    const keywords = {
      'react': 'React',
      'next': 'Next.js',
      'typescript': 'TypeScript',
      'javascript': 'JavaScript',
      'node': 'Node.js',
      'python': 'Python',
      'database': 'Database',
      'sql': 'SQL',
      'api': 'API',
      'rest': 'REST API',
      'graphql': 'GraphQL',
      'docker': 'Docker',
      'kubernetes': 'Kubernetes',
      'aws': 'AWS',
      'azure': 'Azure',
      'gcp': 'Google Cloud',
    };

    const lowerContent = content.toLowerCase();
    Object.entries(keywords).forEach(([key, value]) => {
      if (lowerContent.includes(key)) {
        stack.push(value);
      }
    });

    return [...new Set(stack)];
  }

  private extractRequiredSkills(content: string): BreakdownAnalysis['requiredSkills'] {
    const skills: BreakdownAnalysis['requiredSkills'] = [];

    // Frontend skills
    if (content.toLowerCase().includes('frontend') ||
        content.toLowerCase().includes('ui') ||
        content.toLowerCase().includes('react')) {
      skills.push({
        category: 'frontend',
        skills: ['React', 'TypeScript', 'CSS'],
        proficiency: 3,
      });
    }

    // Backend skills
    if (content.toLowerCase().includes('backend') ||
        content.toLowerCase().includes('api') ||
        content.toLowerCase().includes('server')) {
      skills.push({
        category: 'backend',
        skills: ['Node.js', 'API Design'],
        proficiency: 3,
      });
    }

    // Database skills
    if (content.toLowerCase().includes('database') ||
        content.toLowerCase().includes('sql')) {
      skills.push({
        category: 'database',
        skills: ['SQL', 'Database Design'],
        proficiency: 3,
      });
    }

    return skills;
  }

  private extractTitle(content: string): string {
    // Try to extract first line or first sentence as title
    const firstLine = content.split('\n')[0];
    if (firstLine.length > 0 && firstLine.length < 100) {
      return firstLine.replace(/^#+\s*/, ''); // Remove markdown headers
    }
    return content.substring(0, 50) + '...';
  }

  private generateTaskTitle(input: TaskBreakdownInput, index: number, total: number): string {
    const baseTitle = this.extractTitle(input.content);
    if (total === 1) return baseTitle;

    const phases = ['Setup', 'Implementation', 'Testing', 'Integration', 'Documentation', 'Deployment', 'Review', 'Optimization'];
    return `${phases[index % phases.length]}: ${baseTitle}`;
  }

  private generateTaskDescription(input: TaskBreakdownInput, index: number, total: number): string {
    const base = input.content.substring(0, 200);
    return `${base}\n\nThis is task ${index + 1} of ${total} in the breakdown.`;
  }

  private determinePriority(analysis: BreakdownAnalysis): 1 | 2 | 3 | 4 | 5 {
    switch (analysis.complexity) {
      case 'simple': return 2;
      case 'moderate': return 3;
      case 'complex': return 4;
      case 'very-complex': return 5;
      default: return 3;
    }
  }

  private generateTags(input: TaskBreakdownInput, analysis: BreakdownAnalysis): string[] {
    const tags: string[] = [];

    tags.push(input.type);

    analysis.technicalStack.forEach(tech => {
      tags.push(tech.toLowerCase());
    });

    if (analysis.complexity === 'complex' || analysis.complexity === 'very-complex') {
      tags.push('high-priority');
    }

    return [...new Set(tags)];
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

export const taskBreakdownService = new TaskBreakdownService();
