import { Task, TaskInput, TaskBreakdown, TaskDependency } from '@/types/task';
import { generateId, generateTaskId } from '@/lib/utils';

/**
 * AI Task Breakdown Service
 *
 * This service uses AI to break down high-level requirements (issues, PRDs, screenshots)
 * into structured epics, tickets, and subtasks with DoD, test notes, and risk assessments.
 *
 * Note: This is a simulated implementation. For production, integrate with:
 * - OpenAI API (GPT-4)
 * - Anthropic API (Claude)
 * - Or other LLM providers
 */

interface BreakdownPromptData {
  title: string;
  description: string;
  type: 'issue' | 'prd' | 'screenshot';
  content?: string;
}

/**
 * Generate a detailed system prompt for the AI to break down tasks
 */
function generateBreakdownPrompt(data: BreakdownPromptData): string {
  return `You are an expert project manager and software architect. Break down the following ${data.type} into a structured task hierarchy.

Title: ${data.title}
Description: ${data.description}
${data.content ? `\nAdditional Context:\n${data.content}` : ''}

Please provide a breakdown with:

1. ONE Epic (high-level feature/requirement)
   - Title (concise, action-oriented)
   - Description (overview of the epic)
   - Estimated hours for the entire epic
   - Risk level (low/medium/high/critical) with risk notes
   - Definition of Done (3-5 completion criteria)

2. Multiple Tickets (2-5 major implementation units)
   - Each ticket should be independently deliverable
   - Include title, description, estimated hours
   - Assign risk level and notes if applicable
   - Provide Definition of Done (2-4 criteria per ticket)
   - Test notes (how to verify the ticket works)

3. Subtasks for each Ticket (2-4 subtasks per ticket)
   - Concrete, actionable items
   - Estimated hours (0.5 - 8 hours per subtask)
   - Brief description of what needs to be done

4. Dependencies between tasks
   - Identify which tasks block others
   - Mark related tasks that should be done together

Respond in JSON format following this structure:
{
  "epic": {
    "title": "string",
    "description": "string",
    "estimatedHours": number,
    "riskLevel": "low" | "medium" | "high" | "critical",
    "riskNotes": "string",
    "definitionOfDone": ["criterion1", "criterion2", ...]
  },
  "tickets": [
    {
      "title": "string",
      "description": "string",
      "estimatedHours": number,
      "riskLevel": "low" | "medium" | "high" | "critical",
      "riskNotes": "string",
      "definitionOfDone": ["criterion1", "criterion2", ...],
      "testNotes": "string",
      "priority": 1-5
    }
  ],
  "subtasks": {
    "ticket0": [
      {
        "title": "string",
        "description": "string",
        "estimatedHours": number
      }
    ],
    "ticket1": [...]
  },
  "dependencies": [
    {
      "fromTaskIndex": number,
      "toTaskIndex": number,
      "type": "blocks" | "related"
    }
  ]
}`;
}

/**
 * Simulate AI-generated task breakdown
 * In production, this would call an actual LLM API
 */
