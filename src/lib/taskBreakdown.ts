import { Task, RiskLevel } from '@/types/task';
import { Epic } from '@/types/epic';
import { generateId, generateTaskId } from './utils';

export interface ParsedInput {
  title: string;
  description: string;
  type: 'issue' | 'prd' | 'screenshot';
  rawContent: string;
}

export interface BreakdownResult {
  epic: Epic;
  tasks: Task[];
  dependencies: Array<{
    taskId: string;
    dependsOn: string;
    type: 'blocks' | 'relates_to';
  }>;
}

/**
 * Analyzes text to extract task information
 */
export function parseInput(content: string, type: 'issue' | 'prd' | 'screenshot' = 'issue'): ParsedInput {
  const lines = content.trim().split('\n');
  const title = lines[0].replace(/^#+\s*/, '').replace(/^Issue:?\s*/i, '').trim();
  const description = lines.slice(1).join('\n').trim();

  return {
    title,
    description,
    type,
    rawContent: content,
  };
}

/**
 * Detects technical keywords and suggests required skills
 */
export function detectRequiredSkills(text: string): string[] {
  const skillKeywords: Record<string, string> = {
    'react': 'React',
    'next.js': 'Next.js',
    'nextjs': 'Next.js',
    'typescript': 'TypeScript',
    'javascript': 'JavaScript',
    'node': 'Node.js',
    'nodejs': 'Node.js',
    'api': 'API Design',
    'rest': 'API Design',
    'graphql': 'GraphQL',
    'database': 'Database Design',
    'postgres': 'PostgreSQL',
    'mysql': 'MySQL',
    'mongodb': 'MongoDB',
    'css': 'CSS',
    'tailwind': 'Tailwind CSS',
    'ui': 'UI/UX',
    'ux': 'UI/UX',
    'mobile': 'Mobile Development',
    'ios': 'iOS',
    'android': 'Android',
    'react native': 'React Native',
    'docker': 'Docker',
    'kubernetes': 'Kubernetes',
    'aws': 'AWS',
    'ci/cd': 'CI/CD',
    'devops': 'DevOps',
    'testing': 'Testing',
    'jest': 'Testing',
    'cypress': 'Testing',
  };

  const lowerText = text.toLowerCase();
  const detectedSkills = new Set<string>();

  for (const [keyword, skill] of Object.entries(skillKeywords)) {
    if (lowerText.includes(keyword)) {
      detectedSkills.add(skill);
    }
  }

  return Array.from(detectedSkills);
}

/**
 * Assesses risk level based on content analysis
 */
export function assessRisk(text: string, complexity: number): { level: RiskLevel; flags: string[] } {
  const riskFlags: string[] = [];
  let riskScore = 0;

  const lowerText = text.toLowerCase();

  // Check for high-risk keywords
  if (lowerText.includes('database migration') || lowerText.includes('schema change')) {
    riskFlags.push('Database Migration');
    riskScore += 2;
  }
  if (lowerText.includes('authentication') || lowerText.includes('security')) {
    riskFlags.push('Security-Sensitive');
    riskScore += 2;
  }
  if (lowerText.includes('payment') || lowerText.includes('billing')) {
    riskFlags.push('Payment Processing');
    riskScore += 3;
  }
  if (lowerText.includes('breaking change')) {
    riskFlags.push('Breaking Change');
    riskScore += 2;
  }
  if (lowerText.includes('production') && lowerText.includes('deploy')) {
    riskFlags.push('Production Deployment');
    riskScore += 1;
  }
  if (lowerText.includes('performance') && lowerText.includes('optimization')) {
    riskFlags.push('Performance Critical');
    riskScore += 1;
  }

  // Adjust risk based on complexity
  riskScore += Math.floor(complexity / 3);

  let level: RiskLevel = 'low';
  if (riskScore >= 6) level = 'critical';
  else if (riskScore >= 4) level = 'high';
  else if (riskScore >= 2) level = 'medium';

  return { level, flags: riskFlags };
}

/**
 * Generates Definition of Done items based on task type
 */
export function generateDefinitionOfDone(title: string, description: string): string[] {
  const dod: string[] = [];
  const lowerText = `${title} ${description}`.toLowerCase();

  // Common DoD items
  dod.push('Code is written and follows project coding standards');

  if (lowerText.includes('ui') || lowerText.includes('component') || lowerText.includes('page')) {
    dod.push('UI is responsive and works on mobile and desktop');
    dod.push('Accessibility standards are met (WCAG 2.1)');
  }

  if (lowerText.includes('api') || lowerText.includes('endpoint') || lowerText.includes('backend')) {
    dod.push('API endpoints are documented');
    dod.push('Error handling is implemented');
    dod.push('API returns appropriate status codes');
  }

  if (lowerText.includes('database') || lowerText.includes('schema')) {
    dod.push('Database migration is tested');
    dod.push('Rollback plan is documented');
  }

  // Always include testing and code review
  dod.push('Unit tests are written and passing');
  dod.push('Code has been reviewed and approved');
  dod.push('Changes are merged to main branch');

  return dod;
}

/**
 * Generates test notes based on task content
 */
export function generateTestNotes(title: string, description: string): string {
  const testNotes: string[] = [];
  const lowerText = `${title} ${description}`.toLowerCase();

  testNotes.push('# Test Plan\n');

  if (lowerText.includes('ui') || lowerText.includes('component')) {
    testNotes.push('## Visual Testing');
    testNotes.push('- [ ] Verify component renders correctly');
    testNotes.push('- [ ] Test different screen sizes (mobile, tablet, desktop)');
    testNotes.push('- [ ] Check dark mode compatibility\n');
  }

  if (lowerText.includes('api') || lowerText.includes('backend')) {
    testNotes.push('## API Testing');
    testNotes.push('- [ ] Test successful response cases');
    testNotes.push('- [ ] Test error handling and edge cases');
    testNotes.push('- [ ] Verify input validation');
    testNotes.push('- [ ] Check authentication/authorization\n');
  }

  if (lowerText.includes('form') || lowerText.includes('input')) {
    testNotes.push('## Form Testing');
    testNotes.push('- [ ] Test form validation');
    testNotes.push('- [ ] Test error message display');
    testNotes.push('- [ ] Verify successful submission\n');
  }

  testNotes.push('## Integration Testing');
  testNotes.push('- [ ] Test integration with existing features');
  testNotes.push('- [ ] Verify no regressions in related functionality\n');

  testNotes.push('## Performance Testing');
  testNotes.push('- [ ] Check page load time');
  testNotes.push('- [ ] Verify no memory leaks');

  return testNotes.join('\n');
}

/**
 * Breaks down a complex issue/PRD into epic, tasks, and subtasks
 */
export function breakdownTask(input: ParsedInput, epicCounter: number, taskCounter: number): BreakdownResult {
  const now = Date.now();

  // Create the epic
  const epic: Epic = {
    id: generateId(),
    epicId: `EPIC-${epicCounter}`,
    title: input.title,
    description: input.description,
    status: 'planning',
    priority: 3,
    createdAt: now,
    updatedAt: now,
  };

  // Detect required skills
  const requiredSkills = detectRequiredSkills(input.rawContent);

  // Break down into tasks based on common patterns
  const tasks: Task[] = [];
  const dependencies: Array<{ taskId: string; dependsOn: string; type: 'blocks' | 'relates_to' }> = [];

  // Pattern 1: If it mentions database/backend/API
  let currentTaskId = taskCounter;
  const taskIds: string[] = [];

  if (input.rawContent.toLowerCase().includes('database') ||
      input.rawContent.toLowerCase().includes('backend') ||
      input.rawContent.toLowerCase().includes('api')) {

    const dbTask: Task = {
      id: generateId(),
      taskId: generateTaskId(currentTaskId++),
      title: `Database schema and API design for ${input.title}`,
      description: 'Design and implement database schema and API endpoints',
      status: 'backlog',
      priority: 5,
      tags: ['backend', 'database', 'api'],
      epicId: epic.id,
      definitionOfDone: generateDefinitionOfDone('database api', input.description),
      testNotes: generateTestNotes('database api', input.description),
      riskLevel: assessRisk('database api', 3).level,
      riskFlags: assessRisk('database api migration', 3).flags,
      estimatedHours: 8,
      createdAt: now,
      updatedAt: now,
    };
    tasks.push(dbTask);
    taskIds.push(dbTask.taskId);
  }

  // Pattern 2: If it mentions UI/frontend/component
  if (input.rawContent.toLowerCase().includes('ui') ||
      input.rawContent.toLowerCase().includes('frontend') ||
      input.rawContent.toLowerCase().includes('component') ||
      input.rawContent.toLowerCase().includes('page')) {

    const uiTask: Task = {
      id: generateId(),
      taskId: generateTaskId(currentTaskId++),
      title: `UI components for ${input.title}`,
      description: 'Create and style frontend components',
      status: 'backlog',
      priority: 4,
      tags: ['frontend', 'ui', 'react'],
      epicId: epic.id,
      definitionOfDone: generateDefinitionOfDone('ui component', input.description),
      testNotes: generateTestNotes('ui component', input.description),
      riskLevel: 'low',
      riskFlags: [],
      estimatedHours: 6,
      createdAt: now,
      updatedAt: now,
    };
    tasks.push(uiTask);
    taskIds.push(uiTask.taskId);

    // If there's a backend task, UI depends on it
    if (taskIds.length > 1) {
      dependencies.push({
        taskId: uiTask.taskId,
        dependsOn: taskIds[0],
        type: 'blocks',
      });
    }
  }

  // Pattern 3: Testing task (always comes last)
  const testTask: Task = {
    id: generateId(),
    taskId: generateTaskId(currentTaskId++),
    title: `Testing and QA for ${input.title}`,
    description: 'Write tests, perform QA, and fix bugs',
    status: 'backlog',
    priority: 3,
    tags: ['testing', 'qa'],
    epicId: epic.id,
    definitionOfDone: [
      'All unit tests are passing',
      'Integration tests are written',
      'Edge cases are tested',
      'Test coverage is above 80%',
      'No critical bugs found',
    ],
    testNotes: generateTestNotes('testing', input.description),
    riskLevel: 'low',
    riskFlags: [],
    estimatedHours: 4,
    createdAt: now,
    updatedAt: now,
  };
  tasks.push(testTask);
  taskIds.push(testTask.taskId);

  // Testing depends on all previous tasks
  for (let i = 0; i < taskIds.length - 1; i++) {
    dependencies.push({
      taskId: testTask.taskId,
      dependsOn: taskIds[i],
      type: 'blocks',
    });
  }

  // Pattern 4: Documentation task
  const docTask: Task = {
    id: generateId(),
    taskId: generateTaskId(currentTaskId++),
    title: `Documentation for ${input.title}`,
    description: 'Write user documentation and update technical docs',
    status: 'backlog',
    priority: 2,
    tags: ['documentation'],
    epicId: epic.id,
    definitionOfDone: [
      'User documentation is written',
      'Technical documentation is updated',
      'API documentation is complete',
      'README is updated if needed',
    ],
    testNotes: 'Verify documentation is clear and accurate',
    riskLevel: 'low',
    riskFlags: [],
    estimatedHours: 2,
    createdAt: now,
    updatedAt: now,
  };
  tasks.push(docTask);

  // If no specific tasks were created, create a general implementation task
  if (tasks.length === 2) { // Only test and doc tasks
    const implTask: Task = {
      id: generateId(),
      taskId: generateTaskId(taskCounter),
      title: input.title,
      description: input.description,
      status: 'backlog',
      priority: 3,
      tags: requiredSkills.map(s => s.toLowerCase().replace(/[^a-z0-9]/g, '-')),
      epicId: epic.id,
      definitionOfDone: generateDefinitionOfDone(input.title, input.description),
      testNotes: generateTestNotes(input.title, input.description),
      ...assessRisk(input.rawContent, 2),
      estimatedHours: 5,
      createdAt: now,
      updatedAt: now,
    };
    tasks.unshift(implTask);

    // Update dependencies to depend on this task
    dependencies.forEach(dep => {
      if (dep.dependsOn === taskIds[0]) {
        dep.dependsOn = implTask.taskId;
      }
    });
  }

  return {
    epic,
    tasks,
    dependencies,
  };
}

/**
 * Suggests tags based on content analysis
 */
export function suggestTags(content: string): string[] {
  const tags = new Set<string>();
  const lower = content.toLowerCase();

  // Technology tags
  if (lower.includes('react')) tags.add('react');
  if (lower.includes('next')) tags.add('nextjs');
  if (lower.includes('api')) tags.add('api');
  if (lower.includes('database') || lower.includes('db')) tags.add('database');
  if (lower.includes('ui') || lower.includes('interface')) tags.add('ui');
  if (lower.includes('backend')) tags.add('backend');
  if (lower.includes('frontend')) tags.add('frontend');
  if (lower.includes('mobile')) tags.add('mobile');
  if (lower.includes('devops') || lower.includes('deploy')) tags.add('devops');

  // Type tags
  if (lower.includes('bug') || lower.includes('fix')) tags.add('bug');
  if (lower.includes('feature')) tags.add('feature');
  if (lower.includes('refactor')) tags.add('refactor');
  if (lower.includes('test')) tags.add('testing');
  if (lower.includes('document')) tags.add('documentation');
  if (lower.includes('security')) tags.add('security');
  if (lower.includes('performance')) tags.add('performance');

  // Priority tags
  if (lower.includes('urgent') || lower.includes('critical')) tags.add('urgent');
  if (lower.includes('nice to have') || lower.includes('optional')) tags.add('optional');

  return Array.from(tags);
}
