import { TaskBreakdownInput, BreakdownResult } from '@/types/breakdown';

/**
 * Analyzes input and breaks it down into epics, tasks, subtasks with DoD, test notes, and risk flags
 */
export async function analyzeAndBreakdown(input: TaskBreakdownInput): Promise<BreakdownResult> {
  // This is a rule-based implementation. In production, this could call an AI service
  // like OpenAI GPT-4, Claude, or a custom ML model

  const lines = input.content.split('\n').filter(l => l.trim());
  const isLargeScope = lines.length > 10 || input.content.length > 1000;

  // Analyze content to extract requirements
  const requirements = extractRequirements(input.content);
  const technicalTerms = extractTechnicalTerms(input.content);
  const hasBackend = technicalTerms.some(t => ['api', 'database', 'server', 'backend'].includes(t.toLowerCase()));
  const hasFrontend = technicalTerms.some(t => ['ui', 'frontend', 'component', 'page', 'view'].includes(t.toLowerCase()));
  const hasInfra = technicalTerms.some(t => ['deploy', 'docker', 'ci/cd', 'infrastructure'].includes(t.toLowerCase()));

  const result: BreakdownResult = {
    tasks: [],
    dependencies: [],
  };

  // Create epic if scope is large enough
  if (isLargeScope) {
    result.epic = {
      id: generateId(),
      title: input.title || extractTitle(input.content),
      description: input.content.slice(0, 500),
      priority: determinePriority(input.content),
      estimatedEffort: Math.ceil(requirements.length * 3),
      businessValue: extractBusinessValue(input.content),
      createdAt: Date.now(),
    };
  }

  // Break down into tasks
  const taskGroups = groupRequirements(requirements, { hasBackend, hasFrontend, hasInfra });

  taskGroups.forEach((group, groupIdx) => {
    const task = {
      title: group.title,
      description: group.description,
      priority: group.priority,
      estimatedHours: group.estimatedHours,
      tags: group.tags,
      definitionOfDone: generateDoD(group),
      testNotes: generateTestNotes(group),
      riskFlags: assessRisks(group),
      subtasks: generateSubtasks(group),
      dependencies: group.dependencies,
    };

    result.tasks.push(task);

    // Add dependencies
    group.dependencies.forEach(depIdx => {
      if (depIdx < groupIdx) {
        result.dependencies.push({
          source: depIdx,
          target: groupIdx,
          type: 'blocks',
        });
      }
    });
  });

  return result;
}

interface Requirement {
  text: string;
  category: 'feature' | 'technical' | 'constraint' | 'integration';
  priority: number;
}

function extractRequirements(content: string): Requirement[] {
  const requirements: Requirement[] = [];
  const lines = content.split('\n');

  // Look for bullet points, numbered lists, or "should" statements
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Match bullets, numbers, or action words
    if (
      /^[-*•]\s/.test(trimmed) ||
      /^\d+[\.)]\s/.test(trimmed) ||
      /\b(should|must|need|implement|create|add|build|develop)\b/i.test(trimmed)
    ) {
      const text = trimmed.replace(/^[-*•]\s/, '').replace(/^\d+[\.)]\s/, '');
      const category = categorizeRequirement(text);
      const priority = determinePriorityFromText(text);

      requirements.push({ text, category, priority });
    }
  });

  // If no structured requirements found, treat as single requirement
  if (requirements.length === 0) {
    requirements.push({
      text: content,
      category: 'feature',
      priority: 3,
    });
  }

  return requirements;
}

function categorizeRequirement(text: string): Requirement['category'] {
  const lower = text.toLowerCase();
  if (/\b(api|database|backend|server|endpoint)\b/.test(lower)) return 'technical';
  if (/\b(integrate|connect|sync|import|export)\b/.test(lower)) return 'integration';
  if (/\b(performance|security|scalability|must be|constraint)\b/.test(lower)) return 'constraint';
  return 'feature';
}

function determinePriorityFromText(text: string): number {
  const lower = text.toLowerCase();
  if (/\b(critical|urgent|asap|immediately|blocker)\b/.test(lower)) return 5;
  if (/\b(important|high|priority)\b/.test(lower)) return 4;
  if (/\b(nice to have|optional|future)\b/.test(lower)) return 2;
  return 3;
}

function extractTechnicalTerms(content: string): string[] {
  const terms: string[] = [];
  const techPatterns = [
    /\b(api|rest|graphql|database|sql|nosql)\b/gi,
    /\b(react|vue|angular|frontend|ui|ux)\b/gi,
    /\b(backend|server|node|python|java)\b/gi,
    /\b(docker|kubernetes|ci\/cd|deploy|aws|azure)\b/gi,
    /\b(auth|authentication|authorization|oauth)\b/gi,
  ];

  techPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) terms.push(...matches);
  });

  return [...new Set(terms)];
}

