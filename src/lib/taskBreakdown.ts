// Task Breakdown Engine - Parses issues/PRDs/screenshots and creates structured tasks

import {
  InputSource,
  BreakdownResult,
  BreakdownOptions,
  Epic,
  Ticket,
  Subtask,
  DefinitionOfDone,
  TestNote,
  RiskFlag,
  TaskDependency,
} from '@/types/taskBreakdown';

export class TaskBreakdownEngine {
  /**
   * Main entry point to break down an input source into epics, tickets, and subtasks
   */
  static async breakdown(
    source: InputSource,
    options: BreakdownOptions = {}
  ): Promise<BreakdownResult> {
    const {
      maxSubtasksPerTicket = 5,
      maxTicketsPerEpic = 10,
      autoAssignAgents = true,
      generateTestNotes = true,
      identifyRisks = true,
      estimateEffort = true,
    } = options;

    // Parse the input source
    const parsed = this.parseInput(source);

    // Extract features and requirements
    const features = this.extractFeatures(parsed);

    // Create epics from high-level features
    const epics = this.createEpics(features, maxTicketsPerEpic);

    // Create tickets from epics
    const tickets = this.createTickets(epics, features, maxSubtasksPerTicket);

    // Create subtasks from tickets
    const subtasks = this.createSubtasks(tickets);

    // Add DoD, test notes, and risks
    if (generateTestNotes) {
      this.addTestNotes(tickets, subtasks);
    }

    if (identifyRisks) {
      this.addRiskFlags(tickets, subtasks);
    }

    // Estimate effort
    if (estimateEffort) {
      this.estimateEffort(tickets, subtasks);
    }

    // Identify dependencies
    this.identifyDependencies(tickets, subtasks);

    // Calculate total estimates
    const totalEstimatedHours = this.calculateTotalHours(tickets, subtasks);

    return {
      epics,
      tickets,
      subtasks,
      summary: this.generateSummary(epics, tickets, subtasks),
      totalEstimatedHours,
      suggestedSprint: this.suggestSprint(totalEstimatedHours),
    };
  }

  /**
   * Parse the input source into a structured format
   */
  private static parseInput(source: InputSource): Record<string, unknown> {
    const { type, content } = source;

    if (type === 'screenshot') {
      // For screenshots, extract text and UI elements (placeholder for OCR/AI)
      return {
        elements: this.extractUIElements(content),
        text: this.extractTextFromImage(content),
      };
    }

    if (type === 'prd') {
      return this.parsePRD(content);
    }

    if (type === 'issue') {
      return this.parseIssue(content);
    }

    // Default text parsing
    return this.parseText(content);
  }

  /**
   * Extract UI elements from screenshot (placeholder)
   */
  private static extractUIElements(content: string): string[] {
    // In a real implementation, this would use OCR/AI to detect UI elements
    return ['button', 'form', 'table', 'navigation'];
  }

  /**
   * Extract text from image (placeholder)
   */
  private static extractTextFromImage(content: string): string {
    // In a real implementation, this would use OCR
    return content;
  }

  /**
   * Parse PRD document
   */
  private static parsePRD(content: string): Record<string, unknown> {
    const sections = {
      overview: '',
      features: [] as string[],
      requirements: [] as string[],
      constraints: [] as string[],
    };

    // Simple parsing based on common PRD structure
    const lines = content.split('\n');
    let currentSection = 'overview';

    for (const line of lines) {
      const lower = line.toLowerCase().trim();

      if (lower.includes('feature') || lower.includes('requirement')) {
        currentSection = lower.includes('feature') ? 'features' : 'requirements';
      } else if (lower.includes('constraint') || lower.includes('limitation')) {
        currentSection = 'constraints';
      } else if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
        const item = line.trim().substring(1).trim();
        if (currentSection !== 'overview') {
          (sections[currentSection as keyof typeof sections] as string[]).push(item);
        }
      } else if (line.trim()) {
        if (currentSection === 'overview') {
          sections.overview += line + ' ';
        }
      }
    }