async function simulateAIBreakdown(prompt: string, data: BreakdownPromptData): Promise<any> {
  // Simulated AI response based on common patterns
  // In production, replace with actual API call to OpenAI/Anthropic

  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

  // Generate contextual breakdown based on input
  const isFeature = data.description.toLowerCase().includes('feature') ||
                    data.description.toLowerCase().includes('implement') ||
                    data.description.toLowerCase().includes('add');

  const isBugFix = data.description.toLowerCase().includes('bug') ||
                   data.description.toLowerCase().includes('fix') ||
                   data.description.toLowerCase().includes('issue');

  if (isBugFix) {
    return {
      epic: {
        title: `Fix: ${data.title}`,
        description: `Resolve the issue: ${data.description}`,
        estimatedHours: 8,
        riskLevel: 'medium',
        riskNotes: 'Bug fixes may have unexpected side effects. Thorough testing required.',
        definitionOfDone: [
          'Bug is reproducible and root cause identified',
          'Fix implemented and tested',
          'Regression tests added',
          'Code reviewed and merged'
        ]
      },
      tickets: [
        {
          title: 'Investigate and reproduce the issue',
          description: 'Set up environment to reproduce the bug and identify root cause',
          estimatedHours: 2,
          riskLevel: 'low',
          riskNotes: '',
          definitionOfDone: [
            'Issue is consistently reproducible',
            'Root cause documented'
          ],
          testNotes: 'Verify the issue can be reproduced in development environment',
          priority: 5
        },
        {
          title: 'Implement fix',
          description: 'Apply the necessary code changes to resolve the issue',
          estimatedHours: 4,
          riskLevel: 'medium',
          riskNotes: 'Changes may affect other parts of the system',
          definitionOfDone: [
            'Code changes implemented',
            'Unit tests pass',
            'Manual testing confirms fix'
          ],
          testNotes: 'Test both the specific issue and related functionality',
          priority: 5
        },
        {
          title: 'Add regression tests and documentation',
          description: 'Ensure the bug does not reoccur and document the fix',
          estimatedHours: 2,
          riskLevel: 'low',
          riskNotes: '',
          definitionOfDone: [
            'Automated tests added',
            'Documentation updated'
          ],
          testNotes: 'Run full test suite',
          priority: 3
        }
      ],
      subtasks: {
        ticket0: [
          { title: 'Set up debugging environment', description: 'Configure development setup', estimatedHours: 0.5 },
          { title: 'Reproduce bug with minimal test case', description: 'Create minimal reproduction', estimatedHours: 1 },
          { title: 'Analyze code and identify root cause', description: 'Debug and trace issue', estimatedHours: 0.5 }
        ],
        ticket1: [
          { title: 'Write failing test case', description: 'TDD approach - test first', estimatedHours: 1 },
          { title: 'Implement code fix', description: 'Apply the solution', estimatedHours: 2 },
          { title: 'Verify fix and edge cases', description: 'Test thoroughly', estimatedHours: 1 }
        ],
        ticket2: [
          { title: 'Write regression tests', description: 'Add automated tests', estimatedHours: 1 },
          { title: 'Update documentation', description: 'Document the fix', estimatedHours: 0.5 },
          { title: 'Code review and cleanup', description: 'Final review', estimatedHours: 0.5 }
        ]
      },
      dependencies: [
        { fromTaskIndex: 0, toTaskIndex: 1, type: 'blocks' },
        { fromTaskIndex: 1, toTaskIndex: 2, type: 'blocks' }
      ]
    };
  }

  // Default feature breakdown
  return {
    epic: {
      title: data.title,
      description: data.description,
      estimatedHours: 40,
      riskLevel: 'medium',
      riskNotes: 'New feature requires careful integration with existing system',
      definitionOfDone: [
        'All user stories implemented',
        'Unit and integration tests passing',
        'UI/UX reviewed and approved',
        'Documentation completed',
        'Performance requirements met'
      ]
    },
    tickets: [
      {
        title: 'Design and Architecture',
        description: 'Design the system architecture and data models',
        estimatedHours: 8,
        riskLevel: 'high',
        riskNotes: 'Architecture decisions impact entire implementation',
        definitionOfDone: [
          'Architecture diagram created',
          'Database schema designed',
          'API contracts defined',
          'Design reviewed by team'
        ],
        testNotes: 'Review design with stakeholders and technical team',
        priority: 5
      },
      {
        title: 'Backend Implementation',
        description: 'Implement server-side logic and APIs',
        estimatedHours: 16,
        riskLevel: 'medium',
        riskNotes: 'Database migrations need careful handling',
        definitionOfDone: [
          'API endpoints implemented',
          'Database schema applied',
          'Business logic tested',
          'API documentation complete'
        ],
        testNotes: 'Test all API endpoints with various inputs and edge cases',
        priority: 4
      },
      {
        title: 'Frontend Implementation',
        description: 'Build user interface components and integrate with backend',
        estimatedHours: 12,
        riskLevel: 'low',
        riskNotes: '',
        definitionOfDone: [
          'UI components implemented',
          'API integration complete',
          'Responsive design verified',
          'Accessibility standards met'
        ],
        testNotes: 'Test on multiple browsers and screen sizes',
        priority: 4
      },
      {
        title: 'Testing and Polish',
        description: 'Comprehensive testing, bug fixes, and performance optimization',
        estimatedHours: 4,
        riskLevel: 'low',
        riskNotes: '',
        definitionOfDone: [
          'All tests passing',
          'Performance benchmarks met',
          'Bug fixes completed',
          'User acceptance testing done'
        ],
        testNotes: 'End-to-end testing with real user scenarios',
        priority: 3
      }
    ],
    subtasks: {
      ticket0: [
        { title: 'Create architecture diagram', description: 'Design system components', estimatedHours: 2 },
        { title: 'Define data models', description: 'Design database schema', estimatedHours: 3 },
        { title: 'Write API specifications', description: 'Document API contracts', estimatedHours: 2 },
        { title: 'Review and iterate', description: 'Team review session', estimatedHours: 1 }
      ],
      ticket1: [
        { title: 'Set up database migrations', description: 'Create migration scripts', estimatedHours: 2 },
        { title: 'Implement data access layer', description: 'Build repository pattern', estimatedHours: 4 },
        { title: 'Create API endpoints', description: 'REST/GraphQL implementation', estimatedHours: 6 },
        { title: 'Write unit and integration tests', description: 'Test coverage', estimatedHours: 4 }
      ],
      ticket2: [
        { title: 'Create reusable UI components', description: 'Build component library', estimatedHours: 4 },
        { title: 'Implement feature pages', description: 'Build main UI', estimatedHours: 4 },
        { title: 'Integrate with API', description: 'Connect frontend to backend', estimatedHours: 2 },
        { title: 'Add loading and error states', description: 'Handle edge cases', estimatedHours: 2 }
      ],
      ticket3: [
        { title: 'Write E2E tests', description: 'Test user workflows', estimatedHours: 2 },
        { title: 'Performance optimization', description: 'Profile and optimize', estimatedHours: 1 },
        { title: 'Fix identified bugs', description: 'Bug fixing', estimatedHours: 1 }
      ]
    },
    dependencies: [
      { fromTaskIndex: 0, toTaskIndex: 1, type: 'blocks' },
      { fromTaskIndex: 0, toTaskIndex: 2, type: 'blocks' },
      { fromTaskIndex: 1, toTaskIndex: 3, type: 'blocks' },
      { fromTaskIndex: 2, toTaskIndex: 3, type: 'blocks' }
    ]
  };
}

