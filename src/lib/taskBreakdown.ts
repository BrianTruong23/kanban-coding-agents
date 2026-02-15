import {
  TaskBreakdown,
  Epic,
  Ticket,
  Subtask,
  RiskFlag,
  RiskLevel,
  DependencyEdge
} from '@/types/breakdown';

/**
 * Analyzes input text to break down into epics, tickets, and subtasks
 */
export class TaskBreakdownEngine {
  /**
   * Main entry point for breaking down issues/PRDs/text into structured tasks
   */
  static breakdown(input: {
    type: 'issue' | 'prd' | 'screenshot' | 'text';
    content: string;
  }): TaskBreakdown {
    const epics: Epic[] = [];
    const tickets: Ticket[] = [];
    const subtasks: Subtask[] = [];
    const dependencies: DependencyEdge[] = [];

    // Parse the content based on type
    const parsed = this.parseContent(input.content);

    // Generate epics from high-level features
    parsed.features.forEach((feature, idx) => {
      const epic = this.createEpic(feature, idx);
      epics.push(epic);

      // Generate tickets for each epic
      feature.requirements.forEach((req, reqIdx) => {
        const ticket = this.createTicket(req, epic.id, reqIdx);
        tickets.push(ticket);
        epic.tickets.push(ticket.id);

        // Generate subtasks for each ticket
        const tasks = this.generateSubtasks(req);
        tasks.forEach((task, taskIdx) => {
          const subtask = this.createSubtask(task, ticket.id, taskIdx);
          subtasks.push(subtask);
          ticket.subtasks.push(subtask.id);
        });
      });
    });

    // Analyze and create dependencies
    const deps = this.analyzeDependencies(epics, tickets, subtasks);
    dependencies.push(...deps);

    const totalEffort = this.calculateTotalEffort(epics, tickets, subtasks);

    return {
      sourceType: input.type,
      sourceContent: input.content,
      epics,
      tickets,
      subtasks,
      dependencies,
      metadata: {
        generatedAt: Date.now(),
        estimatedTotalEffort: totalEffort,
      },
    };
  }

