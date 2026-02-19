import {
  BreakdownInput,
  BreakdownResult,
  Epic,
  Ticket,
  Subtask,
  TaskDependency,
  DefinitionOfDone,
  TestNote,
  RiskFlag,
  RiskLevel,
} from '@/types/breakdown';
import { generateId } from '@/lib/utils';

/**
 * AI-powered task breakdown service
 * This is a template that can be extended with actual AI providers (OpenAI, Claude, etc.)
 */

interface AIProvider {
  analyzeAndBreakdown(input: BreakdownInput): Promise<BreakdownResult>;
}

/**
 * Mock AI provider for demonstration
 * Replace this with actual AI API calls (OpenAI, Claude, etc.)
 */
class MockAIProvider implements AIProvider {
  async analyzeAndBreakdown(input: BreakdownInput): Promise<BreakdownResult> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const userId = 'mock-user-id'; // This should come from auth context
    const now = Date.now();

    // Parse the input to extract meaningful information
    const analysis = this.parseInput(input);

    // Generate epic
    const epic: Epic = {
      id: generateId(),
      epicId: `EPIC-${Math.floor(Math.random() * 1000)}`,
      title: analysis.title,
      description: analysis.description,
      status: 'planning',
      priority: analysis.priority,
      tags: analysis.tags,
      estimatedStoryPoints: analysis.estimatedPoints,
      createdAt: now,
      updatedAt: now,
      userId,
    };

    // Generate tickets
    const tickets: Ticket[] = analysis.features.map((feature, idx) => ({
      id: generateId(),
      ticketId: `TICKET-${Math.floor(Math.random() * 1000)}`,
      epicId: epic.id,
      title: feature.title,
      description: feature.description,
      taskType: 'ticket' as const,
      status: 'backlog',
      priority: feature.priority,
      tags: feature.tags,
      estimatedHours: feature.estimatedHours,
      definitionOfDone: this.generateDoD(feature.title),
      testNotes: this.generateTestNotes(feature.title),
      riskFlags: this.generateRiskFlags(feature.title, feature.priority),
      createdAt: now,
      updatedAt: now,
      userId,
    }));

    // Generate subtasks
    const subtasks: Subtask[] = tickets.flatMap(ticket =>
      this.generateSubtasks(ticket, userId, now)
    );

    // Generate dependencies
    const dependencies: TaskDependency[] = this.generateDependencies(tickets);

