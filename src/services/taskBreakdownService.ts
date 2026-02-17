import {
  InputSource,
  TaskBreakdownResult,
  BreakdownConfig,
  Epic,
  Ticket,
  Subtask,
  TaskDependency,
  DefinitionOfDone,
  TestNote,
  RiskFlag,
} from '@/types/taskBreakdown';
import { generateId } from '@/lib/utils';

/**
 * Service for automated task breakdown from various input sources
 * Uses AI/LLM to analyze inputs and create structured epics, tickets, and subtasks
 */
export class TaskBreakdownService {
  private config: BreakdownConfig;

  constructor(config?: BreakdownConfig) {
    this.config = {
      maxEpics: config?.maxEpics ?? 5,
      maxTicketsPerEpic: config?.maxTicketsPerEpic ?? 10,
      maxSubtasksPerTicket: config?.maxSubtasksPerTicket ?? 8,
      includeTestNotes: config?.includeTestNotes ?? true,
      includeRiskFlags: config?.includeRiskFlags ?? true,
      includeDependencies: config?.includeDependencies ?? true,
      estimationUnit: config?.estimationUnit ?? 'story_points',
      defaultPriority: config?.defaultPriority ?? 3,
    };
  }

  /**
   * Breaks down an input source into structured tasks
   */
  async breakdownTasks(input: InputSource): Promise<TaskBreakdownResult> {
    // In a real implementation, this would call an LLM API
    // For now, we'll implement a rule-based breakdown with intelligent parsing

    const result = await this.analyzeAndBreakdown(input);
    return result;
  }

  /**
   * Analyzes the input and creates the task hierarchy
   */
  private async analyzeAndBreakdown(input: InputSource): Promise<TaskBreakdownResult> {
    const epics: Epic[] = [];
    const tickets: Ticket[] = [];
    const subtasks: Subtask[] = [];
    const dependencies: TaskDependency[] = [];

    // Parse the input content
    const analysis = this.parseInput(input);

    // Create epics based on major themes/features
    analysis.themes.forEach((theme, index) => {
      const epic = this.createEpic(theme, index + 1);
      epics.push(epic);

      // Create tickets for each epic
      const epicTickets = this.createTicketsForEpic(epic, theme, analysis);
      tickets.push(...epicTickets);

      // Create subtasks for each ticket
      epicTickets.forEach((ticket) => {
        const ticketSubtasks = this.createSubtasksForTicket(ticket);
        subtasks.push(...ticketSubtasks);
      });
    });

    // Analyze and create dependencies
    if (this.config.includeDependencies) {
      const detectedDeps = this.detectDependencies(tickets, subtasks);
      dependencies.push(...detectedDeps);
    }

    return {
      epics,
      tickets,
      subtasks,
      dependencies,
      summary: this.generateSummary(epics, tickets, subtasks),
      confidence: this.calculateConfidence(analysis),
      generatedAt: Date.now(),
    };
  }

