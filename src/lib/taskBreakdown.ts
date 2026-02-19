import { Task, TaskDependency, BreakdownRequest, TaskBreakdown, RiskLevel } from '@/types/task';
import { generateId, generateTaskId } from './utils';

/**
 * Task Breakdown Service
 * Analyzes issues, PRDs, or screenshots and breaks them down into epics, stories, tasks, and subtasks
 */

interface ParsedRequirement {
  title: string;
  description: string;
  complexity: 'low' | 'medium' | 'high';
  estimatedHours: number;
  requiredSkills: string[];
  risks: Array<{ level: RiskLevel; description: string }>;
  testCases: string[];
  dependencies: string[];
}

/**
 * Parse and analyze the input content to extract requirements
 */
function parseContent(request: BreakdownRequest): ParsedRequirement[] {
  const { content, type } = request;
  const requirements: ParsedRequirement[] = [];

  // Simple keyword-based parsing for demonstration
  // In production, this would use AI/NLP services

  const lines = content.split('\n').filter(line => line.trim());
  let currentRequirement: Partial<ParsedRequirement> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Epic/Feature detection
    if (trimmed.match(/^(epic|feature|milestone)[:|\s]/i)) {
      if (currentRequirement) {
        requirements.push(completeRequirement(currentRequirement));
      }
      currentRequirement = {
        title: trimmed.replace(/^(epic|feature|milestone)[:|\s]/i, '').trim(),
        description: '',
        complexity: 'medium',
        estimatedHours: 40,
        requiredSkills: [],
        risks: [],
        testCases: [],
        dependencies: []
      };
    }
    // Task detection
    else if (trimmed.match(/^[-*•]\s|^\d+\.\s/)) {
      const taskTitle = trimmed.replace(/^[-*•]\s|^\d+\.\s/, '').trim();
      if (taskTitle) {
        requirements.push({
          title: taskTitle,
          description: '',
          complexity: inferComplexity(taskTitle),
          estimatedHours: estimateHours(taskTitle),
          requiredSkills: extractSkills(taskTitle),
          risks: assessRisks(taskTitle),
          testCases: generateTestCases(taskTitle),
          dependencies: []
        });
      }
    }
    // Description continuation
    else if (currentRequirement && trimmed) {
      currentRequirement.description += (currentRequirement.description ? ' ' : '') + trimmed;
    }
  }

  if (currentRequirement) {
    requirements.push(completeRequirement(currentRequirement));
  }

  // If no structured content found, create a single epic from the entire content
  if (requirements.length === 0) {
    requirements.push({
      title: extractTitle(content) || 'Project Implementation',
      description: content.substring(0, 500),
      complexity: 'high',
      estimatedHours: 80,
      requiredSkills: extractSkills(content),
      risks: assessRisks(content),
      testCases: generateTestCases(content),
      dependencies: []
    });
  }

  return requirements;
}

function completeRequirement(partial: Partial<ParsedRequirement>): ParsedRequirement {
  return {
    title: partial.title || 'Untitled Task',
    description: partial.description || '',
    complexity: partial.complexity || 'medium',
    estimatedHours: partial.estimatedHours || 24,
    requiredSkills: partial.requiredSkills || [],
    risks: partial.risks || [],
    testCases: partial.testCases || [],
    dependencies: partial.dependencies || []
  };
}

function extractTitle(content: string): string | null {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    return lines[0].substring(0, 100);
  }
  return null;
}

function inferComplexity(text: string): 'low' | 'medium' | 'high' {
  const complexityIndicators = {
    high: ['implement', 'build', 'create', 'design', 'architect', 'integrate', 'migrate', 'refactor'],
    medium: ['update', 'modify', 'enhance', 'improve', 'add'],
    low: ['fix', 'update', 'change', 'adjust', 'tweak']
  };

  const lowerText = text.toLowerCase();

  if (complexityIndicators.high.some(word => lowerText.includes(word))) return 'high';
  if (complexityIndicators.low.some(word => lowerText.includes(word))) return 'low';
  return 'medium';
}

function estimateHours(text: string): number {
  const complexity = inferComplexity(text);
  const baseHours = {
    low: 4,
    medium: 16,
    high: 40
  };
  return baseHours[complexity];
}

