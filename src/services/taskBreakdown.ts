import {
  TaskBreakdownRequest,
  TaskBreakdownResult,
  ExtendedTask,
  TaskDependency,
  DefinitionOfDone,
  TestNote,
  RiskFlag,
  TaskType,
} from '@/types/taskHierarchy';
import { TaskStatus } from '@/types/task';
import { generateId, generateTaskId } from '@/lib/utils';

/**
 * AI-powered task breakdown service
 * This analyzes issues, PRDs, or screenshots and breaks them down into epics, tickets, and subtasks
 */
export class TaskBreakdownService {
  /**
   * Main method to break down a request into structured tasks
   */
  async breakdown(request: TaskBreakdownRequest): Promise<TaskBreakdownResult> {
    const content = request.content.toLowerCase();

    // Parse the content and extract key information
    const parsedInfo = this.parseContent(content);

    // Generate epics from main features
    const epics = this.generateEpics(parsedInfo);

    // Generate tickets for each epic
    const tickets = this.generateTickets(epics, parsedInfo);

    // Generate subtasks for each ticket
    const subtasks = this.generateSubtasks(tickets, parsedInfo);

    // Determine dependencies
    const dependencies = this.analyzeDependencies([...epics, ...tickets, ...subtasks]);

    // Calculate estimates
    const estimatedTotalHours = this.calculateTotalHours([...epics, ...tickets, ...subtasks]);

    // Calculate risk summary
    const riskSummary = this.calculateRiskSummary([...epics, ...tickets, ...subtasks]);

    return {
      epics,
      tickets,
      subtasks,
      dependencies,
      suggestedAgentAssignments: new Map(),
      estimatedTotalHours,
      riskSummary,
    };
  }