/**
 * Main function to break down a task input into structured breakdown
 */
export async function breakdownTask(input: TaskInput, userId: string): Promise<TaskBreakdown> {
  const now = Date.now();

  const promptData: BreakdownPromptData = {
    title: input.title,
    description: input.description || '',
    type: input.type || 'issue',
    content: input.content
  };

  const prompt = generateBreakdownPrompt(promptData);
  const aiResponse = await simulateAIBreakdown(prompt, promptData);

  // Create the epic
  const epicId = generateId();
  const epic: Task = {
    id: epicId,
    taskId: generateTaskId(),
    title: aiResponse.epic.title,
    description: aiResponse.epic.description,
    status: 'backlog',
    priority: 5,
    tags: ['epic', 'ai-generated'],
    taskType: 'epic',
    definitionOfDone: aiResponse.epic.definitionOfDone,
    riskLevel: aiResponse.epic.riskLevel,
    riskNotes: aiResponse.epic.riskNotes,
    estimatedHours: aiResponse.epic.estimatedHours,
    aiGenerated: true,
    createdAt: now,
    updatedAt: now
  };

  // Create tickets
  const tickets: Task[] = aiResponse.tickets.map((ticketData: any, index: number) => {
    const ticketId = generateId();
    return {
      id: ticketId,
      taskId: generateTaskId(),
      title: ticketData.title,
      description: ticketData.description,
      status: 'backlog',
      priority: ticketData.priority || 3,
      tags: ['ticket', 'ai-generated'],
      taskType: 'ticket',
      parentTaskId: epicId,
      definitionOfDone: ticketData.definitionOfDone,
      testNotes: ticketData.testNotes,
      riskLevel: ticketData.riskLevel,
      riskNotes: ticketData.riskNotes,
      estimatedHours: ticketData.estimatedHours,
      aiGenerated: true,
      createdAt: now + index + 1,
      updatedAt: now + index + 1
    };
  });

  // Create subtasks
  const subtasks: Task[] = [];
  Object.entries(aiResponse.subtasks).forEach(([ticketKey, subtaskList]: [string, any]) => {
    const ticketIndex = parseInt(ticketKey.replace('ticket', ''));
    const parentTicket = tickets[ticketIndex];

    if (parentTicket) {
      (subtaskList as any[]).forEach((subtaskData, subIndex) => {
        subtasks.push({
          id: generateId(),
          taskId: generateTaskId(),
          title: subtaskData.title,
          description: subtaskData.description,
          status: 'backlog',
          priority: 3,
          tags: ['subtask', 'ai-generated'],
          taskType: 'subtask',
          parentTaskId: parentTicket.id,
          estimatedHours: subtaskData.estimatedHours,
          aiGenerated: true,
          createdAt: now + ticketIndex * 100 + subIndex + 1,
          updatedAt: now + ticketIndex * 100 + subIndex + 1
        });
      });
    }
  });

  // Create dependencies
  const dependencies: TaskDependency[] = aiResponse.dependencies.map((dep: any, index: number) => {
    const fromTask = tickets[dep.fromTaskIndex];
    const toTask = tickets[dep.toTaskIndex];

    return {
      id: generateId(),
      taskId: toTask.id,
      dependsOnTaskId: fromTask.id,
      dependencyType: dep.type === 'blocks' ? 'blocked_by' : 'related',
      createdAt: now + index
    };
  });

  return {
    epic,
    tickets,
    subtasks,
    dependencies
  };
}