function extractSkills(text: string): string[] {
  const skillKeywords: Record<string, string[]> = {
    'React': ['react', 'jsx', 'component', 'hook', 'ui'],
    'TypeScript': ['typescript', 'type', 'interface'],
    'Node.js': ['node', 'backend', 'server', 'api'],
    'Database': ['database', 'sql', 'postgres', 'supabase', 'query'],
    'CSS': ['css', 'style', 'tailwind', 'design', 'responsive'],
    'Testing': ['test', 'testing', 'jest', 'cypress', 'qa'],
    'DevOps': ['deploy', 'ci/cd', 'docker', 'kubernetes', 'infrastructure'],
    'Authentication': ['auth', 'login', 'authentication', 'authorization'],
    'API': ['api', 'rest', 'graphql', 'endpoint'],
    'Frontend': ['frontend', 'ui', 'ux', 'client'],
    'Backend': ['backend', 'server', 'database']
  };

  const skills = new Set<string>();
  const lowerText = text.toLowerCase();

  for (const [skill, keywords] of Object.entries(skillKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      skills.add(skill);
    }
  }

  return Array.from(skills);
}

function assessRisks(text: string): Array<{ level: RiskLevel; description: string }> {
  const risks: Array<{ level: RiskLevel; description: string }> = [];
  const lowerText = text.toLowerCase();

  const riskPatterns = [
    { pattern: /(security|auth|password|credential)/i, level: 'high' as RiskLevel, description: 'Security-sensitive implementation' },
    { pattern: /(migration|breaking|refactor)/i, level: 'high' as RiskLevel, description: 'Breaking changes or migration required' },
    { pattern: /(integration|third-party|external)/i, level: 'medium' as RiskLevel, description: 'External dependency integration' },
    { pattern: /(performance|optimization|scale)/i, level: 'medium' as RiskLevel, description: 'Performance considerations' },
    { pattern: /(database|schema|model)/i, level: 'medium' as RiskLevel, description: 'Database changes required' }
  ];

  for (const { pattern, level, description } of riskPatterns) {
    if (pattern.test(text)) {
      risks.push({ level, description });
    }
  }

  if (risks.length === 0) {
    risks.push({ level: 'low', description: 'Standard implementation task' });
  }

  return risks;
}

function generateTestCases(text: string): string[] {
  const testCases: string[] = [];
  const lowerText = text.toLowerCase();

  // Generate basic test cases based on task type
  if (lowerText.includes('ui') || lowerText.includes('component')) {
    testCases.push('Verify component renders correctly');
    testCases.push('Test responsive design on different screen sizes');
    testCases.push('Check accessibility requirements');
  }

  if (lowerText.includes('api') || lowerText.includes('endpoint')) {
    testCases.push('Test API endpoint with valid inputs');
    testCases.push('Test error handling for invalid inputs');
    testCases.push('Verify response format and status codes');
  }

  if (lowerText.includes('auth') || lowerText.includes('login')) {
    testCases.push('Test successful authentication flow');
    testCases.push('Test invalid credentials handling');
    testCases.push('Verify session management');
  }

  if (lowerText.includes('database') || lowerText.includes('data')) {
    testCases.push('Verify data persistence');
    testCases.push('Test data validation');
    testCases.push('Check data integrity constraints');
  }

  // Default test cases
  if (testCases.length === 0) {
    testCases.push('Unit test core functionality');
    testCases.push('Integration test with existing features');
    testCases.push('Manual QA testing');
  }

  return testCases;
}

/**
 * Break down requirements into a hierarchical task structure
 */
