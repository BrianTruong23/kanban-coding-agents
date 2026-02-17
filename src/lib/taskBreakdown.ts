import {
  IssueInput,
  BreakdownResult,
  Epic,
  Ticket,
  Subtask,
  TaskDependency,
  TestNote,
  RiskFlag,
  DefinitionOfDone
} from '@/types/breakdown';
import { generateId } from './utils';

/**
 * Analyzes issue input and breaks it down into epics, tickets, and subtasks
 * This is a rule-based implementation that can be enhanced with AI in the future
 */
export class TaskBreakdownService {

  /**
   * Main entry point for breaking down an issue
   */
  static breakdownIssue(input: IssueInput, userId: string): BreakdownResult {
    const content = input.content.toLowerCase();

    // Determine complexity based on keywords and content length
    const complexity = this.assessComplexity(input);

    // Extract key information
    const keywords = this.extractKeywords(content);
    const features = this.extractFeatures(content);
    const technicalRequirements = this.extractTechnicalRequirements(content);

    // Create breakdown based on complexity
    if (complexity === 'epic') {
      return this.createEpicBreakdown(input, userId, features, technicalRequirements, keywords);
    } else if (complexity === 'multi-ticket') {
      return this.createMultiTicketBreakdown(input, userId, features, technicalRequirements, keywords);
    } else {
      return this.createSingleTicketBreakdown(input, userId, features, technicalRequirements, keywords);
    }
  }

  /**
   * Assess the complexity of the input
   */
  private static assessComplexity(input: IssueInput): 'epic' | 'multi-ticket' | 'single-ticket' {
    const content = input.content.toLowerCase();
    const wordCount = content.split(/\s+/).length;

    // Epic indicators
    const epicKeywords = ['system', 'platform', 'infrastructure', 'architecture', 'redesign', 'overhaul'];
    const hasEpicKeywords = epicKeywords.some(keyword => content.includes(keyword));

    // Multiple features indicator
    const featureIndicators = content.match(/\d+\.\s|[-•]\s/g)?.length || 0;

    if (hasEpicKeywords || wordCount > 500 || featureIndicators > 5) {
      return 'epic';
    } else if (featureIndicators > 2 || wordCount > 200) {
      return 'multi-ticket';
    } else {
      return 'single-ticket';
    }
  }

  /**
   * Extract keywords from content
   */
  private static extractKeywords(content: string): string[] {
    const commonKeywords = [
      'frontend', 'backend', 'api', 'database', 'ui', 'ux', 'authentication',
      'authorization', 'testing', 'deployment', 'security', 'performance',
      'responsive', 'mobile', 'desktop', 'integration', 'migration'
    ];

    return commonKeywords.filter(keyword => content.includes(keyword));
  }