/**
 * Calculate recommended agent for a task based on skills and performance
 */
export function calculateRecommendedAgent(
  task: Task,
  agents: any[],
  agentSkills: Map<string, any[]>,
  agentPerformance: Map<string, any>
): string | null {
  if (!agents || agents.length === 0) return null;

  // Extract required skills from task tags and description
  const requiredSkills = extractRequiredSkills(task);

  // Score each agent
  const agentScores = agents.map(agent => {
    let score = 0;
    const skills = agentSkills.get(agent.id) || [];
    const performance = agentPerformance.get(agent.id) || {
      averageQualityRating: 3,
      onTimePercentage: 0.5
    };

    // Skill matching (40% of score)
    requiredSkills.forEach(reqSkill => {
      const matchingSkill = skills.find((s: any) =>
        s.skillName.toLowerCase().includes(reqSkill.toLowerCase()) ||
        reqSkill.toLowerCase().includes(s.skillName.toLowerCase())
      );
      if (matchingSkill) {
        score += matchingSkill.proficiencyLevel * 4; // Max 40 points per skill
      }
    });

    // Performance history (30% of score)
    score += (performance.averageQualityRating / 5) * 30;

    // On-time delivery (30% of score)
    score += performance.onTimePercentage * 30;

    return { agent, score };
  });

  // Sort by score and return the best match
  agentScores.sort((a, b) => b.score - a.score);

  return agentScores[0]?.score > 0 ? agentScores[0].agent.id : null;
}

/**
 * Extract required skills from task metadata
 */
function extractRequiredSkills(task: Task): string[] {
  const skills: Set<string> = new Set();

  // From tags
  task.tags.forEach(tag => {
    const normalized = tag.toLowerCase();
    if (normalized.includes('react')) skills.add('React');
    if (normalized.includes('node')) skills.add('Node.js');
    if (normalized.includes('typescript') || normalized.includes('ts')) skills.add('TypeScript');
    if (normalized.includes('api')) skills.add('API Design');
    if (normalized.includes('database') || normalized.includes('sql')) skills.add('PostgreSQL');
    if (normalized.includes('ui') || normalized.includes('frontend')) skills.add('UI/UX');
    if (normalized.includes('backend')) skills.add('Node.js');
    if (normalized.includes('devops') || normalized.includes('ci/cd')) skills.add('CI/CD');
    if (normalized.includes('mobile')) skills.add('React Native');
    if (normalized.includes('test')) skills.add('Testing');
  });

  // From task type
  if (task.taskType === 'epic') skills.add('Problem Solving');

  // From description (simple keyword matching)
  const desc = (task.description || '').toLowerCase();
  if (desc.includes('component') || desc.includes('ui')) skills.add('React');
  if (desc.includes('endpoint') || desc.includes('api')) skills.add('API Design');
  if (desc.includes('database') || desc.includes('schema')) skills.add('Database Design');
  if (desc.includes('deploy') || desc.includes('docker')) skills.add('Docker');

  return Array.from(skills);
}