    return {
      epic,
      tickets,
      subtasks,
      dependencies,
      summary: this.generateSummary(epic, tickets, subtasks),
      aiConfidence: 0.85, // Mock confidence score
    };
  }

  private parseInput(input: BreakdownInput): any {
    // Simple parsing logic - in real implementation, this would use AI
    const content = input.content.toLowerCase();

    let priority: 1 | 2 | 3 | 4 | 5 = 3;
    if (content.includes('urgent') || content.includes('critical')) priority = 5;
    else if (content.includes('important') || content.includes('high')) priority = 4;
    else if (content.includes('low priority')) priority = 2;

    const tags: string[] = [];
    if (content.includes('frontend') || content.includes('ui') || content.includes('react')) tags.push('frontend');
    if (content.includes('backend') || content.includes('api') || content.includes('server')) tags.push('backend');
    if (content.includes('database') || content.includes('sql')) tags.push('database');
    if (content.includes('bug') || content.includes('fix')) tags.push('bug');
    if (content.includes('feature')) tags.push('feature');

    // Extract features/tasks from content
    const features = this.extractFeatures(input.content);

    return {
      title: this.extractTitle(input.content),
      description: input.content,
      priority,
      tags,
      estimatedPoints: features.length * 3,
      features,
    };
  }

  private extractTitle(content: string): string {
    // Try to extract a title from the first line or first sentence
    const firstLine = content.split('\n')[0];
    if (firstLine.length > 0 && firstLine.length < 100) {
      return firstLine.replace(/^#+\s*/, '').trim();
    }
    return 'New Feature Implementation';
  }

  private extractFeatures(content: string): Array<{
    title: string;
    description: string;
    priority: 1 | 2 | 3 | 4 | 5;
    tags: string[];
    estimatedHours: number;
  }> {
    // Simple feature extraction - look for bullet points or numbered lists
    const lines = content.split('\n');
    const features: Array<any> = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^[-*]\s+/) || trimmed.match(/^\d+\.\s+/)) {
        const text = trimmed.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '');
        if (text.length > 5) {
          features.push({
            title: text.length > 80 ? text.substring(0, 80) + '...' : text,
            description: text,
            priority: 3 as 1 | 2 | 3 | 4 | 5,
            tags: this.inferTags(text),
            estimatedHours: this.estimateHours(text),
          });
        }
      }
    }

    // If no features found, create a default one
    if (features.length === 0) {
      features.push({
        title: 'Implement main functionality',
        description: content.substring(0, 200),
        priority: 3 as 1 | 2 | 3 | 4 | 5,
        tags: ['feature'],
        estimatedHours: 8,
      });
    }

    return features;
  }

  private inferTags(text: string): string[] {
    const tags: string[] = [];
    const lower = text.toLowerCase();

    if (lower.match(/\b(ui|ux|design|interface|component)\b/)) tags.push('frontend');
    if (lower.match(/\b(api|endpoint|server|backend)\b/)) tags.push('backend');
    if (lower.match(/\b(database|db|sql|query)\b/)) tags.push('database');
    if (lower.match(/\b(test|testing|unit test|integration)\b/)) tags.push('testing');
    if (lower.match(/\b(deploy|ci|cd|devops|docker)\b/)) tags.push('devops');

    return tags.length > 0 ? tags : ['feature'];
  }

  private estimateHours(text: string): number {
    const lower = text.toLowerCase();
    if (lower.includes('simple') || lower.includes('quick')) return 2;
    if (lower.includes('complex') || lower.includes('difficult')) return 16;
    return 8; // Default estimate
  }

  private generateDoD(taskTitle: string): DefinitionOfDone[] {
    const baseDoD: DefinitionOfDone[] = [
      {
        id: generateId(),
        description: 'Code implementation completed',
        completed: false,
      },
      {
        id: generateId(),
        description: 'Unit tests written and passing',
        completed: false,
      },
      {
        id: generateId(),
        description: 'Code review completed',
        completed: false,
      },
      {
        id: generateId(),
        description: 'Documentation updated',
        completed: false,
      },
    ];

    // Add specific DoD items based on task type
    if (taskTitle.toLowerCase().includes('api') || taskTitle.toLowerCase().includes('endpoint')) {
      baseDoD.push({
        id: generateId(),
        description: 'API documentation generated',
        completed: false,
      });
    }

    if (taskTitle.toLowerCase().includes('ui') || taskTitle.toLowerCase().includes('interface')) {
      baseDoD.push({
        id: generateId(),
        description: 'UI/UX design approved',
        completed: false,
      });
    }

    return baseDoD;
  }

  private generateTestNotes(taskTitle: string): TestNote[] {
    const notes: TestNote[] = [
      {
        id: generateId(),
        type: 'unit',
        description: 'Test core functionality with unit tests',
        testCase: 'Verify main function behavior with various inputs',
      },
    ];

    if (taskTitle.toLowerCase().includes('api') || taskTitle.toLowerCase().includes('endpoint')) {
      notes.push({
        id: generateId(),
        type: 'integration',
        description: 'Test API endpoints with integration tests',
        testCase: 'Verify request/response handling and error cases',
      });
    }

    if (taskTitle.toLowerCase().includes('ui') || taskTitle.toLowerCase().includes('user')) {
      notes.push({
        id: generateId(),
        type: 'e2e',
        description: 'End-to-end user flow testing',
        testCase: 'Test complete user journey from start to finish',
      });
    }

    return notes;
  }

  private generateRiskFlags(taskTitle: string, priority: number): RiskFlag[] {
    const risks: RiskFlag[] = [];

    // High priority tasks have inherent risk
    if (priority >= 4) {
      risks.push({
        id: generateId(),
        level: 'high' as RiskLevel,
        description: 'High priority task requires careful attention',
        mitigation: 'Assign experienced team member and allocate buffer time',
      });
    }

    // Identify technical risks
    if (taskTitle.toLowerCase().includes('database') || taskTitle.toLowerCase().includes('migration')) {
      risks.push({
        id: generateId(),
        level: 'high' as RiskLevel,
        description: 'Database changes can affect data integrity',
        mitigation: 'Create backup before migration, test in staging environment',
      });
    }

    if (taskTitle.toLowerCase().includes('security') || taskTitle.toLowerCase().includes('auth')) {
      risks.push({
        id: generateId(),
        level: 'critical' as RiskLevel,
        description: 'Security-related changes require thorough review',
        mitigation: 'Security audit required, penetration testing recommended',
      });
    }

    if (taskTitle.toLowerCase().includes('complex') || taskTitle.toLowerCase().includes('refactor')) {
      risks.push({
        id: generateId(),
        level: 'medium' as RiskLevel,
        description: 'Complex changes may introduce unexpected bugs',
        mitigation: 'Comprehensive testing and gradual rollout',
      });
    }

    return risks;
  }

  private generateSubtasks(ticket: Ticket, userId: string, now: number): Subtask[] {
    const subtasks: Subtask[] = [
      {
        id: generateId(),
        subtaskId: `SUB-${Math.floor(Math.random() * 10000)}`,
        parentTicketId: ticket.id,
        title: 'Set up development environment',
        description: 'Prepare necessary tools, dependencies, and configurations',
        status: 'todo',
        estimatedMinutes: 30,
        createdAt: now,
        updatedAt: now,
        userId,
      },
      {
        id: generateId(),
        subtaskId: `SUB-${Math.floor(Math.random() * 10000)}`,
        parentTicketId: ticket.id,
        title: 'Implement core functionality',
        description: 'Write the main implementation code',
        status: 'todo',
        estimatedMinutes: 180,
        createdAt: now,
        updatedAt: now,
        userId,
      },
      {
        id: generateId(),
        subtaskId: `SUB-${Math.floor(Math.random() * 10000)}`,
        parentTicketId: ticket.id,
        title: 'Write tests',
        description: 'Create unit and integration tests',
        status: 'todo',
        estimatedMinutes: 90,
        createdAt: now,
        updatedAt: now,
        userId,
      },
      {
        id: generateId(),
        subtaskId: `SUB-${Math.floor(Math.random() * 10000)}`,
        parentTicketId: ticket.id,
        title: 'Code review and refinement',
        description: 'Review code, address feedback, and refine',
        status: 'todo',
        estimatedMinutes: 60,
        createdAt: now,
        updatedAt: now,
        userId,
      },
    ];

    return subtasks;
  }

  private generateDependencies(tickets: Ticket[]): TaskDependency[] {
    const dependencies: TaskDependency[] = [];

    // Create logical dependencies between tickets
    for (let i = 1; i < tickets.length; i++) {
      const currentTicket = tickets[i];
      const prevTicket = tickets[i - 1];

      // Backend tasks often need to be completed before frontend
      if (
        prevTicket.tags.includes('backend') &&
        currentTicket.tags.includes('frontend')
      ) {
        dependencies.push({
          id: generateId(),
          sourceTaskId: currentTicket.ticketId,
          targetTaskId: prevTicket.ticketId,
          dependencyType: 'blocks',
          createdAt: Date.now(),
        });
      }

      // Database migrations should be done before backend
      if (
        prevTicket.tags.includes('database') &&
        currentTicket.tags.includes('backend')
      ) {
        dependencies.push({
          id: generateId(),
          sourceTaskId: currentTicket.ticketId,
          targetTaskId: prevTicket.ticketId,
          dependencyType: 'blocks',
          createdAt: Date.now(),
        });
      }
    }

    return dependencies;
  }

  private generateSummary(epic: Epic, tickets: Ticket[], subtasks: Subtask[]): string {
    const totalHours = tickets.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const highPriorityCount = tickets.filter(t => t.priority >= 4).length;
    const totalRisks = tickets.reduce((sum, t) => sum + t.riskFlags.length, 0);

    return `Breakdown Summary:
- Epic: ${epic.title}
- Total Tickets: ${tickets.length}
- Total Subtasks: ${subtasks.length}
- Estimated Hours: ${totalHours}
- High Priority Items: ${highPriorityCount}
- Identified Risks: ${totalRisks}

This breakdown includes definition of done criteria, test notes, and risk assessments for each ticket.`;
  }
}

