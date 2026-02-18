import { Task, TaskType } from '@/types/task';
import { TaskDependency, RiskFlag, DefinitionOfDone, TestNote } from '@/types/dependencies';

export interface BreakdownInput {
  type: 'text' | 'screenshot';
  content: string; // Text content or base64 image
  context?: string; // Additional context
}

export interface BreakdownResult {
  epic?: {
    title: string;
    description: string;
    priority: 1 | 2 | 3 | 4 | 5;
    tags: string[];
    estimatedHours?: number;
  };
  tasks: Array<{
    title: string;
    description: string;
    priority: 1 | 2 | 3 | 4 | 5;
    tags: string[];
    estimatedHours?: number;
    epicRelated?: boolean; // If this task should be part of the epic
    subtasks?: Array<{
      title: string;
      description: string;
    }>;
    definitionOfDone: string[];
    testNotes: Array<{
      description: string;
      testType: 'unit' | 'integration' | 'e2e' | 'manual' | 'performance';
    }>;
    riskFlags: Array<{
      level: 'low' | 'medium' | 'high' | 'critical';
      category: string;
      description: string;
      mitigation?: string;
    }>;
  }>;
  dependencies: Array<{
    sourceTaskIndex: number; // Index in tasks array
    targetTaskIndex: number;
    type: 'blocks' | 'blocked-by' | 'relates-to';
  }>;
}

/**
 * Analyzes input (PRD, issue description, or screenshot) and breaks it down
 * into epics, tasks, subtasks with DoD, test notes, and risk flags.
 *
 * Note: This is a mock implementation. In production, this would call an LLM API
 * like OpenAI GPT-4, Anthropic Claude, or a custom model.
 */
export async function analyzeAndBreakdown(input: BreakdownInput): Promise<BreakdownResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Mock implementation - parse the input and generate structured breakdown
  const result: BreakdownResult = {
    tasks: [],
    dependencies: [],
  };

  // Simple heuristics for demo purposes
  const content = input.content.toLowerCase();
  const isLargeProject = content.length > 500 ||
                         content.includes('epic') ||
                         content.includes('multiple features') ||
                         content.includes('large project');

  if (isLargeProject) {
    // Create an epic for large projects
    result.epic = {
      title: extractTitle(input.content) || 'Project Epic',
      description: 'This epic encompasses the full project scope with multiple related tasks.',
      priority: determinePriority(content),
      tags: extractTags(content),
      estimatedHours: 80,
    };
  }

  // Generate tasks based on content analysis
  const taskCount = isLargeProject ? 5 : 3;
  const taskKeywords = extractTaskKeywords(content);

  for (let i = 0; i < taskCount; i++) {
    const task = {
      title: taskKeywords[i] || `Implement Feature ${i + 1}`,
      description: generateTaskDescription(taskKeywords[i], content),
      priority: determinePriority(content) as 1 | 2 | 3 | 4 | 5,
      tags: extractTags(content),
      estimatedHours: Math.floor(Math.random() * 16) + 8, // 8-24 hours
      epicRelated: isLargeProject,
      subtasks: generateSubtasks(taskKeywords[i], 3),
      definitionOfDone: generateDoD(taskKeywords[i]),
      testNotes: generateTestNotes(taskKeywords[i]),
      riskFlags: generateRiskFlags(content, taskKeywords[i]),
    };
    result.tasks.push(task);
  }

  // Generate dependencies
  if (result.tasks.length > 1) {
    // Create some logical dependencies
    result.dependencies.push({
      sourceTaskIndex: 1,
      targetTaskIndex: 0,
      type: 'blocked-by',
    });

    if (result.tasks.length > 2) {
      result.dependencies.push({
        sourceTaskIndex: 2,
        targetTaskIndex: 1,
        type: 'relates-to',
      });
    }
  }

  return result;
}

function extractTitle(content: string): string | null {
  // Try to extract title from common patterns
  const lines = content.split('\n');
  const firstLine = lines[0]?.trim();

  // Check for markdown headers
  if (firstLine?.startsWith('#')) {
    return firstLine.replace(/^#+\s*/, '').trim();
  }

  // Check for "Title:" pattern
  const titleMatch = content.match(/title:\s*(.+)/i);
  if (titleMatch) {
    return titleMatch[1].trim();
  }

  // Return first non-empty line if short enough
  if (firstLine && firstLine.length < 100) {
    return firstLine;
  }

  return null;
}

function determinePriority(content: string): 1 | 2 | 3 | 4 | 5 {
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('critical') || lowerContent.includes('urgent') || lowerContent.includes('asap')) {
    return 5;
  }
  if (lowerContent.includes('high priority') || lowerContent.includes('important')) {
    return 4;
  }
  if (lowerContent.includes('low priority') || lowerContent.includes('nice to have')) {
    return 2;
  }

  return 3; // Default to medium
}

