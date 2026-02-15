import { TaskBreakdownInput, TaskBreakdownResult, RiskLevel } from '@/types/taskBreakdown';

/**
 * Task Breakdown Service
 * Analyzes input (issues, PRDs, screenshots) and breaks them down into
 * epics, stories, subtasks with DoD, test notes, and risk flags
 */

interface KeywordCategory {
  keywords: string[];
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  risks?: Array<{
    level: RiskLevel;
    category: string;
    description: string;
  }>;
}

const KEYWORD_PATTERNS: Record<string, KeywordCategory> = {
  authentication: {
    keywords: ['auth', 'login', 'signup', 'session', 'jwt', 'oauth'],
    priority: 5,
    tags: ['backend', 'security'],
    risks: [
      {
        level: 'high',
        category: 'security',
        description: 'Authentication vulnerabilities could compromise user data',
      },
    ],
  },
  database: {
    keywords: ['database', 'schema', 'migration', 'sql', 'query', 'data model'],
    priority: 4,
    tags: ['backend', 'database'],
    risks: [
      {
        level: 'medium',
        category: 'technical',
        description: 'Schema changes may require data migration',
      },
    ],
  },
  ui: {
    keywords: ['ui', 'interface', 'component', 'design', 'layout', 'style'],
    priority: 3,
    tags: ['frontend', 'ui-ux'],
  },
  api: {
    keywords: ['api', 'endpoint', 'rest', 'graphql', 'route'],
    priority: 4,
    tags: ['backend', 'api'],
  },
  testing: {
    keywords: ['test', 'unit test', 'integration test', 'e2e'],
    priority: 3,
    tags: ['testing'],
  },
  performance: {
    keywords: ['performance', 'optimization', 'speed', 'cache', 'lazy load'],
    priority: 4,
    tags: ['performance'],
    risks: [
      {
        level: 'medium',
        category: 'technical',
        description: 'Performance issues may impact user experience',
      },
    ],
  },
  deployment: {
    keywords: ['deploy', 'ci/cd', 'docker', 'kubernetes', 'infrastructure'],
    priority: 5,
    tags: ['devops'],
    risks: [
      {
        level: 'high',
        category: 'technical',
        description: 'Deployment issues could cause downtime',
      },
    ],
  },
};

/**
 * Analyzes input text to determine relevant categories and priorities
 */
function analyzeInput(text: string): {
  categories: string[];
  suggestedPriority: 1 | 2 | 3 | 4 | 5;
  suggestedTags: string[];
  identifiedRisks: Array<{ level: RiskLevel; category: string; description: string }>;
} {
  const lowerText = text.toLowerCase();
  const categories: string[] = [];
  const tags = new Set<string>();
  const risks: Array<{ level: RiskLevel; category: string; description: string }> = [];
  let maxPriority: 1 | 2 | 3 | 4 | 5 = 3;

  // Check for urgency keywords
  const urgencyKeywords = ['urgent', 'critical', 'asap', 'emergency', 'blocker'];
  const hasUrgency = urgencyKeywords.some((keyword) => lowerText.includes(keyword));
  if (hasUrgency) {
    maxPriority = 5;
    risks.push({
      level: 'high',
      category: 'deadline',
      description: 'Urgent requirement with tight deadline',
    });
  }

  // Analyze against known patterns
  Object.entries(KEYWORD_PATTERNS).forEach(([category, config]) => {
    const matches = config.keywords.filter((keyword) => lowerText.includes(keyword));
    if (matches.length > 0) {
      categories.push(category);
      config.tags.forEach((tag) => tags.add(tag));
      if (config.priority > maxPriority) {
        maxPriority = config.priority;
      }
      if (config.risks) {
        risks.push(...config.risks);
      }
    }
  });

  return {
    categories,
    suggestedPriority: maxPriority,
    suggestedTags: Array.from(tags),
    identifiedRisks: risks,
  };
}

/**
 * Extracts potential epic from input
 */
