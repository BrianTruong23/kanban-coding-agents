import { Task, TaskDependency, TaskBreakdownInput, TaskBreakdownResult, AgentAssignment } from '@/types/task';
import { AgentWithSkills } from '@/types/agent';
import { generateId, generateTaskId } from '@/lib/utils';

/**
 * AI-powered Task Breakdown Service
 *
 * This service analyzes issues, PRDs, or screenshots and breaks them down into:
 * - Epics (high-level features)
 * - Stories (user-facing functionality)
 * - Subtasks (implementation details)
 * - Dependencies (relationships between tasks)
 * - Agent assignments (based on skills)
 */

interface BreakdownPattern {
  keywords: string[];
  epicTemplate: string;
  stories: string[];
  riskFactors: string[];
}

// Predefined patterns for common development scenarios
const BREAKDOWN_PATTERNS: Record<string, BreakdownPattern> = {
  authentication: {
    keywords: ['auth', 'login', 'signup', 'user', 'session', 'password'],
    epicTemplate: 'User Authentication System',
    stories: [
      'User Registration',
      'User Login',
      'Password Reset',
      'Session Management',
      'User Profile',
    ],
    riskFactors: ['security', 'data-breach', 'compliance'],
  },
  api: {
    keywords: ['api', 'endpoint', 'rest', 'graphql', 'backend', 'server'],
    epicTemplate: 'API Development',
    stories: [
      'API Design and Documentation',
      'Database Schema',
      'API Endpoints Implementation',
      'API Testing',
      'Error Handling',
    ],
    riskFactors: ['performance', 'scalability', 'security'],
  },
  ui: {
    keywords: ['ui', 'interface', 'design', 'component', 'frontend', 'page'],
    epicTemplate: 'UI/UX Development',
    stories: [
      'UI Design and Mockups',
      'Component Library',
      'Page Implementation',
      'Responsive Design',
      'Accessibility',
    ],
    riskFactors: ['browser-compatibility', 'responsive-design', 'accessibility'],
  },
  database: {
    keywords: ['database', 'schema', 'migration', 'model', 'data'],
    epicTemplate: 'Database Development',
    stories: [
      'Schema Design',
      'Migration Scripts',
      'Data Validation',
      'Database Optimization',
      'Backup Strategy',
    ],
    riskFactors: ['data-loss', 'migration-failure', 'performance'],
  },
  testing: {
    keywords: ['test', 'testing', 'qa', 'quality', 'coverage'],
    epicTemplate: 'Testing Infrastructure',
    stories: [
      'Unit Tests',
      'Integration Tests',
      'E2E Tests',
      'Test Automation',
      'CI/CD Integration',
    ],
    riskFactors: ['insufficient-coverage', 'flaky-tests'],
  },
};

const COMMON_SUBTASKS: Record<string, string[]> = {
  'User Registration': [
    'Create registration form UI',
    'Add form validation',
    'Implement API endpoint',
    'Add email verification',
    'Write unit tests',
  ],
  'User Login': [
    'Create login form UI',
    'Implement authentication logic',
    'Add JWT token management',
    'Handle error states',
    'Write integration tests',
  ],
  'API Endpoints Implementation': [
    'Define API routes',
    'Implement request handlers',
    'Add input validation',
    'Implement error handling',
    'Write API documentation',
  ],
  'UI Design and Mockups': [
    'Create wireframes',
    'Design high-fidelity mockups',
    'Define design system',
    'Get stakeholder approval',
  ],
  'Component Library': [
    'Create base components',
    'Add component documentation',
    'Implement theming',
    'Add component tests',
  ],
};

const SKILL_KEYWORDS: Record<string, string[]> = {
  react: ['react', 'component', 'jsx', 'hooks', 'ui', 'frontend'],
  nextjs: ['next', 'nextjs', 'ssr', 'routing', 'api routes'],
  backend: ['api', 'server', 'database', 'backend', 'endpoint'],
  database: ['database', 'schema', 'sql', 'migration', 'query'],
  devops: ['deploy', 'ci/cd', 'docker', 'infra', 'pipeline'],
  mobile: ['mobile', 'ios', 'android', 'app'],
  testing: ['test', 'testing', 'qa', 'coverage'],
};

/**
 * Analyze input and break down into tasks
 */
