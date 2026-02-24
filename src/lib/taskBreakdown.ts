import { Task, TaskType, RiskLevel, DoDItem } from '@/types/task';
import { generateId, generateTaskId } from './utils';

export interface BreakdownInput {
  title: string;
  description: string;
  type: 'issue' | 'prd' | 'screenshot';
  content: string;
}

export interface BreakdownResult {
  epic: Partial<Task>;
  stories: Partial<Task>[];
  tasks: Partial<Task>[];
  dependencies: Array<{ fromTaskId: string; toTaskId: string; type: 'blocks' | 'relates_to' }>;
}

/**
 * Analyzes text to extract task breakdown information
 * This is a rule-based system that can be enhanced with AI in the future
 */
export function breakdownTask(input: BreakdownInput, maxTaskNumber: number): BreakdownResult {
  const now = Date.now();
  const epicId = generateId();
  const epicTaskId = generateTaskId(maxTaskNumber + 1);

  // Create the epic
  const epic: Partial<Task> = {
    id: epicId,
    taskId: epicTaskId,
    title: input.title,
    description: input.description + '\n\n---\nOriginal Input:\n' + input.content,
    taskType: 'epic',
    status: 'backlog',
    priority: 3,
    tags: ['auto-generated'],
    riskLevel: detectRiskLevel(input.content),
    riskNotes: extractRiskNotes(input.content),
    estimatedHours: estimateComplexity(input.content),
    definitionOfDone: generateEpicDoD(input),
    testNotes: extractTestNotes(input.content),
    createdAt: now,
    updatedAt: now,
  };

  // Break down into stories
  const stories = extractStories(input.content, epicId, maxTaskNumber + 2);

  // Break down stories into tasks
  const tasks: Partial<Task>[] = [];
  const dependencies: Array<{ fromTaskId: string; toTaskId: string; type: 'blocks' | 'relates_to' }> = [];

  let taskCounter = maxTaskNumber + 2 + stories.length;

  stories.forEach((story, storyIdx) => {
    const storyTasks = extractTasksFromStory(story, taskCounter);
    tasks.push(...storyTasks);
    taskCounter += storyTasks.length;

    // Add dependencies between story and its tasks
    storyTasks.forEach(task => {
      if (story.id && task.id) {
        dependencies.push({
          fromTaskId: task.id,
          toTaskId: story.id,
          type: 'blocks'
        });
      }
    });

    // Sequential dependencies between stories
    if (storyIdx > 0 && stories[storyIdx - 1].id && story.id) {
      dependencies.push({
        fromTaskId: stories[storyIdx - 1].id!,
        toTaskId: story.id,
        type: 'blocks'
      });
    }
  });

  return { epic, stories, tasks, dependencies };
}

/**
 * Detects risk level from content keywords
 */
function detectRiskLevel(content: string): RiskLevel {
  const lowerContent = content.toLowerCase();

  const criticalKeywords = ['security', 'authentication', 'payment', 'data migration', 'breaking change'];
  const highKeywords = ['database', 'api', 'integration', 'third-party', 'complex'];
  const mediumKeywords = ['refactor', 'optimization', 'performance'];

  if (criticalKeywords.some(keyword => lowerContent.includes(keyword))) {
    return 'critical';
  }
  if (highKeywords.some(keyword => lowerContent.includes(keyword))) {
    return 'high';
  }
  if (mediumKeywords.some(keyword => lowerContent.includes(keyword))) {
    return 'medium';
  }

  return 'low';
}

/**
 * Extracts risk-related notes from content
 */
