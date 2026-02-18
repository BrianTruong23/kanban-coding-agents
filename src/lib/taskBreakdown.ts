/**
 * AI-powered task breakdown service
 * Analyzes issues, PRDs, or screenshots to generate epics, tasks, and subtasks
 * with definition of done, test notes, and risk flags
 */

import { Task, Epic, Subtask, TaskDependency, RiskLevel } from '@/types/task';

export interface BreakdownInput {
  type: 'issue' | 'prd' | 'screenshot';
  content: string; // Text content or base64 image
  title?: string;
  context?: string; // Additional context
}

export interface BreakdownResult {
  epics: Epic[];
  tasks: Task[];
  subtasks: Subtask[];
  dependencies: TaskDependency[];
  suggestedSkills: string[]; // Skills needed across all tasks
}

interface TaskBreakdownItem {
  title: string;
  description: string;
  type: 'epic' | 'task' | 'subtask';
  priority: 1 | 2 | 3 | 4 | 5;
  definitionOfDone: string[];
  testNotes: string;
  riskLevel: RiskLevel;
  riskDescription?: string;
  estimatedHours: number;
  requiredSkills: string[];
  tags: string[];
  dependsOn?: number[]; // Indices of tasks this depends on
}

/**
 * Analyzes input and breaks it down into structured tasks
 * In production, this would call an AI service (e.g., OpenAI, Anthropic Claude)
 */