export async function analyzeAndBreakdown(
  input: TaskBreakdownInput,
  agents: AgentWithSkills[],
  existingTaskCount: number = 0
): Promise<TaskBreakdownResult> {
  const content = input.content.toLowerCase();
  const timestamp = Date.now();

  // Detect patterns
  const detectedPatterns = detectPatterns(content);

  // Generate epics
  const epics = generateEpics(detectedPatterns, existingTaskCount, timestamp);

  // Generate stories for each epic
  const stories = generateStories(epics, detectedPatterns, existingTaskCount + epics.length, timestamp);

  // Generate subtasks for each story
  const subtasks = generateSubtasks(stories, existingTaskCount + epics.length + stories.length, timestamp);

  // Generate dependencies
  const dependencies = generateDependencies([...epics, ...stories, ...subtasks]);

  // Suggest agent assignments
  const suggestedAssignments = suggestAgentAssignments(
    [...epics, ...stories, ...subtasks],
    agents,
    content
  );

  return {
    epics,
    stories,
    subtasks,
    dependencies,
    suggestedAssignments,
  };
}

/**
 * Detect which patterns match the input
 */
function detectPatterns(content: string): string[] {
  const detected: string[] = [];

  for (const [pattern, config] of Object.entries(BREAKDOWN_PATTERNS)) {
    const matchCount = config.keywords.filter(keyword =>
      content.includes(keyword)
    ).length;

    if (matchCount >= 2) {
      detected.push(pattern);
    }
  }

  // Default to UI if nothing detected
  return detected.length > 0 ? detected : ['ui'];
}

/**
 * Generate epic tasks
 */
