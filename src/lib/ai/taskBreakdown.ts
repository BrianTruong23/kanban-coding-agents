/**
 * Task Breakdown AI Service
 *
 * This service uses AI to break down high-level requirements into structured tasks.
 * It can process:
 * - GitHub issues
 * - Product Requirements Documents (PRDs)
 * - Screenshots (via vision API)
 * - Plain text descriptions
 */

import { TaskBreakdownItem, RiskFlag, TaskType } from '@/types/task';

export interface BreakdownInput {
  type: 'issue' | 'prd' | 'screenshot' | 'text';
  content: string;
  metadata?: {
    issueNumber?: string;
    repository?: string;
    imageUrl?: string;
    [key: string]: unknown;
  };
}

export interface BreakdownResult {
  epics: TaskBreakdownItem[];
  summary: string;
  totalEstimatedHours: number;
}

/**
 * System prompt for the AI task breakdown
 */
const TASK_BREAKDOWN_SYSTEM_PROMPT = `You are an expert software project manager and technical lead. Your role is to break down complex requirements into well-structured, actionable tasks.

When given a requirement (issue, PRD, screenshot, or description), analyze it and create a hierarchical breakdown:

1. **Epics**: High-level features or themes (3-20 hours each)
2. **Tickets**: Specific features or user stories (1-8 hours each)
3. **Subtasks**: Granular implementation steps (0.5-3 hours each)

For each task, provide:
- Clear, actionable title
- Detailed description
- Priority (1-5, where 1 is highest)
- Time estimate in hours
- Definition of Done (acceptance criteria as array of strings)
- Test notes (what to test and how)
- Risk flags (technical, timeline, dependency, resource risks with severity)
- Relevant tags (e.g., frontend, backend, database, api, testing)
- Dependencies (which other tasks must be completed first)

Guidelines:
- Be specific and actionable
- Consider technical complexity
- Identify dependencies early
- Flag potential risks
- Include testing requirements
- Break down large tasks into smaller ones
- Prioritize based on dependencies and business value

Return response as JSON matching this structure:
{
  "summary": "Brief overview of the breakdown",
  "totalEstimatedHours": 0,
  "epics": [
    {
      "type": "epic",
      "title": "Epic title",
      "description": "Detailed description",
      "priority": 1,
      "estimatedHours": 15,
      "definitionOfDone": ["criterion 1", "criterion 2"],
      "testNotes": "Testing approach",
      "riskFlags": [
        {
          "type": "technical|timeline|dependency|resource|unknown",
          "severity": "low|medium|high|critical",
          "description": "Risk description"
        }
      ],
      "tags": ["tag1", "tag2"],
      "dependencies": [],
      "children": [
        {
          "type": "ticket",
          "title": "Ticket title",
          "description": "Detailed description",
          "priority": 2,
          "estimatedHours": 5,
          "definitionOfDone": ["criterion 1"],
          "testNotes": "Testing approach",
          "riskFlags": [],
          "tags": ["tag1"],
          "dependencies": [],
          "children": [
            {
              "type": "subtask",
              "title": "Subtask title",
              "description": "Implementation details",
              "priority": 2,
              "estimatedHours": 2,
              "definitionOfDone": ["criterion 1"],
              "testNotes": "Testing steps",
              "riskFlags": [],
              "tags": ["tag1"],
              "dependencies": []
            }
          ]
        }
      ]
    }
  ]
}`;

/**
 * Generate a task breakdown using AI
 *
 * Note: This is a mock implementation. In production, you would:
 * 1. Use OpenAI API (gpt-4-turbo or gpt-4o for vision)
 * 2. Use Anthropic Claude API (claude-3-opus or claude-3-sonnet)
 * 3. Configure API keys via environment variables
 */
