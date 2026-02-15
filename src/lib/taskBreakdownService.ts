import { Task } from '@/types/task';
import {
  TaskBreakdown,
  TaskDependency,
  TaskHierarchy,
  ParsedTaskInput,
  BreakdownResult,
  DefinitionOfDone,
  TestNote,
  RiskFlag,
  TaskType
} from '@/types/taskBreakdown';

/**
 * Task Breakdown Service
 * Handles parsing of issues/PRDs/screenshots and breaking them down into epics, tickets, and subtasks
 */

export class TaskBreakdownService {
  /**
   * Parse input and generate task breakdown
   */
  static async parseAndBreakdown(input: ParsedTaskInput): Promise<BreakdownResult> {
    const content = input.content.toLowerCase();

    // Simple AI-powered parsing logic (can be enhanced with actual AI/LLM integration)
    const hierarchy = await this.generateHierarchy(input);
    const dependencies = this.inferDependencies(hierarchy);
    const suggestedAssignments = this.suggestAssignments(hierarchy);

    return {
      hierarchy,
      dependencies,
      suggestedAssignments
    };
  }

  /**
   * Generate task hierarchy from parsed input
   */
  private static async generateHierarchy(input: ParsedTaskInput): Promise<TaskHierarchy> {
    const content = input.content;
    const lines = content.split('\n').filter(line => line.trim());

    // Detect if this is an epic-level task
    const isEpic = this.detectEpic(content);
    const tickets: TaskBreakdown[] = [];
    const subtasks: TaskBreakdown[] = [];
    let epic: TaskBreakdown | undefined;

    if (isEpic) {
      epic = this.createTaskBreakdown('epic', content, []);

      // Extract tickets from epic
      const extractedTickets = this.extractTickets(content);
      for (const ticketContent of extractedTickets) {
        const ticket = this.createTaskBreakdown('ticket', ticketContent, epic ? [epic.id] : []);
        tickets.push(ticket);

        // Extract subtasks for each ticket
        const extractedSubtasks = this.extractSubtasks(ticketContent);
        for (const subtaskContent of extractedSubtasks) {
          const subtask = this.createTaskBreakdown('subtask', subtaskContent, [ticket.id]);
          subtasks.push(subtask);
        }
      }
    } else {
      // Single ticket with potential subtasks
      const ticket = this.createTaskBreakdown('ticket', content, []);
      tickets.push(ticket);

      const extractedSubtasks = this.extractSubtasks(content);
      for (const subtaskContent of extractedSubtasks) {
        const subtask = this.createTaskBreakdown('subtask', subtaskContent, [ticket.id]);
        subtasks.push(subtask);
      }
    }

    return { epic, tickets, subtasks };
  }

  /**
   * Detect if content describes an epic
   */
  private static detectEpic(content: string): boolean {
    const epicKeywords = [
      'epic:',
      'large feature',
      'major initiative',
      'multiple tickets',
      'phases:',
      'milestones:',
      'release',
      'version'
    ];

    const lowerContent = content.toLowerCase();
    return epicKeywords.some(keyword => lowerContent.includes(keyword)) ||
           content.split('\n').length > 20; // Long content likely an epic
  }

  /**
   * Extract tickets from content
   */
  private static extractTickets(content: string): string[] {
    const tickets: string[] = [];
    const lines = content.split('\n');

    let currentTicket = '';
    let inTicket = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Detect ticket headers
      if (this.isTicketHeader(trimmed)) {
        if (currentTicket) {
          tickets.push(currentTicket.trim());
        }
        currentTicket = trimmed;
        inTicket = true;
      } else if (inTicket && trimmed) {
        currentTicket += '\n' + trimmed;
      }
    }

    if (currentTicket) {
      tickets.push(currentTicket.trim());
    }

    // If no explicit tickets found, create one from the whole content
    if (tickets.length === 0) {
      tickets.push(content);
    }