  private parseContent(content: string): ParsedInfo {
    const features: string[] = [];
    const technologies: string[] = [];
    const requirements: string[] = [];
    const risks: string[] = [];

    // Extract features (look for common patterns)
    const featurePatterns = [
      /implement\s+([^.]+)/gi,
      /add\s+([^.]+)/gi,
      /create\s+([^.]+)/gi,
      /build\s+([^.]+)/gi,
      /develop\s+([^.]+)/gi,
    ];

    featurePatterns.forEach((pattern) => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length < 100) {
          features.push(match[1].trim());
        }
      }
    });

    // Extract technologies
    const techKeywords = [
      'react', 'vue', 'angular', 'node', 'express', 'nextjs', 'typescript',
      'javascript', 'python', 'django', 'flask', 'postgresql', 'mongodb',
      'redis', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'graphql',
      'rest', 'api', 'authentication', 'oauth', 'jwt', 'supabase'
    ];

    techKeywords.forEach((tech) => {
      if (content.includes(tech)) {
        technologies.push(tech);
      }
    });

    // Extract requirements (must/should/need patterns)
    const reqPatterns = [
      /must\s+([^.]+)/gi,
      /should\s+([^.]+)/gi,
      /need\s+to\s+([^.]+)/gi,
      /required\s+to\s+([^.]+)/gi,
    ];

    reqPatterns.forEach((pattern) => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length < 100) {
          requirements.push(match[1].trim());
        }
      }
    });

    // Identify potential risks
    const riskKeywords = ['security', 'performance', 'scalability', 'migration', 'breaking change', 'complex'];
    riskKeywords.forEach((keyword) => {
      if (content.includes(keyword)) {
        risks.push(keyword);
      }
    });

    return {
      features: features.length > 0 ? features : ['Main Feature Implementation'],
      technologies,
      requirements,
      risks,
      hasAuth: content.includes('auth') || content.includes('login'),
      hasDatabase: content.includes('database') || content.includes('db') || content.includes('data'),
      hasUI: content.includes('ui') || content.includes('interface') || content.includes('design'),
      hasAPI: content.includes('api') || content.includes('endpoint'),
      hasTesting: content.includes('test') || content.includes('testing'),
    };
  }

  private generateEpics(parsedInfo: ParsedInfo): ExtendedTask[] {
    const epics: ExtendedTask[] = [];
    const timestamp = Date.now();

    // Group features into logical epics
    const epicGroups = this.groupFeaturesIntoEpics(parsedInfo);

    epicGroups.forEach((group, index) => {
      const epic = this.createBaseTask({
        taskType: 'epic',
        title: group.title,
        description: group.description,
        priority: group.priority,
        tags: group.tags,
        complexity: group.complexity,
        skillsRequired: group.skillsRequired,
        timestamp,
        index,
      });

      epic.definitionOfDone = this.generateDoD(epic);
      epic.testNotes = this.generateTestNotes(epic);
      epic.riskFlags = this.generateRiskFlags(epic, parsedInfo);
      epic.estimatedHours = this.estimateHours(epic);

      epics.push(epic);
    });

    return epics;
  }

  private groupFeaturesIntoEpics(parsedInfo: ParsedInfo): EpicGroup[] {
    const groups: EpicGroup[] = [];

    // Authentication epic
    if (parsedInfo.hasAuth) {
      groups.push({
        title: 'User Authentication & Authorization',
        description: 'Implement complete authentication system with user management',
        priority: 5,
        tags: ['auth', 'security', 'backend'],
        complexity: 'high',
        skillsRequired: ['backend', 'security'],
      });
    }

    // UI/Frontend epic
    if (parsedInfo.hasUI) {
      groups.push({
        title: 'User Interface & Experience',
        description: 'Design and implement user-facing components and interactions',
        priority: 4,
        tags: ['frontend', 'ui', 'ux'],
        complexity: 'medium',
        skillsRequired: ['frontend', 'ui-ux'],
      });
    }

    // API epic
    if (parsedInfo.hasAPI) {
      groups.push({
        title: 'API Development',
        description: 'Create and document RESTful API endpoints',
        priority: 5,
        tags: ['api', 'backend'],
        complexity: 'medium',
        skillsRequired: ['backend', 'api-design'],
      });
    }

    // Database epic
    if (parsedInfo.hasDatabase) {
      groups.push({
        title: 'Database Design & Implementation',
        description: 'Design schema and implement database layer',
        priority: 5,
        tags: ['database', 'backend'],
        complexity: 'high',
        skillsRequired: ['database', 'backend'],
      });
    }

    // Testing epic
    if (parsedInfo.hasTesting) {
      groups.push({
        title: 'Testing & Quality Assurance',
        description: 'Implement comprehensive testing strategy',
        priority: 3,
        tags: ['testing', 'qa'],
        complexity: 'medium',
        skillsRequired: ['testing'],
      });
    }

    // Default epic if none match
    if (groups.length === 0) {
      groups.push({
        title: parsedInfo.features[0] || 'Feature Implementation',
        description: 'Implement requested feature',
        priority: 4,
        tags: ['feature'],
        complexity: 'medium',
        skillsRequired: ['frontend', 'backend'],
      });
    }

    return groups;
  }

  private generateTickets(epics: ExtendedTask[], parsedInfo: ParsedInfo): ExtendedTask[] {
    const tickets: ExtendedTask[] = [];
    const timestamp = Date.now();

    epics.forEach((epic, epicIndex) => {
      const epicTickets = this.getTicketsForEpic(epic, parsedInfo);

      epicTickets.forEach((ticketData, ticketIndex) => {
        const ticket = this.createBaseTask({
          taskType: 'ticket',
          title: ticketData.title,
          description: ticketData.description,
          priority: ticketData.priority,
          tags: ticketData.tags,
          complexity: ticketData.complexity,
          skillsRequired: ticketData.skillsRequired,
          timestamp,
          index: epicIndex * 10 + ticketIndex,
          parentTaskId: epic.id,
        });

        ticket.definitionOfDone = this.generateDoD(ticket);
        ticket.testNotes = this.generateTestNotes(ticket);
        ticket.riskFlags = this.generateRiskFlags(ticket, parsedInfo);
        ticket.estimatedHours = this.estimateHours(ticket);

        tickets.push(ticket);
      });
    });

    return tickets;
  }

  private getTicketsForEpic(epic: ExtendedTask, parsedInfo: ParsedInfo): TicketData[] {
    const tickets: TicketData[] = [];

    if (epic.title.toLowerCase().includes('authentication')) {
      tickets.push(
        {
          title: 'User Registration Flow',
          description: 'Implement user signup with email verification',
          priority: 5,
          tags: ['auth', 'backend', 'frontend'],
          complexity: 'medium',
          skillsRequired: ['backend', 'frontend'],
        },
        {
          title: 'Login System',
          description: 'Implement secure login with session management',
          priority: 5,
          tags: ['auth', 'security'],
          complexity: 'high',
          skillsRequired: ['backend', 'security'],
        },
        {
          title: 'Password Reset Functionality',
          description: 'Implement forgot password and reset flow',
          priority: 4,
          tags: ['auth', 'email'],
          complexity: 'medium',
          skillsRequired: ['backend'],
        }
      );
    } else if (epic.title.toLowerCase().includes('interface')) {
      tickets.push(
        {
          title: 'Component Library Setup',
          description: 'Create reusable UI components',
          priority: 4,
          tags: ['frontend', 'components'],
          complexity: 'medium',
          skillsRequired: ['frontend', 'ui-ux'],
        },
        {
          title: 'Responsive Layout',
          description: 'Implement responsive design for all screen sizes',
          priority: 4,
          tags: ['frontend', 'responsive'],
          complexity: 'medium',
          skillsRequired: ['frontend', 'ui-ux'],
        },
        {
          title: 'Dark Mode Support',
          description: 'Add theme switching capability',
          priority: 2,
          tags: ['frontend', 'ui'],
          complexity: 'low',
          skillsRequired: ['frontend'],
        }
      );
    } else if (epic.title.toLowerCase().includes('api')) {
      tickets.push(
        {
          title: 'API Route Setup',
          description: 'Configure API routing and middleware',
          priority: 5,
          tags: ['api', 'backend'],
          complexity: 'medium',
          skillsRequired: ['backend', 'api-design'],
        },
        {
          title: 'API Documentation',
          description: 'Create OpenAPI/Swagger documentation',
          priority: 3,
          tags: ['api', 'documentation'],
          complexity: 'low',
          skillsRequired: ['api-design'],
        },
        {
          title: 'Rate Limiting & Security',
          description: 'Implement API rate limiting and security headers',
          priority: 5,
          tags: ['api', 'security'],
          complexity: 'medium',
          skillsRequired: ['backend', 'security'],
        }
      );
    } else if (epic.title.toLowerCase().includes('database')) {
      tickets.push(
        {
          title: 'Database Schema Design',
          description: 'Design normalized database schema',
          priority: 5,
          tags: ['database', 'architecture'],
          complexity: 'high',
          skillsRequired: ['database', 'architecture'],
        },
        {
          title: 'Database Migrations',
          description: 'Set up migration system and initial migrations',
          priority: 5,
          tags: ['database', 'devops'],
          complexity: 'medium',
          skillsRequired: ['database', 'devops'],
        },
        {
          title: 'Database Indexes & Optimization',
          description: 'Add indexes for query performance',
          priority: 3,
          tags: ['database', 'performance'],
          complexity: 'medium',
          skillsRequired: ['database'],
        }
      );
    } else if (epic.title.toLowerCase().includes('testing')) {
      tickets.push(
        {
          title: 'Unit Test Setup',
          description: 'Configure testing framework and write unit tests',
          priority: 4,
          tags: ['testing', 'unit'],
          complexity: 'medium',
          skillsRequired: ['testing'],
        },
        {
          title: 'Integration Tests',
          description: 'Write integration tests for API endpoints',
          priority: 3,
          tags: ['testing', 'integration'],
          complexity: 'medium',
          skillsRequired: ['testing', 'backend'],
        },
        {
          title: 'E2E Test Coverage',
          description: 'Implement end-to-end testing',
          priority: 3,
          tags: ['testing', 'e2e'],
          complexity: 'high',
          skillsRequired: ['testing', 'frontend'],
        }
      );
    } else {
      tickets.push(
        {
          title: `${epic.title} - Implementation`,
          description: `Core implementation of ${epic.title}`,
          priority: epic.priority,
          tags: epic.tags,
          complexity: 'medium',
          skillsRequired: epic.skillsRequired || [],
        }
      );
    }

    return tickets;
  }

  private generateSubtasks(tickets: ExtendedTask[], parsedInfo: ParsedInfo): ExtendedTask[] {
    const subtasks: ExtendedTask[] = [];
    const timestamp = Date.now();

    tickets.forEach((ticket, ticketIndex) => {
      const ticketSubtasks = this.getSubtasksForTicket(ticket);

      ticketSubtasks.forEach((subtaskData, subtaskIndex) => {
        const subtask = this.createBaseTask({
          taskType: 'subtask',
          title: subtaskData.title,
          description: subtaskData.description,
          priority: subtaskData.priority,
          tags: subtaskData.tags,
          complexity: subtaskData.complexity,
          skillsRequired: subtaskData.skillsRequired,
          timestamp,
          index: ticketIndex * 10 + subtaskIndex,
          parentTaskId: ticket.id,
        });

        subtask.definitionOfDone = this.generateDoD(subtask);
        subtask.testNotes = this.generateTestNotes(subtask);
        subtask.riskFlags = this.generateRiskFlags(subtask, parsedInfo);
        subtask.estimatedHours = this.estimateHours(subtask);

        subtasks.push(subtask);
      });
    });

    return subtasks;
  }

  private getSubtasksForTicket(ticket: ExtendedTask): SubtaskData[] {
    const subtasks: SubtaskData[] = [];
    const title = ticket.title.toLowerCase();

    // Common subtasks for any ticket
    subtasks.push(
      {
        title: 'Design & Planning',
        description: 'Create technical design and implementation plan',
        priority: ticket.priority,
        tags: ['planning', 'design'],
        complexity: 'low',
        skillsRequired: ticket.skillsRequired || [],
      },
      {
        title: 'Implementation',
        description: 'Write the core code for this feature',
        priority: ticket.priority,
        tags: ['implementation'],
        complexity: ticket.complexity || 'medium',
        skillsRequired: ticket.skillsRequired || [],
      },
      {
        title: 'Code Review & Testing',
        description: 'Review code and ensure tests pass',
        priority: ticket.priority,
        tags: ['review', 'testing'],
        complexity: 'low',
        skillsRequired: ['testing'],
      }
    );

    // Add specific subtasks based on ticket type
    if (title.includes('api') || title.includes('endpoint')) {
      subtasks.push({
        title: 'API Documentation',
        description: 'Document API endpoints and parameters',
        priority: 3,
        tags: ['documentation'],
        complexity: 'low',
        skillsRequired: ['api-design'],
      });
    }

    if (title.includes('database') || title.includes('schema')) {
      subtasks.push({
        title: 'Database Migration',
        description: 'Create and test database migration',
        priority: 5,
        tags: ['database', 'migration'],
        complexity: 'medium',
        skillsRequired: ['database'],
      });
    }

    if (title.includes('ui') || title.includes('component')) {
      subtasks.push({
        title: 'Responsive Design',
        description: 'Ensure component works on all screen sizes',
        priority: 4,
        tags: ['responsive', 'ui'],
        complexity: 'low',
        skillsRequired: ['frontend', 'ui-ux'],
      });
    }

    return subtasks;
  }

  private createBaseTask(params: {
    taskType: TaskType;
    title: string;
    description: string;
    priority: number;
    tags: string[];
    complexity: 'low' | 'medium' | 'high';
    skillsRequired: string[];
    timestamp: number;
    index: number;
    parentTaskId?: string;
  }): ExtendedTask {
    const id = generateId();
    const taskId = generateTaskId(params.index + 1);

    return {
      id,
      taskId,
      title: params.title,
      description: params.description,
      status: 'backlog' as TaskStatus,
      priority: Math.min(5, Math.max(1, params.priority)) as 1 | 2 | 3 | 4 | 5,
      tags: params.tags,
      createdAt: params.timestamp,
      updatedAt: params.timestamp,
      taskType: params.taskType,
      parentTaskId: params.parentTaskId,
      definitionOfDone: [],
      testNotes: [],
      riskFlags: [],
      complexity: params.complexity,
      skillsRequired: params.skillsRequired,
      dependencies: [],
      blockedBy: [],
    };
  }

  private generateDoD(task: ExtendedTask): DefinitionOfDone[] {
    const dod: DefinitionOfDone[] = [];

    // Common DoD items
    dod.push(
      {
        id: generateId(),
        description: 'Code is written and follows project standards',
        completed: false,
      },
      {
        id: generateId(),
        description: 'All tests pass successfully',
        completed: false,
      },
      {
        id: generateId(),
        description: 'Code review completed and approved',
        completed: false,
      },
      {
        id: generateId(),
        description: 'Documentation updated',
        completed: false,
      }
    );

    // Task-specific DoD items
    if (task.taskType === 'epic') {
      dod.push({
        id: generateId(),
        description: 'All child tickets and subtasks completed',
        completed: false,
      });
    }

    if (task.tags.includes('api')) {
      dod.push({
        id: generateId(),
        description: 'API endpoints documented in Swagger/OpenAPI',
        completed: false,
      });
    }

    if (task.tags.includes('database')) {
      dod.push({
        id: generateId(),
        description: 'Database migrations tested and verified',
        completed: false,
      });
    }

    if (task.tags.includes('frontend') || task.tags.includes('ui')) {
      dod.push({
        id: generateId(),
        description: 'UI tested on multiple browsers and screen sizes',
        completed: false,
      });
    }

    return dod;
  }

  private generateTestNotes(task: ExtendedTask): TestNote[] {
    const testNotes: TestNote[] = [];

    // Unit tests
    testNotes.push({
      id: generateId(),
      description: 'Unit tests for core functionality',
      testType: 'unit',
      priority: 'high',
    });

    // Task-specific test notes
    if (task.tags.includes('api') || task.tags.includes('backend')) {
      testNotes.push({
        id: generateId(),
        description: 'Integration tests for API endpoints',
        testType: 'integration',
        priority: 'high',
      });
    }

    if (task.tags.includes('frontend') || task.tags.includes('ui')) {
      testNotes.push({
        id: generateId(),
        description: 'E2E tests for user workflows',
        testType: 'e2e',
        priority: 'medium',
      });
      testNotes.push({
        id: generateId(),
        description: 'Manual testing on different devices',
        testType: 'manual',
        priority: 'medium',
      });
    }

    if (task.tags.includes('auth') || task.tags.includes('security')) {
      testNotes.push({
        id: generateId(),
        description: 'Security testing and vulnerability scanning',
        testType: 'integration',
        priority: 'high',
      });
    }

    return testNotes;
  }

  private generateRiskFlags(task: ExtendedTask, parsedInfo: ParsedInfo): RiskFlag[] {
    const riskFlags: RiskFlag[] = [];

    // Complexity-based risks
    if (task.complexity === 'high') {
      riskFlags.push({
        id: generateId(),
        description: 'High complexity may lead to longer development time',
        severity: 'medium',
        mitigation: 'Break down into smaller subtasks, conduct peer review',
        status: 'open',
      });
    }

    // Technology-specific risks
    if (task.tags.includes('security') || task.tags.includes('auth')) {
      riskFlags.push({
        id: generateId(),
        description: 'Security-critical feature requires thorough testing',
        severity: 'high',
        mitigation: 'Security audit, penetration testing, code review by security expert',
        status: 'open',
      });
    }

    if (task.tags.includes('database') && task.title.toLowerCase().includes('migration')) {
      riskFlags.push({
        id: generateId(),
        description: 'Database migration may cause data loss if not tested properly',
        severity: 'critical',
        mitigation: 'Test on staging environment, create backup, plan rollback strategy',
        status: 'open',
      });
    }

    if (task.tags.includes('performance')) {
      riskFlags.push({
        id: generateId(),
        description: 'Performance optimizations may introduce bugs',
        severity: 'medium',
        mitigation: 'Benchmark before and after, comprehensive testing',
        status: 'open',
      });
    }

    // Epic-level risks
    if (task.taskType === 'epic') {
      riskFlags.push({
        id: generateId(),
        description: 'Large scope may lead to scope creep',
        severity: 'medium',
        mitigation: 'Regular sprint reviews, strict scope management',
        status: 'open',
      });
    }

    return riskFlags;
  }

  private estimateHours(task: ExtendedTask): number {
    let baseHours = 0;

    // Base hours by task type
    switch (task.taskType) {
      case 'epic':
        baseHours = 40;
        break;
      case 'ticket':
        baseHours = 8;
        break;
      case 'subtask':
        baseHours = 2;
        break;
    }

    // Adjust by complexity
    switch (task.complexity) {
      case 'low':
        baseHours *= 0.7;
        break;
      case 'medium':
        baseHours *= 1.0;
        break;
      case 'high':
        baseHours *= 1.5;
        break;
    }

    // Adjust by priority (higher priority might need more thorough work)
    if (task.priority >= 4) {
      baseHours *= 1.2;
    }

    return Math.round(baseHours);
  }

  private analyzeDependencies(tasks: ExtendedTask[]): TaskDependency[] {
    const dependencies: TaskDependency[] = [];

    // Group tasks by type
    const epics = tasks.filter((t) => t.taskType === 'epic');
    const tickets = tasks.filter((t) => t.taskType === 'ticket');
    const subtasks = tasks.filter((t) => t.taskType === 'subtask');

    // Database/schema tasks should come before API tasks
    const dbTasks = tasks.filter((t) => t.tags.includes('database') || t.tags.includes('schema'));
    const apiTasks = tasks.filter((t) => t.tags.includes('api'));

    dbTasks.forEach((dbTask) => {
      apiTasks.forEach((apiTask) => {
        if (dbTask.id !== apiTask.id) {
          dependencies.push({
            id: generateId(),
            dependsOnTaskId: dbTask.id,
            dependentTaskId: apiTask.id,
            dependencyType: 'blocks',
            createdAt: Date.now(),
          });
        }
      });
    });

    // Backend tasks should come before frontend tasks
    const backendTasks = tasks.filter((t) => t.tags.includes('backend') && !t.tags.includes('frontend'));
    const frontendTasks = tasks.filter((t) => t.tags.includes('frontend'));

    backendTasks.forEach((backendTask) => {
      frontendTasks.forEach((frontendTask) => {
        if (backendTask.id !== frontendTask.id && !dependencies.some(d =>
          d.dependsOnTaskId === backendTask.id && d.dependentTaskId === frontendTask.id
        )) {
          dependencies.push({
            id: generateId(),
            dependsOnTaskId: backendTask.id,
            dependentTaskId: frontendTask.id,
            dependencyType: 'blocks',
            createdAt: Date.now(),
          });
        }
      });
    });

    // Subtasks depend on their parent tickets being started
    subtasks.forEach((subtask) => {
      if (subtask.parentTaskId) {
        const parent = tickets.find((t) => t.id === subtask.parentTaskId);
        if (parent) {
          dependencies.push({
            id: generateId(),
            dependsOnTaskId: parent.id,
            dependentTaskId: subtask.id,
            dependencyType: 'required-for',
            createdAt: Date.now(),
          });
        }
      }
    });

    return dependencies;
  }

  private calculateTotalHours(tasks: ExtendedTask[]): number {
    return tasks.reduce((total, task) => total + (task.estimatedHours || 0), 0);
  }

  private calculateRiskSummary(tasks: ExtendedTask[]): { high: number; medium: number; low: number } {
    const summary = { high: 0, medium: 0, low: 0 };

    tasks.forEach((task) => {
      task.riskFlags.forEach((risk) => {
        if (risk.status === 'open') {
          if (risk.severity === 'critical' || risk.severity === 'high') {
            summary.high++;
          } else if (risk.severity === 'medium') {
            summary.medium++;
          } else {
            summary.low++;
          }
        }
      });
    });

    return summary;
  }
}

// Helper interfaces
interface ParsedInfo {
  features: string[];
  technologies: string[];
  requirements: string[];
  risks: string[];
  hasAuth: boolean;
  hasDatabase: boolean;
  hasUI: boolean;
  hasAPI: boolean;
  hasTesting: boolean;
}

interface EpicGroup {
  title: string;
  description: string;
  priority: number;
  tags: string[];
  complexity: 'low' | 'medium' | 'high';
  skillsRequired: string[];
}

interface TicketData {
  title: string;
  description: string;
  priority: number;
  tags: string[];
  complexity: 'low' | 'medium' | 'high';
  skillsRequired: string[];
}

interface SubtaskData {
  title: string;
  description: string;
  priority: number;
  tags: string[];
  complexity: 'low' | 'medium' | 'high';
  skillsRequired: string[];
}

// Export singleton instance
export const taskBreakdownService = new TaskBreakdownService();