function extractTitle(content: string): string {
  const firstLine = content.split('\n')[0];
  if (firstLine.length > 100) {
    return firstLine.slice(0, 100) + '...';
  }
  return firstLine || 'Untitled Epic';
}

function determinePriority(content: string): 1 | 2 | 3 | 4 | 5 {
  const lower = content.toLowerCase();
  if (/\b(critical|urgent|p0|asap)\b/.test(lower)) return 5;
  if (/\b(important|high|p1)\b/.test(lower)) return 4;
  if (/\b(low|p3|minor)\b/.test(lower)) return 2;
  if (/\b(trivial|p4)\b/.test(lower)) return 1;
  return 3;
}

function extractBusinessValue(content: string): string {
  const valueKeywords = ['user', 'customer', 'revenue', 'efficiency', 'cost', 'value'];
  const lines = content.split('\n');

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (valueKeywords.some(kw => lower.includes(kw))) {
      return line.trim();
    }
  }

  return 'Improves system functionality and user experience';
}

interface TaskGroup {
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4 | 5;
  estimatedHours: number;
  tags: string[];
  requirements: Requirement[];
  dependencies: number[];
}

function groupRequirements(
  requirements: Requirement[],
  features: { hasBackend: boolean; hasFrontend: boolean; hasInfra: boolean }
): TaskGroup[] {
  const groups: TaskGroup[] = [];

  // Group by category and create logical tasks
  const byCategory = {
    feature: requirements.filter(r => r.category === 'feature'),
    technical: requirements.filter(r => r.category === 'technical'),
    integration: requirements.filter(r => r.category === 'integration'),
    constraint: requirements.filter(r => r.category === 'constraint'),
  };

  // Backend task
  if (features.hasBackend || byCategory.technical.length > 0) {
    groups.push({
      title: 'Backend Development',
      description: 'Implement server-side logic, APIs, and database operations',
      priority: 4,
      estimatedHours: 16,
      tags: ['backend', 'api', 'database'],
      requirements: byCategory.technical,
      dependencies: [],
    });
  }

  // Frontend task (depends on backend if both exist)
  if (features.hasFrontend) {
    groups.push({
      title: 'Frontend Development',
      description: 'Implement user interface components and interactions',
      priority: 3,
      estimatedHours: 12,
      tags: ['frontend', 'ui', 'react'],
      requirements: byCategory.feature,
      dependencies: features.hasBackend ? [0] : [],
    });
  }

  // Integration task (depends on both backend and frontend)
  if (byCategory.integration.length > 0) {
    const deps: number[] = [];
    if (features.hasBackend) deps.push(0);
    if (features.hasFrontend) deps.push(features.hasBackend ? 1 : 0);

    groups.push({
      title: 'Integration & Testing',
      description: 'Integrate components and perform end-to-end testing',
      priority: 3,
      estimatedHours: 8,
      tags: ['integration', 'testing'],
      requirements: byCategory.integration,
      dependencies: deps,
    });
  }

  // Infrastructure/Deployment (usually last)
  if (features.hasInfra) {
    groups.push({
      title: 'Deployment & Infrastructure',
      description: 'Set up deployment pipeline and infrastructure',
      priority: 2,
      estimatedHours: 6,
      tags: ['devops', 'infrastructure', 'deployment'],
      requirements: [],
      dependencies: Array.from({ length: groups.length }, (_, i) => i),
    });
  }

  // If no specific groups were created, create a general task
  if (groups.length === 0) {
    groups.push({
      title: 'Implementation',
      description: requirements.map(r => r.text).join('. '),
      priority: 3,
      estimatedHours: 8,
      tags: ['development'],
      requirements: requirements,
      dependencies: [],
    });
  }

  return groups;
}

function generateDoD(group: TaskGroup): string[] {
  const dod: string[] = [
    'Code is written and follows coding standards',
    'Unit tests are written and passing',
    'Code is reviewed and approved',
  ];

  if (group.tags.includes('backend')) {
    dod.push('API endpoints are documented');
    dod.push('Database migrations are created and tested');
  }

  if (group.tags.includes('frontend')) {
    dod.push('UI matches design specifications');
    dod.push('Component is responsive and accessible');
  }

  if (group.tags.includes('integration')) {
    dod.push('End-to-end tests are passing');
    dod.push('All edge cases are handled');
  }

  if (group.tags.includes('devops')) {
    dod.push('Deployment scripts are tested');
    dod.push('Monitoring and logging are configured');
  }

  return dod;
}