/**
 * OpenAI Provider (placeholder - requires API key)
 */
class OpenAIProvider implements AIProvider {
  constructor(private apiKey: string) {}

  async analyzeAndBreakdown(input: BreakdownInput): Promise<BreakdownResult> {
    // TODO: Implement OpenAI API integration
    // Use GPT-4 to analyze the input and generate structured breakdown
    throw new Error('OpenAI provider not yet implemented. Please configure your API key.');
  }
}

/**
 * Main AI Breakdown Service
 */
export class AIBreakdownService {
  private provider: AIProvider;

  constructor(provider: 'mock' | 'openai' = 'mock', apiKey?: string) {
    if (provider === 'openai') {
      if (!apiKey) {
        throw new Error('API key required for OpenAI provider');
      }
      this.provider = new OpenAIProvider(apiKey);
    } else {
      this.provider = new MockAIProvider();
    }
  }

  async breakdownTask(input: BreakdownInput): Promise<BreakdownResult> {
    return this.provider.analyzeAndBreakdown(input);
  }

  async breakdownFromGitHubIssue(issueUrl: string, context?: string): Promise<BreakdownResult> {
    // TODO: Fetch GitHub issue content via API
    return this.breakdownTask({
      type: 'github-issue',
      content: issueUrl,
      context,
    });
  }

  async breakdownFromPRD(prdText: string, context?: string): Promise<BreakdownResult> {
    return this.breakdownTask({
      type: 'prd-text',
      content: prdText,
      context,
    });
  }

  async breakdownFromScreenshot(base64Image: string, context?: string): Promise<BreakdownResult> {
    return this.breakdownTask({
      type: 'screenshot',
      content: base64Image,
      context,
    });
  }
}

// Export singleton instance
export const aiBreakdownService = new AIBreakdownService('mock');
