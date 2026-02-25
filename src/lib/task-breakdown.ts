import { Task } from '@/types/task';
import {
  TaskBreakdownInput,
  TaskBreakdownResult,
  TaskHierarchy,
  TaskDependency,
  TaskBreakdownNode,
  RiskFlag,
} from '@/types/task-breakdown';
import { generateId, generateTaskId } from './utils';

interface BreakdownPattern {
  keywords: string[];
  epicTitle: string;
  tickets: {
    title: string;
    description: string;
    riskFlags: RiskFlag[];
    estimatedEffort: number;
    subtasks: string[];
  }[];
}

const breakdownPatterns: BreakdownPattern[] = [
  {
    keywords: ['authentication', 'login', 'signup', 'auth', 'user management'],
    epicTitle: 'User Authentication System',
    tickets: [
      {
        title: 'Design authentication flow and database schema',
        description: 'Create user table, sessions, and authentication flow diagrams',
        riskFlags: ['security', 'data-migration'],
        estimatedEffort: 5,
        subtasks: [
          'Design user table schema',
          'Design session management approach',
          'Create security audit checklist',
        ],
      },
      {
        title: 'Implement backend authentication API',
        description: 'Create login, signup, logout, and session management endpoints',
        riskFlags: ['security', 'high-complexity'],
        estimatedEffort: 8,
        subtasks: [
          'Implement signup endpoint with validation',
          'Implement login endpoint with JWT/session',
          'Add password hashing and validation',
          'Implement logout and session cleanup',
        ],
      },
      {
        title: 'Build frontend authentication UI',
        description: 'Create login and signup forms with validation',
        riskFlags: [],
        estimatedEffort: 5,
        subtasks: [
          'Create login form component',
          'Create signup form component',
          'Add form validation and error handling',
          'Implement protected routes',
        ],
      },
      {
        title: 'Add authentication testing and security audit',
        description: 'Write tests and perform security review',
        riskFlags: ['security'],
        estimatedEffort: 3,
        subtasks: [
          'Write unit tests for auth endpoints',
          'Write integration tests for auth flow',
          'Perform security audit',
          'Test edge cases and error scenarios',
        ],
      },
    ],
  },
  {
    keywords: ['dashboard', 'analytics', 'charts', 'reporting', 'metrics'],
    epicTitle: 'Analytics Dashboard',
    tickets: [
      {
        title: 'Design dashboard layout and data requirements',
        description: 'Define metrics, charts, and data sources',
        riskFlags: [],
        estimatedEffort: 3,
        subtasks: [
          'Define key metrics to display',
          'Design dashboard wireframes',
          'Identify data sources and APIs',
        ],
      },
      {
        title: 'Implement backend analytics API',
        description: 'Create endpoints for aggregated metrics and data',
        riskFlags: ['performance'],
        estimatedEffort: 8,
        subtasks: [
          'Create database queries for metrics',
          'Implement caching layer',
          'Add API endpoints for dashboard data',
          'Optimize query performance',
        ],
      },
      {
        title: 'Build dashboard UI components',
        description: 'Create charts, tables, and visualization components',
        riskFlags: ['high-complexity'],
        estimatedEffort: 8,
        subtasks: [
          'Integrate charting library',
          'Create metric cards components',
          'Build data visualization components',
          'Add filtering and date range selection',
        ],
      },
      {
        title: 'Add real-time updates and export features',
        description: 'Implement live updates and data export',
        riskFlags: ['performance'],
        estimatedEffort: 5,
        subtasks: [
          'Implement WebSocket or polling for live updates',
          'Add CSV/PDF export functionality',
          'Optimize rendering performance',
        ],
      },
    ],
  },
  {
    keywords: ['api', 'rest', 'graphql', 'endpoint', 'backend'],
    epicTitle: 'API Development',
    tickets: [
      {
        title: 'Design API architecture and documentation',
        description: 'Define API structure, endpoints, and specifications',
        riskFlags: ['breaking-change'],
        estimatedEffort: 5,
        subtasks: [
          'Define API endpoints and resources',
          'Create OpenAPI/Swagger documentation',
          'Design error handling strategy',
        ],
      },
      {
        title: 'Implement core API endpoints',
        description: 'Build CRUD operations and business logic',
        riskFlags: ['high-complexity'],
        estimatedEffort: 13,
        subtasks: [
          'Set up API framework and routing',
          'Implement authentication middleware',
          'Create CRUD endpoints for each resource',
          'Add validation and error handling',
        ],
      },
      {
        title: 'Add API testing and monitoring',
        description: 'Write tests and set up monitoring',
        riskFlags: [],
        estimatedEffort: 5,
        subtasks: [
          'Write unit tests for endpoints',
          'Write integration tests',
          'Set up API monitoring and logging',
          'Add rate limiting and security headers',
        ],
      },
    ],
  },
];