    return sections;
  }

  /**
   * Parse GitHub issue format
   */
  private static parseIssue(content: string): Record<string, unknown> {
    return {
      description: content,
      requirements: this.extractRequirements(content),
    };
  }

  /**
   * Parse plain text
   */
  private static parseText(content: string): Record<string, unknown> {
    return {
      description: content,
      requirements: this.extractRequirements(content),
    };
  }

  /**
   * Extract requirements from text
   */
  private static extractRequirements(text: string): string[] {
    const requirements: string[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.startsWith('-') ||
        trimmed.startsWith('*') ||
        trimmed.startsWith('•') ||
        /^\d+\./.test(trimmed)
      ) {
        requirements.push(trimmed.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, ''));
      }
    }

    return requirements;
  }

  /**
   * Extract features from parsed input
   */
  private static extractFeatures(parsed: Record<string, unknown>): string[] {
    const features: string[] = [];

    if (Array.isArray(parsed.features)) {
      features.push(...parsed.features);
    }

    if (Array.isArray(parsed.requirements)) {
      features.push(...parsed.requirements);
    }

    if (typeof parsed.description === 'string') {
      const extracted = this.extractRequirements(parsed.description);
      features.push(...extracted);
    }

    // If no features extracted, create a generic one
    if (features.length === 0) {
      features.push('Implement requested functionality');
    }

    return features;
  }

  /**
   * Create epics from features
   */
  private static createEpics(features: string[], maxTickets: number): Epic[] {
    const epics: Epic[] = [];
    const now = Date.now();

    // Group features into logical epics
    const epicGroups = this.groupFeaturesIntoEpics(features);

    for (const [title, epicFeatures] of Object.entries(epicGroups)) {
      epics.push({
        id: this.generateId('epic'),
        title,
        description: `Epic containing ${epicFeatures.length} related features`,
        hierarchy: 'epic',
        tickets: [],
        acceptanceCriteria: epicFeatures.map((f) => `Complete: ${f}`),
        createdAt: now,
        updatedAt: now,
      });
    }

    return epics;
  }

  /**
   * Group features into logical epics
   */
  private static groupFeaturesIntoEpics(features: string[]): Record<string, string[]> {
    // Simple grouping logic - in production, use AI/ML
    const groups: Record<string, string[]> = {
      'Core Implementation': [],
    };

    for (const feature of features) {
      const lower = feature.toLowerCase();

      if (lower.includes('ui') || lower.includes('interface') || lower.includes('component')) {
        if (!groups['UI/UX Implementation']) groups['UI/UX Implementation'] = [];
        groups['UI/UX Implementation'].push(feature);
      } else if (lower.includes('api') || lower.includes('backend') || lower.includes('database')) {
        if (!groups['Backend Implementation']) groups['Backend Implementation'] = [];
        groups['Backend Implementation'].push(feature);
      } else if (lower.includes('test') || lower.includes('quality')) {
        if (!groups['Testing & Quality']) groups['Testing & Quality'] = [];
        groups['Testing & Quality'].push(feature);
      } else {
        groups['Core Implementation'].push(feature);
      }
    }

    // Remove empty groups
    return Object.fromEntries(
      Object.entries(groups).filter(([_, features]) => features.length > 0)
    );
  }

  /**
   * Create tickets from epics
   */
  private static createTickets(
    epics: Epic[],
    features: string[],
    maxSubtasks: number
  ): Ticket[] {
    const tickets: Ticket[] = [];
    const now = Date.now();

    for (const epic of epics) {
      const epicFeatures = features.slice(0, Math.min(features.length, 5));

      for (const feature of epicFeatures) {
        const ticketId = this.generateId('ticket');

        tickets.push({
          id: ticketId,
          epicId: epic.id,
          title: feature,
          description: `Implement: ${feature}`,
          hierarchy: 'ticket',
          subtasks: [],
          definitionOfDone: this.generateDoD(feature),
          testNotes: [],
          riskFlags: [],
          dependencies: [],
          requiredSkills: this.extractRequiredSkills(feature),
          priority: this.determinePriority(feature),
          status: 'backlog',
          tags: this.extractTags(feature),
          createdAt: now,
          updatedAt: now,
        });

        epic.tickets.push(ticketId);
      }
    }

    return tickets;
  }

  /**
   * Create subtasks from tickets
   */
  private static createSubtasks(tickets: Ticket[]): Subtask[] {
    const subtasks: Subtask[] = [];
    const now = Date.now();

    for (const ticket of tickets) {
      const tasks = this.breakdownTicketIntoTasks(ticket.title);

      for (const task of tasks) {
        const subtaskId = this.generateId('subtask');

        subtasks.push({
          id: subtaskId,
          ticketId: ticket.id,
          title: task,
          description: `Complete: ${task}`,
          hierarchy: 'subtask',
          definitionOfDone: this.generateDoD(task),
          testNotes: [],
          riskFlags: [],
          dependencies: [],
          requiredSkills: this.extractRequiredSkills(task),
          priority: ticket.priority,
          status: 'backlog',
          createdAt: now,
          updatedAt: now,
        });

        ticket.subtasks.push(subtaskId);
      }
    }

    return subtasks;
  }

  /**
   * Break down a ticket into subtasks
   */
  private static breakdownTicketIntoTasks(ticketTitle: string): string[] {
    const lower = ticketTitle.toLowerCase();
    const tasks: string[] = [];

    // Standard development tasks
    tasks.push('Design and plan implementation');
    tasks.push('Implement core functionality');
    tasks.push('Write unit tests');
    tasks.push('Update documentation');
    tasks.push('Code review and refinement');

    return tasks;
  }

  /**
   * Generate Definition of Done items
   */
  private static generateDoD(title: string): DefinitionOfDone[] {
    return [
      {
        id: this.generateId('dod'),
        description: 'Code implementation complete',
        completed: false,
        verificationMethod: 'Code review',
      },
      {
        id: this.generateId('dod'),
        description: 'Unit tests written and passing',
        completed: false,
        verificationMethod: 'Test suite execution',
      },
      {
        id: this.generateId('dod'),
        description: 'Documentation updated',
        completed: false,
        verificationMethod: 'Documentation review',
      },
      {
        id: this.generateId('dod'),
        description: 'Code reviewed and approved',
        completed: false,
        verificationMethod: 'Peer review',
      },
    ];
  }

  /**
   * Add test notes to tickets and subtasks
   */
  private static addTestNotes(tickets: Ticket[], subtasks: Subtask[]): void {
    for (const ticket of tickets) {
      ticket.testNotes = [
        {
          id: this.generateId('test'),
          type: 'unit',
          description: 'Test individual components and functions',
          expectedOutcome: 'All unit tests pass',
        },
        {
          id: this.generateId('test'),
          type: 'integration',
          description: 'Test integration with other components',
          expectedOutcome: 'Integration points work correctly',
        },
      ];
    }

    for (const subtask of subtasks) {
      subtask.testNotes = [
        {
          id: this.generateId('test'),
          type: 'unit',
          description: 'Test subtask functionality',
          expectedOutcome: 'Subtask tests pass',
        },
      ];
    }
  }

  /**
   * Add risk flags
   */
  private static addRiskFlags(tickets: Ticket[], subtasks: Subtask[]): void {
    for (const ticket of tickets) {
      const lower = ticket.title.toLowerCase();

      if (lower.includes('database') || lower.includes('migration')) {
        ticket.riskFlags.push({
          id: this.generateId('risk'),
          level: 'high',
          description: 'Database changes require careful migration planning',
          mitigation: 'Create rollback plan and test migrations thoroughly',
          impact: 'Data loss or downtime if not handled properly',
        });
      }

      if (lower.includes('security') || lower.includes('auth')) {
        ticket.riskFlags.push({
          id: this.generateId('risk'),
          level: 'critical',
          description: 'Security-critical feature requiring extra scrutiny',
          mitigation: 'Security review and penetration testing',
          impact: 'Potential security vulnerabilities',
        });
      }

      if (lower.includes('performance') || lower.includes('optimization')) {
        ticket.riskFlags.push({
          id: this.generateId('risk'),
          level: 'medium',
          description: 'Performance changes need benchmarking',
          mitigation: 'Establish baseline metrics and monitor',
          impact: 'Performance regression if not tested',
        });
      }
    }
  }

  /**
   * Estimate effort for tickets and subtasks
   */
  private static estimateEffort(tickets: Ticket[], subtasks: Subtask[]): void {
    for (const ticket of tickets) {
      // Estimate based on complexity (simplified)
      const baseHours = 8;
      const complexityMultiplier = ticket.riskFlags.length > 0 ? 1.5 : 1;
      ticket.estimatedHours = Math.round(baseHours * complexityMultiplier);
    }

    for (const subtask of subtasks) {
      subtask.estimatedHours = Math.round(Math.random() * 4 + 2); // 2-6 hours
    }
  }

  /**
   * Identify dependencies between tasks
   */
  private static identifyDependencies(tickets: Ticket[], subtasks: Subtask[]): void {
    // Simple dependency logic: database/backend tasks should be done before frontend
    const backendTickets = tickets.filter(t =>
      t.title.toLowerCase().includes('api') ||
      t.title.toLowerCase().includes('backend') ||
      t.title.toLowerCase().includes('database')
    );

    const frontendTickets = tickets.filter(t =>
      t.title.toLowerCase().includes('ui') ||
      t.title.toLowerCase().includes('frontend') ||
      t.title.toLowerCase().includes('component')
    );

    for (const frontend of frontendTickets) {
      for (const backend of backendTickets) {
        frontend.dependencies.push({
          dependsOn: backend.id,
          type: 'blocked-by',
          description: 'Requires backend implementation',
        });
      }
    }
  }

  /**
   * Extract required skills from task description
   */
  private static extractRequiredSkills(text: string): string[] {
    const skills: string[] = [];
    const lower = text.toLowerCase();

    if (lower.includes('react') || lower.includes('ui') || lower.includes('component')) {
      skills.push('frontend', 'react');
    }
    if (lower.includes('api') || lower.includes('backend')) {
      skills.push('backend', 'api');
    }
    if (lower.includes('database') || lower.includes('sql')) {
      skills.push('database');
    }
    if (lower.includes('test')) {
      skills.push('testing');
    }
    if (lower.includes('devops') || lower.includes('deploy')) {
      skills.push('devops');
    }

    return skills.length > 0 ? skills : ['general'];
  }

  /**
   * Determine priority based on keywords
   */
  private static determinePriority(text: string): 1 | 2 | 3 | 4 | 5 {
    const lower = text.toLowerCase();

    if (lower.includes('critical') || lower.includes('urgent') || lower.includes('security')) {
      return 5;
    }
    if (lower.includes('high') || lower.includes('important')) {
      return 4;
    }
    if (lower.includes('low') || lower.includes('minor')) {
      return 2;
    }

    return 3; // default medium
  }

  /**
   * Extract tags from text
   */
  private static extractTags(text: string): string[] {
    const tags: string[] = [];
    const lower = text.toLowerCase();

    if (lower.includes('bug') || lower.includes('fix')) tags.push('bug');
    if (lower.includes('feature')) tags.push('feature');
    if (lower.includes('ui') || lower.includes('frontend')) tags.push('frontend');
    if (lower.includes('api') || lower.includes('backend')) tags.push('backend');
    if (lower.includes('test')) tags.push('testing');
    if (lower.includes('doc')) tags.push('documentation');

    return tags;
  }

  /**
   * Calculate total estimated hours
   */
  private static calculateTotalHours(tickets: Ticket[], subtasks: Subtask[]): number {
    const ticketHours = tickets.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const subtaskHours = subtasks.reduce((sum, s) => sum + (s.estimatedHours || 0), 0);
    return ticketHours + subtaskHours;
  }

  /**
   * Generate summary
   */
  private static generateSummary(epics: Epic[], tickets: Ticket[], subtasks: Subtask[]): string {
    return `Breakdown complete: ${epics.length} epic(s), ${tickets.length} ticket(s), ${subtasks.length} subtask(s)`;
  }

  /**
   * Suggest sprint based on total hours
   */
  private static suggestSprint(totalHours: number): string {
    const weeks = Math.ceil(totalHours / 40); // 40 hours per week
    return `Sprint ${weeks} (${weeks} week${weeks > 1 ? 's' : ''})`;
  }

  /**
   * Generate unique ID
   */
  private static generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