export function breakdownTasks(request: BreakdownRequest, baseTaskNumber: number): TaskBreakdown {
  const parsedRequirements = parseContent(request);
  const breakdown: TaskBreakdown = {
    epic: {} as Task,
    stories: [],
    tasks: [],
    subtasks: [],
    dependencies: []
  };

  let taskCounter = baseTaskNumber;

  // Create the main epic
  const mainRequirement = parsedRequirements[0];
  const epic: Task = {
    id: generateId(),
    taskId: generateTaskId(taskCounter++),
    title: mainRequirement.title,
    description: mainRequirement.description,
    status: 'backlog',
    priority: 4,
    tags: ['epic', ...mainRequirement.requiredSkills.slice(0, 3)],
    taskType: 'epic',
    definitionOfDone: generateDoD(mainRequirement),
    testNotes: mainRequirement.testCases.join('\n'),
    riskLevel: mainRequirement.risks[0]?.level || 'none',
    riskDescription: mainRequirement.risks.map(r => r.description).join('; '),
    estimatedHours: mainRequirement.estimatedHours,
    requiredSkills: mainRequirement.requiredSkills,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  breakdown.epic = epic;

  // Create stories/tasks from remaining requirements
  for (let i = 1; i < parsedRequirements.length; i++) {
    const req = parsedRequirements[i];
    const task: Task = {
      id: generateId(),
      taskId: generateTaskId(taskCounter++),
      title: req.title,
      description: req.description,
      status: 'backlog',
      priority: req.complexity === 'high' ? 4 : req.complexity === 'medium' ? 3 : 2,
      tags: req.requiredSkills.slice(0, 3),
      taskType: req.complexity === 'high' ? 'story' : 'task',
      epicId: epic.id,
      definitionOfDone: generateDoD(req),
      testNotes: req.testCases.join('\n'),
      riskLevel: req.risks[0]?.level || 'none',
      riskDescription: req.risks.map(r => r.description).join('; '),
      estimatedHours: req.estimatedHours,
      requiredSkills: req.requiredSkills,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (task.taskType === 'story') {
      breakdown.stories.push(task);

      // Create subtasks for stories
      const subtaskTitles = generateSubtasks(req);
      for (const subtaskTitle of subtaskTitles) {
        const subtask: Task = {
          id: generateId(),
          taskId: generateTaskId(taskCounter++),
          title: subtaskTitle,
          description: '',
          status: 'backlog',
          priority: task.priority,
          tags: req.requiredSkills.slice(0, 2),
          taskType: 'subtask',
          epicId: epic.id,
          parentTaskId: task.id,
          estimatedHours: req.estimatedHours / subtaskTitles.length,
          requiredSkills: req.requiredSkills,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        breakdown.subtasks.push(subtask);
      }
    } else {
      breakdown.tasks.push(task);
    }
  }

  // Generate dependencies
  breakdown.dependencies = generateDependencies(breakdown);

  return breakdown;
}

function generateDoD(requirement: ParsedRequirement): string {
  const dod = [
    '- Code implemented and follows best practices',
    '- Unit tests written and passing',
    '- Code reviewed and approved',
    '- Documentation updated',
  ];

  if (requirement.testCases.length > 0) {
    dod.push('- All test cases verified');
  }

  if (requirement.requiredSkills.includes('Frontend') || requirement.requiredSkills.includes('React')) {
    dod.push('- UI matches design specifications');
    dod.push('- Responsive on mobile and desktop');
  }

  if (requirement.requiredSkills.includes('API') || requirement.requiredSkills.includes('Backend')) {
    dod.push('- API endpoints tested and documented');
  }

  return dod.join('\n');
}

function generateSubtasks(requirement: ParsedRequirement): string[] {
  const subtasks: string[] = [];

  if (requirement.requiredSkills.includes('Frontend') || requirement.requiredSkills.includes('React')) {
    subtasks.push('Create UI components');
    subtasks.push('Implement business logic');
    subtasks.push('Add styling and responsive design');
  } else if (requirement.requiredSkills.includes('Backend') || requirement.requiredSkills.includes('API')) {
    subtasks.push('Design API endpoints');
    subtasks.push('Implement server logic');
    subtasks.push('Add validation and error handling');
  } else {
    subtasks.push('Research and design approach');
    subtasks.push('Implement core functionality');
    subtasks.push('Add tests and documentation');
  }

  return subtasks;
}

function generateDependencies(breakdown: TaskBreakdown): TaskDependency[] {
  const dependencies: TaskDependency[] = [];

  // Stories depend on epic
  for (const story of breakdown.stories) {
    dependencies.push({
      id: generateId(),
      taskId: story.id,
      dependsOnTaskId: breakdown.epic.id,
      dependencyType: 'blocks',
      createdAt: Date.now()
    });
  }

  // Subtasks depend on their parent stories
  for (const subtask of breakdown.subtasks) {
    if (subtask.parentTaskId) {
      dependencies.push({
        id: generateId(),
        taskId: subtask.id,
        dependsOnTaskId: subtask.parentTaskId,
        dependencyType: 'blocks',
        createdAt: Date.now()
      });
    }
  }

  // Sequential dependencies for related tasks
  const allTasks = [...breakdown.stories, ...breakdown.tasks];
  for (let i = 1; i < allTasks.length; i++) {
    if (hasRelatedSkills(allTasks[i - 1], allTasks[i])) {
      dependencies.push({
        id: generateId(),
        taskId: allTasks[i].id,
        dependsOnTaskId: allTasks[i - 1].id,
        dependencyType: 'related',
        createdAt: Date.now()
      });
    }
  }

  return dependencies;
}

function hasRelatedSkills(task1: Task, task2: Task): boolean {
  if (!task1.requiredSkills || !task2.requiredSkills) return false;

  const skills1 = new Set(task1.requiredSkills);
  const skills2 = new Set(task2.requiredSkills);

  let commonSkills = 0;
  for (const skill of skills1) {
    if (skills2.has(skill)) commonSkills++;
  }

  return commonSkills >= 2;
}