function analyzeInput(input: TaskBreakdownInput): {
  pattern: BreakdownPattern | null;
  customBreakdown: boolean;
} {
  const searchText = `${input.title} ${input.description} ${input.content}`.toLowerCase();

  for (const pattern of breakdownPatterns) {
    const matches = pattern.keywords.filter((keyword) =>
      searchText.includes(keyword.toLowerCase())
    );
    if (matches.length > 0) {
      return { pattern, customBreakdown: false };
    }
  }

  return { pattern: null, customBreakdown: true };
}

function createGenericBreakdown(input: TaskBreakdownInput): BreakdownPattern {
  // Generic breakdown for unrecognized patterns
  const lines = input.content.split('\n').filter((line) => line.trim());
  const hasFrontend = /ui|frontend|component|form|page/i.test(input.content);
  const hasBackend = /api|backend|server|database|endpoint/i.test(input.content);
  const hasTesting = /test|qa|quality/i.test(input.content);

  const tickets: BreakdownPattern['tickets'] = [];

  if (hasFrontend && hasBackend) {
    tickets.push({
      title: 'Design system architecture and data flow',
      description: 'Plan the overall architecture, API contracts, and data models',
      riskFlags: ['high-complexity'],
      estimatedEffort: 5,
      subtasks: [
        'Create system architecture diagram',
        'Define API contracts',
        'Design database schema',
      ],
    });
    tickets.push({
      title: 'Implement backend logic and APIs',
      description: 'Build server-side functionality and endpoints',
      riskFlags: [],
      estimatedEffort: 8,
      subtasks: [
        'Set up backend framework',
        'Implement business logic',
        'Create API endpoints',
        'Add error handling',
      ],
    });
    tickets.push({
      title: 'Build frontend components and UI',
      description: 'Create user interface and integrate with backend',
      riskFlags: [],
      estimatedEffort: 8,
      subtasks: [
        'Create UI components',
        'Implement state management',
        'Integrate with API',
        'Add loading and error states',
      ],
    });
  } else if (hasFrontend) {
    tickets.push({
      title: 'Design UI components and layout',
      description: 'Create wireframes and component structure',
      riskFlags: [],
      estimatedEffort: 3,
      subtasks: ['Create wireframes', 'Define component hierarchy', 'Plan state management'],
    });
    tickets.push({
      title: 'Implement UI components',
      description: 'Build and style frontend components',
      riskFlags: [],
      estimatedEffort: 8,
      subtasks: [
        'Create base components',
        'Add styling and responsiveness',
        'Implement interactions',
      ],
    });
  } else if (hasBackend) {
    tickets.push({
      title: 'Design backend architecture',
      description: 'Plan database schema and API structure',
      riskFlags: [],
      estimatedEffort: 3,
      subtasks: ['Design database schema', 'Define API endpoints', 'Plan error handling'],
    });
    tickets.push({
      title: 'Implement backend functionality',
      description: 'Build server-side logic and APIs',
      riskFlags: [],
      estimatedEffort: 8,
      subtasks: [
        'Implement database operations',
        'Create API endpoints',
        'Add validation and error handling',
      ],
    });
  } else {
    tickets.push({
      title: 'Research and planning',
      description: 'Investigate requirements and create implementation plan',
      riskFlags: [],
      estimatedEffort: 3,
      subtasks: ['Research requirements', 'Create technical specification', 'Plan implementation'],
    });
    tickets.push({
      title: 'Core implementation',
      description: 'Implement the main functionality',
      riskFlags: ['high-complexity'],
      estimatedEffort: 8,
      subtasks: [
        'Implement core features',
        'Add error handling',
        'Create documentation',
      ],
    });
  }

  if (hasTesting || tickets.length > 2) {
    tickets.push({
      title: 'Testing and quality assurance',
      description: 'Write tests and ensure code quality',
      riskFlags: [],
      estimatedEffort: 5,
      subtasks: [
        'Write unit tests',
        'Write integration tests',
        'Perform manual testing',
        'Fix bugs and issues',
      ],
    });
  }

  return {
    keywords: [],
    epicTitle: input.title,
    tickets,
  };
}

