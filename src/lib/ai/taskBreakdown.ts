import { Task, TaskType, RiskSeverity, DefinitionOfDone, RiskFlag } from '@/types/task';
import { AgentSkill } from '@/types/agent';

export interface BreakdownInput {
  type: 'text' | 'file' | 'url' | 'screenshot';
  content: string;
  context?: {
    existingTasks?: Task[];
    availableSkills?: string[];
  };
}

export interface BreakdownResult {
  epics: GeneratedTask[];
  stories: GeneratedTask[];
  subtasks: GeneratedTask[];
  dependencies: Array<{
    taskId: string;
    dependsOnTaskId: string;
    type: 'blocks' | 'blocked_by' | 'related';
  }>;
}

export interface GeneratedTask {
  tempId: string; // Temporary ID for dependency mapping
  title: string;
  description: string;
  taskType: TaskType;
  parentTempId?: string; // Reference to parent's tempId
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  definitionOfDone: DefinitionOfDone[];
  testNotes?: string;
  riskFlags: RiskFlag[];
  estimatedHours?: number;
  suggestedSkills?: string[]; // Skills needed for this task
}

/**
 * Parse and break down a PRD, issue, or requirement document into structured tasks
 * This is a simplified implementation - in production, this would integrate with an AI API
 */
export async function breakdownTasksWithAI(input: BreakdownInput): Promise<BreakdownResult> {
  // Simulate AI processing with a structured breakdown
  // In production, this would call an AI service like OpenAI, Anthropic Claude, etc.

  const breakdown = analyzeInput(input.content);

  return {
    epics: breakdown.epics,
    stories: breakdown.stories,
    subtasks: breakdown.subtasks,
    dependencies: breakdown.dependencies,
  };
}

/**
 * Rule-based task breakdown logic (simulates AI for demo purposes)
 * In production, replace with actual AI API calls
 */