export async function analyzeAndBreakdown(input: BreakdownInput): Promise<BreakdownResult> {
  // This is a mock implementation. In production, replace with actual AI API call
  const analysis = await mockAIAnalysis(input);

  const epics: Epic[] = [];
  const tasks: Task[] = [];
  const subtasks: Subtask[] = [];
  const dependencies: TaskDependency[] = [];
  const suggestedSkills = new Set<string>();

  let epicCounter = 1;
  let taskCounter = 1;
  let subtaskCounter = 1;

  analysis.forEach((item, index) => {
    item.requiredSkills.forEach(skill => suggestedSkills.add(skill));

    if (item.type === 'epic') {
      const epic: Epic = {
        id: `epic-${Date.now()}-${epicCounter}`,
        epicId: `EPIC-${epicCounter}`,
        title: item.title,
        description: item.description,
        status: 'backlog',
        priority: item.priority,
        tags: item.tags,
        definitionOfDone: item.definitionOfDone.join('\n'),
        estimatedHours: item.estimatedHours,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      epics.push(epic);
      epicCounter++;
    } else if (item.type === 'task') {
      const task: Task = {
        id: `task-${Date.now()}-${taskCounter}`,
        taskId: `TASK-${taskCounter}`,
        title: item.title,
        description: item.description,
        status: 'backlog',
        priority: item.priority,
        tags: item.tags,
        type: 'task',
        definitionOfDone: item.definitionOfDone.join('\n'),
        testNotes: item.testNotes,
        riskLevel: item.riskLevel,
        riskDescription: item.riskDescription,
        estimatedHours: item.estimatedHours,
        requiredSkills: item.requiredSkills,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Create dependencies
      if (item.dependsOn) {
        item.dependsOn.forEach(depIndex => {
          if (depIndex < index) {
            const dependency: TaskDependency = {
              id: `dep-${Date.now()}-${Math.random()}`,
              taskId: task.id,
              dependsOnTaskId: tasks[depIndex]?.id || '',
              dependencyType: 'blocked-by',
              createdAt: Date.now(),
            };
            dependencies.push(dependency);
          }
        });
      }

      tasks.push(task);
      taskCounter++;
    } else if (item.type === 'subtask') {
      const subtask: Subtask = {
        id: `subtask-${Date.now()}-${subtaskCounter}`,
        subtaskId: `SUBTASK-${subtaskCounter}`,
        taskId: tasks.length > 0 ? tasks[tasks.length - 1].id : '',
        title: item.title,
        description: item.description,
        status: 'backlog',
        priority: item.priority,
        definitionOfDone: item.definitionOfDone.join('\n'),
        testNotes: item.testNotes,
        estimatedHours: item.estimatedHours,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      subtasks.push(subtask);
      subtaskCounter++;
    }
  });

  return {
    epics,
    tasks,
    subtasks,
    dependencies,
    suggestedSkills: Array.from(suggestedSkills),
  };
}

/**
 * Mock AI analysis - simulates what an AI would return
 * Replace this with actual AI API integration
 */
async function mockAIAnalysis(input: BreakdownInput): Promise<TaskBreakdownItem[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Parse the input and generate a realistic breakdown
  const items: TaskBreakdownItem[] = [];

  // Example breakdown based on input type
  if (input.type === 'issue' || input.type === 'prd') {
    // Create an epic
    items.push({
      title: input.title || 'Feature Implementation',
      description: 'Implement the requested feature with all necessary components',
      type: 'epic',
      priority: 3,
      definitionOfDone: [
        'All user stories completed',
        'Integration tests passing',
        'Documentation updated',
        'Code reviewed and merged'
      ],
      testNotes: 'Comprehensive test suite required',
      riskLevel: 'medium',
      estimatedHours: 40,
      requiredSkills: ['Full Stack Development', 'Testing'],
      tags: ['feature'],
    });

    // Create tasks
    items.push({
      title: 'Design database schema',
      description: 'Create database tables and relationships for the new feature',
      type: 'task',
      priority: 5,
      definitionOfDone: [
        'Schema designed and reviewed',
        'Migration scripts created',
        'Applied to development database'
      ],
      testNotes: 'Test migration rollback',
      riskLevel: 'low',
      estimatedHours: 4,
      requiredSkills: ['Database Design', 'SQL'],
      tags: ['backend', 'database'],
    });

    items.push({
      title: 'Implement backend API endpoints',
      description: 'Create RESTful API endpoints for CRUD operations',
      type: 'task',
      priority: 4,
      definitionOfDone: [
        'All endpoints implemented',
        'API documentation generated',
        'Unit tests coverage > 80%',
        'Integration tests passing'
      ],
      testNotes: 'Test error handling, validation, and edge cases',
      riskLevel: 'medium',
      riskDescription: 'Complex business logic may require additional time',
      estimatedHours: 12,
      requiredSkills: ['Node.js', 'API Design', 'Testing'],
      tags: ['backend', 'api'],
      dependsOn: [1], // Depends on database schema
    });

    items.push({
      title: 'Create UI components',
      description: 'Build React components for the feature interface',
      type: 'task',
      priority: 3,
      definitionOfDone: [
        'Components match design specs',
        'Responsive on all screen sizes',
        'Accessibility standards met',
        'Component tests written'
      ],
      testNotes: 'Test keyboard navigation and screen readers',
      riskLevel: 'low',
      estimatedHours: 8,
      requiredSkills: ['React', 'TypeScript', 'CSS'],
      tags: ['frontend', 'ui'],
    });

    items.push({
      title: 'Integrate frontend with backend',
      description: 'Connect UI components to API endpoints',
      type: 'task',
      priority: 4,
      definitionOfDone: [
        'All API calls implemented',
        'Error handling in place',
        'Loading states implemented',
        'End-to-end tests passing'
      ],
      testNotes: 'Test network failures and timeout scenarios',
      riskLevel: 'medium',
      riskDescription: 'Integration issues may arise',
      estimatedHours: 6,
      requiredSkills: ['React', 'API Integration', 'Testing'],
      tags: ['frontend', 'integration'],
      dependsOn: [2, 3], // Depends on both backend and frontend tasks
    });

    items.push({
      title: 'Write integration tests',
      description: 'Create comprehensive integration test suite',
      type: 'task',
      priority: 4,
      definitionOfDone: [
        'All critical paths tested',
        'Coverage > 90%',
        'Tests passing in CI/CD'
      ],
      testNotes: 'Include both happy path and error scenarios',
      riskLevel: 'low',
      estimatedHours: 6,
      requiredSkills: ['Testing', 'Automation'],
      tags: ['testing'],
      dependsOn: [4], // Depends on integration being complete
    });

    items.push({
      title: 'Update documentation',
      description: 'Document the new feature for developers and users',
      type: 'task',
      priority: 2,
      definitionOfDone: [
        'API documentation complete',
        'User guide updated',
        'README updated'
      ],
      testNotes: 'Review documentation for clarity',
      riskLevel: 'low',
      estimatedHours: 4,
      requiredSkills: ['Technical Writing'],
      tags: ['documentation'],
    });
  }

  return items;
}

/**
 * Extracts key information from text using pattern matching
 * In production, use NLP/AI for better extraction
 */
export function extractKeyInformation(text: string): {
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  risks: string[];
  estimatedHours?: number;
} {
  const lowerText = text.toLowerCase();

  // Detect priority
  let priority: 1 | 2 | 3 | 4 | 5 = 3;
  if (lowerText.includes('critical') || lowerText.includes('urgent')) priority = 5;
  else if (lowerText.includes('high priority')) priority = 4;
  else if (lowerText.includes('low priority')) priority = 2;

  // Extract tags
  const tags: string[] = [];
  if (lowerText.includes('frontend') || lowerText.includes('ui') || lowerText.includes('react')) tags.push('frontend');
  if (lowerText.includes('backend') || lowerText.includes('api') || lowerText.includes('server')) tags.push('backend');
  if (lowerText.includes('bug') || lowerText.includes('fix')) tags.push('bug');
  if (lowerText.includes('feature')) tags.push('feature');
  if (lowerText.includes('test')) tags.push('testing');
  if (lowerText.includes('database') || lowerText.includes('db')) tags.push('database');

  // Identify risks
  const risks: string[] = [];
  if (lowerText.includes('complex')) risks.push('High complexity');
  if (lowerText.includes('legacy')) risks.push('Legacy code integration');
  if (lowerText.includes('migration')) risks.push('Data migration required');
  if (lowerText.includes('performance')) risks.push('Performance concerns');

  // Extract estimated hours (simple pattern matching)
  const hourMatch = text.match(/(\d+)\s*(hour|hr|h)/i);
  const estimatedHours = hourMatch ? parseInt(hourMatch[1]) : undefined;

  return { priority, tags, risks, estimatedHours };
}
