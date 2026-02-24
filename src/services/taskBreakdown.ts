import { TaskBreakdownInput, TaskBreakdownResult, RiskLevel, DependencyType } from '@/types/task';

/**
 * AI-powered task breakdown service
 *
 * This service analyzes issues, PRDs, or screenshots and breaks them down into:
 * - Epic (high-level feature)
 * - Tasks (implementation steps)
 * - Subtasks (granular work items)
 * - Dependencies (relationships between tasks)
 * - Risk assessment and DoD
 *
 * TODO: Integrate with actual AI model (OpenAI, Anthropic, etc.)
 * For now, this provides intelligent rule-based breakdown with patterns
 */

interface ParsedRequirement {
  features: string[];
  technicalDetails: string[];
  constraints: string[];
  acceptanceCriteria: string[];
}

/**
 * Parse the input text to extract key information
 */
function parseRequirements(input: TaskBreakdownInput): ParsedRequirement {
  const lines = input.description.split('\n').filter(line => line.trim());

  const features: string[] = [];
  const technicalDetails: string[] = [];
  const constraints: string[] = [];
  const acceptanceCriteria: string[] = [];

  let currentSection = 'features';

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Section detection
    if (lowerLine.includes('acceptance criteria') || lowerLine.includes('requirements')) {
      currentSection = 'criteria';
      continue;
    } else if (lowerLine.includes('technical') || lowerLine.includes('implementation')) {
      currentSection = 'technical';
      continue;
    } else if (lowerLine.includes('constraint') || lowerLine.includes('limitation')) {
      currentSection = 'constraints';
      continue;
    }

    // Add to appropriate section
    if (line.trim().startsWith('-') || line.trim().startsWith('*') || line.trim().match(/^\d+\./)) {
      const content = line.replace(/^[-*\d.]\s*/, '').trim();
      if (content) {
        switch (currentSection) {
          case 'criteria':
            acceptanceCriteria.push(content);
            break;
          case 'technical':
            technicalDetails.push(content);
            break;
          case 'constraints':
            constraints.push(content);
            break;
          default:
            features.push(content);
        }
      }
    } else if (line.trim()) {
      features.push(line.trim());
    }
  }

  return { features, technicalDetails, constraints, acceptanceCriteria };
}

/**
 * Determine risk level based on content analysis
 */
function assessRisk(text: string, hasMultipleFeatures: boolean): RiskLevel {
  const riskKeywords = {
    critical: ['security', 'authentication', 'payment', 'data loss', 'migration', 'breaking change'],
    high: ['database', 'api', 'integration', 'third-party', 'performance', 'scale'],
    medium: ['ui', 'frontend', 'styling', 'validation', 'testing'],
    low: ['documentation', 'comment', 'typo', 'refactor', 'cleanup']
  };

  const lowerText = text.toLowerCase();

  for (const keyword of riskKeywords.critical) {
    if (lowerText.includes(keyword)) return 'critical';
  }

  for (const keyword of riskKeywords.high) {
    if (lowerText.includes(keyword)) return 'high';
  }

  for (const keyword of riskKeywords.medium) {
    if (lowerText.includes(keyword)) return 'medium';
  }

  return hasMultipleFeatures ? 'medium' : 'low';
}

/**
 * Extract suggested skills from task description
 */
function extractSuggestedSkills(text: string): string[] {
  const skillKeywords = {
    'React': ['react', 'jsx', 'component', 'hooks', 'frontend', 'ui'],
    'TypeScript': ['typescript', 'type', 'interface', 'ts'],
    'Node.js': ['node', 'express', 'api', 'backend', 'server'],
    'Database': ['database', 'sql', 'postgres', 'supabase', 'query'],
    'CSS': ['css', 'styling', 'tailwind', 'design', 'layout'],
    'Testing': ['test', 'jest', 'unit test', 'integration test'],
    'DevOps': ['deploy', 'ci/cd', 'docker', 'infrastructure'],
    'Authentication': ['auth', 'login', 'jwt', 'session'],
    'API': ['api', 'endpoint', 'rest', 'graphql'],
    'Performance': ['performance', 'optimization', 'cache', 'lazy load']
  };

  const lowerText = text.toLowerCase();
  const skills: string[] = [];

  for (const [skill, keywords] of Object.entries(skillKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      skills.push(skill);
    }
  }

  return skills;
}

