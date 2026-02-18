import { Task, TaskBreakdownRequest, TaskBreakdownResult, TaskType } from '@/types/task';

/**
 * Task Breakdown Engine
 * Analyzes issues, PRDs, or screenshots to break down work into epics, stories, and tasks
 */

interface ParsedRequirement {
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4 | 5;
  estimatedHours?: number;
  tags: string[];
  riskFlags: string[];
  acceptanceCriteria: string[];
  definitionOfDone: string[];
  testNotes?: string;
}

/**
 * Extract structured information from raw text
 */
function parseRequirementText(text: string): ParsedRequirement[] {
  const requirements: ParsedRequirement[] = [];

  // Split by common delimiters for multiple requirements
  const sections = text.split(/(?:\n\n|\n#{1,3}\s)/);

  for (const section of sections) {
    if (!section.trim()) continue;

    const lines = section.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) continue;

    const title = lines[0].replace(/^[#\-*]\s*/, '').trim();
    if (!title) continue;

    let description = '';
    const tags: string[] = [];
    const riskFlags: string[] = [];
    const acceptanceCriteria: string[] = [];
    const definitionOfDone: string[] = [];
    let testNotes = '';
    let priority: 1 | 2 | 3 | 4 | 5 = 3;
    let estimatedHours: number | undefined;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // Extract acceptance criteria
      if (line.toLowerCase().includes('acceptance criteria') || line.toLowerCase().includes('ac:')) {
        for (let j = i + 1; j < lines.length && lines[j].match(/^[-*]\s/); j++) {
          acceptanceCriteria.push(lines[j].replace(/^[-*]\s*/, ''));
        }
      }

      // Extract DoD
      if (line.toLowerCase().includes('definition of done') || line.toLowerCase().includes('dod:')) {
        for (let j = i + 1; j < lines.length && lines[j].match(/^[-*]\s/); j++) {
          definitionOfDone.push(lines[j].replace(/^[-*]\s*/, ''));
        }
      }

      // Extract risk flags
      if (line.toLowerCase().includes('risk') || line.toLowerCase().includes('blocker')) {
        riskFlags.push(line.replace(/^[-*]\s*/, ''));
      }

      // Extract test notes
      if (line.toLowerCase().includes('test') && !line.toLowerCase().includes('acceptance')) {
        testNotes += line + '\n';
      }

      // Extract priority
      if (line.toLowerCase().includes('priority')) {
        const match = line.match(/priority\s*[:=]?\s*([1-5])/i);
        if (match) priority = parseInt(match[1]) as 1 | 2 | 3 | 4 | 5;
      }

      // Extract estimate
      if (line.toLowerCase().includes('estimate') || line.toLowerCase().includes('hours')) {
        const match = line.match(/(\d+)\s*(?:hours?|hrs?)/i);
        if (match) estimatedHours = parseInt(match[1]);
      }

      // Extract tags
      if (line.toLowerCase().includes('tag') || line.match(/#\w+/)) {
        const tagMatches = line.match(/#(\w+)/g);
        if (tagMatches) {
          tags.push(...tagMatches.map(t => t.substring(1)));
        }
      }

      // Build description
      if (!line.match(/^(acceptance criteria|definition of done|risk|test|priority|estimate|tag)/i)) {
        description += line + '\n';
      }
    }

    requirements.push({
      title,
      description: description.trim(),
      priority,
      estimatedHours,
      tags: tags.length > 0 ? tags : ['general'],
      riskFlags,
      acceptanceCriteria,
      definitionOfDone,
      testNotes: testNotes.trim() || undefined,
    });
  }

  return requirements;
}

/**
 * Categorize a requirement as epic, story, or task based on complexity
 */
function categorizeRequirement(req: ParsedRequirement): TaskType {
  const { title, description, estimatedHours } = req;

  // Epics are large features with multiple parts
  if (
    title.toLowerCase().includes('epic') ||
    title.toLowerCase().includes('feature') ||
    (estimatedHours && estimatedHours > 40) ||
    description.length > 500
  ) {
    return 'epic';
  }

  // Stories are user-facing features
  if (
    title.toLowerCase().includes('user') ||
    title.toLowerCase().includes('as a') ||
    (estimatedHours && estimatedHours > 8)
  ) {
    return 'story';
  }

  // Default to task
  return 'task';
}

/**
 * Break down an epic into stories and tasks
 */
function breakdownEpic(epic: ParsedRequirement): ParsedRequirement[] {
  const stories: ParsedRequirement[] = [];
  const keywords = ['authentication', 'ui', 'api', 'database', 'testing', 'deployment'];

  // Simple heuristic: look for component mentions in description
  const description = epic.description.toLowerCase();

  keywords.forEach(keyword => {
    if (description.includes(keyword)) {
      stories.push({
        title: `Implement ${keyword} for ${epic.title}`,
        description: `Handle ${keyword} requirements for ${epic.title}`,
        priority: epic.priority,
        estimatedHours: epic.estimatedHours ? Math.ceil(epic.estimatedHours / keywords.length) : undefined,
        tags: [...epic.tags, keyword],
        riskFlags: epic.riskFlags,
        acceptanceCriteria: epic.acceptanceCriteria.filter(ac =>
          ac.toLowerCase().includes(keyword)
        ),
        definitionOfDone: epic.definitionOfDone,
        testNotes: epic.testNotes,
      });
    }
  });

  // If no breakdown found, create a default story
  if (stories.length === 0) {
    stories.push({
      ...epic,
      title: `Implement ${epic.title}`,
    });
  }

  return stories;
}

/**
 * Break down a story into tasks
 */
function breakdownStory(story: ParsedRequirement): ParsedRequirement[] {
  const tasks: ParsedRequirement[] = [];

  // Standard tasks for most stories
  const standardTasks = [
    { title: 'Design and plan', tags: ['planning'], estimateRatio: 0.15 },
    { title: 'Implement core functionality', tags: ['development'], estimateRatio: 0.5 },
    { title: 'Write tests', tags: ['testing'], estimateRatio: 0.2 },
    { title: 'Code review and refinement', tags: ['review'], estimateRatio: 0.15 },
  ];

  standardTasks.forEach(taskTemplate => {
    tasks.push({
      title: `${taskTemplate.title} for ${story.title}`,
      description: story.description,
      priority: story.priority,
      estimatedHours: story.estimatedHours
        ? Math.ceil(story.estimatedHours * taskTemplate.estimateRatio)
        : undefined,
      tags: [...story.tags, ...taskTemplate.tags],
      riskFlags: story.riskFlags,
      acceptanceCriteria: story.acceptanceCriteria,
      definitionOfDone: story.definitionOfDone,
      testNotes: story.testNotes,
    });
  });

  return tasks;
}

/**
 * Detect dependencies between tasks
 */
function detectDependencies(items: Array<{ id: string; title: string; tags: string[] }>): Array<{
  from: string;
  to: string;
  type: 'blocks' | 'related';
}> {
  const dependencies: Array<{ from: string; to: string; type: 'blocks' | 'related' }> = [];

  // Common dependency patterns
  const dependencyRules = [
    { from: 'planning', to: 'development', type: 'blocks' as const },
    { from: 'development', to: 'testing', type: 'blocks' as const },
    { from: 'testing', to: 'review', type: 'blocks' as const },
    { from: 'database', to: 'api', type: 'blocks' as const },
    { from: 'api', to: 'ui', type: 'blocks' as const },
    { from: 'authentication', to: 'authorization', type: 'blocks' as const },
  ];

  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items.length; j++) {
      if (i === j) continue;

      const item1 = items[i];
      const item2 = items[j];

      // Check if any dependency rule applies
      for (const rule of dependencyRules) {
        if (
          item1.tags.includes(rule.from) &&
          item2.tags.includes(rule.to)
        ) {
          dependencies.push({
            from: item1.id,
            to: item2.id,
            type: rule.type,
          });
        }
      }

      // Check for related tasks (same tags)
      const commonTags = item1.tags.filter(tag => item2.tags.includes(tag));
      if (commonTags.length >= 2 && !dependencies.some(d =>
        (d.from === item1.id && d.to === item2.id) ||
        (d.from === item2.id && d.to === item1.id)
      )) {
        dependencies.push({
          from: item1.id,
          to: item2.id,
          type: 'related',
        });
      }
    }
  }

  return dependencies;
}

/**
 * Main task breakdown function
 */
export async function breakdownTask(request: TaskBreakdownRequest): Promise<TaskBreakdownResult> {
  let text = request.content;

  // For screenshots, you would integrate with an OCR/vision API here
  if (request.source === 'screenshot' && request.imageData) {
    // Placeholder: In production, use OCR or vision API
    text = 'Extracted text from screenshot:\n' + text;
  }

  // Parse requirements from text
  const requirements = parseRequirementText(text);

  if (requirements.length === 0) {
    throw new Error('No requirements could be extracted from the input');
  }

  // Categorize the main requirement
  const mainReq = requirements[0];
  const mainType = categorizeRequirement(mainReq);

  const result: TaskBreakdownResult = {
    epic: {} as Partial<Task>,
    stories: [],
    tasks: [],
    dependencies: [],
    suggestedAgentAssignments: [],
  };

  let tempIdCounter = 0;
  const getTempId = () => `temp_${tempIdCounter++}`;

  // Build task hierarchy based on type
  if (mainType === 'epic') {
    // Create epic
    const epicId = getTempId();
    result.epic = {
      taskId: epicId,
      title: mainReq.title,
      description: mainReq.description,
      taskType: 'epic',
      priority: mainReq.priority,
      tags: mainReq.tags,
      estimatedHours: mainReq.estimatedHours,
      riskFlags: mainReq.riskFlags,
      acceptanceCriteria: mainReq.acceptanceCriteria,
      definitionOfDone: mainReq.definitionOfDone.length > 0 ? mainReq.definitionOfDone : [
        'All stories completed',
        'Integration tests passing',
        'Documentation updated',
        'Code reviewed and approved',
      ],
      testNotes: mainReq.testNotes,
    };

    // Break down into stories
    const stories = breakdownEpic(mainReq);
    const storyItems: Array<{ id: string; title: string; tags: string[] }> = [];

    for (const story of stories) {
      const storyId = getTempId();
      storyItems.push({ id: storyId, title: story.title, tags: story.tags });

      result.stories.push({
        taskId: storyId,
        title: story.title,
        description: story.description,
        taskType: 'story',
        epicId: epicId,
        priority: story.priority,
        tags: story.tags,
        estimatedHours: story.estimatedHours,
        riskFlags: story.riskFlags,
        acceptanceCriteria: story.acceptanceCriteria.length > 0 ? story.acceptanceCriteria : [
          'Feature works as expected',
          'Tests written and passing',
          'Code meets standards',
        ],
        definitionOfDone: story.definitionOfDone.length > 0 ? story.definitionOfDone : [
          'Code complete',
          'Tests passing',
          'Peer reviewed',
        ],
        testNotes: story.testNotes,
      });

      // Break down story into tasks
      const tasks = breakdownStory(story);
      const taskItems: Array<{ id: string; title: string; tags: string[] }> = [];

      for (const task of tasks) {
        const taskId = getTempId();
        taskItems.push({ id: taskId, title: task.title, tags: task.tags });

        result.tasks.push({
          taskId: taskId,
          title: task.title,
          description: task.description,
          taskType: 'task',
          epicId: epicId,
          parentId: storyId,
          priority: task.priority,
          tags: task.tags,
          estimatedHours: task.estimatedHours,
          riskFlags: task.riskFlags,
          acceptanceCriteria: task.acceptanceCriteria,
          definitionOfDone: task.definitionOfDone.length > 0 ? task.definitionOfDone : [
            'Implementation complete',
            'Code reviewed',
          ],
          testNotes: task.testNotes,
        });
      }

      // Detect dependencies within story tasks
      const taskDeps = detectDependencies(taskItems);
      result.dependencies.push(...taskDeps);
    }

    // Detect dependencies between stories
    const storyDeps = detectDependencies(storyItems);
    result.dependencies.push(...storyDeps);

  } else if (mainType === 'story') {
    // Create story
    const storyId = getTempId();
    result.stories.push({
      taskId: storyId,
      title: mainReq.title,
      description: mainReq.description,
      taskType: 'story',
      priority: mainReq.priority,
      tags: mainReq.tags,
      estimatedHours: mainReq.estimatedHours,
      riskFlags: mainReq.riskFlags,
      acceptanceCriteria: mainReq.acceptanceCriteria.length > 0 ? mainReq.acceptanceCriteria : [
        'Feature works as expected',
        'Tests written and passing',
      ],
      definitionOfDone: mainReq.definitionOfDone.length > 0 ? mainReq.definitionOfDone : [
        'Code complete',
        'Tests passing',
        'Peer reviewed',
      ],
      testNotes: mainReq.testNotes,
    });

    // Break down into tasks
    const tasks = breakdownStory(mainReq);
    const taskItems: Array<{ id: string; title: string; tags: string[] }> = [];

    for (const task of tasks) {
      const taskId = getTempId();
      taskItems.push({ id: taskId, title: task.title, tags: task.tags });

      result.tasks.push({
        taskId: taskId,
        title: task.title,
        description: task.description,
        taskType: 'task',
        parentId: storyId,
        priority: task.priority,
        tags: task.tags,
        estimatedHours: task.estimatedHours,
        riskFlags: task.riskFlags,
        acceptanceCriteria: task.acceptanceCriteria,
        definitionOfDone: task.definitionOfDone.length > 0 ? task.definitionOfDone : [
          'Implementation complete',
          'Code reviewed',
        ],
        testNotes: task.testNotes,
      });
    }

    // Detect dependencies
    const deps = detectDependencies(taskItems);
    result.dependencies.push(...deps);

  } else {
    // Just a single task
    const taskId = getTempId();
    result.tasks.push({
      taskId: taskId,
      title: mainReq.title,
      description: mainReq.description,
      taskType: 'task',
      priority: mainReq.priority,
      tags: mainReq.tags,
      estimatedHours: mainReq.estimatedHours,
      riskFlags: mainReq.riskFlags,
      acceptanceCriteria: mainReq.acceptanceCriteria.length > 0 ? mainReq.acceptanceCriteria : [
        'Task completed successfully',
      ],
      definitionOfDone: mainReq.definitionOfDone.length > 0 ? mainReq.definitionOfDone : [
        'Implementation complete',
        'Code reviewed',
      ],
      testNotes: mainReq.testNotes,
    });
  }

  return result;
}