export async function breakdownTask(
  input: TaskBreakdownInput,
  userId: string,
  existingTaskCount: number = 0
): Promise<TaskBreakdownResult> {
  const { pattern, customBreakdown } = analyzeInput(input);
  const breakdown = pattern || createGenericBreakdown(input);

  const allTasks: Task[] = [];
  const allHierarchies: TaskHierarchy[] = [];
  const allDependencies: TaskDependency[] = [];
  let taskCounter = existingTaskCount;

  // Create epic task
  const epicTask: Task = {
    id: generateId(),
    taskId: generateTaskId(++taskCounter),
    title: breakdown.epicTitle,
    description: input.description,
    status: 'backlog',
    priority: 3,
    tags: ['epic', ...(customBreakdown ? ['auto-generated'] : [])],
    commentsCount: 0,
    attachmentsCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const epicHierarchy: TaskHierarchy = {
    id: generateId(),
    userId,
    taskId: epicTask.id,
    hierarchyType: 'epic',
    position: 0,
    riskFlags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  allTasks.push(epicTask);
  allHierarchies.push(epicHierarchy);

  const ticketNodes: TaskBreakdownNode[] = [];
  let previousTicketId: string | null = null;

  // Create tickets and subtasks
  for (let i = 0; i < breakdown.tickets.length; i++) {
    const ticketData = breakdown.tickets[i];

    const ticketTask: Task = {
      id: generateId(),
      taskId: generateTaskId(++taskCounter),
      title: ticketData.title,
      description: ticketData.description,
      status: 'backlog',
      priority: ticketData.riskFlags.length > 0 ? 2 : 3,
      tags: ['ticket', ...(ticketData.riskFlags.length > 0 ? ['high-risk'] : [])],
      commentsCount: 0,
      attachmentsCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const ticketHierarchy: TaskHierarchy = {
      id: generateId(),
      userId,
      taskId: ticketTask.id,
      parentId: epicHierarchy.id,
      hierarchyType: 'ticket',
      position: i,
      definitionOfDone: ticketData.subtasks.map((st) => `- [ ] ${st}`).join('\n'),
      testNotes: `Test all functionality in ${ticketData.title.toLowerCase()}`,
      riskFlags: ticketData.riskFlags,
      estimatedEffort: ticketData.estimatedEffort,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    allTasks.push(ticketTask);
    allHierarchies.push(ticketHierarchy);

    // Create dependency on previous ticket (sequential flow)
    if (previousTicketId && i > 0) {
      const dependency: TaskDependency = {
        id: generateId(),
        userId,
        taskId: ticketTask.id,
        dependsOnTaskId: previousTicketId,
        dependencyType: 'blocks',
        createdAt: Date.now(),
      };
      allDependencies.push(dependency);
    }

    previousTicketId = ticketTask.id;

    // Create subtasks
    const subtaskNodes: TaskBreakdownNode[] = [];
    for (let j = 0; j < ticketData.subtasks.length; j++) {
      const subtaskTitle = ticketData.subtasks[j];

      const subtaskTask: Task = {
        id: generateId(),
        taskId: generateTaskId(++taskCounter),
        title: subtaskTitle,
        description: `Subtask for: ${ticketData.title}`,
        status: 'backlog',
        priority: 3,
        tags: ['subtask'],
        commentsCount: 0,
        attachmentsCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const subtaskHierarchy: TaskHierarchy = {
        id: generateId(),
        userId,
        taskId: subtaskTask.id,
        parentId: ticketHierarchy.id,
        hierarchyType: 'subtask',
        position: j,
        riskFlags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      allTasks.push(subtaskTask);
      allHierarchies.push(subtaskHierarchy);

      subtaskNodes.push({
        task: subtaskTask,
        hierarchy: subtaskHierarchy,
        children: [],
        dependencies: [],
      });
    }

    ticketNodes.push({
      task: ticketTask,
      hierarchy: ticketHierarchy,
      children: subtaskNodes,
      dependencies: allDependencies.filter((d) => d.taskId === ticketTask.id),
    });
  }

  const epicNode: TaskBreakdownNode = {
    task: epicTask,
    hierarchy: epicHierarchy,
    children: ticketNodes,
    dependencies: [],
  };

  return {
    epic: epicNode,
    tickets: ticketNodes,
    allTasks,
    allHierarchies,
    allDependencies,
  };
}

export function getDependencyGraph(
  tasks: Task[],
  dependencies: TaskDependency[]
): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  tasks.forEach((task) => {
    graph.set(task.id, []);
  });

  dependencies.forEach((dep) => {
    const dependents = graph.get(dep.dependsOnTaskId) || [];
    dependents.push(dep.taskId);
    graph.set(dep.dependsOnTaskId, dependents);
  });

  return graph;
}

export function getBlockedTasks(
  tasks: Task[],
  dependencies: TaskDependency[]
): Set<string> {
  const blocked = new Set<string>();

  dependencies.forEach((dep) => {
    const blockingTask = tasks.find((t) => t.id === dep.dependsOnTaskId);
    if (blockingTask && blockingTask.status !== 'done') {
      blocked.add(dep.taskId);
    }
  });

  return blocked;
}