  /**
   * Extract features from content
   */
  private static extractFeatures(content: string): string[] {
    const features: string[] = [];

    // Look for numbered or bulleted lists
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.match(/^\s*[\d•-]+[\.)]\s+/) || line.match(/^[-•]\s+/)) {
        const feature = line.replace(/^\s*[\d•-]+[\.)]\s+|^[-•]\s+/, '').trim();
        if (feature) {
          features.push(feature);
        }
      }
    }

    // If no explicit features found, try to extract sentences that look like features
    if (features.length === 0) {
      const sentences = content.split(/[.!?]+/);
      features.push(...sentences.filter(s => s.trim().length > 10 && s.trim().length < 200).slice(0, 3));
    }

    return features;
  }

  /**
   * Extract technical requirements
   */
  private static extractTechnicalRequirements(content: string): string[] {
    const requirements: string[] = [];
    const techTerms = ['react', 'node', 'typescript', 'javascript', 'python', 'java',
                       'sql', 'postgres', 'mongodb', 'redis', 'docker', 'kubernetes',
                       'aws', 'azure', 'gcp', 'rest', 'graphql', 'websocket'];

    techTerms.forEach(term => {
      if (content.includes(term)) {
        requirements.push(term);
      }
    });

    return requirements;
  }

  /**
   * Create epic-level breakdown
   */
  private static createEpicBreakdown(
    input: IssueInput,
    userId: string,
    features: string[],
    technicalRequirements: string[],
    keywords: string[]
  ): BreakdownResult {
    const epicId = generateId();
    const now = Date.now();

    // Create the epic
    const epic: Epic = {
      id: epicId,
      title: this.extractTitle(input.content) || 'New Epic',
      description: input.content,
      userId,
      tickets: [],
      status: 'planning',
      createdAt: now,
      updatedAt: now
    };

    // Create tickets for each major feature area
    const tickets: Ticket[] = [];
    const subtasks: Subtask[] = [];
    const dependencies: TaskDependency[] = [];

    let ticketCounter = 1;
    let subtaskCounter = 1;

    // Group features into logical tickets
    const ticketGroups = this.groupFeatures(features, keywords);

    ticketGroups.forEach((group, groupIndex) => {
      const ticketId = generateId();
      const ticket: Ticket = {
        id: ticketId,
        epicId: epicId,
        taskId: `TICKET-${ticketCounter++}`,
        title: group.title,
        description: group.description,
        userId,
        subtasks: [],
        definitionOfDone: this.generateDoD(group.features),
        testNotes: this.generateTestNotes(group.features, keywords),
        riskFlags: this.generateRiskFlags(group.features, keywords, technicalRequirements),
        dependencies: [],
        blockedBy: [],
        status: 'backlog',
        priority: this.calculatePriority(group.features, keywords),
        tags: this.generateTags(group.features, keywords),
        createdAt: now,
        updatedAt: now
      };

      // Create subtasks for this ticket
      group.features.forEach(feature => {
        const subtaskId = generateId();
        const subtask: Subtask = {
          id: subtaskId,
          ticketId: ticketId,
          title: feature,
          description: `Implement: ${feature}`,
          userId,
          definitionOfDone: this.generateDoD([feature]),
          testNotes: this.generateTestNotes([feature], keywords),
          riskFlags: this.generateRiskFlags([feature], keywords, technicalRequirements),
          dependencies: [],
          status: 'todo',
          estimatedHours: this.estimateHours(feature),
          createdAt: now,
          updatedAt: now
        };

        subtasks.push(subtask);
        ticket.subtasks.push(subtaskId);
      });

      tickets.push(ticket);
      epic.tickets.push(ticketId);

      // Create dependencies between tickets (each ticket depends on the previous one)
      if (groupIndex > 0) {
        dependencies.push({
          id: generateId(),
          sourceId: ticketId,
          targetId: tickets[groupIndex - 1].id,
          type: 'blocks',
          description: 'Sequential implementation order',
          createdAt: now
        });
      }
    });

    return {
      epics: [epic],
      tickets,
      subtasks,
      dependencies,
      suggestedAssignments: []
    };
  }

  /**
   * Create multi-ticket breakdown
   */
  private static createMultiTicketBreakdown(
    input: IssueInput,
    userId: string,
    features: string[],
    technicalRequirements: string[],
    keywords: string[]
  ): BreakdownResult {
    const now = Date.now();
    const tickets: Ticket[] = [];
    const subtasks: Subtask[] = [];
    const dependencies: TaskDependency[] = [];

    let ticketCounter = 1;

    features.forEach((feature, index) => {
      const ticketId = generateId();
      const ticket: Ticket = {
        id: ticketId,
        taskId: `TICKET-${ticketCounter++}`,
        title: feature.substring(0, 100),
        description: feature,
        userId,
        subtasks: [],
        definitionOfDone: this.generateDoD([feature]),
        testNotes: this.generateTestNotes([feature], keywords),
        riskFlags: this.generateRiskFlags([feature], keywords, technicalRequirements),
        dependencies: [],
        blockedBy: [],
        status: 'backlog',
        priority: this.calculatePriority([feature], keywords),
        tags: this.generateTags([feature], keywords),
        createdAt: now,
        updatedAt: now
      };

      // Create subtasks for implementation phases
      const phases = ['Design', 'Implementation', 'Testing', 'Documentation'];
      phases.forEach(phase => {
        const subtaskId = generateId();
        const subtask: Subtask = {
          id: subtaskId,
          ticketId: ticketId,
          title: `${phase}: ${feature.substring(0, 50)}`,
          description: `${phase} phase for: ${feature}`,
          userId,
          definitionOfDone: this.generateDoD([`Complete ${phase.toLowerCase()}`]),
          testNotes: phase === 'Testing' ? this.generateTestNotes([feature], keywords) : [],
          riskFlags: [],
          dependencies: [],
          status: 'todo',
          estimatedHours: phase === 'Implementation' ? 8 : 2,
          createdAt: now,
          updatedAt: now
        };

        subtasks.push(subtask);
        ticket.subtasks.push(subtaskId);
      });

      tickets.push(ticket);
    });

    return {
      epics: [],
      tickets,
      subtasks,
      dependencies,
      suggestedAssignments: []
    };
  }

  /**
   * Create single-ticket breakdown
   */
  private static createSingleTicketBreakdown(
    input: IssueInput,
    userId: string,
    features: string[],
    technicalRequirements: string[],
    keywords: string[]
  ): BreakdownResult {
    const now = Date.now();
    const ticketId = generateId();

    const ticket: Ticket = {
      id: ticketId,
      taskId: 'TICKET-1',
      title: this.extractTitle(input.content) || 'New Task',
      description: input.content,
      userId,
      subtasks: [],
      definitionOfDone: this.generateDoD(features.length > 0 ? features : ['Complete implementation']),
      testNotes: this.generateTestNotes(features, keywords),
      riskFlags: this.generateRiskFlags(features, keywords, technicalRequirements),
      dependencies: [],
      blockedBy: [],
      status: 'backlog',
      priority: this.calculatePriority(features, keywords),
      tags: this.generateTags(features, keywords),
      createdAt: now,
      updatedAt: now
    };

    return {
      epics: [],
      tickets: [ticket],
      subtasks: [],
      dependencies: [],
      suggestedAssignments: []
    };
  }

  /**
   * Group features into logical tickets
   */
  private static groupFeatures(features: string[], keywords: string[]): Array<{
    title: string;
    description: string;
    features: string[];
  }> {
    const groups: Array<{ title: string; description: string; features: string[] }> = [];

    // Simple grouping by keywords
    const frontendFeatures = features.filter(f =>
      f.includes('ui') || f.includes('frontend') || f.includes('component') || f.includes('page')
    );
    const backendFeatures = features.filter(f =>
      f.includes('api') || f.includes('backend') || f.includes('server') || f.includes('database')
    );
    const otherFeatures = features.filter(f =>
      !frontendFeatures.includes(f) && !backendFeatures.includes(f)
    );

    if (frontendFeatures.length > 0) {
      groups.push({
        title: 'Frontend Implementation',
        description: 'User interface and frontend components',
        features: frontendFeatures
      });
    }

    if (backendFeatures.length > 0) {
      groups.push({
        title: 'Backend Implementation',
        description: 'API endpoints and server-side logic',
        features: backendFeatures
      });
    }

    if (otherFeatures.length > 0) {
      groups.push({
        title: 'Additional Features',
        description: 'Other implementation tasks',
        features: otherFeatures
      });
    }

    // If no grouping occurred, create a single group
    if (groups.length === 0 && features.length > 0) {
      groups.push({
        title: 'Implementation',
        description: 'Implementation tasks',
        features: features
      });
    }

    return groups;
  }

  /**
   * Extract title from content
   */
  private static extractTitle(content: string): string | null {
    const lines = content.split('\n');
    const firstLine = lines[0]?.trim();

    if (firstLine && firstLine.length < 200) {
      // Remove markdown heading markers
      return firstLine.replace(/^#+\s*/, '').substring(0, 100);
    }

    return null;
  }

  /**
   * Generate Definition of Done criteria
   */
  private static generateDoD(features: string[]): DefinitionOfDone {
    const criteria = [
      { id: generateId(), description: 'Code implemented and reviewed', completed: false },
      { id: generateId(), description: 'Unit tests written and passing', completed: false },
      { id: generateId(), description: 'Integration tests passing', completed: false },
      { id: generateId(), description: 'Documentation updated', completed: false },
      { id: generateId(), description: 'No critical bugs or security issues', completed: false }
    ];

    const acceptanceTests = features.map(f => `Verify: ${f}`);

    return { criteria, acceptanceTests };
  }

  /**
   * Generate test notes
   */
  private static generateTestNotes(features: string[], keywords: string[]): TestNote[] {
    const notes: TestNote[] = [];

    if (keywords.includes('api') || keywords.includes('backend')) {
      notes.push({
        id: generateId(),
        type: 'integration',
        description: 'Test API endpoints with various input scenarios',
        priority: 'high'
      });
    }

    if (keywords.includes('ui') || keywords.includes('frontend')) {
      notes.push({
        id: generateId(),
        type: 'e2e',
        description: 'Test user interface interactions and workflows',
        priority: 'high'
      });
    }

    notes.push({
      id: generateId(),
      type: 'unit',
      description: 'Test individual functions and components',
      priority: 'high'
    });

    return notes;
  }

  /**
   * Generate risk flags
   */
  private static generateRiskFlags(
    features: string[],
    keywords: string[],
    technicalRequirements: string[]
  ): RiskFlag[] {
    const flags: RiskFlag[] = [];

    if (keywords.includes('database') || keywords.includes('migration')) {
      flags.push({
        id: generateId(),
        severity: 'high',
        category: 'technical',
        description: 'Database changes require careful migration planning',
        mitigation: 'Create rollback plan and test migrations in staging',
        status: 'identified'
      });
    }

    if (keywords.includes('security') || keywords.includes('authentication')) {
      flags.push({
        id: generateId(),
        severity: 'critical',
        category: 'quality',
        description: 'Security-sensitive feature requires thorough review',
        mitigation: 'Conduct security audit and penetration testing',
        status: 'identified'
      });
    }

    if (keywords.includes('performance')) {
      flags.push({
        id: generateId(),
        severity: 'medium',
        category: 'technical',
        description: 'Performance requirements need benchmarking',
        mitigation: 'Set up performance monitoring and load testing',
        status: 'identified'
      });
    }

    return flags;
  }

  /**
   * Calculate priority based on keywords
   */
  private static calculatePriority(features: string[], keywords: string[]): 1 | 2 | 3 | 4 | 5 {
    const urgentKeywords = ['critical', 'urgent', 'blocker', 'security', 'bug'];
    const highKeywords = ['important', 'priority', 'needed'];

    const content = features.join(' ').toLowerCase();

    if (urgentKeywords.some(k => content.includes(k) || keywords.includes(k))) {
      return 5;
    } else if (highKeywords.some(k => content.includes(k) || keywords.includes(k))) {
      return 4;
    } else {
      return 3;
    }
  }

  /**
   * Generate tags based on content
   */
  private static generateTags(features: string[], keywords: string[]): string[] {
    const tags = new Set<string>();

    keywords.forEach(keyword => {
      if (['frontend', 'backend', 'api', 'database', 'ui', 'testing'].includes(keyword)) {
        tags.add(keyword);
      }
    });

    const content = features.join(' ').toLowerCase();
    if (content.includes('bug')) tags.add('bug');
    if (content.includes('feature')) tags.add('feature');
    if (content.includes('enhancement')) tags.add('enhancement');

    return Array.from(tags);
  }

  /**
   * Estimate hours for a task
   */
  private static estimateHours(feature: string): number {
    const length = feature.length;

    if (length < 50) return 2;
    if (length < 100) return 4;
    if (length < 200) return 8;
    return 16;
  }
}