function extractTags(content: string): string[] {
  const tags: string[] = [];
  const lowerContent = content.toLowerCase();

  // Technology tags
  if (lowerContent.includes('react') || lowerContent.includes('frontend') || lowerContent.includes('ui')) {
    tags.push('frontend');
  }
  if (lowerContent.includes('api') || lowerContent.includes('backend') || lowerContent.includes('server')) {
    tags.push('backend');
  }
  if (lowerContent.includes('database') || lowerContent.includes('sql') || lowerContent.includes('data')) {
    tags.push('database');
  }
  if (lowerContent.includes('bug') || lowerContent.includes('fix')) {
    tags.push('bug');
  }
  if (lowerContent.includes('feature') || lowerContent.includes('new')) {
    tags.push('feature');
  }
  if (lowerContent.includes('test')) {
    tags.push('testing');
  }
  if (lowerContent.includes('design') || lowerContent.includes('ux')) {
    tags.push('design');
  }

  return tags.length > 0 ? tags : ['general'];
}

function extractTaskKeywords(content: string): string[] {
  // Extract potential task names from content
  const keywords: string[] = [];
  const lowerContent = content.toLowerCase();

  // Common task patterns
  const patterns = [
    'implement authentication',
    'create api endpoints',
    'design user interface',
    'setup database schema',
    'write tests',
    'configure deployment',
    'add validation',
    'integrate third-party service',
  ];

  patterns.forEach(pattern => {
    if (lowerContent.includes(pattern.toLowerCase())) {
      keywords.push(capitalizeWords(pattern));
    }
  });

  // If we didn't find specific patterns, generate generic ones
  if (keywords.length === 0) {
    keywords.push(
      'Setup Project Foundation',
      'Implement Core Features',
      'Add Testing & Documentation',
      'Polish & Optimization',
      'Deployment & Monitoring'
    );
  }

  return keywords;
}

function capitalizeWords(str: string): string {
  return str.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function generateTaskDescription(taskName: string | undefined, originalContent: string): string {
  if (!taskName) {
    return 'This task needs to be implemented as part of the project.';
  }

  return `Implement ${taskName.toLowerCase()} according to the project requirements. Ensure all acceptance criteria are met and properly tested.`;
}

function generateSubtasks(taskName: string | undefined, count: number): Array<{ title: string; description: string }> {
  const subtasks: Array<{ title: string; description: string }> = [];

  const templates = [
    { title: 'Research and Planning', description: 'Research best practices and plan implementation approach' },
    { title: 'Core Implementation', description: 'Implement the main functionality' },
    { title: 'Testing', description: 'Write and run comprehensive tests' },
    { title: 'Documentation', description: 'Document the implementation and usage' },
    { title: 'Code Review', description: 'Submit for code review and address feedback' },
  ];

  for (let i = 0; i < Math.min(count, templates.length); i++) {
    subtasks.push(templates[i]);
  }

  return subtasks;
}

function generateDoD(taskName: string | undefined): string[] {
  return [
    'Code implementation is complete and follows coding standards',
    'Unit tests are written and passing',
    'Integration tests are written and passing',
    'Code has been reviewed and approved',
    'Documentation is updated',
    'No critical bugs or security issues',
    'Performance meets requirements',
  ];
}

function generateTestNotes(taskName: string | undefined): Array<{
  description: string;
  testType: 'unit' | 'integration' | 'e2e' | 'manual' | 'performance';
}> {
  return [
    {
      description: 'Unit tests for core functionality',
      testType: 'unit',
    },
    {
      description: 'Integration tests with related components',
      testType: 'integration',
    },
    {
      description: 'End-to-end user flow testing',
      testType: 'e2e',
    },
  ];
}

function generateRiskFlags(content: string, taskName: string | undefined): Array<{
  level: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  mitigation?: string;
}> {
  const risks: Array<{
    level: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    description: string;
    mitigation?: string;
  }> = [];

  const lowerContent = content.toLowerCase();

  // Detect potential risks based on content
  if (lowerContent.includes('security') || lowerContent.includes('authentication') || lowerContent.includes('payment')) {
    risks.push({
      level: 'high',
      category: 'security',
      description: 'This feature involves security-sensitive operations',
      mitigation: 'Conduct security review and penetration testing before deployment',
    });
  }

  if (lowerContent.includes('migration') || lowerContent.includes('database change')) {
    risks.push({
      level: 'medium',
      category: 'data-migration',
      description: 'Database migration required',
      mitigation: 'Create rollback plan and test migration on staging environment',
    });
  }

  if (lowerContent.includes('third-party') || lowerContent.includes('external api')) {
    risks.push({
      level: 'medium',
      category: 'external-dependency',
      description: 'Depends on external service availability',
      mitigation: 'Implement proper error handling and fallback mechanisms',
    });
  }

  // Default risk for complexity
  if (risks.length === 0) {
    risks.push({
      level: 'low',
      category: 'complexity',
      description: 'Standard implementation complexity',
      mitigation: 'Follow best practices and conduct code reviews',
    });
  }

  return risks;
}

/**
 * Analyzes a screenshot and extracts requirements
 * Note: This is a mock. In production, this would use vision models like GPT-4V or Claude Vision
 */
export async function analyzeScreenshot(base64Image: string): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock response
  return `Based on the screenshot analysis:

- Implement a dashboard with key metrics
- Create data visualization components
- Add filtering and search functionality
- Ensure responsive design for mobile
- Implement real-time updates`;
}