function analyzeInput(content: string): BreakdownResult {
  const epics: GeneratedTask[] = [];
  const stories: GeneratedTask[] = [];
  const subtasks: GeneratedTask[] = [];
  const dependencies: Array<{ taskId: string; dependsOnTaskId: string; type: 'blocks' | 'blocked_by' | 'related' }> = [];

  // Simple keyword-based analysis
  const hasAuth = /auth|login|signup|user|account/i.test(content);
  const hasUI = /ui|interface|component|design|frontend/i.test(content);
  const hasAPI = /api|endpoint|backend|database|server/i.test(content);
  const hasTests = /test|testing|qa|quality/i.test(content);
  const hasDeploy = /deploy|deployment|production|infra/i.test(content);

  let epicCounter = 0;
  let storyCounter = 0;
  let subtaskCounter = 0;

  // Generate Authentication Epic if mentioned
  if (hasAuth) {
    const epicId = `epic-${++epicCounter}`;
    epics.push({
      tempId: epicId,
      title: 'User Authentication System',
      description: 'Implement complete user authentication and authorization system',
      taskType: 'epic',
      priority: 5,
      tags: ['auth', 'security', 'backend'],
      definitionOfDone: [
        { id: 'dod-1', description: 'Users can register with email/password', completed: false },
        { id: 'dod-2', description: 'Users can login and logout', completed: false },
        { id: 'dod-3', description: 'Session management is secure', completed: false },
        { id: 'dod-4', description: 'Password reset functionality works', completed: false },
      ],
      testNotes: 'Test all auth flows, including edge cases and security vulnerabilities',
      riskFlags: [
        {
          id: 'risk-1',
          description: 'Security vulnerabilities in authentication',
          severity: 'high' as RiskSeverity,
          mitigationStrategy: 'Use industry-standard auth libraries, conduct security audit',
        },
      ],
      estimatedHours: 40,
      suggestedSkills: ['backend', 'security', 'database'],
    });

    // Login Story
    const loginStoryId = `story-${++storyCounter}`;
    stories.push({
      tempId: loginStoryId,
      title: 'Implement Login Functionality',
      description: 'Create login endpoint and UI for user authentication',
      taskType: 'story',
      parentTempId: epicId,
      priority: 5,
      tags: ['auth', 'frontend', 'backend'],
      definitionOfDone: [
        { id: 'dod-1', description: 'Login API endpoint created', completed: false },
        { id: 'dod-2', description: 'Login UI component built', completed: false },
        { id: 'dod-3', description: 'JWT tokens generated and validated', completed: false },
      ],
      testNotes: 'Test with valid/invalid credentials, check token expiration',
      riskFlags: [],
      estimatedHours: 12,
      suggestedSkills: ['backend', 'frontend', 'security'],
    });

    // Login subtasks
    subtasks.push({
      tempId: `subtask-${++subtaskCounter}`,
      title: 'Create login API endpoint',
      description: 'Implement POST /api/auth/login endpoint with email/password validation',
      taskType: 'subtask',
      parentTempId: loginStoryId,
      priority: 5,
      tags: ['backend', 'api'],
      definitionOfDone: [
        { id: 'dod-1', description: 'Endpoint validates credentials', completed: false },
        { id: 'dod-2', description: 'Returns JWT token on success', completed: false },
      ],
      estimatedHours: 4,
      suggestedSkills: ['backend', 'api'],
    });

    subtasks.push({
      tempId: `subtask-${++subtaskCounter}`,
      title: 'Build login UI component',
      description: 'Create responsive login form with email and password fields',
      taskType: 'subtask',
      parentTempId: loginStoryId,
      priority: 5,
      tags: ['frontend', 'ui'],
      definitionOfDone: [
        { id: 'dod-1', description: 'Form has email and password inputs', completed: false },
        { id: 'dod-2', description: 'Displays validation errors', completed: false },
      ],
      estimatedHours: 4,
      suggestedSkills: ['frontend', 'react'],
    });

    // Signup Story
    const signupStoryId = `story-${++storyCounter}`;
    stories.push({
      tempId: signupStoryId,
      title: 'Implement User Registration',
      description: 'Create signup endpoint and UI for new user registration',
      taskType: 'story',
      parentTempId: epicId,
      priority: 5,
      tags: ['auth', 'frontend', 'backend'],
      definitionOfDone: [
        { id: 'dod-1', description: 'Signup API endpoint created', completed: false },
        { id: 'dod-2', description: 'User data stored securely', completed: false },
        { id: 'dod-3', description: 'Signup UI component built', completed: false },
      ],
      estimatedHours: 10,
      suggestedSkills: ['backend', 'frontend', 'database'],
    });
  }

  // Generate UI Epic if mentioned
  if (hasUI) {
    const epicId = `epic-${++epicCounter}`;
    epics.push({
      tempId: epicId,
      title: 'User Interface Development',
      description: 'Build responsive and accessible user interface components',
      taskType: 'epic',
      priority: 4,
      tags: ['frontend', 'ui', 'design'],
      definitionOfDone: [
        { id: 'dod-1', description: 'All components are responsive', completed: false },
        { id: 'dod-2', description: 'UI matches design mockups', completed: false },
        { id: 'dod-3', description: 'Accessibility standards met', completed: false },
      ],
      estimatedHours: 60,
      suggestedSkills: ['frontend', 'react', 'css'],
    });

    const dashboardStoryId = `story-${++storyCounter}`;
    stories.push({
      tempId: dashboardStoryId,
      title: 'Create Dashboard Layout',
      description: 'Build main dashboard with navigation and content areas',
      taskType: 'story',
      parentTempId: epicId,
      priority: 4,
      tags: ['frontend', 'ui'],
      definitionOfDone: [
        { id: 'dod-1', description: 'Layout is responsive', completed: false },
        { id: 'dod-2', description: 'Navigation works correctly', completed: false },
      ],
      estimatedHours: 16,
      suggestedSkills: ['frontend', 'react'],
    });
  }

  // Generate API Epic if mentioned
  if (hasAPI) {
    const epicId = `epic-${++epicCounter}`;
    epics.push({
      tempId: epicId,
      title: 'API Development',
      description: 'Develop RESTful API endpoints for application functionality',
      taskType: 'epic',
      priority: 5,
      tags: ['backend', 'api', 'database'],
      definitionOfDone: [
        { id: 'dod-1', description: 'All CRUD endpoints implemented', completed: false },
        { id: 'dod-2', description: 'API documentation complete', completed: false },
        { id: 'dod-3', description: 'Error handling implemented', completed: false },
      ],
      riskFlags: [
        {
          id: 'risk-1',
          description: 'Database performance issues with large datasets',
          severity: 'medium' as RiskSeverity,
          mitigationStrategy: 'Implement pagination, indexing, and query optimization',
        },
      ],
      estimatedHours: 50,
      suggestedSkills: ['backend', 'database', 'api'],
    });
  }

  // Generate Testing Epic if mentioned
  if (hasTests) {
    const epicId = `epic-${++epicCounter}`;
    epics.push({
      tempId: epicId,
      title: 'Testing & Quality Assurance',
      description: 'Implement comprehensive testing suite',
      taskType: 'epic',
      priority: 3,
      tags: ['testing', 'qa'],
      definitionOfDone: [
        { id: 'dod-1', description: 'Unit tests cover 80%+ of code', completed: false },
        { id: 'dod-2', description: 'Integration tests pass', completed: false },
        { id: 'dod-3', description: 'E2E tests for critical flows', completed: false },
      ],
      estimatedHours: 30,
      suggestedSkills: ['testing', 'qa'],
    });
  }

  // Generate dependencies between tasks
  if (stories.length > 1) {
    // API development should be done before UI components can consume it
    const apiStory = stories.find(s => s.tags.includes('api'));
    const uiStory = stories.find(s => s.tags.includes('ui') && !s.tags.includes('api'));

    if (apiStory && uiStory) {
      dependencies.push({
        taskId: uiStory.tempId,
        dependsOnTaskId: apiStory.tempId,
        type: 'blocks',
      });
    }
  }

  return { epics, stories, subtasks, dependencies };
}