  /**
   * Parse content into structured features and requirements
   */
  private static parseContent(content: string): {
    features: Array<{
      title: string;
      description: string;
      priority: 1 | 2 | 3 | 4 | 5;
      requirements: Array<{
        title: string;
        description: string;
        priority: 1 | 2 | 3 | 4 | 5;
        tasks: string[];
      }>;
    }>;
  } {
    const features: any[] = [];

    // Simple parsing logic - split by headers, bullets, etc.
    const lines = content.split('\n').filter(line => line.trim());

    let currentFeature: any = null;
    let currentRequirement: any = null;

    lines.forEach(line => {
      const trimmed = line.trim();

      // Detect epic-level features (## or numbered items)
      if (trimmed.match(/^##\s+/) || trimmed.match(/^\d+\.\s+[A-Z]/)) {
        if (currentFeature) {
          if (currentRequirement) {
            currentFeature.requirements.push(currentRequirement);
            currentRequirement = null;
          }
          features.push(currentFeature);
        }

        currentFeature = {
          title: trimmed.replace(/^##\s+/, '').replace(/^\d+\.\s+/, ''),
          description: '',
          priority: this.inferPriority(trimmed),
          requirements: [],
        };
      }
      // Detect requirements (- or * bullets)
      else if (trimmed.match(/^[-*]\s+/)) {
        if (currentFeature) {
          if (currentRequirement) {
            currentFeature.requirements.push(currentRequirement);
          }

          currentRequirement = {
            title: trimmed.replace(/^[-*]\s+/, ''),
            description: '',
            priority: this.inferPriority(trimmed),
            tasks: [],
          };
        }
      }
      // Description or task details
      else if (trimmed && currentFeature) {
        if (currentRequirement) {
          currentRequirement.description += trimmed + ' ';
        } else {
          currentFeature.description += trimmed + ' ';
        }
      }
    });

    // Add the last feature and requirement
    if (currentRequirement && currentFeature) {
      currentFeature.requirements.push(currentRequirement);
    }
    if (currentFeature) {
      features.push(currentFeature);
    }

    // If no structured content found, create a single feature
    if (features.length === 0) {
      features.push({
        title: 'Main Feature',
        description: content,
        priority: 3,
        requirements: [{
          title: 'Implementation',
          description: content,
          priority: 3,
          tasks: [],
        }],
      });
    }

    return { features };
  }

  /**
   * Infer priority from text keywords
   */
  private static inferPriority(text: string): 1 | 2 | 3 | 4 | 5 {
    const lower = text.toLowerCase();
    if (lower.includes('critical') || lower.includes('urgent') || lower.includes('asap')) return 5;
    if (lower.includes('high') || lower.includes('important')) return 4;
    if (lower.includes('low') || lower.includes('nice to have')) return 2;
    if (lower.includes('optional')) return 1;
    return 3;
  }

  /**
   * Create an epic from a feature
   */
  private static createEpic(
    feature: { title: string; description: string; priority: 1 | 2 | 3 | 4 | 5 },
    index: number
  ): Epic {
    return {
      id: `epic-${Date.now()}-${index}`,
      title: feature.title,
      description: feature.description.trim(),
      priority: feature.priority,
      estimatedEffort: 0, // Will be calculated from tickets
      tickets: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * Create a ticket from a requirement
   */
  private static createTicket(
    requirement: { title: string; description: string; priority: 1 | 2 | 3 | 4 | 5 },
    epicId: string,
    index: number
  ): Ticket {
    const riskFlags = this.identifyRisks(requirement.title + ' ' + requirement.description);
    const dod = this.generateDoD(requirement);
    const testNotes = this.generateTestNotes(requirement);

    return {
      id: `ticket-${Date.now()}-${index}`,
      epicId,
      title: requirement.title,
      description: requirement.description.trim(),
      priority: requirement.priority,
      estimatedEffort: this.estimateEffort(requirement.title + ' ' + requirement.description),
      definitionOfDone: dod,
      testNotes,
      riskFlags,
      subtasks: [],
      dependencies: [],
      status: 'backlog',
      tags: this.extractTags(requirement.title + ' ' + requirement.description),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * Generate subtasks from a requirement
   */
  private static generateSubtasks(requirement: { title: string; description: string }): Array<{
    title: string;
    description: string;
  }> {
    const text = requirement.title + ' ' + requirement.description;
    const subtasks: Array<{ title: string; description: string }> = [];

    // Common development phases
    const phases = [
      { keyword: ['design', 'ui', 'ux'], task: 'Design and mockup' },
      { keyword: ['database', 'schema', 'model'], task: 'Database schema design' },
      { keyword: ['api', 'endpoint', 'backend'], task: 'Backend API implementation' },
      { keyword: ['frontend', 'component', 'ui'], task: 'Frontend component implementation' },
      { keyword: ['test', 'testing'], task: 'Write tests' },
      { keyword: ['document'], task: 'Update documentation' },
    ];

    phases.forEach(phase => {
      if (phase.keyword.some(kw => text.toLowerCase().includes(kw))) {
        subtasks.push({
          title: phase.task,
          description: `${phase.task} for ${requirement.title}`,
        });
      }
    });

    // If no specific subtasks identified, create generic ones
    if (subtasks.length === 0) {
      subtasks.push(
        { title: 'Implementation', description: `Implement ${requirement.title}` },
        { title: 'Testing', description: `Test ${requirement.title}` }
      );
    }

    return subtasks;
  }

  /**
   * Create a subtask
   */
  private static createSubtask(
    task: { title: string; description: string },
    ticketId: string,
    index: number
  ): Subtask {
    return {
      id: `subtask-${Date.now()}-${index}`,
      ticketId,
      title: task.title,
      description: task.description,
      estimatedEffort: this.estimateEffort(task.title),
      status: 'backlog',
      dependencies: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * Identify risks in a requirement
   */
  private static identifyRisks(text: string): RiskFlag[] {
    const risks: RiskFlag[] = [];
    const lower = text.toLowerCase();

    const riskPatterns: Array<{
      keywords: string[];
      level: RiskLevel;
      description: string;
    }> = [
      {
        keywords: ['security', 'authentication', 'authorization', 'encryption'],
        level: 'critical',
        description: 'Security-sensitive implementation requires careful review',
      },
      {
        keywords: ['migration', 'database change', 'schema change'],
        level: 'high',
        description: 'Database migration requires careful planning and rollback strategy',
      },
      {
        keywords: ['performance', 'optimization', 'scale'],
        level: 'medium',
        description: 'Performance implications should be tested under load',
      },
      {
        keywords: ['third-party', 'external api', 'integration'],
        level: 'medium',
        description: 'External dependency may introduce reliability concerns',
      },
      {
        keywords: ['breaking change', 'backward compatibility'],
        level: 'high',
        description: 'Breaking changes require version management and user communication',
      },
    ];

    riskPatterns.forEach((pattern, idx) => {
      if (pattern.keywords.some(kw => lower.includes(kw))) {
        risks.push({
          id: `risk-${Date.now()}-${idx}`,
          level: pattern.level,
          description: pattern.description,
          createdAt: Date.now(),
        });
      }
    });

    return risks;
  }

  /**
   * Generate Definition of Done
   */
  private static generateDoD(requirement: { title: string; description: string }): string[] {
    const dod: string[] = [
      'Code is written and follows project coding standards',
      'Unit tests are written and passing',
      'Code review is completed and approved',
      'Documentation is updated',
    ];

    const text = (requirement.title + ' ' + requirement.description).toLowerCase();

    if (text.includes('ui') || text.includes('frontend') || text.includes('component')) {
      dod.push('UI matches design specifications');
      dod.push('Responsive design works on mobile and desktop');
    }

    if (text.includes('api') || text.includes('backend') || text.includes('endpoint')) {
      dod.push('API endpoints are documented');
      dod.push('Error handling is implemented');
    }

    if (text.includes('database') || text.includes('schema')) {
      dod.push('Database migration is tested');
      dod.push('Rollback plan is documented');
    }

    return dod;
  }

  /**
   * Generate test notes
   */
  private static generateTestNotes(requirement: { title: string; description: string }): string[] {
    const notes: string[] = [];
    const text = (requirement.title + ' ' + requirement.description).toLowerCase();

    notes.push('Test happy path scenarios');
    notes.push('Test error handling and edge cases');

    if (text.includes('authentication') || text.includes('login')) {
      notes.push('Test with valid and invalid credentials');
      notes.push('Test session management');
    }

    if (text.includes('form') || text.includes('input')) {
      notes.push('Test form validation');
      notes.push('Test required field handling');
    }

    if (text.includes('api')) {
      notes.push('Test API response codes');
      notes.push('Test rate limiting if applicable');
    }

    return notes;
  }

  /**
   * Extract tags from text
   */
  private static extractTags(text: string): string[] {
    const tags: string[] = [];
    const lower = text.toLowerCase();

    const tagMap: Record<string, string> = {
      frontend: 'frontend',
      backend: 'backend',
      api: 'api',
      database: 'database',
      ui: 'ui',
      ux: 'ux',
      security: 'security',
      performance: 'performance',
      bug: 'bug',
      feature: 'feature',
      urgent: 'urgent',
      critical: 'critical',
    };

    Object.entries(tagMap).forEach(([keyword, tag]) => {
      if (lower.includes(keyword) && !tags.includes(tag)) {
        tags.push(tag);
      }
    });

    return tags;
  }

  /**
   * Estimate effort in hours based on text complexity
   */
  private static estimateEffort(text: string): number {
    const lower = text.toLowerCase();
    let effort = 4; // Base effort

    // Increase for complex keywords
    if (lower.includes('authentication') || lower.includes('security')) effort += 8;
    if (lower.includes('migration') || lower.includes('database')) effort += 6;
    if (lower.includes('integration') || lower.includes('third-party')) effort += 6;
    if (lower.includes('optimization') || lower.includes('performance')) effort += 4;
    if (lower.includes('api')) effort += 3;
    if (lower.includes('ui') || lower.includes('component')) effort += 2;

    return effort;
  }

  /**
   * Analyze dependencies between tasks
   */
  private static analyzeDependencies(
    epics: Epic[],
    tickets: Ticket[],
    subtasks: Subtask[]
  ): DependencyEdge[] {
    const dependencies: DependencyEdge[] = [];

    // Subtasks within a ticket often have natural dependencies
    tickets.forEach(ticket => {
      const ticketSubtasks = subtasks.filter(s => s.ticketId === ticket.id);

      for (let i = 0; i < ticketSubtasks.length - 1; i++) {
        // Each subtask may depend on the previous one
        const current = ticketSubtasks[i];
        const next = ticketSubtasks[i + 1];

        if (current.title.toLowerCase().includes('design') &&
            next.title.toLowerCase().includes('implement')) {
          dependencies.push({
            from: next.id,
            to: current.id,
            type: 'requires',
          });
        } else if (current.title.toLowerCase().includes('implement') &&
                   next.title.toLowerCase().includes('test')) {
          dependencies.push({
            from: next.id,
            to: current.id,
            type: 'requires',
          });
        }
      }
    });

    // Database changes often block other work
    const dbTickets = tickets.filter(t =>
      t.title.toLowerCase().includes('database') ||
      t.title.toLowerCase().includes('schema')
    );

    dbTickets.forEach(dbTicket => {
      tickets.forEach(ticket => {
        if (ticket.id !== dbTicket.id &&
            (ticket.title.toLowerCase().includes('api') ||
             ticket.title.toLowerCase().includes('backend'))) {
          dependencies.push({
            from: ticket.id,
            to: dbTicket.id,
            type: 'requires',
          });
        }
      });
    });

    return dependencies;
  }

  /**
   * Calculate total effort
   */
  private static calculateTotalEffort(epics: Epic[], tickets: Ticket[], subtasks: Subtask[]): number {
    return subtasks.reduce((sum, s) => sum + s.estimatedEffort, 0);
  }
}
