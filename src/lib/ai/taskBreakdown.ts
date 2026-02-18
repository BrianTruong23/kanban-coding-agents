import { Task, TaskType, DefinitionOfDone, TestNote, RiskFlag, RiskLevel } from '@/types/task';
import { generateId, generateTaskId } from '@/lib/utils';

export interface BreakdownInput {
  type: 'issue' | 'prd' | 'screenshot' | 'text';
  content: string;
  imageData?: string; // base64 encoded image for screenshots
}

export interface BreakdownResult {
  epic?: Task;
  stories: Task[];
  tasks: Task[];
  subtasks: Task[];
  dependencies: Map<string, string[]>; // taskId -> dependent taskIds
}

/**
 * Parse and analyze input to break down into structured tasks
 */
export async function analyzeAndBreakdown(input: BreakdownInput): Promise<BreakdownResult> {
  // This is a mock implementation. In production, you would integrate with:
  // - OpenAI GPT-4 Vision for screenshots
  // - Anthropic Claude for text analysis
  // - Or a custom ML model

  const mockAnalysis = await mockAIAnalysis(input);
  return mockAnalysis;
}

/**
 * Mock AI analysis - simulates what an AI would return
 * In production, replace this with actual API calls to OpenAI/Anthropic
 */
async function mockAIAnalysis(input: BreakdownInput): Promise<BreakdownResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const now = Date.now();
  const baseTaskNumber = Math.floor(Math.random() * 1000);

  // Create an epic
  const epic: Task = {
    id: generateId(),
    taskId: generateTaskId(baseTaskNumber),
    title: extractTitle(input.content),
    description: input.content,
    status: 'backlog',
    type: 'epic',
    priority: 4,
    tags: ['ai-generated', 'epic'],
    createdAt: now,
    updatedAt: now,
    definitionOfDone: generateDoD('epic'),
    testNotes: [],
    riskFlags: identifyRisks(input.content),
    dependencies: [],
    estimatedHours: 80,
    storyPoints: 21,
  };

  // Create stories
  const stories: Task[] = [];
  const storyCount = 3;
  for (let i = 0; i < storyCount; i++) {
    const story: Task = {
      id: generateId(),
      taskId: generateTaskId(baseTaskNumber + i + 1),
      title: `Story ${i + 1}: ${generateStoryTitle(i)}`,
      description: `Story description for ${generateStoryTitle(i)}`,
      status: 'backlog',
      type: 'story',
      epicId: epic.id,
      priority: 3,
      tags: ['ai-generated', 'story'],
      createdAt: now,
      updatedAt: now,
      definitionOfDone: generateDoD('story'),
      testNotes: generateTestNotes('story'),
      riskFlags: i === 0 ? [{ id: generateId(), description: 'Complex integration required', level: 'medium', resolved: false }] : [],
      dependencies: [],
      estimatedHours: 20,
      storyPoints: 8,
    };
    stories.push(story);
  }

  // Create tasks
  const tasks: Task[] = [];
  const taskCount = 6;
  for (let i = 0; i < taskCount; i++) {
    const parentStory = stories[Math.floor(i / 2)];
    const task: Task = {
      id: generateId(),
      taskId: generateTaskId(baseTaskNumber + storyCount + i + 1),
      title: `Task ${i + 1}: ${generateTaskTitle(i)}`,
      description: `Task description for ${generateTaskTitle(i)}`,
      status: 'backlog',
      type: 'task',
      parentTaskId: parentStory.id,
      epicId: epic.id,
      priority: (i % 3) + 2 as 2 | 3 | 4,
      tags: ['ai-generated', 'task', generateTaskTag(i)],
      createdAt: now,
      updatedAt: now,
      definitionOfDone: generateDoD('task'),
      testNotes: generateTestNotes('task'),
      riskFlags: i % 3 === 0 ? [{ id: generateId(), description: 'May require additional dependencies', level: 'low', resolved: false }] : [],
      dependencies: [],
      estimatedHours: 8,
      storyPoints: 3,
    };
    tasks.push(task);
  }

  // Create subtasks
  const subtasks: Task[] = [];
  const subtaskCount = 12;
  for (let i = 0; i < subtaskCount; i++) {
    const parentTask = tasks[Math.floor(i / 2)];
    const subtask: Task = {
      id: generateId(),
      taskId: generateTaskId(baseTaskNumber + storyCount + taskCount + i + 1),
      title: `Subtask ${i + 1}: ${generateSubtaskTitle(i)}`,
      description: `Subtask description for ${generateSubtaskTitle(i)}`,
      status: 'backlog',
      type: 'subtask',
      parentTaskId: parentTask.id,
      epicId: epic.id,
      priority: 2,
      tags: ['ai-generated', 'subtask'],
      createdAt: now,
      updatedAt: now,
      definitionOfDone: generateDoD('subtask'),
      testNotes: i % 2 === 0 ? generateTestNotes('subtask') : [],
      riskFlags: [],
      dependencies: [],
      estimatedHours: 2,
      storyPoints: 1,
    };
    subtasks.push(subtask);
  }

  // Generate dependencies
  const dependencies = new Map<string, string[]>();

  // Stories depend on each other sequentially
  if (stories.length > 1) {
    dependencies.set(stories[1].id, [stories[0].id]);
  }
  if (stories.length > 2) {
    dependencies.set(stories[2].id, [stories[1].id]);
  }

  // Some tasks have dependencies
  if (tasks.length > 2) {
    dependencies.set(tasks[2].id, [tasks[0].id, tasks[1].id]);
  }
  if (tasks.length > 4) {
    dependencies.set(tasks[4].id, [tasks[2].id]);
  }

  return {
    epic,
    stories,
    tasks,
    subtasks,
    dependencies,
  };
}