function generateTestNotes(group: TaskGroup): string[] {
  const notes: string[] = [];

  if (group.tags.includes('backend')) {
    notes.push('Test all API endpoints with valid and invalid inputs');
    notes.push('Verify database operations and data integrity');
    notes.push('Test error handling and edge cases');
  }

  if (group.tags.includes('frontend')) {
    notes.push('Test UI on different screen sizes and browsers');
    notes.push('Verify user interactions and form validations');
    notes.push('Test accessibility with screen readers');
  }

  if (group.tags.includes('integration')) {
    notes.push('Perform end-to-end user flow testing');
    notes.push('Test integration points between components');
    notes.push('Verify data flow and state management');
  }

  if (notes.length === 0) {
    notes.push('Test functionality meets requirements');
    notes.push('Verify no regressions in existing features');
  }

  return notes;
}

function assessRisks(group: TaskGroup): Array<{
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'technical' | 'dependency' | 'resource' | 'timeline' | 'scope';
  description: string;
  mitigation?: string;
}> {
  const risks: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'technical' | 'dependency' | 'resource' | 'timeline' | 'scope';
    description: string;
    mitigation?: string;
  }> = [];

  // Dependency risks
  if (group.dependencies.length > 2) {
    risks.push({
      severity: 'medium',
      category: 'dependency',
      description: 'Multiple dependencies may cause delays if upstream tasks are blocked',
      mitigation: 'Identify critical path and prioritize blocking tasks',
    });
  }

  // Timeline risks
  if (group.estimatedHours > 20) {
    risks.push({
      severity: 'medium',
      category: 'timeline',
      description: 'Large task may take longer than estimated',
      mitigation: 'Break down into smaller subtasks and track progress daily',
    });
  }

  // Technical risks
  if (group.tags.includes('database') || group.tags.includes('api')) {
    risks.push({
      severity: 'low',
      category: 'technical',
      description: 'Database schema changes may require careful migration',
      mitigation: 'Test migrations on staging environment first',
    });
  }

  if (group.tags.includes('integration')) {
    risks.push({
      severity: 'medium',
      category: 'technical',
      description: 'Integration issues may arise between components',
      mitigation: 'Use contract testing and mock services during development',
    });
  }

  return risks;
}

function generateSubtasks(group: TaskGroup): Array<{
  title: string;
  description: string;
  estimatedHours: number;
}> {
  const subtasks: Array<{
    title: string;
    description: string;
    estimatedHours: number;
  }> = [];

  if (group.tags.includes('backend')) {
    subtasks.push(
      {
        title: 'Design database schema',
        description: 'Define tables, relationships, and constraints',
        estimatedHours: 2,
      },
      {
        title: 'Implement API endpoints',
        description: 'Create REST/GraphQL endpoints for CRUD operations',
        estimatedHours: 6,
      },
      {
        title: 'Write unit tests',
        description: 'Test business logic and API endpoints',
        estimatedHours: 3,
      },
    );
  }

  if (group.tags.includes('frontend')) {
    subtasks.push(
      {
        title: 'Create UI components',
        description: 'Build reusable React components',
        estimatedHours: 4,
      },
      {
        title: 'Implement state management',
        description: 'Set up state and data flow',
        estimatedHours: 3,
      },
      {
        title: 'Style and polish UI',
        description: 'Apply styling and ensure responsiveness',
        estimatedHours: 2,
      },
    );
  }

  if (group.tags.includes('integration')) {
    subtasks.push(
      {
        title: 'Connect frontend to backend',
        description: 'Integrate API calls and handle responses',
        estimatedHours: 3,
      },
      {
        title: 'Write integration tests',
        description: 'Test end-to-end user flows',
        estimatedHours: 3,
      },
    );
  }

  if (subtasks.length === 0) {
    // Default subtasks for generic task
    const hoursPerSubtask = Math.ceil(group.estimatedHours / 3);
    subtasks.push(
      {
        title: 'Initial implementation',
        description: 'Core functionality development',
        estimatedHours: hoursPerSubtask,
      },
      {
        title: 'Testing and refinement',
        description: 'Test and fix issues',
        estimatedHours: hoursPerSubtask,
      },
      {
        title: 'Documentation',
        description: 'Update documentation and comments',
        estimatedHours: Math.max(1, group.estimatedHours - hoursPerSubtask * 2),
      },
    );
  }

  return subtasks;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
