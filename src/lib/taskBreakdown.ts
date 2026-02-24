import { Task, TaskType, RiskLevel, TaskBreakdown } from '@/types/task';
import { generateId, generateTaskId } from './utils';

export interface BreakdownInput {
  title: string;
  description: string;
  context?: string;
  imageUrl?: string;
}

export interface BreakdownOptions {
  maxTicketsPerEpic?: number;
  maxSubtasksPerTicket?: number;
  includeTestNotes?: boolean;
  includeRiskAssessment?: boolean;
}

/**
 * AI-powered task breakdown service
 * Analyzes an issue/PRD/screenshot and breaks it down into epics, tickets, and subtasks
 * with Definition of Done (DoD), test notes, and risk flags
 */
export class TaskBreakdownService {
  /**
   * Break down a high-level requirement into structured tasks
   */
  async breakdownTask(
    input: BreakdownInput,
    options: BreakdownOptions = {}
  ): Promise<TaskBreakdown> {
    const {
      maxTicketsPerEpic = 10,
      maxSubtasksPerTicket = 8,
      includeTestNotes = true,
      includeRiskAssessment = true,
    } = options;

    // Analyze the input and generate structured breakdown
    const analysis = await this.analyzeInput(input);

    // Create the epic
    const epic = this.createEpic(input, analysis);

    // Create tickets from the analysis
    const tickets = this.createTickets(epic, analysis, maxTicketsPerEpic);

    // Create subtasks for each ticket
    const subtasks = new Map<string, Task[]>();
    for (const ticket of tickets) {
      const ticketSubtasks = this.createSubtasks(ticket, analysis, maxSubtasksPerTicket);
      if (ticketSubtasks.length > 0) {
        subtasks.set(ticket.id, ticketSubtasks);
      }
    }

    // Add dependencies between tasks
    this.analyzeDependencies(tickets, subtasks);

    // Add risk assessment if enabled
    if (includeRiskAssessment) {
      this.assessRisks(epic, tickets, Array.from(subtasks.values()).flat());
    }

    // Add test notes if enabled
    if (includeTestNotes) {
      this.generateTestNotes(tickets, Array.from(subtasks.values()).flat());
    }

    return { epic, tickets, subtasks };
  }

  /**
   * Analyze input to extract requirements and structure
   */
  private async analyzeInput(input: BreakdownInput): Promise<InputAnalysis> {
    // This is a simplified version. In production, this would use:
    // - NLP to extract requirements
    // - Image analysis if imageUrl is provided
    // - Context analysis to identify technical stack and patterns

    const { title, description, context } = input;

    // Extract key components from description
    const components = this.extractComponents(description);
    const features = this.extractFeatures(description);
    const technicalAreas = this.identifyTechnicalAreas(description, context);
    const complexity = this.estimateComplexity(description);

    return {
      components,
      features,
      technicalAreas,
      complexity,
      estimatedHours: complexity * 8, // Rough estimate: complexity * 8 hours
    };
  }

  /**
   * Extract logical components from description
   */
  private extractComponents(description: string): string[] {
    const components: string[] = [];
    const lowerDesc = description.toLowerCase();

    // Common component patterns
    const componentPatterns = [
      { pattern: /database|db|schema|table/, name: 'Database' },
      { pattern: /ui|interface|component|view|page/, name: 'UI/Frontend' },
      { pattern: /api|endpoint|service|backend/, name: 'Backend/API' },
      { pattern: /auth|authentication|login/, name: 'Authentication' },
      { pattern: /test|testing|unit test|e2e/, name: 'Testing' },
      { pattern: /deploy|ci\/cd|pipeline|docker/, name: 'DevOps' },
      { pattern: /documentation|docs|readme/, name: 'Documentation' },
    ];

    for (const { pattern, name } of componentPatterns) {
      if (pattern.test(lowerDesc)) {
        components.push(name);
      }
    }

    return components.length > 0 ? components : ['Implementation'];
  }