/**
 * Analyze agent skills and suggest best agent for a task
 */
export function suggestAgentForTask(
  task: GeneratedTask,
  agents: Array<{ id: string; skills: AgentSkill[]; performanceMetrics?: any }>
): string | undefined {
  if (!task.suggestedSkills || task.suggestedSkills.length === 0) {
    return undefined;
  }

  // Score each agent based on skill match and performance
  const agentScores = agents.map(agent => {
    let score = 0;

    // Check skill matches
    task.suggestedSkills?.forEach(requiredSkill => {
      const agentSkill = agent.skills.find(s =>
        s.name.toLowerCase().includes(requiredSkill.toLowerCase()) ||
        s.category.toLowerCase().includes(requiredSkill.toLowerCase())
      );

      if (agentSkill) {
        score += agentSkill.proficiency * 10; // Weight by proficiency
      }
    });

    // Bonus for good performance
    if (agent.performanceMetrics?.successRate) {
      score += agent.performanceMetrics.successRate / 10;
    }

    return { agentId: agent.id, score };
  });

  // Sort by score and return best match
  agentScores.sort((a, b) => b.score - a.score);

  return agentScores.length > 0 && agentScores[0].score > 0
    ? agentScores[0].agentId
    : undefined;
}

/**
 * Extract key information from text input
 */
export function extractKeywords(text: string): string[] {
  const keywords: string[] = [];

  // Common technical keywords
  const technicalTerms = [
    'frontend', 'backend', 'api', 'database', 'ui', 'ux', 'design',
    'auth', 'authentication', 'authorization', 'security',
    'testing', 'qa', 'deployment', 'devops', 'ci/cd',
    'mobile', 'web', 'react', 'next.js', 'typescript', 'javascript',
    'python', 'java', 'golang', 'rust',
  ];

  technicalTerms.forEach(term => {
    if (new RegExp(term, 'i').test(text)) {
      keywords.push(term.toLowerCase());
    }
  });

  return [...new Set(keywords)]; // Remove duplicates
}