function extractTitle(content: string): string {
  // Extract first line or first sentence as title
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // Remove markdown headers
    const cleanedTitle = firstLine.replace(/^#+\s*/, '').substring(0, 100);
    return cleanedTitle || 'New Epic';
  }
  return 'New Epic';
}

function generateDoD(type: TaskType): DefinitionOfDone[] {
  const dodMap: Record<TaskType, string[]> = {
    epic: [
      'All stories completed and deployed',
      'End-to-end testing passed',
      'Documentation updated',
      'Stakeholder sign-off received',
    ],
    story: [
      'Code implemented and reviewed',
      'Unit tests written and passing',
      'Integration tests passing',
      'UI/UX approved by designer',
    ],
    task: [
      'Implementation completed',
      'Code reviewed by peer',
      'Tests written and passing',
      'No critical bugs',
    ],
    subtask: [
      'Code implemented',
      'Self-tested',
      'Ready for integration',
    ],
    bug: [
      'Root cause identified',
      'Fix implemented and tested',
      'No regression issues',
      'Deployed to production',
    ],
  };

  const descriptions = dodMap[type] || dodMap.task;
  return descriptions.map(desc => ({
    id: generateId(),
    description: desc,
    completed: false,
  }));
}

function generateTestNotes(type: TaskType): TestNote[] {
  const testMap: Record<string, Array<{description: string, testType: 'unit' | 'integration' | 'e2e' | 'manual'}>> = {
    epic: [
      { description: 'Full end-to-end user journey testing', testType: 'e2e' },
      { description: 'Performance testing under load', testType: 'manual' },
    ],
    story: [
      { description: 'Test all acceptance criteria', testType: 'integration' },
      { description: 'Verify edge cases', testType: 'unit' },
    ],
    task: [
      { description: 'Unit test all functions', testType: 'unit' },
      { description: 'Integration test with dependent modules', testType: 'integration' },
    ],
    subtask: [
      { description: 'Verify implementation works as expected', testType: 'unit' },
    ],
  };

  const tests = testMap[type] || testMap.task;
  return tests.map(test => ({
    id: generateId(),
    description: test.description,
    testType: test.testType,
    completed: false,
  }));
}

function identifyRisks(content: string): RiskFlag[] {
  const risks: RiskFlag[] = [];
  const lowerContent = content.toLowerCase();

  // Simple keyword-based risk detection (in production, use NLP)
  if (lowerContent.includes('database') || lowerContent.includes('migration')) {
    risks.push({
      id: generateId(),
      description: 'Database changes require careful migration strategy',
      level: 'medium',
      mitigationStrategy: 'Create rollback plan and test migration in staging',
      resolved: false,
    });
  }

  if (lowerContent.includes('authentication') || lowerContent.includes('security')) {
    risks.push({
      id: generateId(),
      description: 'Security-sensitive feature requires thorough security review',
      level: 'high',
      mitigationStrategy: 'Conduct security audit and penetration testing',
      resolved: false,
    });
  }

  if (lowerContent.includes('api') && lowerContent.includes('breaking')) {
    risks.push({
      id: generateId(),
      description: 'Breaking API changes may affect existing integrations',
      level: 'high',
      mitigationStrategy: 'Version the API and notify all consumers',
      resolved: false,
    });
  }

  if (lowerContent.includes('performance') || lowerContent.includes('scale')) {
    risks.push({
      id: generateId(),
      description: 'Performance optimization requires load testing',
      level: 'medium',
      mitigationStrategy: 'Benchmark before and after changes',
      resolved: false,
    });
  }

  return risks;
}

function generateStoryTitle(index: number): string {
  const titles = [
    'User Interface Development',
    'Backend API Implementation',
    'Data Integration and Testing',
  ];
  return titles[index] || `Story ${index + 1}`;
}

function generateTaskTitle(index: number): string {
  const titles = [
    'Setup project structure',
    'Implement core functionality',
    'Add validation logic',
    'Create API endpoints',
    'Implement error handling',
    'Write documentation',
  ];
  return titles[index] || `Task ${index + 1}`;
}

function generateSubtaskTitle(index: number): string {
  const titles = [
    'Create component file',
    'Add TypeScript types',
    'Implement UI layout',
    'Add event handlers',
    'Style with Tailwind CSS',
    'Add unit tests',
    'Update documentation',
    'Code review fixes',
    'Add error boundaries',
    'Optimize performance',
    'Add accessibility features',
    'Final QA testing',
  ];
  return titles[index] || `Subtask ${index + 1}`;
}

function generateTaskTag(index: number): string {
  const tags = ['frontend', 'backend', 'database', 'api', 'ui', 'testing'];
  return tags[index % tags.length];
}
