import {
  TaskBreakdownRequest,
  TaskBreakdownResult,
  HierarchicalTask,
  TaskDependency,
  DefinitionOfDone,
  TestNote,
  RiskFlag
} from '@/types/taskHierarchy';
import { generateId, generateTaskId } from './utils';

/**
 * Analyzes text and breaks it down into structured tasks
 * This is a rule-based implementation. In production, this could be enhanced with AI/LLM
 */
export class TaskBreakdownService {
  private static taskCounter = 0;

  /**
   * Main entry point for task breakdown
   */
  static async breakdownTask(request: TaskBreakdownRequest): Promise<TaskBreakdownResult> {
    const { source, content, context } = request;

    // Parse the content based on source type
    const parsed = this.parseContent(content, source);

    // Generate task hierarchy
    const { epics, tickets, subtasks } = this.generateTaskHierarchy(parsed, context);

    // Identify dependencies
    const dependencies = this.identifyDependencies(epics, tickets, subtasks);

    // Generate suggested assignments (placeholder - will be enhanced with agent matching)
    const suggestedAssignments = this.generateSuggestedAssignments(epics, tickets, subtasks);

    return {
      epics,
      tickets,
      subtasks,
      dependencies,
      suggestedAssignments
    };
  }

  /**
   * Parses content from different sources
   */
  private static parseContent(content: string, source: string) {
    const lines = content.split('\n').filter(line => line.trim());

    const result = {
      title: '',
      description: '',
      features: [] as string[],
      requirements: [] as string[],
      technicalNotes: [] as string[],
      risks: [] as string[]
    };

    let currentSection = 'description';

    for (const line of lines) {
      const trimmed = line.trim();

      // Detect sections
      if (trimmed.match(/^#{1,3}\s*(title|name|project)/i)) {
        currentSection = 'title';
        continue;
      } else if (trimmed.match(/^#{1,3}\s*(feature|epic|user stor)/i)) {
        currentSection = 'features';
        continue;
      } else if (trimmed.match(/^#{1,3}\s*(requirement|acceptance|criteria)/i)) {
        currentSection = 'requirements';
        continue;
      } else if (trimmed.match(/^#{1,3}\s*(technical|implementation|tech)/i)) {
        currentSection = 'technicalNotes';
        continue;
      } else if (trimmed.match(/^#{1,3}\s*(risk|concern|blocker)/i)) {
        currentSection = 'risks';
        continue;
      }

      // Extract content based on current section
      if (currentSection === 'title' && !result.title) {
        result.title = trimmed.replace(/^#+\s*/, '').replace(/^(title|name|project):\s*/i, '');
      } else if (currentSection === 'features' && (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.match(/^\d+\./))) {
        result.features.push(trimmed.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, ''));
      } else if (currentSection === 'requirements' && (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.match(/^\d+\./))) {
        result.requirements.push(trimmed.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, ''));
      } else if (currentSection === 'technicalNotes' && (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.match(/^\d+\./))) {
        result.technicalNotes.push(trimmed.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, ''));
      } else if (currentSection === 'risks' && (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.match(/^\d+\./))) {
        result.risks.push(trimmed.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, ''));
      } else if (currentSection === 'description') {
        result.description += (result.description ? '\n' : '') + trimmed;
      }
    }

    // If no explicit features found, try to extract from description
    if (result.features.length === 0 && result.description) {
      const sentences = result.description.split(/[.!?]+/).filter(s => s.trim());
      if (sentences.length > 0) {
        result.features.push(sentences[0].trim());
      }
    }

    return result;
  }

  /**
   * Generates task hierarchy from parsed content
   */
  private static generateTaskHierarchy(parsed: any, context?: any) {
    const epics: HierarchicalTask[] = [];
    const tickets: HierarchicalTask[] = [];
    const subtasks: HierarchicalTask[] = [];

    const now = Date.now();

    // Create an epic for the overall project
    if (parsed.features.length > 1 || parsed.title) {
      const epicId = generateId();
      const epic: HierarchicalTask = {
        id: epicId,
        taskId: generateTaskId(++this.taskCounter),
        title: parsed.title || 'Project Implementation',
        description: parsed.description,
        type: 'epic',
        status: 'backlog',
        priority: 3,
        tags: ['epic'],
        definitionOfDone: this.generateDoD(parsed.requirements),
        testNotes: [],
        riskFlags: this.generateRiskFlags(parsed.risks),
        dependencies: [],
        createdAt: now,
        updatedAt: now
      };
      epics.push(epic);

      // Create tickets for each feature
      parsed.features.forEach((feature: string, index: number) => {
        const ticketId = generateId();
        const ticket = this.createTicket(
          feature,
          epicId,
          parsed.technicalNotes[index] || '',
          index
        );
        tickets.push(ticket);

        // Create subtasks for each ticket
        const taskSubtasks = this.generateSubtasks(ticket, parsed.technicalNotes);
        subtasks.push(...taskSubtasks);
      });
    } else if (parsed.features.length === 1) {
      // Single feature - create just a ticket
      const ticketId = generateId();
      const ticket = this.createTicket(
        parsed.features[0],
        undefined,
        parsed.description,
        0
      );
      tickets.push(ticket);

      const taskSubtasks = this.generateSubtasks(ticket, parsed.technicalNotes);
      subtasks.push(...taskSubtasks);
    } else {
      // Fallback - create a single ticket from description
      const ticketId = generateId();
      const ticket: HierarchicalTask = {
        id: ticketId,
        taskId: generateTaskId(++this.taskCounter),
        title: parsed.title || 'Implementation Task',
        description: parsed.description,
        type: 'ticket',
        status: 'backlog',
        priority: 3,
        tags: [],
        definitionOfDone: this.generateDoD(parsed.requirements),
        testNotes: [],
        riskFlags: this.generateRiskFlags(parsed.risks),
        dependencies: [],
        createdAt: now,
        updatedAt: now
      };
      tickets.push(ticket);
    }

    return { epics, tickets, subtasks };
  }

  /**
   * Creates a ticket from a feature
   */
  private static createTicket(
    feature: string,
    parentId: string | undefined,
    description: string,
    index: number
  ): HierarchicalTask {
    const tags = this.extractTags(feature);
    const priority = this.estimatePriority(feature);

    return {
      id: generateId(),
      taskId: generateTaskId(++this.taskCounter),
      title: feature,
      description: description,
      type: 'ticket',
      parentId,
      status: 'backlog',
      priority,
      tags,
      estimatedHours: this.estimateHours(feature),
      definitionOfDone: this.generateTicketDoD(feature),
      testNotes: this.generateTestNotes(feature),
      riskFlags: this.assessRisks(feature),
      dependencies: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  /**
   * Generates subtasks for a ticket
   */
  private static generateSubtasks(
    ticket: HierarchicalTask,
    technicalNotes: string[]
  ): HierarchicalTask[] {
    const subtasks: HierarchicalTask[] = [];

    // Common implementation subtasks
    const commonSubtasks = [
      'Set up component/module structure',
      'Implement core functionality',
      'Add error handling',
      'Write unit tests',
      'Update documentation'
    ];

    // If technical notes exist, use them as subtasks
    const subtaskDescriptions = technicalNotes.length > 0
      ? technicalNotes
      : commonSubtasks.slice(0, 3);

    subtaskDescriptions.forEach((desc, index) => {
      const subtask: HierarchicalTask = {
        id: generateId(),
        taskId: generateTaskId(++this.taskCounter),
        title: desc,
        description: `Subtask for: ${ticket.title}`,
        type: 'subtask',
        parentId: ticket.id,
        status: 'backlog',
        priority: ticket.priority,
        tags: [...ticket.tags, 'subtask'],
        estimatedHours: 2,
        definitionOfDone: [
          {
            id: generateId(),
            description: 'Implementation completed',
            completed: false
          }
        ],
        testNotes: [],
        riskFlags: [],
        dependencies: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      subtasks.push(subtask);
    });

    return subtasks;
  }

  /**
   * Generates Definition of Done items
   */
  private static generateDoD(requirements: string[]): DefinitionOfDone[] {
    const dod: DefinitionOfDone[] = [
      {
        id: generateId(),
        description: 'Code implemented and reviewed',
        completed: false
      },
      {
        id: generateId(),
        description: 'All tests passing',
        completed: false
      },
      {
        id: generateId(),
        description: 'Documentation updated',
        completed: false
      }
    ];

    requirements.forEach(req => {
      dod.push({
        id: generateId(),
        description: req,
        completed: false
      });
    });

    return dod;
  }

  private static generateTicketDoD(feature: string): DefinitionOfDone[] {
    return [
      {
        id: generateId(),
        description: 'Feature implemented according to requirements',
        completed: false
      },
      {
        id: generateId(),
        description: 'Unit tests written and passing',
        completed: false
      },
      {
        id: generateId(),
        description: 'Code reviewed and approved',
        completed: false
      }
    ];
  }

  /**
   * Generates test notes based on task content
   */
  private static generateTestNotes(feature: string): TestNote[] {
    const notes: TestNote[] = [
      {
        id: generateId(),
        description: 'Verify functionality works as expected',
        testType: 'unit',
        priority: 1
      }
    ];

    // Add integration tests for API/database related features
    if (feature.match(/api|endpoint|database|backend/i)) {
      notes.push({
        id: generateId(),
        description: 'Test API integration and data flow',
        testType: 'integration',
        priority: 1
      });
    }

    // Add E2E tests for UI features
    if (feature.match(/ui|user interface|page|component|form|button/i)) {
      notes.push({
        id: generateId(),
        description: 'Test user workflow end-to-end',
        testType: 'e2e',
        priority: 2
      });
    }

    return notes;
  }

  /**
   * Generates risk flags
   */
  private static generateRiskFlags(risks: string[]): RiskFlag[] {
    return risks.map(risk => ({
      id: generateId(),
      description: risk,
      level: this.assessRiskLevel(risk),
      mitigation: this.suggestMitigation(risk)
    }));
  }

  private static assessRisks(feature: string): RiskFlag[] {
    const risks: RiskFlag[] = [];

    // Check for complexity indicators
    if (feature.match(/complex|advanced|integration|migration|refactor/i)) {
      risks.push({
        id: generateId(),
        description: 'High complexity task',
        level: 'high',
        mitigation: 'Break down into smaller subtasks, assign to senior developer'
      });
    }

    // Check for external dependencies
    if (feature.match(/third[- ]party|external|api|integration/i)) {
      risks.push({
        id: generateId(),
        description: 'External dependency',
        level: 'medium',
        mitigation: 'Verify API documentation, add fallback handling'
      });
    }

    return risks;
  }

  private static assessRiskLevel(risk: string): 'low' | 'medium' | 'high' | 'critical' {
    if (risk.match(/critical|blocker|security|data loss/i)) return 'critical';
    if (risk.match(/high|major|important/i)) return 'high';
    if (risk.match(/medium|moderate/i)) return 'medium';
    return 'low';
  }

  private static suggestMitigation(risk: string): string {
    if (risk.match(/security/i)) return 'Conduct security review and testing';
    if (risk.match(/performance/i)) return 'Add performance monitoring and optimization';
    if (risk.match(/dependency|third[- ]party/i)) return 'Verify compatibility and add fallback options';
    return 'Monitor closely and adjust as needed';
  }

  /**
   * Identifies dependencies between tasks
   */
  private static identifyDependencies(
    epics: HierarchicalTask[],
    tickets: HierarchicalTask[],
    subtasks: HierarchicalTask[]
  ): TaskDependency[] {
    const dependencies: TaskDependency[] = [];

    // Subtasks depend on their parent tickets being in progress
    subtasks.forEach(subtask => {
      if (subtask.parentId) {
        dependencies.push({
          id: generateId(),
          dependsOn: subtask.parentId,
          type: 'blocks'
        });
      }
    });

    // Identify sequential dependencies (e.g., setup -> implementation -> testing)
    const setupKeywords = ['setup', 'configure', 'initialize', 'install'];
    const testKeywords = ['test', 'verify', 'validate'];

    tickets.forEach((ticket, index) => {
      if (index > 0) {
        const prevTicket = tickets[index - 1];
        const currentIsTest = testKeywords.some(k => ticket.title.toLowerCase().includes(k));
        const prevIsSetup = setupKeywords.some(k => prevTicket.title.toLowerCase().includes(k));

        if (currentIsTest || prevIsSetup) {
          dependencies.push({
            id: generateId(),
            dependsOn: prevTicket.id,
            type: 'blocks'
          });
        }
      }
    });

    return dependencies;
  }

  /**
   * Generates suggested assignments (placeholder)
   */
  private static generateSuggestedAssignments(
    epics: HierarchicalTask[],
    tickets: HierarchicalTask[],
    subtasks: HierarchicalTask[]
  ) {
    // This will be enhanced with actual agent matching logic
    return [];
  }

  /**
   * Helper: Extract tags from feature description
   */
  private static extractTags(feature: string): string[] {
    const tags: string[] = [];

    if (feature.match(/frontend|ui|component|page|form/i)) tags.push('frontend');
    if (feature.match(/backend|api|server|database/i)) tags.push('backend');
    if (feature.match(/auth|login|signup|security/i)) tags.push('auth');
    if (feature.match(/test|testing/i)) tags.push('testing');
    if (feature.match(/bug|fix|issue/i)) tags.push('bug');
    if (feature.match(/urgent|critical|asap/i)) tags.push('urgent');

    return tags;
  }

  /**
   * Helper: Estimate priority
   */
  private static estimatePriority(feature: string): 1 | 2 | 3 | 4 | 5 {
    if (feature.match(/critical|urgent|blocker|asap/i)) return 5;
    if (feature.match(/important|high|priority/i)) return 4;
    if (feature.match(/nice[- ]to[- ]have|optional|low/i)) return 2;
    return 3;
  }

  /**
   * Helper: Estimate hours
   */
  private static estimateHours(feature: string): number {
    if (feature.match(/complex|advanced|integration|migration/i)) return 16;
    if (feature.match(/simple|quick|small|minor/i)) return 4;
    return 8;
  }
}
