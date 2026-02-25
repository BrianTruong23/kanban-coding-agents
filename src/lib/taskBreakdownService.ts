import { TaskBreakdownResult, ParsedRequirement } from '@/types/taskBreakdown';

/**
 * Parse an issue, PRD, or requirement text into structured tasks
 * This is a rule-based parser that identifies patterns in the text
 */
export function parseRequirementText(text: string): TaskBreakdownResult {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const result: TaskBreakdownResult = {
    tasks: [],
    dependencies: [],
  };

  let currentTask: TaskBreakdownResult['tasks'][0] | null = null;
  let epicTitle = '';
  let epicDescription = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Epic detection
    if (lowerLine.startsWith('epic:') || lowerLine.startsWith('# epic')) {
      epicTitle = line.replace(/^(epic:|#\s*epic)/i, '').trim();
      epicDescription = lines[i + 1] || '';
      result.epic = {
        id: '',
        title: epicTitle,
        description: epicDescription,
        status: 'planning',
        priority: 3,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      continue;
    }

    // Task detection (numbered list, bullet points, or "Task:" prefix)
    if (/^\d+\./.test(line) || /^[-*•]/.test(line) || lowerLine.startsWith('task:') || lowerLine.startsWith('## ')) {
      if (currentTask) {
        result.tasks.push(currentTask);
      }

      const title = line.replace(/^(\d+\.|[-*•]|task:|##)\s*/i, '').trim();
      const priority = detectPriority(title);
      const tags = detectTags(title);

      currentTask = {
        title,
        description: '',
        priority,
        tags,
        subtasks: [],
        definitionsOfDone: [],
        testNotes: [],
        riskFlags: [],
        suggestedAgentSkills: detectSkills(title),
      };
      continue;
    }

    // Subtask detection (indented items)
    if (currentTask && /^\s{2,}[-*•]/.test(line)) {
      const subtaskTitle = line.replace(/^\s+[-*•]\s*/, '').trim();
      currentTask.subtasks?.push({
        title: subtaskTitle,
        description: '',
        completed: false,
      });
      continue;
    }

    // DoD detection
    if (currentTask && (lowerLine.includes('definition of done') || lowerLine.includes('dod:') || lowerLine.includes('acceptance criteria'))) {
      const dodText = line.replace(/^.*?(definition of done|dod:|acceptance criteria):?\s*/i, '').trim();
      if (dodText) {
        currentTask.definitionsOfDone?.push({
          description: dodText,
          completed: false,
        });
      }
      continue;
    }

    // Test notes detection
    if (currentTask && (lowerLine.includes('test:') || lowerLine.includes('testing:'))) {
      const testText = line.replace(/^.*?(test|testing):?\s*/i, '').trim();
      const testType = detectTestType(testText);
      if (testText) {
        currentTask.testNotes?.push({
          description: testText,
          testType,
          completed: false,
        });
      }
      continue;
    }

    // Risk detection
    if (currentTask && (lowerLine.includes('risk:') || lowerLine.includes('warning:') || lowerLine.includes('⚠'))) {
      const riskText = line.replace(/^.*?(risk|warning):?\s*/i, '').replace(/⚠/g, '').trim();
      const severity = detectRiskSeverity(riskText);
      if (riskText) {
        currentTask.riskFlags?.push({
          description: riskText,
          severity,
          resolved: false,
        });
      }
      continue;
    }

    // Dependency detection
    if (currentTask && (lowerLine.includes('depends on') || lowerLine.includes('blocked by') || lowerLine.includes('requires'))) {
      // This is a simplified dependency detection
      // In a real implementation, you'd need more sophisticated parsing
      continue;
    }

    // Description continuation
    if (currentTask && line.length > 0 && !line.startsWith('#')) {
      if (currentTask.description) {
        currentTask.description += '\n' + line;
      } else {
        currentTask.description = line;
      }
    }
  }

  // Add the last task
  if (currentTask) {
    result.tasks.push(currentTask);
  }

  // If no tasks were found, create a single task from the entire text
  if (result.tasks.length === 0 && text.trim().length > 0) {
    result.tasks.push({
      title: text.split('\n')[0].substring(0, 100),
      description: text,
      priority: 3,
      tags: detectTags(text),
      suggestedAgentSkills: detectSkills(text),
    });
  }

  return result;
}

function detectPriority(text: string): 1 | 2 | 3 | 4 | 5 {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('critical') || lowerText.includes('urgent') || lowerText.includes('p0') || lowerText.includes('priority 5')) {
    return 5;
  }
  if (lowerText.includes('high priority') || lowerText.includes('important') || lowerText.includes('p1') || lowerText.includes('priority 4')) {
    return 4;
  }
  if (lowerText.includes('low priority') || lowerText.includes('p3') || lowerText.includes('priority 1')) {
    return 1;
  }
  if (lowerText.includes('p2') || lowerText.includes('priority 2')) {
    return 2;
  }
  return 3;
}

function detectTags(text: string): string[] {
  const tags: string[] = [];
  const lowerText = text.toLowerCase();

  // Technical tags
  if (lowerText.includes('frontend') || lowerText.includes('ui') || lowerText.includes('react')) tags.push('frontend');
  if (lowerText.includes('backend') || lowerText.includes('api') || lowerText.includes('server')) tags.push('backend');
  if (lowerText.includes('database') || lowerText.includes('sql') || lowerText.includes('db')) tags.push('database');
  if (lowerText.includes('mobile') || lowerText.includes('ios') || lowerText.includes('android')) tags.push('mobile');
  if (lowerText.includes('devops') || lowerText.includes('ci/cd') || lowerText.includes('deployment')) tags.push('devops');
  if (lowerText.includes('test') || lowerText.includes('testing')) tags.push('testing');

  // Type tags
  if (lowerText.includes('bug') || lowerText.includes('fix')) tags.push('bug');
  if (lowerText.includes('feature') || lowerText.includes('new')) tags.push('feature');
  if (lowerText.includes('refactor') || lowerText.includes('cleanup')) tags.push('refactor');
  if (lowerText.includes('documentation') || lowerText.includes('docs')) tags.push('documentation');

  return [...new Set(tags)]; // Remove duplicates
}

function detectSkills(text: string): string[] {
  const skills: string[] = [];
  const lowerText = text.toLowerCase();

  // Frontend skills
  if (lowerText.includes('react')) skills.push('React');
  if (lowerText.includes('next.js') || lowerText.includes('nextjs')) skills.push('Next.js');
  if (lowerText.includes('typescript') || lowerText.includes('ts')) skills.push('TypeScript');
  if (lowerText.includes('ui') || lowerText.includes('design') || lowerText.includes('css')) skills.push('UI/UX Design');

  // Backend skills
  if (lowerText.includes('node') || lowerText.includes('nodejs')) skills.push('Node.js');
  if (lowerText.includes('api')) skills.push('API Design');
  if (lowerText.includes('auth') || lowerText.includes('authentication')) skills.push('Authentication');

  // Database skills
  if (lowerText.includes('postgres') || lowerText.includes('postgresql') || lowerText.includes('sql')) skills.push('PostgreSQL');
  if (lowerText.includes('database') || lowerText.includes('db')) skills.push('Database Design');

  // DevOps skills
  if (lowerText.includes('docker')) skills.push('Docker');
  if (lowerText.includes('ci/cd') || lowerText.includes('pipeline')) skills.push('CI/CD');
  if (lowerText.includes('aws') || lowerText.includes('cloud')) skills.push('AWS');

  // Mobile skills
  if (lowerText.includes('react native')) skills.push('React Native');
  if (lowerText.includes('ios')) skills.push('iOS Development');
  if (lowerText.includes('android')) skills.push('Android Development');

  // Testing
  if (lowerText.includes('test') || lowerText.includes('testing')) skills.push('Testing');

  return [...new Set(skills)]; // Remove duplicates
}

function detectTestType(text: string): 'unit' | 'integration' | 'e2e' | 'manual' {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('unit')) return 'unit';
  if (lowerText.includes('integration')) return 'integration';
  if (lowerText.includes('e2e') || lowerText.includes('end-to-end')) return 'e2e';
  return 'manual';
}

function detectRiskSeverity(text: string): 'low' | 'medium' | 'high' | 'critical' {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('critical') || lowerText.includes('severe')) return 'critical';
  if (lowerText.includes('high') || lowerText.includes('major')) return 'high';
  if (lowerText.includes('low') || lowerText.includes('minor')) return 'low';
  return 'medium';
}

/**
 * Parse a screenshot description into tasks
 * This would ideally use AI/ML in production
 */
export function parseScreenshot(description: string): TaskBreakdownResult {
  // For now, treat it like regular text
  // In production, you'd analyze the image with AI
  return parseRequirementText(description);
}

/**
 * Generate a comprehensive task breakdown with all metadata
 */
export function generateTaskBreakdown(input: {
  text?: string;
  screenshotDescription?: string;
  type: 'issue' | 'prd' | 'screenshot';
}): TaskBreakdownResult {
  const text = input.text || input.screenshotDescription || '';
  const result = input.type === 'screenshot'
    ? parseScreenshot(text)
    : parseRequirementText(text);

  // Enhance with additional metadata
  result.tasks.forEach((task, index) => {
    // Add default DoD if none exists
    if (!task.definitionsOfDone || task.definitionsOfDone.length === 0) {
      task.definitionsOfDone = [
        { description: 'Code is written and tested', completed: false },
        { description: 'Code review is completed', completed: false },
        { description: 'Changes are merged to main branch', completed: false },
      ];
    }

    // Add estimated hours based on complexity
    const complexity = estimateComplexity(task.description);
    task.estimatedHours = complexity === 'low' ? 2 : complexity === 'medium' ? 8 : complexity === 'high' ? 16 : 32;
  });

  return result;
}

function estimateComplexity(description: string): 'low' | 'medium' | 'high' | 'very-high' {
  const wordCount = description.split(/\s+/).length;
  const lowerDesc = description.toLowerCase();

  // Check for complexity indicators
  const complexIndicators = [
    'complex', 'difficult', 'challenging', 'integration', 'migration',
    'refactor', 'architecture', 'scalability', 'performance'
  ];

  const hasComplexIndicators = complexIndicators.some(indicator => lowerDesc.includes(indicator));

  if (hasComplexIndicators || wordCount > 200) return 'very-high';
  if (wordCount > 100) return 'high';
  if (wordCount > 30) return 'medium';
  return 'low';
}