  /**
   * Extract features from description
   */
  private extractFeatures(description: string): string[] {
    // Split by common delimiters and extract feature-like items
    const features: string[] = [];
    const lines = description.split(/[\n•\-*]/).filter(line => line.trim());

    for (const line of lines) {
      const trimmed = line.trim();
      // Look for action verbs indicating features
      if (/^(add|create|implement|build|develop|design|update|fix|enhance)/i.test(trimmed)) {
        features.push(trimmed);
      }
    }

    return features;
  }

  /**
   * Identify technical areas involved
   */
  private identifyTechnicalAreas(description: string, context?: string): string[] {
    const areas: string[] = [];
    const text = `${description} ${context || ''}`.toLowerCase();

    const areaPatterns = [
      { pattern: /react|next\.?js|vue|angular/, name: 'Frontend Framework' },
      { pattern: /typescript|javascript/, name: 'TypeScript/JavaScript' },
      { pattern: /node\.?js|express|fastify/, name: 'Node.js' },
      { pattern: /postgres|mysql|mongodb|supabase/, name: 'Database' },
      { pattern: /graphql|rest|api/, name: 'API Development' },
      { pattern: /tailwind|css|scss/, name: 'Styling' },
      { pattern: /websocket|realtime|sse/, name: 'Real-time Communication' },
    ];

    for (const { pattern, name } of areaPatterns) {
      if (pattern.test(text)) {
        areas.push(name);
      }
    }

    return areas;
  }

  /**
   * Estimate complexity (1-5)
   */
  private estimateComplexity(description: string): number {
    let complexity = 1;

    // Length indicator
    if (description.length > 500) complexity += 1;
    if (description.length > 1000) complexity += 1;

    // Complexity keywords
    const complexityIndicators = [
      'architecture',
      'refactor',
      'migration',
      'integration',
      'security',
      'performance',
      'scalability',
      'distributed',
    ];

    for (const indicator of complexityIndicators) {
      if (description.toLowerCase().includes(indicator)) {
        complexity += 0.5;
      }
    }

    return Math.min(5, Math.round(complexity));
  }

