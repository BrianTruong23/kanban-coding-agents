import {
  TaskBreakdownInput,
  TaskBreakdownResult,
  BreakdownTask,
  TaskType,
  RiskLevel,
  DefinitionOfDone,
  TestNotes,
  RiskFlag,
  TaskDependency,
} from '@/types/breakdown';
import { generateId } from './utils';

/**
 * Task Breakdown Service
 * This service analyzes input (issue, PRD, screenshot description) and breaks it down
 * into hierarchical tasks with DoD, test notes, and risk flags.
 *
 * In a production environment, this would integrate with an AI service like OpenAI GPT-4
 * or Anthropic Claude. For now, it uses pattern matching and heuristics.
 */

interface BreakdownPattern {
  keywords: string[];
  taskType: TaskType;
  suggestedSkills: string[];
  riskLevel: RiskLevel;
}

const BREAKDOWN_PATTERNS: BreakdownPattern[] = [
  {
    keywords: ['authentication', 'login', 'signup', 'auth', 'oauth', 'jwt'],
    taskType: 'epic',
    suggestedSkills: ['backend', 'security', 'frontend'],
    riskLevel: 'high',
  },
  {
    keywords: ['database', 'schema', 'migration', 'sql', 'query'],
    taskType: 'story',
    suggestedSkills: ['backend', 'database'],
    riskLevel: 'medium',
  },
  {
    keywords: ['ui', 'component', 'design', 'layout', 'styling', 'css'],
    taskType: 'story',
    suggestedSkills: ['frontend', 'ui-ux'],
    riskLevel: 'low',
  },
  {
    keywords: ['api', 'endpoint', 'rest', 'graphql', 'route'],
    taskType: 'story',
    suggestedSkills: ['backend', 'api-design'],
    riskLevel: 'medium',
  },
  {
    keywords: ['test', 'testing', 'unit test', 'e2e', 'integration test'],
    taskType: 'task',
    suggestedSkills: ['testing'],
    riskLevel: 'low',
  },
  {
    keywords: ['deploy', 'ci/cd', 'docker', 'kubernetes', 'devops'],
    taskType: 'story',
    suggestedSkills: ['devops'],
    riskLevel: 'high',
  },
  {
    keywords: ['mobile', 'ios', 'android', 'react native'],
    taskType: 'epic',
    suggestedSkills: ['mobile', 'frontend'],
    riskLevel: 'medium',
  },
];

function analyzeContent(content: string): {
  matchedPatterns: BreakdownPattern[];
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedTasks: number;
} {
  const lowerContent = content.toLowerCase();
  const matchedPatterns: BreakdownPattern[] = [];

  BREAKDOWN_PATTERNS.forEach((pattern) => {
    if (pattern.keywords.some((keyword) => lowerContent.includes(keyword))) {
      matchedPatterns.push(pattern);
    }
  });

  // Determine complexity based on content length and matched patterns
  const wordCount = content.split(/\s+/).length;
  let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
  let estimatedTasks = 3;

  if (wordCount > 200 || matchedPatterns.length > 5) {
    complexity = 'complex';
    estimatedTasks = 8 + Math.floor(matchedPatterns.length / 2);
  } else if (wordCount > 50 || matchedPatterns.length > 2) {
    complexity = 'moderate';
    estimatedTasks = 5 + matchedPatterns.length;
  } else {
    estimatedTasks = 2 + matchedPatterns.length;
  }

  return { matchedPatterns, complexity, estimatedTasks };
}

function generateDefinitionOfDone(taskTitle: string, taskType: TaskType): DefinitionOfDone {
  const baseCriteria = [
    'Code is written and follows project coding standards',
    'Code is reviewed and approved',
    'All tests pass',
    'Documentation is updated',
  ];

  const acceptanceCriteria = [
    `Implementation matches the requirements for: ${taskTitle}`,
    'No critical bugs or issues',
    'Performance meets acceptable standards',
  ];

  if (taskType === 'epic') {
    acceptanceCriteria.push('All child stories and tasks are completed');
  }

  return { criteria: baseCriteria, acceptanceCriteria };
}

function generateTestNotes(taskTitle: string, suggestedSkills: string[]): TestNotes {
  const testCases = [
    `Happy path: ${taskTitle} works as expected`,
    'Error handling: Invalid inputs are handled gracefully',
    'Edge cases: Boundary conditions are tested',
  ];

  let testingStrategy = 'Unit tests and integration tests';
  if (suggestedSkills.includes('frontend') || suggestedSkills.includes('ui-ux')) {
    testingStrategy += ', visual regression tests';
    testCases.push('UI renders correctly across different screen sizes');
  }
  if (suggestedSkills.includes('backend') || suggestedSkills.includes('api-design')) {
    testingStrategy += ', API contract tests';
    testCases.push('API responses match expected schema');
  }

  const edgeCases = [
    'Empty or null inputs',
    'Concurrent operations',
    'Network failures or timeouts',
  ];

  return { testCases, testingStrategy, edgeCases };
}