function extractEpic(input: TaskBreakdownInput): { title: string; description: string; goals: string[] } | null {
  const text = input.source;

  // Look for epic-level indicators
  const epicIndicators = ['epic', 'feature set', 'major feature', 'project', 'initiative'];
  const hasEpicIndicator = epicIndicators.some((indicator) =>
    text.toLowerCase().includes(indicator)
  );

  if (!hasEpicIndicator && text.length < 500) {
    return null; // Too small to be an epic
  }

  // Extract first line as title
  const lines = text.split('\n').filter((line) => line.trim());
  const title = lines[0]?.replace(/^#+\s*/, '').trim() || 'New Epic';

  // Extract goals from numbered lists or bullet points
  const goals: string[] = [];
  const goalPattern = /(?:^|\n)(?:\d+\.|-|\*)\s*(.+)/g;
  let match;
  while ((match = goalPattern.exec(text)) !== null) {
    if (match[1] && match[1].trim()) {
      goals.push(match[1].trim());
    }
  }

  return {
    title,
    description: text,
    goals: goals.length > 0 ? goals : ['Complete feature implementation'],
  };
}

/**
 * Breaks down input into stories and subtasks
 */
function breakdownIntoStories(input: TaskBreakdownInput): TaskBreakdownResult['stories'] {
  const text = input.source;
  const analysis = analyzeInput(text);

  // Split by major sections (headers, numbered items, etc.)
  const sections = text.split(/\n(?=#+\s|\d+\.|\*\s)/);

  const stories: TaskBreakdownResult['stories'] = [];

  // If input is simple, create a single story
  if (sections.length <= 2 && text.length < 300) {
    const lines = text.split('\n').filter((line) => line.trim());
    const title = lines[0]?.replace(/^#+\s*/, '').trim() || 'Implement feature';

    stories.push({
      title,
      description: text,
      priority: analysis.suggestedPriority,
      tags: analysis.suggestedTags,
      estimatedHours: estimateHours(text, analysis.categories),
      subtasks: generateSubtasks(title, analysis.categories),
      definitionOfDone: generateDoD(analysis.categories),
      testScenarios: generateTestScenarios(title, analysis.categories),
      risks: analysis.identifiedRisks,
      dependencies: [],
    });
  } else {
    // Create multiple stories from sections
    sections.forEach((section, index) => {
      if (!section.trim()) return;

      const sectionLines = section.split('\n').filter((line) => line.trim());
      const sectionTitle = sectionLines[0]?.replace(/^#+\s*|\d+\.\s*|\*\s*/, '').trim() || `Story ${index + 1}`;
      const sectionAnalysis = analyzeInput(section);

      stories.push({
        title: sectionTitle,
        description: section.trim(),
        priority: sectionAnalysis.suggestedPriority,
        tags: sectionAnalysis.suggestedTags.length > 0 ? sectionAnalysis.suggestedTags : analysis.suggestedTags,
        estimatedHours: estimateHours(section, sectionAnalysis.categories),
        subtasks: generateSubtasks(sectionTitle, sectionAnalysis.categories),
        definitionOfDone: generateDoD(sectionAnalysis.categories),
        testScenarios: generateTestScenarios(sectionTitle, sectionAnalysis.categories),
        risks: sectionAnalysis.identifiedRisks,
        dependencies: [],
      });
    });
  }

  // Analyze dependencies between stories
  analyzeDependencies(stories);

  return stories;
}

/**
 * Generates subtasks based on story title and categories
 */
function generateSubtasks(
  storyTitle: string,
  categories: string[]
): Array<{ title: string; description: string; estimatedHours?: number }> {
  const subtasks: Array<{ title: string; description: string; estimatedHours?: number }> = [];

  // Common subtasks based on categories
  if (categories.includes('ui') || categories.includes('frontend')) {
    subtasks.push({
      title: 'Design UI components',
      description: 'Create mockups and design system components',
      estimatedHours: 3,
    });
    subtasks.push({
      title: 'Implement UI components',
      description: 'Build React components with proper styling',
      estimatedHours: 5,
    });
  }

  if (categories.includes('api') || categories.includes('backend')) {
    subtasks.push({
      title: 'Design API endpoints',
      description: 'Define API routes, request/response schemas',
      estimatedHours: 2,
    });
    subtasks.push({
      title: 'Implement API logic',
      description: 'Create controllers and business logic',
      estimatedHours: 6,
    });
  }

  if (categories.includes('database')) {
    subtasks.push({
      title: 'Design database schema',
      description: 'Create tables, relationships, and indexes',
      estimatedHours: 3,
    });
    subtasks.push({
      title: 'Write migration scripts',
      description: 'Create up/down migration files',
      estimatedHours: 2,
    });
  }

  if (categories.includes('authentication')) {
    subtasks.push({
      title: 'Implement authentication logic',
      description: 'Set up JWT/session handling',
      estimatedHours: 4,
    });
    subtasks.push({
      title: 'Add authentication middleware',
      description: 'Protect routes with auth checks',
      estimatedHours: 2,
    });
  }

  // Always add testing and documentation
  subtasks.push({
    title: 'Write unit tests',
    description: `Add comprehensive tests for ${storyTitle}`,
    estimatedHours: 3,
  });

  subtasks.push({
    title: 'Update documentation',
    description: 'Document implementation and usage',
    estimatedHours: 1,
  });

  return subtasks;
}

/**
 * Generates Definition of Done criteria
 */
function generateDoD(categories: string[]): string[] {
  const dod: string[] = [
    'Code is reviewed and approved',
    'All unit tests pass',
    'No linting errors',
    'Documentation is updated',
  ];

  if (categories.includes('ui') || categories.includes('frontend')) {
    dod.push('UI matches design specifications');
    dod.push('Responsive design works on mobile and desktop');
  }

  if (categories.includes('api') || categories.includes('backend')) {
    dod.push('API endpoints return correct responses');
    dod.push('Error handling is implemented');
  }

  if (categories.includes('database')) {
    dod.push('Database migrations run successfully');
    dod.push('Data integrity constraints are in place');
  }

  if (categories.includes('authentication')) {
    dod.push('Security best practices are followed');
    dod.push('Authentication flows work correctly');
  }

  if (categories.includes('testing')) {
    dod.push('Integration tests pass');
    dod.push('Test coverage meets minimum threshold');
  }

  if (categories.includes('deployment')) {
    dod.push('Deployment pipeline runs successfully');
    dod.push('Production environment tested');
  }

  return dod;
}

/**
 * Generates test scenarios
 */
function generateTestScenarios(storyTitle: string, categories: string[]): string[] {
  const scenarios: string[] = [
    `Verify ${storyTitle} works as expected`,
    'Test edge cases and error conditions',
  ];

  if (categories.includes('ui')) {
    scenarios.push('Test UI interactions and state changes');
    scenarios.push('Verify accessibility requirements');
  }

  if (categories.includes('api')) {
    scenarios.push('Test API with valid inputs');
    scenarios.push('Test API with invalid inputs');
    scenarios.push('Verify error responses are correct');
  }

  if (categories.includes('authentication')) {
    scenarios.push('Test login with valid credentials');
    scenarios.push('Test login with invalid credentials');
    scenarios.push('Verify session persistence');
  }

  if (categories.includes('database')) {
    scenarios.push('Test database queries return correct data');
    scenarios.push('Verify data constraints work properly');
  }

  if (categories.includes('performance')) {
    scenarios.push('Test performance under load');
    scenarios.push('Verify caching works correctly');
  }

  return scenarios;
}

/**
 * Estimates hours based on text complexity and categories
 */
function estimateHours(text: string, categories: string[]): number {
  let baseHours = 8; // Default 1 day

  // Adjust based on text length
  const words = text.split(/\s+/).length;
  if (words < 50) baseHours = 4;
  else if (words < 150) baseHours = 8;
  else if (words < 300) baseHours = 16;
  else baseHours = 24;

  // Adjust based on complexity of categories
  const complexCategories = ['authentication', 'database', 'deployment', 'performance'];
  const hasComplexity = categories.some((cat) => complexCategories.includes(cat));
  if (hasComplexity) {
    baseHours *= 1.5;
  }

  return Math.round(baseHours);
}

/**
 * Analyzes and sets dependencies between stories
 */
function analyzeDependencies(stories: TaskBreakdownResult['stories']): void {
  stories.forEach((story, index) => {
    // Database changes should come first
    if (story.tags.includes('database') && index > 0) {
      const apiStories = stories.filter((s) => s.tags.includes('backend') || s.tags.includes('api'));
      apiStories.forEach((apiStory) => {
        if (apiStory !== story && !story.dependencies.includes(apiStory.title)) {
          story.dependencies.push(story.title);
        }
      });
    }

    // API should come before UI
    if (story.tags.includes('frontend') && index > 0) {
      const apiStories = stories.filter((s) => s.tags.includes('backend') || s.tags.includes('api'));
      apiStories.forEach((apiStory) => {
        if (!story.dependencies.includes(apiStory.title)) {
          story.dependencies.push(apiStory.title);
        }
      });
    }

    // Testing comes after implementation
    if (story.tags.includes('testing') && index > 0) {
      const implStories = stories.filter((s) => !s.tags.includes('testing'));
      implStories.forEach((implStory) => {
        if (!story.dependencies.includes(implStory.title)) {
          story.dependencies.push(implStory.title);
        }
      });
    }

    // Deployment comes last
    if (story.tags.includes('devops') && index > 0) {
      const otherStories = stories.filter((s) => !s.tags.includes('devops'));
      otherStories.forEach((otherStory) => {
        if (!story.dependencies.includes(otherStory.title)) {
          story.dependencies.push(otherStory.title);
        }
      });
    }
  });
}

/**
 * Main function to break down input into structured tasks
 */
export function breakdownTask(input: TaskBreakdownInput): TaskBreakdownResult {
  const epic = extractEpic(input);
  const stories = breakdownIntoStories(input);

  return {
    epic: epic
      ? {
          id: '',
          epicId: '',
          title: epic.title,
          description: epic.description,
          goals: epic.goals,
          userId: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
      : undefined,
    stories,
  };
}

/**
 * Validates and scores the quality of a task breakdown
 */
export function validateBreakdown(breakdown: TaskBreakdownResult): {
  isValid: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Check if stories exist
  if (breakdown.stories.length === 0) {
    issues.push('No stories generated');
    score -= 50;
  }

  // Check each story
  breakdown.stories.forEach((story, index) => {
    if (!story.title || story.title.length < 5) {
      issues.push(`Story ${index + 1}: Title is too short`);
      score -= 10;
    }

    if (story.subtasks.length === 0) {
      suggestions.push(`Story ${index + 1}: Consider adding subtasks`);
      score -= 5;
    }

    if (story.definitionOfDone.length === 0) {
      issues.push(`Story ${index + 1}: Missing Definition of Done`);
      score -= 10;
    }

    if (story.testScenarios.length === 0) {
      suggestions.push(`Story ${index + 1}: Consider adding test scenarios`);
      score -= 5;
    }

    if (!story.estimatedHours) {
      suggestions.push(`Story ${index + 1}: Consider adding time estimate`);
      score -= 3;
    }
  });

  return {
    isValid: issues.length === 0,
    score: Math.max(0, score),
    issues,
    suggestions,
  };
}
