import { Task, TaskType, RiskFlag } from '@/types/task';
import { generateId, generateTaskId } from './utils';

export interface BreakdownInput {
  source: string; // issue description, PRD, or screenshot analysis
  type: 'issue' | 'prd' | 'screenshot';
}

export interface BreakdownResult {
  epics: Task[];
  stories: Task[];
  subtasks: Task[];
  dependencies: Array<{ taskId: string; dependsOn: string; type: 'blocks' | 'blocked_by' | 'relates_to' }>;
}

/**
 * Parse an issue/PRD and break it down into structured tasks
 * This is a rule-based implementation. Can be enhanced with AI (OpenAI/Anthropic) later.
 */
export async function breakdownTask(input: BreakdownInput, startTaskNumber: number = 1): Promise<BreakdownResult> {
  const { source, type } = input;

  // Parse the input based on type
  const parsed = parseInput(source, type);

  // Generate epics, stories, and subtasks
  const epics: Task[] = [];
  const stories: Task[] = [];
  const subtasks: Task[] = [];
  const dependencies: BreakdownResult['dependencies'] = [];

  let taskCounter = startTaskNumber;

  // Create epics from high-level features
  for (const epicData of parsed.epics) {
    const epic: Task = {
      id: generateId(),
      taskId: generateTaskId(taskCounter++),
      title: epicData.title,
      description: epicData.description,
      status: 'backlog',
      priority: epicData.priority || 3,
      tags: epicData.tags || [],
      taskType: 'epic',
      definitionOfDone: epicData.dod || [],
      testNotes: epicData.testNotes,
      riskFlags: epicData.risks || [],
      estimatedHours: epicData.estimatedHours,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    epics.push(epic);

    // Create stories for this epic
    for (const storyData of epicData.stories || []) {
      const story: Task = {
        id: generateId(),
        taskId: generateTaskId(taskCounter++),
        title: storyData.title,
        description: storyData.description,
        status: 'backlog',
        priority: storyData.priority || epic.priority,
        tags: [...(epic.tags || []), ...(storyData.tags || [])],
        taskType: 'story',
        parentTaskId: epic.id,
        definitionOfDone: storyData.dod || [],
        testNotes: storyData.testNotes,
        riskFlags: storyData.risks || [],
        estimatedHours: storyData.estimatedHours,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      stories.push(story);

      // Create subtasks for this story
      for (const subtaskData of storyData.subtasks || []) {
        const subtask: Task = {
          id: generateId(),
          taskId: generateTaskId(taskCounter++),
          title: subtaskData.title,
          description: subtaskData.description,
          status: 'backlog',
          priority: subtaskData.priority || story.priority,
          tags: story.tags,
          taskType: 'subtask',
          parentTaskId: story.id,
          definitionOfDone: subtaskData.dod || [],
          testNotes: subtaskData.testNotes,
          riskFlags: subtaskData.risks || [],
          estimatedHours: subtaskData.estimatedHours,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        subtasks.push(subtask);
      }

      // Add dependencies if specified
      if (storyData.dependencies) {
        for (const dep of storyData.dependencies) {
          dependencies.push({
            taskId: story.taskId,
            dependsOn: dep.taskId,
            type: dep.type || 'blocks',
          });
        }
      }
    }
  }

  return { epics, stories, subtasks, dependencies };
}

interface ParsedEpic {
  title: string;
  description: string;
  priority?: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
  dod?: string[];
  testNotes?: string;
  risks?: RiskFlag[];
  estimatedHours?: number;
  stories?: ParsedStory[];
}

interface ParsedStory {
  title: string;
  description: string;
  priority?: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
  dod?: string[];
  testNotes?: string;
  risks?: RiskFlag[];
  estimatedHours?: number;
  subtasks?: ParsedSubtask[];
  dependencies?: Array<{ taskId: string; type: 'blocks' | 'blocked_by' | 'relates_to' }>;
}

interface ParsedSubtask {
  title: string;
  description: string;
  priority?: 1 | 2 | 3 | 4 | 5;
  dod?: string[];
  testNotes?: string;
  risks?: RiskFlag[];
  estimatedHours?: number;
}

interface ParsedInput {
  epics: ParsedEpic[];
}

/**
 * Parse input text into structured format
 * This uses pattern matching and heuristics. Can be enhanced with AI.
 */
function parseInput(source: string, type: 'issue' | 'prd' | 'screenshot'): ParsedInput {
  const epics: ParsedEpic[] = [];

  // Split by sections (Epic, Feature, etc.)
  const lines = source.split('\n');
  let currentEpic: ParsedEpic | null = null;
  let currentStory: ParsedStory | null = null;
  let currentSection: 'description' | 'dod' | 'tests' | 'risks' | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Epic detection (## Epic:, # Epic:, Epic:)
    if (trimmed.match(/^#+\s*epic/i) || trimmed.match(/^epic:/i)) {
      if (currentEpic) {
        if (currentStory) currentEpic.stories?.push(currentStory);
        epics.push(currentEpic);
      }
      currentEpic = {
        title: trimmed.replace(/^#+\s*epic:\s*/i, '').replace(/^epic:\s*/i, ''),
        description: '',
        stories: [],
      };
      currentStory = null;
      currentSection = 'description';
      continue;
    }

    // Story detection (## Story:, - Story:, * Story:)
    if (trimmed.match(/^#+\s*story/i) || trimmed.match(/^[-*]\s*story/i) || trimmed.match(/^story:/i)) {
      if (currentStory && currentEpic) {
        currentEpic.stories?.push(currentStory);
      }
      currentStory = {
        title: trimmed.replace(/^#+\s*story:\s*/i, '').replace(/^[-*]\s*story:\s*/i, '').replace(/^story:\s*/i, ''),
        description: '',
        subtasks: [],
      };
      currentSection = 'description';

      // If no epic exists, create a default one
      if (!currentEpic) {
        currentEpic = {
          title: 'Main Epic',
          description: 'Auto-generated epic from task breakdown',
          stories: [],
        };
      }
      continue;
    }

    // Subtask detection (- [ ], * [ ], - Task:, * Task:)
    if (trimmed.match(/^[-*]\s*\[[ x]\]/i) || trimmed.match(/^[-*]\s*task:/i) || trimmed.match(/^[-*]\s+\w/)) {
      const subtaskTitle = trimmed
        .replace(/^[-*]\s*\[[ x]\]\s*/i, '')
        .replace(/^[-*]\s*task:\s*/i, '')
        .replace(/^[-*]\s+/, '');

      if (currentStory) {
        currentStory.subtasks?.push({
          title: subtaskTitle,
          description: '',
          estimatedHours: estimateHours(subtaskTitle),
        });
      }
      continue;
    }

    // Section markers
    if (trimmed.match(/^#+\s*definition of done/i) || trimmed.match(/^dod:/i)) {
      currentSection = 'dod';
      continue;
    }
    if (trimmed.match(/^#+\s*test/i) || trimmed.match(/^testing:/i)) {
      currentSection = 'tests';
      continue;
    }
    if (trimmed.match(/^#+\s*risk/i) || trimmed.match(/^risks:/i)) {
      currentSection = 'risks';
      continue;
    }

    // Content based on current section
    if (currentSection === 'description') {
      if (currentStory) {
        currentStory.description += (currentStory.description ? '\n' : '') + trimmed;
      } else if (currentEpic) {
        currentEpic.description += (currentEpic.description ? '\n' : '') + trimmed;
      }
    } else if (currentSection === 'dod' && trimmed.match(/^[-*]/)) {
      const dodItem = trimmed.replace(/^[-*]\s*/, '');
      if (currentStory) {
        currentStory.dod = currentStory.dod || [];
        currentStory.dod.push(dodItem);
      } else if (currentEpic) {
        currentEpic.dod = currentEpic.dod || [];
        currentEpic.dod.push(dodItem);
      }
    } else if (currentSection === 'tests') {
      if (currentStory) {
        currentStory.testNotes = (currentStory.testNotes || '') + (currentStory.testNotes ? '\n' : '') + trimmed;
      } else if (currentEpic) {
        currentEpic.testNotes = (currentEpic.testNotes || '') + (currentEpic.testNotes ? '\n' : '') + trimmed;
      }
    } else if (currentSection === 'risks' && trimmed.match(/^[-*]/)) {
      const riskText = trimmed.replace(/^[-*]\s*/, '');
      const severity = detectRiskSeverity(riskText);
      const risk: RiskFlag = {
        severity,
        description: riskText,
      };
      if (currentStory) {
        currentStory.risks = currentStory.risks || [];
        currentStory.risks.push(risk);
      } else if (currentEpic) {
        currentEpic.risks = currentEpic.risks || [];
        currentEpic.risks.push(risk);
      }
    }
  }

  // Close final epic and story
  if (currentStory && currentEpic) {
    currentEpic.stories?.push(currentStory);
  }
  if (currentEpic) {
    epics.push(currentEpic);
  }

  // If no structured input was found, create a simple breakdown
  if (epics.length === 0) {
    epics.push({
      title: 'Implementation',
      description: source.substring(0, 500),
      priority: 3,
      tags: ['auto-generated'],
      stories: [
        {
          title: 'Analyze requirements',
          description: 'Review and understand the requirements',
          dod: ['Requirements documented', 'Acceptance criteria defined'],
          estimatedHours: 2,
          subtasks: [],
        },
        {
          title: 'Implement solution',
          description: 'Build the requested functionality',
          dod: ['Code implemented', 'Code reviewed', 'Tests passing'],
          estimatedHours: 8,
          subtasks: [],
        },
        {
          title: 'Testing and validation',
          description: 'Test the implementation',
          dod: ['All tests passing', 'Manual testing complete', 'Documentation updated'],
          estimatedHours: 4,
          subtasks: [],
        },
      ],
    });
  }

  // Auto-detect tags and priorities
  for (const epic of epics) {
    epic.tags = epic.tags || detectTags(epic.title + ' ' + epic.description);
    epic.priority = epic.priority || detectPriority(epic.title + ' ' + epic.description);

    for (const story of epic.stories || []) {
      story.tags = story.tags || detectTags(story.title + ' ' + story.description);
      story.priority = story.priority || epic.priority;
      story.estimatedHours = story.estimatedHours || estimateHours(story.title + ' ' + story.description);
    }
  }

  return { epics };
}

function detectTags(text: string): string[] {
  const tags: string[] = [];
  const lower = text.toLowerCase();

  if (lower.match(/\b(ui|frontend|react|component|design)\b/)) tags.push('frontend');
  if (lower.match(/\b(api|backend|server|database|db)\b/)) tags.push('backend');
  if (lower.match(/\b(bug|fix|issue|error)\b/)) tags.push('bug');
  if (lower.match(/\b(feature|new|add|implement)\b/)) tags.push('feature');
  if (lower.match(/\b(urgent|critical|important|asap)\b/)) tags.push('urgent');
  if (lower.match(/\b(test|testing|qa)\b/)) tags.push('testing');
  if (lower.match(/\b(refactor|cleanup|optimize)\b/)) tags.push('refactor');
  if (lower.match(/\b(doc|documentation)\b/)) tags.push('documentation');

  return tags;
}

function detectPriority(text: string): 1 | 2 | 3 | 4 | 5 {
  const lower = text.toLowerCase();

  if (lower.match(/\b(critical|urgent|asap|emergency|p1)\b/)) return 5;
  if (lower.match(/\b(high|important|p2)\b/)) return 4;
  if (lower.match(/\b(medium|normal|p3)\b/)) return 3;
  if (lower.match(/\b(low|minor|p4)\b/)) return 2;
  if (lower.match(/\b(trivial|nice-to-have|p5)\b/)) return 1;

  return 3; // default
}

function detectRiskSeverity(text: string): 'low' | 'medium' | 'high' | 'critical' {
  const lower = text.toLowerCase();

  if (lower.match(/\b(critical|severe|major)\b/)) return 'critical';
  if (lower.match(/\b(high|significant)\b/)) return 'high';
  if (lower.match(/\b(medium|moderate)\b/)) return 'medium';

  return 'low';
}

function estimateHours(text: string): number {
  const lower = text.toLowerCase();

  // Look for explicit hour mentions
  const hourMatch = lower.match(/(\d+)\s*(hour|hr|h)\b/);
  if (hourMatch) return parseInt(hourMatch[1]);

  // Estimate based on complexity keywords
  if (lower.match(/\b(large|complex|major|refactor)\b/)) return 16;
  if (lower.match(/\b(medium|moderate)\b/)) return 8;
  if (lower.match(/\b(small|minor|simple|quick)\b/)) return 2;

  // Default estimate
  return 4;
}