function extractRiskNotes(content: string): string {
  const riskPatterns = [
    /risk[s]?:\s*([^\n]+)/i,
    /concern[s]?:\s*([^\n]+)/i,
    /warning[s]?:\s*([^\n]+)/i,
  ];

  for (const pattern of riskPatterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return '';
}

/**
 * Estimates complexity based on content length and keywords
 */
function estimateComplexity(content: string): number {
  const wordCount = content.split(/\s+/).length;
  const complexityKeywords = ['complex', 'integration', 'multiple', 'system', 'architecture'];
  const complexityScore = complexityKeywords.filter(kw =>
    content.toLowerCase().includes(kw)
  ).length;

  // Base estimate: 1 hour per 50 words + complexity bonus
  return Math.max(2, Math.round((wordCount / 50) + (complexityScore * 2)));
}

/**
 * Generates Definition of Done for an epic
 */
function generateEpicDoD(input: BreakdownInput): DoDItem[] {
  const baseDoD: DoDItem[] = [
    { id: generateId(), text: 'All user stories completed', completed: false },
    { id: generateId(), text: 'All acceptance criteria met', completed: false },
    { id: generateId(), text: 'Code reviewed and approved', completed: false },
    { id: generateId(), text: 'Tests written and passing', completed: false },
    { id: generateId(), text: 'Documentation updated', completed: false },
  ];

  // Add specific DoD based on content
  const lowerContent = input.content.toLowerCase();

  if (lowerContent.includes('api') || lowerContent.includes('endpoint')) {
    baseDoD.push({ id: generateId(), text: 'API documentation complete', completed: false });
  }

  if (lowerContent.includes('ui') || lowerContent.includes('frontend')) {
    baseDoD.push({ id: generateId(), text: 'UI/UX review completed', completed: false });
  }

  if (lowerContent.includes('security') || lowerContent.includes('auth')) {
    baseDoD.push({ id: generateId(), text: 'Security review completed', completed: false });
  }

  return baseDoD;
}

/**
 * Extracts test notes from content
 */
function extractTestNotes(content: string): string {
  const testPatterns = [
    /test[ing]?:\s*([^\n]+)/i,
    /acceptance criteria:\s*([^\n]+)/i,
    /verify:\s*([^\n]+)/i,
  ];

  const notes: string[] = [];

  for (const pattern of testPatterns) {
    const matches = content.matchAll(new RegExp(pattern.source, 'gi'));
    for (const match of matches) {
      notes.push(match[1].trim());
    }
  }

  if (notes.length > 0) {
    return notes.join('\n');
  }

  return 'Manual testing required after implementation';
}

/**
 * Extracts user stories from content
 */
function extractStories(content: string, epicId: string, startingTaskNumber: number): Partial<Task>[] {
  const now = Date.now();
  const stories: Partial<Task>[] = [];

  // Try to find explicit user stories
  const storyPattern = /(?:as a|user story)[\s:]*([^\n]+)/gi;
  const matches = Array.from(content.matchAll(storyPattern));

  if (matches.length > 0) {
    matches.forEach((match, idx) => {
      const storyText = match[1].trim();
      stories.push({
        id: generateId(),
        taskId: generateTaskId(startingTaskNumber + idx),
        title: storyText.substring(0, 100),
        description: storyText,
        taskType: 'story',
        parentTaskId: epicId,
        status: 'backlog',
        priority: 3,
        tags: ['auto-generated', 'story'],
        definitionOfDone: [
          { id: generateId(), text: 'Implementation complete', completed: false },
          { id: generateId(), text: 'Unit tests passing', completed: false },
          { id: generateId(), text: 'Code reviewed', completed: false },
        ],
        createdAt: now,
        updatedAt: now,
      });
    });
  } else {
    // Generate generic stories based on phases
    const phases = ['Planning and Design', 'Implementation', 'Testing and QA', 'Documentation'];

    phases.forEach((phase, idx) => {
      stories.push({
        id: generateId(),
        taskId: generateTaskId(startingTaskNumber + idx),
        title: phase,
        description: `${phase} phase for the epic`,
        taskType: 'story',
        parentTaskId: epicId,
        status: 'backlog',
        priority: 3,
        tags: ['auto-generated', 'story'],
        definitionOfDone: [
          { id: generateId(), text: 'Phase objectives met', completed: false },
          { id: generateId(), text: 'Deliverables completed', completed: false },
        ],
        createdAt: now,
        updatedAt: now,
      });
    });
  }

  return stories;
}

/**
 * Extracts tasks from a story
 */
function extractTasksFromStory(story: Partial<Task>, startingTaskNumber: number): Partial<Task>[] {
  const now = Date.now();
  const tasks: Partial<Task>[] = [];

  // Generate standard tasks for each story
  const taskTemplates = [
    { title: 'Design and planning', priority: 3 as const },
    { title: 'Implementation', priority: 4 as const },
    { title: 'Testing', priority: 3 as const },
  ];

  taskTemplates.forEach((template, idx) => {
    tasks.push({
      id: generateId(),
      taskId: generateTaskId(startingTaskNumber + idx),
      title: `${story.title}: ${template.title}`,
      description: `${template.title} for: ${story.description}`,
      taskType: 'task',
      parentTaskId: story.id,
      status: 'backlog',
      priority: template.priority,
      tags: ['auto-generated', 'task'],
      estimatedHours: template.title === 'Implementation' ? 4 : 2,
      definitionOfDone: [
        { id: generateId(), text: 'Work completed', completed: false },
        { id: generateId(), text: 'Quality checked', completed: false },
      ],
      createdAt: now,
      updatedAt: now,
    });
  });

  return tasks;
}

/**
 * Analyzes task requirements and suggests required skills
 */
export function extractRequiredSkills(task: Partial<Task>): string[] {
  const skills: Set<string> = new Set();
  const content = `${task.title} ${task.description}`.toLowerCase();

  // Frontend skills
  if (content.match(/\b(react|ui|frontend|component|css|tailwind)\b/)) {
    skills.add('React');
    skills.add('CSS');
  }

  // Backend skills
  if (content.match(/\b(api|backend|server|database|postgresql|sql)\b/)) {
    skills.add('Node.js');
    skills.add('PostgreSQL');
    skills.add('API Design');
  }

  // TypeScript
  if (content.match(/\b(typescript|type|interface)\b/)) {
    skills.add('TypeScript');
  }

  // DevOps
  if (content.match(/\b(deploy|ci\/cd|docker|kubernetes|aws)\b/)) {
    skills.add('Docker');
    skills.add('CI/CD');
  }

  // Mobile
  if (content.match(/\b(mobile|ios|android|react native)\b/)) {
    skills.add('React Native');
    skills.add('Mobile UI');
  }

  return Array.from(skills);
}