/**
 * Estimate hours based on complexity
 */
function estimateHours(text: string, complexity: 'low' | 'medium' | 'high'): number {
  const baseHours = {
    low: 2,
    medium: 8,
    high: 16
  };

  let hours = baseHours[complexity];

  // Adjust based on keywords
  const lowerText = text.toLowerCase();
  if (lowerText.includes('complex') || lowerText.includes('advanced')) hours *= 1.5;
  if (lowerText.includes('simple') || lowerText.includes('basic')) hours *= 0.75;
  if (lowerText.includes('research') || lowerText.includes('investigation')) hours += 4;

  return Math.round(hours);
}

/**
 * Break down a task into subtasks
 */
function generateSubtasks(taskTitle: string, taskDescription: string) {
  const subtasks = [];

  // Common subtask patterns based on task type
  const lowerTitle = taskTitle.toLowerCase();
  const lowerDesc = taskDescription.toLowerCase();

  // Feature implementation pattern
  if (lowerTitle.includes('implement') || lowerTitle.includes('add') || lowerTitle.includes('create')) {
    subtasks.push({
      title: 'Design component/module structure',
      description: 'Plan the architecture and interfaces',
      estimatedHours: 2
    });
    subtasks.push({
      title: 'Implement core functionality',
      description: 'Write the main business logic',
      estimatedHours: 4
    });
    subtasks.push({
      title: 'Add error handling and validation',
      description: 'Ensure robust error handling',
      estimatedHours: 2
    });
    if (lowerDesc.includes('ui') || lowerDesc.includes('frontend')) {
      subtasks.push({
        title: 'Style and polish UI',
        description: 'Apply styling and ensure responsive design',
        estimatedHours: 2
      });
    }
    subtasks.push({
      title: 'Write tests',
      description: 'Add unit and integration tests',
      estimatedHours: 3
    });
  }

  // API/Backend pattern
  if (lowerDesc.includes('api') || lowerDesc.includes('endpoint') || lowerDesc.includes('backend')) {
    subtasks.push({
      title: 'Define API contract',
      description: 'Specify request/response structure',
      estimatedHours: 1
    });
    subtasks.push({
      title: 'Implement database changes',
      description: 'Update schema and migrations',
      estimatedHours: 2
    });
    subtasks.push({
      title: 'Implement endpoint logic',
      description: 'Create API handlers and business logic',
      estimatedHours: 4
    });
    subtasks.push({
      title: 'Test API endpoints',
      description: 'Write integration tests for API',
      estimatedHours: 2
    });
  }

  // Bug fix pattern
  if (lowerTitle.includes('fix') || lowerTitle.includes('bug')) {
    subtasks.push({
      title: 'Reproduce and debug issue',
      description: 'Identify root cause of the bug',
      estimatedHours: 2
    });
    subtasks.push({
      title: 'Implement fix',
      description: 'Write code to resolve the issue',
      estimatedHours: 2
    });
    subtasks.push({
      title: 'Add regression tests',
      description: 'Ensure bug does not reoccur',
      estimatedHours: 2
    });
  }

  return subtasks;
}

/**
 * Main function to break down a requirement into epics, tasks, and subtasks
 */