  /**
   * Parses input content to extract themes, requirements, and structure
   */
  private parseInput(input: InputSource): {
    themes: string[];
    requirements: string[];
    technicalNotes: string[];
    risks: string[];
  } {
    const content = input.content.toLowerCase();
    const lines = input.content.split('\n').filter(line => line.trim());

    // Extract themes (major features/components)
    const themes: string[] = [];
    const requirements: string[] = [];
    const technicalNotes: string[] = [];
    const risks: string[] = [];

    // Simple keyword-based extraction
    const themeKeywords = ['feature', 'component', 'module', 'system', 'interface', 'epic'];
    const riskKeywords = ['risk', 'challenge', 'concern', 'issue', 'problem', 'difficult'];
    const techKeywords = ['implement', 'use', 'technology', 'framework', 'library', 'api'];

    lines.forEach((line) => {
      const lowerLine = line.toLowerCase();

      if (themeKeywords.some(kw => lowerLine.includes(kw)) || line.match(/^#{1,3}\s/)) {
        themes.push(line.replace(/^#{1,3}\s/, '').trim());
      } else if (riskKeywords.some(kw => lowerLine.includes(kw))) {
        risks.push(line);
      } else if (techKeywords.some(kw => lowerLine.includes(kw))) {
        technicalNotes.push(line);
      } else if (line.match(/^[-*]\s/) || line.match(/^\d+\./)) {
        requirements.push(line.replace(/^[-*\d.]\s*/, '').trim());
      }
    });

    // If no themes found, create a default theme
    if (themes.length === 0) {
      themes.push(input.type === 'issue' ? 'Issue Implementation' : 'Feature Development');
    }

    return {
      themes: themes.slice(0, this.config.maxEpics!),
      requirements,
      technicalNotes,
      risks,
    };
  }

  /**
   * Creates an epic from a theme
   */
  private createEpic(theme: string, index: number): Epic {
    const epic: Epic = {
      id: generateId(),
      epicId: `EPIC-${index}`,
      title: theme,
      description: `Epic for ${theme}`,
      goals: [
        `Complete all tickets related to ${theme}`,
        'Meet acceptance criteria',
        'Pass all tests',
      ],
      status: 'planning',
      priority: this.config.defaultPriority!,
      estimatedEffort: 0,
      tags: this.extractTags(theme),
      definitionsOfDone: this.generateDoD('epic'),
      riskFlags: this.config.includeRiskFlags ? this.generateRiskFlags(theme) : [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return epic;
  }

  /**
   * Creates tickets for an epic
   */
  private createTicketsForEpic(
    epic: Epic,
    theme: string,
    analysis: ReturnType<typeof this.parseInput>
  ): Ticket[] {
    const tickets: Ticket[] = [];
    const ticketTypes: Array<'feature' | 'task' | 'bug' | 'improvement'> = [
      'feature',
      'task',
      'improvement',
    ];

    // Create tickets based on requirements or generic breakdown
    const relevantRequirements = analysis.requirements.slice(0, this.config.maxTicketsPerEpic!);

    if (relevantRequirements.length === 0) {
      // Create generic tickets for common phases
      const phases = ['Design', 'Implementation', 'Testing', 'Documentation'];
      phases.forEach((phase, index) => {
        tickets.push(this.createTicket(epic, `${phase} for ${theme}`, index + 1, 'task'));
      });
    } else {
      relevantRequirements.forEach((req, index) => {
        const type = ticketTypes[index % ticketTypes.length];
        tickets.push(this.createTicket(epic, req, index + 1, type));
      });
    }

    return tickets;
  }

  /**
   * Creates a single ticket
   */
  private createTicket(
    epic: Epic,
    requirement: string,
    index: number,
    type: 'feature' | 'bug' | 'improvement' | 'task' | 'research'
  ): Ticket {
    const ticket: Ticket = {
      id: generateId(),
      ticketId: `${epic.epicId}-T${index}`,
      epicId: epic.id,
      title: requirement,
      description: `Implement: ${requirement}`,
      type,
      status: 'backlog',
      priority: this.config.defaultPriority!,
      estimatedEffort: this.estimateEffort('ticket'),
      tags: this.extractTags(requirement),
      definitionsOfDone: this.generateDoD('ticket'),
      testNotes: this.config.includeTestNotes ? this.generateTestNotes() : [],
      riskFlags: this.config.includeRiskFlags ? this.generateRiskFlags(requirement) : [],
      acceptanceCriteria: this.generateAcceptanceCriteria(requirement),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return ticket;
  }

  /**
   * Creates subtasks for a ticket
   */
  private createSubtasksForTicket(ticket: Ticket): Subtask[] {
    const subtasks: Subtask[] = [];
    const commonPhases = [
      'Setup and preparation',
      'Core implementation',
      'Error handling',
      'Unit tests',
      'Integration tests',
      'Code review and refinement',
    ];

    const numSubtasks = Math.min(
      commonPhases.length,
      this.config.maxSubtasksPerTicket!
    );

    for (let i = 0; i < numSubtasks; i++) {
      const subtask: Subtask = {
        id: generateId(),
        subtaskId: `${ticket.ticketId}-S${i + 1}`,
        ticketId: ticket.id,
        title: commonPhases[i],
        description: `${commonPhases[i]} for ${ticket.title}`,
        status: 'todo',
        estimatedEffort: this.estimateEffort('subtask'),
        testNotes: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      subtasks.push(subtask);
    }

    return subtasks;
  }

  /**
   * Detects dependencies between tasks
   */
  private detectDependencies(tickets: Ticket[], subtasks: Subtask[]): TaskDependency[] {
    const dependencies: TaskDependency[] = [];

    // Simple heuristic: tickets in the same epic with certain keywords block each other
    const blockingKeywords = ['design', 'setup', 'architecture', 'foundation'];
    const blockedKeywords = ['implement', 'test', 'deploy', 'document'];

    tickets.forEach((ticket, i) => {
      const lowerTitle = ticket.title.toLowerCase();

      // If this is a blocking task, mark later tasks as blocked
      if (blockingKeywords.some(kw => lowerTitle.includes(kw))) {
        tickets.slice(i + 1).forEach((laterTicket) => {
          if (ticket.epicId === laterTicket.epicId) {
            dependencies.push({
              id: generateId(),
              sourceTaskId: ticket.id,
              targetTaskId: laterTicket.id,
              type: 'blocks',
              createdAt: Date.now(),
            });
          }
        });
      }
    });

    return dependencies;
  }

  /**
   * Generates Definition of Done items
   */
  private generateDoD(level: 'epic' | 'ticket' | 'subtask'): DefinitionOfDone[] {
    const commonDoD: Record<string, string[]> = {
      epic: [
        'All tickets completed and tested',
        'Documentation updated',
        'Acceptance criteria met',
        'Code reviewed and merged',
      ],
      ticket: [
        'Code implemented and working',
        'Unit tests written and passing',
        'Code reviewed by peer',
        'Documentation updated',
      ],
      subtask: [
        'Implementation complete',
        'Self-tested',
        'Ready for review',
      ],
    };

    return (commonDoD[level] || []).map((desc, index) => ({
      id: generateId(),
      description: desc,
      completed: false,
      createdAt: Date.now(),
    }));
  }

  /**
   * Generates test notes
   */
  private generateTestNotes(): TestNote[] {
    const testTypes: TestNote['testType'][] = ['unit', 'integration', 'e2e'];

    return testTypes.map((type) => ({
      id: generateId(),
      description: `${type} tests for this ticket`,
      testType: type,
      status: 'pending',
      createdAt: Date.now(),
    }));
  }

  /**
   * Generates risk flags based on content
   */
  private generateRiskFlags(content: string): RiskFlag[] {
    const risks: RiskFlag[] = [];
    const lowerContent = content.toLowerCase();

    // Check for complexity indicators
    if (
      lowerContent.includes('complex') ||
      lowerContent.includes('difficult') ||
      lowerContent.includes('challenging')
    ) {
      risks.push({
        id: generateId(),
        level: 'medium',
        description: 'Task complexity may require additional time',
        impact: 'May affect timeline',
        probability: 'medium',
        createdAt: Date.now(),
        resolved: false,
      });
    }

    // Check for integration indicators
    if (
      lowerContent.includes('integration') ||
      lowerContent.includes('third-party') ||
      lowerContent.includes('api')
    ) {
      risks.push({
        id: generateId(),
        level: 'medium',
        description: 'External dependencies may cause delays',
        impact: 'Integration issues could block progress',
        probability: 'medium',
        createdAt: Date.now(),
        resolved: false,
      });
    }

    return risks;
  }

  /**
   * Generates acceptance criteria
   */
  private generateAcceptanceCriteria(requirement: string): string[] {
    return [
      `Implements ${requirement} as specified`,
      'Passes all automated tests',
      'Meets performance requirements',
      'Has proper error handling',
    ];
  }

  /**
   * Extracts tags from text
   */
  private extractTags(text: string): string[] {
    const tags: string[] = [];
    const techKeywords = [
      'frontend',
      'backend',
      'database',
      'api',
      'ui',
      'ux',
      'auth',
      'security',
      'performance',
      'testing',
    ];

    const lowerText = text.toLowerCase();
    techKeywords.forEach((keyword) => {
      if (lowerText.includes(keyword)) {
        tags.push(keyword);
      }
    });

    return tags;
  }

  /**
   * Estimates effort for tasks
   */
  private estimateEffort(level: 'epic' | 'ticket' | 'subtask'): number {
    const estimates = {
      epic: { min: 20, max: 100 },
      ticket: { min: 3, max: 13 },
      subtask: { min: 1, max: 5 },
    };

    const range = estimates[level];
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  }

  /**
   * Generates a summary of the breakdown
   */
  private generateSummary(epics: Epic[], tickets: Ticket[], subtasks: Subtask[]): string {
    return `Generated ${epics.length} epic(s), ${tickets.length} ticket(s), and ${subtasks.length} subtask(s) from the input. Total estimated effort: ${this.calculateTotalEffort(epics, tickets, subtasks)} ${this.config.estimationUnit}.`;
  }

  /**
   * Calculates total effort
   */
  private calculateTotalEffort(epics: Epic[], tickets: Ticket[], subtasks: Subtask[]): number {
    const ticketEffort = tickets.reduce((sum, t) => sum + (t.estimatedEffort || 0), 0);
    const subtaskEffort = subtasks.reduce((sum, s) => sum + (s.estimatedEffort || 0), 0);
    return ticketEffort + subtaskEffort;
  }

  /**
   * Calculates confidence score
   */
  private calculateConfidence(analysis: ReturnType<typeof this.parseInput>): number {
    let score = 0.5; // Base confidence

    // More themes/requirements = higher confidence
    if (analysis.themes.length > 0) score += 0.1;
    if (analysis.requirements.length > 3) score += 0.2;
    if (analysis.technicalNotes.length > 0) score += 0.1;
    if (analysis.risks.length > 0) score += 0.1;

    return Math.min(score, 1.0);
  }
}