  /**
   * Create epic from input
   */
  private createEpic(input: BreakdownInput, analysis: InputAnalysis): Task {
    const now = Date.now();
    return {
      id: generateId(),
      taskId: generateTaskId(1),
      title: input.title,
      description: input.description,
      status: 'backlog',
      taskType: 'epic',
      priority: 5,
      tags: ['epic', ...analysis.technicalAreas.slice(0, 3)],
      estimatedHours: analysis.estimatedHours,
      definitionOfDone: this.generateEpicDoD(analysis),
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Generate Definition of Done for epic
   */
  private generateEpicDoD(analysis: InputAnalysis): string[] {
    const dod: string[] = [
      'All tickets completed and verified',
      'End-to-end testing completed successfully',
      'Code review approved by team',
      'Documentation updated',
    ];

    if (analysis.components.includes('Database')) {
      dod.push('Database migrations tested and verified');
    }

    if (analysis.components.includes('Testing')) {
      dod.push('Test coverage meets requirements (>80%)');
    }

    return dod;
  }

  /**
   * Create tickets from analysis
   */
  private createTickets(epic: Task, analysis: InputAnalysis, maxTickets: number): Task[] {
    const tickets: Task[] = [];
    const now = Date.now();

    // Create tickets based on components
    for (let i = 0; i < Math.min(analysis.components.length, maxTickets); i++) {
      const component = analysis.components[i];
      const ticket: Task = {
        id: generateId(),
        taskId: generateTaskId(100 + i + 1),
        title: `${component}: ${epic.title}`,
        description: `Implement ${component.toLowerCase()} for ${epic.title}`,
        status: 'backlog',
        taskType: 'ticket',
        parentTaskId: epic.id,
        priority: this.calculateTicketPriority(component, analysis),
        tags: [component.toLowerCase()],
        estimatedHours: Math.ceil((analysis.estimatedHours || 8) / analysis.components.length),
        definitionOfDone: this.generateTicketDoD(component),
        createdAt: now,
        updatedAt: now,
      };
      tickets.push(ticket);
    }

    // If no component-based tickets, create feature-based tickets
    if (tickets.length === 0 && analysis.features.length > 0) {
      for (let i = 0; i < Math.min(analysis.features.length, maxTickets); i++) {
        const feature = analysis.features[i];
        const ticket: Task = {
          id: generateId(),
          taskId: generateTaskId(100 + i + 1),
          title: feature.substring(0, 100),
          description: feature,
          status: 'backlog',
          taskType: 'ticket',
          parentTaskId: epic.id,
          priority: 3,
          tags: ['feature'],
          estimatedHours: Math.ceil((analysis.estimatedHours || 8) / analysis.features.length),
          definitionOfDone: ['Feature implemented', 'Tests passing', 'Code reviewed'],
          createdAt: now,
          updatedAt: now,
        };
        tickets.push(ticket);
      }
    }

    return tickets;
  }

  /**
   * Calculate ticket priority based on component and analysis
   */
  private calculateTicketPriority(component: string, analysis: InputAnalysis): 1 | 2 | 3 | 4 | 5 {
    // Database and Authentication are typically foundational
    if (component === 'Database' || component === 'Authentication') {
      return 5;
    }

    // Backend/API before frontend
    if (component === 'Backend/API') {
      return 4;
    }

    // UI after backend
    if (component === 'UI/Frontend') {
      return 3;
    }

    // Testing and docs are important but can come later
    if (component === 'Testing' || component === 'Documentation') {
      return 2;
    }

    return 3;
  }

  /**
   * Generate Definition of Done for ticket
   */
  private generateTicketDoD(component: string): string[] {
    const baseDod = [
      'Implementation complete',
      'Unit tests written and passing',
      'Code reviewed and approved',
    ];

    if (component === 'UI/Frontend') {
      return [...baseDod, 'UI matches design specs', 'Responsive on all screen sizes'];
    }

    if (component === 'Backend/API') {
      return [...baseDod, 'API documentation updated', 'Error handling implemented'];
    }

    if (component === 'Database') {
      return [...baseDod, 'Migration scripts created', 'Database indexes optimized'];
    }

    return baseDod;
  }

  /**
   * Create subtasks for a ticket
   */
  private createSubtasks(ticket: Task, analysis: InputAnalysis, maxSubtasks: number): Task[] {
    const subtasks: Task[] = [];
    const now = Date.now();

    // Generate standard subtasks based on ticket component
    const subtaskTemplates = this.getSubtaskTemplates(ticket);

    for (let i = 0; i < Math.min(subtaskTemplates.length, maxSubtasks); i++) {
      const template = subtaskTemplates[i];
      const subtask: Task = {
        id: generateId(),
        taskId: generateTaskId(1000 + parseInt(ticket.taskId.split('-')[1]) * 10 + i + 1),
        title: template.title,
        description: template.description,
        status: 'backlog',
        taskType: 'subtask',
        parentTaskId: ticket.id,
        priority: template.priority,
        tags: [template.category],
        estimatedHours: template.estimatedHours,
        definitionOfDone: template.dod,
        createdAt: now,
        updatedAt: now,
      };
      subtasks.push(subtask);
    }

    return subtasks;
  }

  /**
   * Get subtask templates based on ticket tags
   */
  private getSubtaskTemplates(ticket: Task): SubtaskTemplate[] {
    const tag = ticket.tags[0]?.toLowerCase() || '';

    if (tag.includes('database')) {
      return [
        {
          title: 'Design database schema',
          description: 'Define tables, columns, relationships, and constraints',
          category: 'database',
          priority: 5,
          estimatedHours: 2,
          dod: ['Schema documented', 'Reviewed by team'],
        },
        {
          title: 'Write migration scripts',
          description: 'Create SQL migration files for schema changes',
          category: 'database',
          priority: 4,
          estimatedHours: 1,
          dod: ['Migration scripts created', 'Rollback tested'],
        },
        {
          title: 'Implement database queries',
          description: 'Write optimized queries for CRUD operations',
          category: 'database',
          priority: 4,
          estimatedHours: 3,
          dod: ['Queries optimized', 'Indexes added'],
        },
      ];
    }

    if (tag.includes('ui') || tag.includes('frontend')) {
      return [
        {
          title: 'Create component structure',
          description: 'Set up React components and file structure',
          category: 'frontend',
          priority: 4,
          estimatedHours: 2,
          dod: ['Components created', 'Props defined'],
        },
        {
          title: 'Implement UI logic',
          description: 'Add state management and event handlers',
          category: 'frontend',
          priority: 4,
          estimatedHours: 3,
          dod: ['Logic implemented', 'State managed correctly'],
        },
        {
          title: 'Style components',
          description: 'Apply Tailwind CSS styling',
          category: 'frontend',
          priority: 3,
          estimatedHours: 2,
          dod: ['Styling matches design', 'Responsive on all devices'],
        },
      ];
    }

    if (tag.includes('backend') || tag.includes('api')) {
      return [
        {
          title: 'Define API endpoints',
          description: 'Specify REST/GraphQL endpoints and contracts',
          category: 'backend',
          priority: 5,
          estimatedHours: 1,
          dod: ['Endpoints documented', 'Contracts defined'],
        },
        {
          title: 'Implement business logic',
          description: 'Write core functionality and data processing',
          category: 'backend',
          priority: 4,
          estimatedHours: 4,
          dod: ['Logic implemented', 'Error handling added'],
        },
        {
          title: 'Add validation and error handling',
          description: 'Validate inputs and handle errors gracefully',
          category: 'backend',
          priority: 4,
          estimatedHours: 2,
          dod: ['Validation complete', 'Error responses standardized'],
        },
      ];
    }

    // Default generic subtasks
    return [
      {
        title: 'Research and design',
        description: 'Research requirements and design approach',
        category: 'planning',
        priority: 4,
        estimatedHours: 2,
        dod: ['Approach documented', 'Design reviewed'],
      },
      {
        title: 'Implementation',
        description: 'Implement core functionality',
        category: 'development',
        priority: 4,
        estimatedHours: 4,
        dod: ['Code complete', 'Tests passing'],
      },
      {
        title: 'Testing and refinement',
        description: 'Test implementation and fix issues',
        category: 'testing',
        priority: 3,
        estimatedHours: 2,
        dod: ['Tests passing', 'Edge cases covered'],
      },
    ];
  }

  /**
   * Analyze and add dependencies between tasks
   */
  private analyzeDependencies(tickets: Task[], subtasks: Map<string, Task[]>): void {
    // Sort tickets by priority (higher priority = should be done first)
    const sortedTickets = [...tickets].sort((a, b) => (b.priority - a.priority));

    // Add dependencies: database before API, API before UI
    for (let i = 0; i < sortedTickets.length - 1; i++) {
      const current = sortedTickets[i];
      const next = sortedTickets[i + 1];

      // Database should be dependency for API
      if (this.isDatabase(current) && this.isAPI(next)) {
        next.dependencies = [...(next.dependencies || []), current.id];
      }
      // API should be dependency for UI
      else if (this.isAPI(current) && this.isUI(next)) {
        next.dependencies = [...(next.dependencies || []), current.id];
      }
    }

    // Add dependencies between subtasks (sequential within same ticket)
    for (const [ticketId, ticketSubtasks] of subtasks) {
      for (let i = 1; i < ticketSubtasks.length; i++) {
        ticketSubtasks[i].dependencies = [ticketSubtasks[i - 1].id];
      }
    }
  }

  private isDatabase(task: Task): boolean {
    return task.tags.some(tag => tag.toLowerCase().includes('database'));
  }

  private isAPI(task: Task): boolean {
    return task.tags.some(tag =>
      tag.toLowerCase().includes('api') ||
      tag.toLowerCase().includes('backend')
    );
  }

  private isUI(task: Task): boolean {
    return task.tags.some(tag =>
      tag.toLowerCase().includes('ui') ||
      tag.toLowerCase().includes('frontend')
    );
  }

  /**
   * Assess risks for tasks
   */
  private assessRisks(epic: Task, tickets: Task[], subtasks: Task[]): void {
    // Epic risk is highest ticket risk
    const allTasks = [...tickets, ...subtasks];

    for (const task of allTasks) {
      task.riskLevel = this.calculateRiskLevel(task);
    }

    // Set epic risk to highest ticket risk
    const ticketRisks = tickets.map(t => this.getRiskScore(t.riskLevel || 'low'));
    const maxRisk = Math.max(...ticketRisks);
    epic.riskLevel = this.getRiskLevelFromScore(maxRisk);
  }

  /**
   * Calculate risk level for a task
   */
  private calculateRiskLevel(task: Task): RiskLevel {
    let riskScore = 0;

    // High complexity = higher risk
    if ((task.estimatedHours || 0) > 20) riskScore += 2;
    else if ((task.estimatedHours || 0) > 10) riskScore += 1;

    // Database and auth are higher risk
    if (this.isDatabase(task)) riskScore += 1;
    if (task.tags.some(tag => tag.toLowerCase().includes('auth'))) riskScore += 1;

    // Dependencies increase risk
    if ((task.dependencies || []).length > 2) riskScore += 1;

    if (riskScore >= 4) return 'critical';
    if (riskScore >= 3) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  }

  private getRiskScore(risk: RiskLevel): number {
    const scores = { low: 1, medium: 2, high: 3, critical: 4 };
    return scores[risk];
  }

  private getRiskLevelFromScore(score: number): RiskLevel {
    if (score >= 4) return 'critical';
    if (score >= 3) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  /**
   * Generate test notes for tasks
   */
  private generateTestNotes(tickets: Task[], subtasks: Task[]): void {
    for (const task of [...tickets, ...subtasks]) {
      task.testNotes = this.generateTestNotesForTask(task);
    }
  }

  /**
   * Generate test notes for a specific task
   */
  private generateTestNotesForTask(task: Task): string {
    const notes: string[] = [];

    if (this.isDatabase(task)) {
      notes.push('- Test migrations up and down');
      notes.push('- Verify constraints and relationships');
      notes.push('- Test query performance with sample data');
    } else if (this.isAPI(task)) {
      notes.push('- Test all endpoints with valid/invalid inputs');
      notes.push('- Verify error handling and status codes');
      notes.push('- Test authentication and authorization');
    } else if (this.isUI(task)) {
      notes.push('- Test on different screen sizes');
      notes.push('- Verify accessibility (keyboard navigation, screen readers)');
      notes.push('- Test user interactions and edge cases');
    } else {
      notes.push('- Write unit tests for core functionality');
      notes.push('- Test edge cases and error scenarios');
      notes.push('- Verify integration with dependent components');
    }

    return notes.join('\n');
  }
}

interface InputAnalysis {
  components: string[];
  features: string[];
  technicalAreas: string[];
  complexity: number;
  estimatedHours: number;
}

interface SubtaskTemplate {
  title: string;
  description: string;
  category: string;
  priority: 1 | 2 | 3 | 4 | 5;
  estimatedHours: number;
  dod: string[];
}

// Singleton instance
export const taskBreakdownService = new TaskBreakdownService();