export async function breakdownTask(input: TaskBreakdownInput): Promise<TaskBreakdownResult> {
  const parsed = parseRequirements(input);
  const allText = `${input.title} ${input.description}`;

  // Determine if this is a large feature (epic-worthy)
  const isLargeFeature = parsed.features.length > 3 ||
                         parsed.technicalDetails.length > 2 ||
                         input.description.length > 500;

  // Create epic
  const epicRisk = assessRisk(allText, true);
  const epic = {
    title: input.title,
    description: input.description,
    estimatedHours: estimateHours(allText, isLargeFeature ? 'high' : 'medium'),
    riskLevel: epicRisk
  };

  // Generate tasks from features
  const tasks: TaskBreakdownResult['tasks'] = [];
  const dependencies: TaskBreakdownResult['dependencies'] = [];

  // If we have explicit features, create tasks for each
  if (parsed.features.length > 0) {
    parsed.features.forEach((feature, index) => {
      const taskText = `${feature} ${parsed.technicalDetails[index] || ''}`;
      const riskLevel = assessRisk(taskText, false);
      const suggestedSkills = extractSuggestedSkills(taskText);

      // Determine priority based on risk and position
      let priority: 1 | 2 | 3 | 4 | 5 = 3;
      if (riskLevel === 'critical') priority = 5;
      else if (riskLevel === 'high') priority = 4;
      else if (index === 0) priority = 4; // First task is usually important
      else if (riskLevel === 'low') priority = 2;

      const task = {
        title: feature.length > 80 ? feature.substring(0, 77) + '...' : feature,
        description: parsed.technicalDetails[index] || feature,
        definitionOfDone: parsed.acceptanceCriteria[index] || `${feature} is fully implemented and tested`,
        testNotes: `Verify: ${feature.toLowerCase()}`,
        estimatedHours: estimateHours(taskText, riskLevel === 'critical' ? 'high' : riskLevel === 'low' ? 'low' : 'medium'),
        riskLevel,
        priority,
        tags: suggestedSkills.map(s => s.toLowerCase()),
        suggestedSkills,
        subtasks: generateSubtasks(feature, taskText)
      };

      tasks.push(task);

      // Add dependencies for sequential features
      if (index > 0 && (feature.toLowerCase().includes('after') ||
                        feature.toLowerCase().includes('then') ||
                        riskLevel === 'critical')) {
        dependencies.push({
          fromTaskIndex: index,
          toTaskIndex: index - 1,
          type: 'blocked_by' as DependencyType
        });
      }
    });
  } else {
    // No explicit features - create a single comprehensive task
    const suggestedSkills = extractSuggestedSkills(allText);
    const riskLevel = assessRisk(allText, false);

    tasks.push({
      title: input.title,
      description: input.description,
      definitionOfDone: parsed.acceptanceCriteria.join('; ') || 'Feature is fully implemented and tested',
      testNotes: 'Verify all functionality works as expected',
      estimatedHours: estimateHours(allText, 'medium'),
      riskLevel,
      priority: riskLevel === 'critical' ? 5 : riskLevel === 'high' ? 4 : 3,
      tags: suggestedSkills.map(s => s.toLowerCase()),
      suggestedSkills,
      subtasks: generateSubtasks(input.title, input.description)
    });
  }

  // Detect implicit dependencies (e.g., database before API, API before UI)
  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const task1 = tasks[i];
      const task2 = tasks[j];

      const task1Text = `${task1.title} ${task1.description}`.toLowerCase();
      const task2Text = `${task2.title} ${task2.description}`.toLowerCase();

      // Database changes should come before API
      if (task1Text.includes('database') && task2Text.includes('api')) {
        dependencies.push({
          fromTaskIndex: j,
          toTaskIndex: i,
          type: 'blocked_by'
        });
      }

      // API should come before UI
      if (task1Text.includes('api') && (task2Text.includes('ui') || task2Text.includes('frontend'))) {
        dependencies.push({
          fromTaskIndex: j,
          toTaskIndex: i,
          type: 'blocked_by'
        });
      }

      // Authentication should come early
      if (task1Text.includes('auth') && !task2Text.includes('auth')) {
        dependencies.push({
          fromTaskIndex: j,
          toTaskIndex: i,
          type: 'blocked_by'
        });
      }
    }
  }

  return {
    epic,
    tasks,
    dependencies
  };
}

/**
 * Analyze screenshot for task breakdown
 * TODO: Implement actual image analysis with AI vision model
 */
export async function analyzeScreenshot(imageUrl: string): Promise<string> {
  // Placeholder for future AI vision integration
  // This would use GPT-4 Vision, Claude with vision, or similar
  return `Screenshot analysis not yet implemented. Please provide text description.

  Future capabilities:
  - Detect UI components and layouts
  - Identify missing features
  - Suggest implementation tasks
  - Estimate complexity from visual design`;
}