    return tickets;
  }

  /**
   * Check if a line is a ticket header
   */
  private static isTicketHeader(line: string): boolean {
    const ticketPatterns = [
      /^##\s+/,           // Markdown H2
      /^ticket\s*\d+:/i,  // "Ticket 1:"
      /^task\s*\d+:/i,    // "Task 1:"
      /^feature\s*\d+:/i, // "Feature 1:"
      /^-\s+\[.*\]/,      // Checkbox list
      /^\d+\.\s+/         // Numbered list
    ];

    return ticketPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Extract subtasks from content
   */
  private static extractSubtasks(content: string): string[] {
    const subtasks: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Detect subtask patterns
      if (this.isSubtaskItem(trimmed)) {
        subtasks.push(trimmed.replace(/^[-*]\s*/, '').replace(/^\[.\]\s*/, ''));
      }
    }

    return subtasks;
  }

  /**
   * Check if a line is a subtask item
   */
  private static isSubtaskItem(line: string): boolean {
    const subtaskPatterns = [
      /^-\s+[A-Z]/,       // "- Task"
      /^\*\s+[A-Z]/,      // "* Task"
      /^-\s+\[.\]\s+/,    // "- [ ] Task"
      /^\*\s+\[.\]\s+/    // "* [ ] Task"
    ];

    return subtaskPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Create a task breakdown object
   */
  private static createTaskBreakdown(
    type: TaskType,
    content: string,
    parentIds: string[]
  ): TaskBreakdown {
    const now = Date.now();
    const id = `tb_${type}_${Math.random().toString(36).substr(2, 9)}`;

    // Extract title (first line or first sentence)
    const title = content.split('\n')[0].trim().substring(0, 100);

    // Generate DoD, test notes, and risk flags based on content
    const definitionOfDone = this.generateDoD(content, type);
    const testNotes = this.generateTestNotes(content, type);
    const riskFlags = this.detectRisks(content);
    const acceptanceCriteria = this.extractAcceptanceCriteria(content);

    return {
      id,
      taskId: '', // Will be set when linked to actual task
      type,
      parentId: parentIds[0],
      childIds: [],
      definitionOfDone,
      testNotes,
      riskFlags,
      estimatedHours: this.estimateHours(content, type),
      acceptanceCriteria,
      technicalNotes: this.extractTechnicalNotes(content),
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Generate Definition of Done items
   */
  private static generateDoD(content: string, type: TaskType): DefinitionOfDone[] {
    const dod: DefinitionOfDone[] = [];
    const baseItems = [
      'Code is written and reviewed',
      'Tests are written and passing',
      'Documentation is updated'
    ];

    if (type === 'epic') {
      baseItems.push('All tickets are completed', 'Integration testing completed');
    } else if (type === 'ticket') {
      baseItems.push('All subtasks are completed', 'Code is merged to main branch');
    }

    baseItems.forEach((item, index) => {
      dod.push({
        id: `dod_${index}_${Math.random().toString(36).substr(2, 9)}`,
        description: item,
        completed: false
      });
    });

    return dod;
  }

  /**
   * Generate test notes
   */
  private static generateTestNotes(content: string, type: TaskType): TestNote[] {
    const testNotes: TestNote[] = [];
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('api') || lowerContent.includes('backend')) {
      testNotes.push({
        id: `test_${Math.random().toString(36).substr(2, 9)}`,
        type: 'integration',
        description: 'API integration tests',
        status: 'pending'
      });
    }

    if (lowerContent.includes('ui') || lowerContent.includes('frontend') || lowerContent.includes('component')) {
      testNotes.push({
        id: `test_${Math.random().toString(36).substr(2, 9)}`,
        type: 'unit',
        description: 'Component unit tests',
        status: 'pending'
      });
    }

    if (type === 'epic' || lowerContent.includes('e2e') || lowerContent.includes('end-to-end')) {
      testNotes.push({
        id: `test_${Math.random().toString(36).substr(2, 9)}`,
        type: 'e2e',
        description: 'End-to-end user flow tests',
        status: 'pending'
      });
    }

    return testNotes;
  }

  /**
   * Detect and create risk flags
   */
  private static detectRisks(content: string): RiskFlag[] {
    const risks: RiskFlag[] = [];
    const lowerContent = content.toLowerCase();

    const riskPatterns = [
      { keywords: ['database migration', 'schema change'], level: 'high' as const, description: 'Database schema changes require careful migration' },
      { keywords: ['breaking change', 'backward compatibility'], level: 'critical' as const, description: 'Breaking changes may affect existing users' },
      { keywords: ['security', 'authentication', 'authorization'], level: 'high' as const, description: 'Security-related changes require thorough review' },
      { keywords: ['performance', 'optimization', 'slow'], level: 'medium' as const, description: 'Performance impact needs to be measured' },
      { keywords: ['third-party', 'external api', 'dependency'], level: 'medium' as const, description: 'External dependencies may introduce instability' },
      { keywords: ['complex', 'difficult', 'challenging'], level: 'medium' as const, description: 'Complex implementation may require more time' }
    ];

    riskPatterns.forEach(pattern => {
      if (pattern.keywords.some(keyword => lowerContent.includes(keyword))) {
        risks.push({
          id: `risk_${Math.random().toString(36).substr(2, 9)}`,
          level: pattern.level,
          description: pattern.description,
          resolved: false
        });
      }
    });

    return risks;
  }

  /**
   * Extract acceptance criteria
   */
  private static extractAcceptanceCriteria(content: string): string[] {
    const criteria: string[] = [];
    const lines = content.split('\n');

    let inCriteriaSection = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (/acceptance criteria/i.test(trimmed)) {
        inCriteriaSection = true;
        continue;
      }

      if (inCriteriaSection && (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed))) {
        criteria.push(trimmed.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, ''));
      } else if (inCriteriaSection && /^##/.test(trimmed)) {
        inCriteriaSection = false;
      }
    }

    // If no explicit criteria, generate some
    if (criteria.length === 0) {
      criteria.push('Feature works as described');
      criteria.push('No regressions in existing functionality');
      criteria.push('Code passes all tests');
    }

    return criteria;
  }

  /**
   * Extract technical notes
   */
  private static extractTechnicalNotes(content: string): string {
    const lines = content.split('\n');
    const technicalKeywords = ['technical', 'implementation', 'architecture', 'design', 'approach'];

    let notes = '';
    let inTechnicalSection = false;

    for (const line of lines) {
      const trimmed = line.trim();
      const lowerLine = trimmed.toLowerCase();

      if (technicalKeywords.some(keyword => lowerLine.includes(keyword))) {
        inTechnicalSection = true;
        notes += trimmed + '\n';
      } else if (inTechnicalSection && trimmed) {
        notes += trimmed + '\n';
      } else if (inTechnicalSection && !trimmed) {
        inTechnicalSection = false;
      }
    }

    return notes.trim();
  }

  /**
   * Estimate hours based on content and type
   */
  private static estimateHours(content: string, type: TaskType): number {
    const wordCount = content.split(/\s+/).length;

    if (type === 'epic') {
      return Math.max(40, wordCount * 0.5);
    } else if (type === 'ticket') {
      return Math.max(4, wordCount * 0.1);
    } else {
      return Math.max(1, wordCount * 0.05);
    }
  }

  /**
   * Infer dependencies between tasks
   */
  private static inferDependencies(hierarchy: TaskHierarchy): TaskDependency[] {
    const dependencies: TaskDependency[] = [];

    // Tickets depend on epic
    if (hierarchy.epic) {
      hierarchy.tickets.forEach(ticket => {
        dependencies.push({
          id: `dep_${Math.random().toString(36).substr(2, 9)}`,
          sourceTaskId: ticket.id,
          targetTaskId: hierarchy.epic!.id,
          type: 'depends-on',
          createdAt: Date.now()
        });
      });
    }

    // Subtasks depend on their parent tickets
    hierarchy.subtasks.forEach(subtask => {
      if (subtask.parentId) {
        dependencies.push({
          id: `dep_${Math.random().toString(36).substr(2, 9)}`,
          sourceTaskId: subtask.id,
          targetTaskId: subtask.parentId,
          type: 'depends-on',
          createdAt: Date.now()
        });
      }
    });

    return dependencies;
  }

  /**
   * Suggest task assignments based on content analysis
   */
  private static suggestAssignments(hierarchy: TaskHierarchy): Array<{
    taskId: string;
    agentId: string;
    confidence: number;
    reason: string;
  }> {
    const suggestions: Array<{
      taskId: string;
      agentId: string;
      confidence: number;
      reason: string;
    }> = [];

    const allTasks = [
      ...(hierarchy.epic ? [hierarchy.epic] : []),
      ...hierarchy.tickets,
      ...hierarchy.subtasks
    ];

    // This is a placeholder - will be enhanced with actual agent skill matching
    // For now, we just return empty suggestions
    // In production, this would integrate with the AgentOrchestrationService

    return suggestions;
  }
}