function generateRiskFlags(
  riskLevel: RiskLevel,
  suggestedSkills: string[]
): RiskFlag[] {
  const risks: RiskFlag[] = [];

  if (riskLevel === 'high' || riskLevel === 'critical') {
    risks.push({
      level: riskLevel,
      description: 'High complexity task requiring careful implementation',
      mitigation: 'Break down into smaller subtasks, conduct thorough code reviews',
    });
  }

  if (suggestedSkills.includes('security')) {
    risks.push({
      level: 'high',
      description: 'Security implications - requires security review',
      mitigation: 'Follow security best practices, conduct security audit',
    });
  }

  if (suggestedSkills.includes('database')) {
    risks.push({
      level: 'medium',
      description: 'Database changes may require migrations',
      mitigation: 'Test migrations in staging environment first',
    });
  }

  if (suggestedSkills.includes('devops')) {
    risks.push({
      level: 'medium',
      description: 'Infrastructure changes may affect production',
      mitigation: 'Use blue-green deployment or canary releases',
    });
  }

  return risks;
}

function generateTaskHierarchy(
  content: string,
  matchedPatterns: BreakdownPattern[],
  complexity: 'simple' | 'moderate' | 'complex'
): BreakdownTask[] {
  const tasks: BreakdownTask[] = [];
  let taskCounter = 1;
  let epicCounter = 1;
  let storyCounter = 1;
  let subtaskCounter = 1;

  // Extract title from first line or use first sentence
  const lines = content.split('\n').filter((l) => l.trim());
  const mainTitle = lines[0] || 'Untitled Task';

  // For complex tasks, create an epic
  if (complexity === 'complex') {
    const epic: BreakdownTask = {
      id: generateId(),
      taskId: `EPIC-${epicCounter++}`,
      title: mainTitle,
      description: content,
      type: 'epic',
      priority: 5,
      estimatedHours: 80,
      tags: ['epic'],
      definitionOfDone: generateDefinitionOfDone(mainTitle, 'epic'),
      testNotes: generateTestNotes(mainTitle, ['fullstack']),
      riskFlags: [{ level: 'high', description: 'Large scope epic', mitigation: 'Break into smaller stories' }],
      dependencies: [],
      status: 'backlog',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    tasks.push(epic);

    // Create stories under the epic
    matchedPatterns.slice(0, 4).forEach((pattern, idx) => {
      const story: BreakdownTask = {
        id: generateId(),
        taskId: `STORY-${storyCounter++}`,
        title: `${pattern.keywords[0].charAt(0).toUpperCase() + pattern.keywords[0].slice(1)} Implementation`,
        description: `Implement ${pattern.keywords[0]} functionality as part of ${mainTitle}`,
        type: 'story',
        parentId: epic.id,
        priority: 4,
        estimatedHours: 16,
        tags: pattern.suggestedSkills,
        definitionOfDone: generateDefinitionOfDone(`${pattern.keywords[0]} implementation`, 'story'),
        testNotes: generateTestNotes(`${pattern.keywords[0]} implementation`, pattern.suggestedSkills),
        riskFlags: generateRiskFlags(pattern.riskLevel, pattern.suggestedSkills),
        dependencies: idx > 0 ? [{ taskId: tasks[tasks.length - 1].taskId, type: 'blocked_by' }] : [],
        status: 'backlog',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      tasks.push(story);

      // Create 2-3 subtasks for each story
      for (let i = 0; i < 2; i++) {
        const subtask: BreakdownTask = {
          id: generateId(),
          taskId: `TASK-${taskCounter++}`,
          title: `${i === 0 ? 'Setup' : 'Complete'} ${pattern.keywords[0]} ${i === 0 ? 'structure' : 'logic'}`,
          description: `Subtask for ${story.title}`,
          type: 'subtask',
          parentId: story.id,
          priority: 3,
          estimatedHours: 4,
          tags: pattern.suggestedSkills,
          definitionOfDone: generateDefinitionOfDone(`${pattern.keywords[0]} subtask`, 'subtask'),
          testNotes: generateTestNotes(`${pattern.keywords[0]} subtask`, pattern.suggestedSkills),
          riskFlags: generateRiskFlags('low', pattern.suggestedSkills),
          dependencies: i > 0 ? [{ taskId: tasks[tasks.length - 1].taskId, type: 'blocked_by' }] : [],
          status: 'backlog',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        tasks.push(subtask);
      }
    });
  } else if (complexity === 'moderate') {
    // Create stories with tasks
    matchedPatterns.slice(0, 3).forEach((pattern, idx) => {
      const story: BreakdownTask = {
        id: generateId(),
        taskId: `STORY-${storyCounter++}`,
        title: `${pattern.keywords[0].charAt(0).toUpperCase() + pattern.keywords[0].slice(1)} Feature`,
        description: `Implement ${pattern.keywords[0]} feature based on: ${mainTitle}`,
        type: 'story',
        priority: 3,
        estimatedHours: 12,
        tags: pattern.suggestedSkills,
        definitionOfDone: generateDefinitionOfDone(`${pattern.keywords[0]} feature`, 'story'),
        testNotes: generateTestNotes(`${pattern.keywords[0]} feature`, pattern.suggestedSkills),
        riskFlags: generateRiskFlags(pattern.riskLevel, pattern.suggestedSkills),
        dependencies: idx > 0 ? [{ taskId: tasks[idx - 1].taskId, type: 'blocked_by' }] : [],
        status: 'backlog',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      tasks.push(story);

      // Add 1-2 tasks per story
      const task: BreakdownTask = {
        id: generateId(),
        taskId: `TASK-${taskCounter++}`,
        title: `Implement ${pattern.keywords[0]} logic`,
        description: `Core implementation for ${story.title}`,
        type: 'task',
        parentId: story.id,
        priority: 3,
        estimatedHours: 6,
        tags: pattern.suggestedSkills,
        definitionOfDone: generateDefinitionOfDone(`${pattern.keywords[0]} logic`, 'task'),
        testNotes: generateTestNotes(`${pattern.keywords[0]} logic`, pattern.suggestedSkills),
        riskFlags: generateRiskFlags(pattern.riskLevel, pattern.suggestedSkills),
        dependencies: [],
        status: 'backlog',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      tasks.push(task);
    });
  } else {
    // Simple: Create just tasks
    const primaryPattern = matchedPatterns[0] || {
      keywords: ['implementation'],
      taskType: 'task',
      suggestedSkills: ['fullstack'],
      riskLevel: 'low' as RiskLevel,
    };

    for (let i = 0; i < 3; i++) {
      const task: BreakdownTask = {
        id: generateId(),
        taskId: `TASK-${taskCounter++}`,
        title: `${mainTitle} - Part ${i + 1}`,
        description: content,
        type: 'task',
        priority: 2,
        estimatedHours: 4,
        tags: primaryPattern.suggestedSkills,
        definitionOfDone: generateDefinitionOfDone(`${mainTitle} - Part ${i + 1}`, 'task'),
        testNotes: generateTestNotes(mainTitle, primaryPattern.suggestedSkills),
        riskFlags: generateRiskFlags(primaryPattern.riskLevel, primaryPattern.suggestedSkills),
        dependencies: i > 0 ? [{ taskId: tasks[i - 1].taskId, type: 'blocked_by' }] : [],
        status: 'backlog',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      tasks.push(task);
    }
  }

  return tasks;
}

/**
 * Main function to break down a task input into structured tasks
 */
export async function breakdownTask(
  input: TaskBreakdownInput
): Promise<TaskBreakdownResult> {
  const { content, context } = input;
  const fullContent = context ? `${content}\n\nContext: ${context}` : content;

  // Analyze the content
  const { matchedPatterns, complexity, estimatedTasks } = analyzeContent(fullContent);

  // Generate task hierarchy
  const tasks = generateTaskHierarchy(fullContent, matchedPatterns, complexity);

  // Calculate total estimated hours
  const totalEstimatedHours = tasks.reduce(
    (sum, task) => sum + (task.estimatedHours || 0),
    0
  );

  // Generate summary
  const summary = `Analyzed ${input.type} and created ${tasks.length} tasks (${complexity} complexity).
    Estimated ${totalEstimatedHours} hours total.
    Identified ${matchedPatterns.length} key areas: ${matchedPatterns.map(p => p.keywords[0]).join(', ')}.`;

  return {
    tasks,
    summary,
    totalEstimatedHours,
  };
}

/**
 * Convert BreakdownTask to regular Task format for the kanban board
 */
export function convertToKanbanTask(breakdownTask: BreakdownTask): {
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  status: string;
} {
  // Create a rich description that includes DoD, test notes, and risk flags
  let richDescription = breakdownTask.description;

  richDescription += '\n\n## Definition of Done\n';
  breakdownTask.definitionOfDone.criteria.forEach(c => {
    richDescription += `- ${c}\n`;
  });

  richDescription += '\n## Acceptance Criteria\n';
  breakdownTask.definitionOfDone.acceptanceCriteria.forEach(c => {
    richDescription += `- ${c}\n`;
  });

  if (breakdownTask.testNotes.testCases.length > 0) {
    richDescription += '\n## Test Cases\n';
    breakdownTask.testNotes.testCases.forEach(tc => {
      richDescription += `- ${tc}\n`;
    });
  }

  if (breakdownTask.riskFlags.length > 0) {
    richDescription += '\n## Risk Flags\n';
    breakdownTask.riskFlags.forEach(rf => {
      richDescription += `- [${rf.level.toUpperCase()}] ${rf.description}\n`;
      if (rf.mitigation) {
        richDescription += `  Mitigation: ${rf.mitigation}\n`;
      }
    });
  }

  const tags = [...breakdownTask.tags, breakdownTask.type];
  if (breakdownTask.estimatedHours) {
    tags.push(`${breakdownTask.estimatedHours}h`);
  }

  return {
    title: `[${breakdownTask.taskId}] ${breakdownTask.title}`,
    description: richDescription,
    priority: breakdownTask.priority,
    tags,
    status: breakdownTask.status,
  };
}