function generateEpics(
  patterns: string[],
  startIndex: number,
  timestamp: number
): Task[] {
  return patterns.map((pattern, index) => {
    const config = BREAKDOWN_PATTERNS[pattern];
    return {
      id: generateId(),
      taskId: generateTaskId(startIndex + index + 1),
      title: config.epicTemplate,
      description: `Epic for ${config.epicTemplate}. This will be broken down into multiple stories and subtasks.`,
      status: 'backlog' as const,
      priority: 4,
      tags: [pattern, 'epic'],
      taskType: 'epic' as const,
      riskFlags: config.riskFactors,
      estimatedHours: 80,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });
}

/**
 * Generate story tasks
 */
function generateStories(
  epics: Task[],
  patterns: string[],
  startIndex: number,
  timestamp: number
): Task[] {
  const stories: Task[] = [];
  let currentIndex = startIndex;

  epics.forEach((epic, epicIndex) => {
    const pattern = patterns[epicIndex];
    const config = BREAKDOWN_PATTERNS[pattern];

    config.stories.forEach((storyTitle, storyIndex) => {
      stories.push({
        id: generateId(),
        taskId: generateTaskId(currentIndex + storyIndex),
        title: storyTitle,
        description: `Implement ${storyTitle} as part of ${epic.title}`,
        status: 'backlog' as const,
        priority: 3,
        tags: [pattern, 'story'],
        taskType: 'story' as const,
        epicId: epic.id,
        definitionOfDone: generateDoD(storyTitle),
        testNotes: generateTestNotes(storyTitle),
        estimatedHours: 16,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    });

    currentIndex += config.stories.length;
  });

  return stories;
}

/**
 * Generate subtask tasks
 */
function generateSubtasks(
  stories: Task[],
  startIndex: number,
  timestamp: number
): Task[] {
  const subtasks: Task[] = [];
  let currentIndex = startIndex;

  stories.forEach((story) => {
    const subtaskTemplates = COMMON_SUBTASKS[story.title] || [
      'Research and planning',
      'Implementation',
      'Testing',
      'Documentation',
    ];

    subtaskTemplates.forEach((subtaskTitle, index) => {
      subtasks.push({
        id: generateId(),
        taskId: generateTaskId(currentIndex + index),
        title: `${story.title}: ${subtaskTitle}`,
        description: `${subtaskTitle} for ${story.title}`,
        status: 'backlog' as const,
        priority: 3,
        tags: ['subtask'],
        taskType: 'subtask' as const,
        parentTaskId: story.id,
        epicId: story.epicId,
        estimatedHours: 4,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    });

    currentIndex += subtaskTemplates.length;
  });

  return subtasks;
}

/**
 * Generate dependencies between tasks
 */
function generateDependencies(tasks: Task[]): TaskDependency[] {
  const dependencies: TaskDependency[] = [];
  const epics = tasks.filter(t => t.taskType === 'epic');
  const stories = tasks.filter(t => t.taskType === 'story');
  const subtasks = tasks.filter(t => t.taskType === 'subtask');

  // Stories depend on their epics
  stories.forEach(story => {
    if (story.epicId) {
      dependencies.push({
        id: generateId(),
        taskId: story.id,
        dependsOnTaskId: story.epicId,
        dependencyType: 'requires',
        createdAt: Date.now(),
      });
    }
  });

  // Subtasks depend on their parent stories
  subtasks.forEach(subtask => {
    if (subtask.parentTaskId) {
      dependencies.push({
        id: generateId(),
        taskId: subtask.id,
        dependsOnTaskId: subtask.parentTaskId,
        dependencyType: 'requires',
        createdAt: Date.now(),
      });
    }
  });

  // Add some logical dependencies (e.g., design before implementation)
  stories.forEach((story, index) => {
    if (index > 0 && story.epicId === stories[index - 1].epicId) {
      if (story.title.includes('Design') || story.title.includes('Schema')) {
        // Design/Schema tasks should be done first
        const implementationStory = stories.find(s =>
          s.epicId === story.epicId &&
          s.title.includes('Implementation')
        );
        if (implementationStory) {
          dependencies.push({
            id: generateId(),
            taskId: implementationStory.id,
            dependsOnTaskId: story.id,
            dependencyType: 'blocks',
            createdAt: Date.now(),
          });
        }
      }
    }
  });

  return dependencies;
}

/**
 * Generate Definition of Done
 */
function generateDoD(storyTitle: string): string {
  const commonDoD = [
    'Code is written and committed',
    'Unit tests are passing',
    'Code review completed',
    'Documentation updated',
  ];

  if (storyTitle.includes('UI') || storyTitle.includes('Design')) {
    commonDoD.push('Responsive design verified');
    commonDoD.push('Accessibility standards met');
  }

  if (storyTitle.includes('API') || storyTitle.includes('Endpoint')) {
    commonDoD.push('API documentation generated');
    commonDoD.push('Integration tests passing');
  }

  if (storyTitle.includes('Database') || storyTitle.includes('Schema')) {
    commonDoD.push('Migration scripts tested');
    commonDoD.push('Rollback plan documented');
  }

  return commonDoD.map((item, i) => `${i + 1}. ${item}`).join('\n');
}

/**
 * Generate test notes
 */
function generateTestNotes(storyTitle: string): string {
  const notes: string[] = [];

  if (storyTitle.includes('Login') || storyTitle.includes('Auth')) {
    notes.push('Test with valid credentials');
    notes.push('Test with invalid credentials');
    notes.push('Test session persistence');
    notes.push('Test logout functionality');
  } else if (storyTitle.includes('API')) {
    notes.push('Test successful responses');
    notes.push('Test error responses');
    notes.push('Test input validation');
    notes.push('Test rate limiting');
  } else if (storyTitle.includes('UI')) {
    notes.push('Test on different screen sizes');
    notes.push('Test keyboard navigation');
    notes.push('Test with screen reader');
    notes.push('Test error states');
  } else {
    notes.push('Test happy path');
    notes.push('Test edge cases');
    notes.push('Test error handling');
  }

  return notes.join('\n');
}

/**
 * Suggest agent assignments based on skills
 */
function suggestAgentAssignments(
  tasks: Task[],
  agents: AgentWithSkills[],
  originalContent: string
): AgentAssignment[] {
  const assignments: AgentAssignment[] = [];

  tasks.forEach(task => {
    const taskContent = `${task.title} ${task.description} ${task.tags.join(' ')}`.toLowerCase();
    let bestAgent: AgentWithSkills | null = null;
    let bestScore = 0;
    let matchedSkills: string[] = [];

    agents.forEach(agent => {
      let score = 0;
      const agentSkills: string[] = [];

      // Check agent's skills against task requirements
      for (const [skill, keywords] of Object.entries(SKILL_KEYWORDS)) {
        const hasSkill = agent.skills.some(s =>
          s.skillName.toLowerCase().includes(skill) ||
          skill.includes(s.skillName.toLowerCase())
        );

        if (hasSkill) {
          const keywordMatches = keywords.filter(kw => taskContent.includes(kw)).length;
          if (keywordMatches > 0) {
            const skillLevel = agent.skills.find(s =>
              s.skillName.toLowerCase().includes(skill)
            )?.skillLevel || 3;
            score += keywordMatches * skillLevel;
            agentSkills.push(skill);
          }
        }
      }

      // Boost score based on performance metrics
      if (agent.performanceMetrics) {
        score *= (agent.performanceMetrics.averageQualityScore / 5);
      }

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
        matchedSkills = agentSkills;
      }
    });

    if (bestAgent && bestScore > 0) {
      assignments.push({
        taskId: task.id,
        agentId: bestAgent.id,
        reason: `Matched skills: ${matchedSkills.join(', ')}`,
        confidence: Math.min(bestScore / 10, 1),
      });
    }
  });

  return assignments;
}

/**
 * Extract text from image (placeholder for OCR/AI vision)
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  // In a real implementation, this would use OCR or AI vision API
  // For now, return a placeholder
  return 'Extracted text from image: [This would use OCR or AI vision to extract text from screenshots]';
}