export async function generateTaskBreakdown(
  input: BreakdownInput
): Promise<BreakdownResult> {
  // For now, return a structured mock response based on the input
  // In production, this would call an AI API

  const mockBreakdown: BreakdownResult = {
    summary: `Analyzed ${input.type} and created structured task breakdown`,
    totalEstimatedHours: 24,
    epics: [
      {
        type: 'epic' as TaskType,
        title: 'Implement Feature from Requirements',
        description: `This epic covers the implementation of the requirements specified in the ${input.type}.`,
        priority: 1,
        estimatedHours: 24,
        definitionOfDone: [
          'All tickets and subtasks completed',
          'Code reviewed and merged',
          'Tests passing',
          'Documentation updated'
        ],
        testNotes: 'Integration tests required for all components',
        riskFlags: [
          {
            type: 'timeline',
            severity: 'medium',
            description: 'Timeline may be affected by external dependencies'
          }
        ],
        tags: ['feature', 'backend', 'frontend'],
        dependencies: [],
        children: [
          {
            type: 'ticket' as TaskType,
            title: 'Backend API Implementation',
            description: 'Implement the necessary backend API endpoints',
            priority: 1,
            estimatedHours: 8,
            definitionOfDone: [
              'API endpoints created',
              'Validation implemented',
              'Error handling in place',
              'Unit tests written'
            ],
            testNotes: 'Test all endpoints with various input scenarios',
            riskFlags: [],
            tags: ['backend', 'api'],
            dependencies: [],
            children: [
              {
                type: 'subtask' as TaskType,
                title: 'Create database schema',
                description: 'Design and implement the database schema for new features',
                priority: 1,
                estimatedHours: 2,
                definitionOfDone: [
                  'Schema created',
                  'Migrations written',
                  'Indexes added'
                ],
                testNotes: 'Verify schema with test data',
                riskFlags: [],
                tags: ['database'],
                dependencies: []
              },
              {
                type: 'subtask' as TaskType,
                title: 'Implement API routes',
                description: 'Create the API route handlers',
                priority: 2,
                estimatedHours: 4,
                definitionOfDone: [
                  'Routes implemented',
                  'Request validation added',
                  'Response formatting standardized'
                ],
                testNotes: 'Test with Postman or similar tool',
                riskFlags: [],
                tags: ['api'],
                dependencies: ['Create database schema']
              },
              {
                type: 'subtask' as TaskType,
                title: 'Write API tests',
                description: 'Create comprehensive test suite for API',
                priority: 3,
                estimatedHours: 2,
                definitionOfDone: [
                  'Test coverage > 80%',
                  'Edge cases covered',
                  'All tests passing'
                ],
                testNotes: 'Use Jest or similar testing framework',
                riskFlags: [],
                tags: ['testing', 'api'],
                dependencies: ['Implement API routes']
              }
            ]
          },
          {
            type: 'ticket' as TaskType,
            title: 'Frontend UI Implementation',
            description: 'Build the user interface components',
            priority: 2,
            estimatedHours: 10,
            definitionOfDone: [
              'Components built',
              'Responsive design verified',
              'Accessibility standards met',
              'User testing completed'
            ],
            testNotes: 'Test on multiple devices and browsers',
            riskFlags: [
              {
                type: 'technical',
                severity: 'low',
                description: 'Complex state management may require refactoring'
              }
            ],
            tags: ['frontend', 'ui'],
            dependencies: ['Backend API Implementation'],
            children: [
              {
                type: 'subtask' as TaskType,
                title: 'Create UI components',
                description: 'Build reusable React components',
                priority: 2,
                estimatedHours: 5,
                definitionOfDone: [
                  'Components created',
                  'Props properly typed',
                  'Styling applied'
                ],
                testNotes: 'Visual regression testing',
                riskFlags: [],
                tags: ['frontend', 'react'],
                dependencies: []
              },
              {
                type: 'subtask' as TaskType,
                title: 'Integrate with API',
                description: 'Connect frontend to backend API',
                priority: 2,
                estimatedHours: 3,
                definitionOfDone: [
                  'API calls implemented',
                  'Loading states handled',
                  'Error handling in place'
                ],
                testNotes: 'Test with real API and mock data',
                riskFlags: [],
                tags: ['frontend', 'integration'],
                dependencies: ['Backend API Implementation']
              },
              {
                type: 'subtask' as TaskType,
                title: 'Add frontend tests',
                description: 'Write component and integration tests',
                priority: 3,
                estimatedHours: 2,
                definitionOfDone: [
                  'Component tests written',
                  'Integration tests added',
                  'Test coverage acceptable'
                ],
                testNotes: 'Use React Testing Library',
                riskFlags: [],
                tags: ['testing', 'frontend'],
                dependencies: ['Create UI components', 'Integrate with API']
              }
            ]
          },
          {
            type: 'ticket' as TaskType,
            title: 'Documentation and Deployment',
            description: 'Document the feature and prepare for deployment',
            priority: 3,
            estimatedHours: 6,
            definitionOfDone: [
              'README updated',
              'API documentation complete',
              'Deployment guide written',
              'Successfully deployed to staging'
            ],
            testNotes: 'Verify documentation accuracy',
            riskFlags: [],
            tags: ['documentation', 'deployment'],
            dependencies: ['Backend API Implementation', 'Frontend UI Implementation'],
            children: [
              {
                type: 'subtask' as TaskType,
                title: 'Write documentation',
                description: 'Create comprehensive documentation',
                priority: 3,
                estimatedHours: 3,
                definitionOfDone: [
                  'User guide written',
                  'API docs generated',
                  'Code comments added'
                ],
                testNotes: 'Review documentation for clarity',
                riskFlags: [],
                tags: ['documentation'],
                dependencies: []
              },
              {
                type: 'subtask' as TaskType,
                title: 'Deploy to staging',
                description: 'Deploy and verify in staging environment',
                priority: 3,
                estimatedHours: 3,
                definitionOfDone: [
                  'Deployed successfully',
                  'All tests passing',
                  'Performance verified'
                ],
                testNotes: 'End-to-end testing in staging',
                riskFlags: [
                  {
                    type: 'resource',
                    severity: 'low',
                    description: 'May need DevOps support for deployment issues'
                  }
                ],
                tags: ['deployment', 'devops'],
                dependencies: ['Write documentation']
              }
            ]
          }
        ]
      }
    ]
  };

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return mockBreakdown;
}

/**
 * In production, integrate with real AI APIs:
 *
 * // OpenAI example:
 * const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 * const response = await openai.chat.completions.create({
 *   model: "gpt-4-turbo",
 *   messages: [
 *     { role: "system", content: TASK_BREAKDOWN_SYSTEM_PROMPT },
 *     { role: "user", content: input.content }
 *   ],
 *   response_format: { type: "json_object" }
 * });
 *
 * // Anthropic Claude example:
 * const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
 * const message = await anthropic.messages.create({
 *   model: "claude-3-opus-20240229",
 *   max_tokens: 4096,
 *   system: TASK_BREAKDOWN_SYSTEM_PROMPT,
 *   messages: [{ role: "user", content: input.content }]
 * });
 */
