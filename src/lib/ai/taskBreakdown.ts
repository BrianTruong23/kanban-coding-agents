import { BreakdownResult } from '@/types/breakdown';

const BREAKDOWN_PROMPT = `You are an expert project manager and software architect. Analyze the following input and break it down into a comprehensive project structure.

Your response must be a valid JSON object with this exact structure:
{
  "epic": {
    "title": "Brief epic title (max 100 chars)",
    "description": "Detailed epic description",
    "priority": 1-5 (1=low, 5=critical)
  },
  "tasks": [
    {
      "title": "Task title",
      "description": "Task description with acceptance criteria",
      "priority": 1-5,
      "tags": ["tag1", "tag2"],
      "estimatedHours": number or null,
      "requiredSkills": ["skill1", "skill2"],
      "subtasks": [
        {
          "title": "Subtask title",
          "description": "What needs to be done",
          "definitionOfDone": "Clear completion criteria",
          "testNotes": "How to test/verify",
          "riskLevel": "low" | "medium" | "high" | "critical",
          "estimatedHours": number or null,
          "requiredSkills": ["skill1"]
        }
      ]
    }
  ],
  "dependencies": [
    {
      "taskIndex": 1,
      "dependsOnTaskIndex": 0,
      "type": "finish_to_start"
    }
  ]
}

Guidelines:
1. Break down into 2-8 meaningful tasks
2. Each task should have 2-6 subtasks
3. Include clear Definition of Done (DoD) for each subtask
4. Add test notes explaining how to verify completion
5. Assign realistic risk levels based on complexity and uncertainty
6. Identify task dependencies (which tasks must be completed before others)
7. Extract required skills for proper agent assignment
8. Estimate hours if possible based on complexity
9. Use appropriate tags (frontend, backend, database, api, testing, etc.)

Risk level criteria:
- low: Well-understood, simple changes
- medium: Moderate complexity, some unknowns
- high: Complex, significant technical challenges
- critical: High risk, requires careful planning and testing

Input to analyze:
`;

export async function breakdownTaskWithAI(
  input: string,
  type: 'prd' | 'issue' | 'screenshot'
): Promise<BreakdownResult> {
  // Check if we have an API key configured
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Return a mock breakdown for development/testing
    return generateMockBreakdown(input, type);
  }

  try {
    // Use Anthropic Claude API if available
    if (process.env.ANTHROPIC_API_KEY) {
      return await breakdownWithClaude(input, type);
    }

    // Fallback to OpenAI if available
    if (process.env.OPENAI_API_KEY) {
      return await breakdownWithOpenAI(input, type);
    }

    // If no API keys, use mock
    return generateMockBreakdown(input, type);
  } catch (error) {
    console.error('AI breakdown failed:', error);
    throw new Error(`Failed to break down task: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function breakdownWithClaude(input: string, type: string): Promise<BreakdownResult> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${BREAKDOWN_PROMPT}\n\nType: ${type}\nContent:\n${input}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.content[0].text;

  // Extract JSON from markdown code blocks if present
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : content;

  return JSON.parse(jsonStr);
}

async function breakdownWithOpenAI(input: string, type: string): Promise<BreakdownResult> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert project manager. Always respond with valid JSON only, no markdown formatting.',
        },
        {
          role: 'user',
          content: `${BREAKDOWN_PROMPT}\n\nType: ${type}\nContent:\n${input}`,
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

function generateMockBreakdown(input: string, type: string): BreakdownResult {
  // Generate a realistic mock breakdown for testing
  const inputPreview = input.substring(0, 50);

  return {
    epic: {
      title: `Implement: ${inputPreview}...`,
      description: `This epic covers the implementation of the feature described in the ${type}. It includes all necessary development, testing, and documentation work.`,
      priority: 3,
    },
    tasks: [
      {
        title: 'Design and Architecture',
        description: 'Create technical design and architecture for the feature. Define data models, API contracts, and component structure.',
        priority: 5,
        tags: ['architecture', 'planning'],
        estimatedHours: 8,
        requiredSkills: ['system-design', 'architecture'],
        subtasks: [
          {
            title: 'Define data models and database schema',
            description: 'Create database tables, relationships, and migrations',
            definitionOfDone: 'Schema designed, reviewed, and documented',
            testNotes: 'Review schema with team, ensure all relationships are correct',
            riskLevel: 'medium',
            estimatedHours: 3,
            requiredSkills: ['database', 'sql'],
          },
          {
            title: 'Design API endpoints',
            description: 'Define REST/GraphQL endpoints, request/response formats',
            definitionOfDone: 'API spec documented in OpenAPI/GraphQL schema',
            testNotes: 'Validate against requirements, ensure RESTful principles',
            riskLevel: 'low',
            estimatedHours: 2,
            requiredSkills: ['api-design', 'backend'],
          },
          {
            title: 'Create component hierarchy and state management plan',
            description: 'Design React component structure and data flow',
            definitionOfDone: 'Component tree documented, state management approach defined',
            testNotes: 'Review for reusability and performance considerations',
            riskLevel: 'medium',
            estimatedHours: 3,
            requiredSkills: ['react', 'frontend', 'state-management'],
          },
        ],
      },
      {
        title: 'Backend Implementation',
        description: 'Implement server-side logic, database operations, and API endpoints',
        priority: 4,
        tags: ['backend', 'api', 'database'],
        estimatedHours: 16,
        requiredSkills: ['backend', 'database', 'api'],
        subtasks: [
          {
            title: 'Implement database models and migrations',
            description: 'Create ORM models and run migrations',
            definitionOfDone: 'Models created, migrations run successfully, relationships tested',
            testNotes: 'Test CRUD operations, verify constraints and indexes',
            riskLevel: 'low',
            estimatedHours: 4,
            requiredSkills: ['database', 'orm'],
          },
          {
            title: 'Develop API endpoints',
            description: 'Implement REST/GraphQL endpoints with validation and error handling',
            definitionOfDone: 'All endpoints implemented, validated, and return correct responses',
            testNotes: 'Test with Postman/Insomnia, verify error cases',
            riskLevel: 'medium',
            estimatedHours: 8,
            requiredSkills: ['backend', 'api'],
          },
          {
            title: 'Add authentication and authorization',
            description: 'Implement auth middleware and permissions',
            definitionOfDone: 'Auth working, unauthorized access blocked',
            testNotes: 'Test with valid/invalid tokens, verify permission levels',
            riskLevel: 'high',
            estimatedHours: 4,
            requiredSkills: ['security', 'authentication'],
          },
        ],
      },
      {
        title: 'Frontend Implementation',
        description: 'Build user interface components and integrate with backend',
        priority: 4,
        tags: ['frontend', 'react', 'ui'],
        estimatedHours: 20,
        requiredSkills: ['react', 'frontend', 'typescript'],
        subtasks: [
          {
            title: 'Create reusable UI components',
            description: 'Build base components following design system',
            definitionOfDone: 'Components built, styled, and documented',
            testNotes: 'Visual review, test different states and props',
            riskLevel: 'low',
            estimatedHours: 6,
            requiredSkills: ['react', 'css', 'typescript'],
          },
          {
            title: 'Implement state management',
            description: 'Set up context/redux and connect to API',
            definitionOfDone: 'State management working, data flows correctly',
            testNotes: 'Test loading, error, and success states',
            riskLevel: 'medium',
            estimatedHours: 6,
            requiredSkills: ['react', 'state-management'],
          },
          {
            title: 'Add form validation and error handling',
            description: 'Implement client-side validation and user feedback',
            definitionOfDone: 'All forms validated, errors displayed clearly',
            testNotes: 'Test edge cases, empty inputs, invalid data',
            riskLevel: 'low',
            estimatedHours: 4,
            requiredSkills: ['react', 'forms'],
          },
          {
            title: 'Implement responsive design',
            description: 'Ensure UI works on mobile, tablet, desktop',
            definitionOfDone: 'Responsive on all breakpoints, no overflow issues',
            testNotes: 'Test on different devices and screen sizes',
            riskLevel: 'medium',
            estimatedHours: 4,
            requiredSkills: ['css', 'responsive-design'],
          },
        ],
      },
      {
        title: 'Testing and Quality Assurance',
        description: 'Write tests and ensure quality standards are met',
        priority: 3,
        tags: ['testing', 'qa'],
        estimatedHours: 12,
        requiredSkills: ['testing', 'qa'],
        subtasks: [
          {
            title: 'Write unit tests for backend',
            description: 'Test business logic and API endpoints',
            definitionOfDone: 'Backend code coverage >80%, all tests passing',
            testNotes: 'Run test suite, check coverage report',
            riskLevel: 'low',
            estimatedHours: 4,
            requiredSkills: ['testing', 'backend'],
          },
          {
            title: 'Write unit tests for frontend',
            description: 'Test React components and hooks',
            definitionOfDone: 'Frontend code coverage >80%, all tests passing',
            testNotes: 'Run test suite, verify component behavior',
            riskLevel: 'low',
            estimatedHours: 4,
            requiredSkills: ['testing', 'react'],
          },
          {
            title: 'Perform integration testing',
            description: 'Test end-to-end user flows',
            definitionOfDone: 'Critical user paths tested and working',
            testNotes: 'Run E2E tests, manual testing of key flows',
            riskLevel: 'medium',
            estimatedHours: 4,
            requiredSkills: ['testing', 'e2e'],
          },
        ],
      },
      {
        title: 'Documentation and Deployment',
        description: 'Document the feature and deploy to production',
        priority: 2,
        tags: ['documentation', 'deployment'],
        estimatedHours: 6,
        requiredSkills: ['documentation', 'devops'],
        subtasks: [
          {
            title: 'Write technical documentation',
            description: 'Document API, components, and architecture',
            definitionOfDone: 'README updated, API documented, inline comments added',
            testNotes: 'Review docs for completeness and clarity',
            riskLevel: 'low',
            estimatedHours: 3,
            requiredSkills: ['documentation'],
          },
          {
            title: 'Deploy to staging',
            description: 'Deploy and verify in staging environment',
            definitionOfDone: 'Deployed to staging, smoke tests pass',
            testNotes: 'Test in staging, verify all features work',
            riskLevel: 'medium',
            estimatedHours: 2,
            requiredSkills: ['devops', 'deployment'],
          },
          {
            title: 'Deploy to production',
            description: 'Production deployment with monitoring',
            definitionOfDone: 'Deployed to production, monitoring active, no critical errors',
            testNotes: 'Monitor logs and metrics, verify user experience',
            riskLevel: 'high',
            estimatedHours: 1,
            requiredSkills: ['devops', 'monitoring'],
          },
        ],
      },
    ],
    dependencies: [
      {
        taskIndex: 1,
        dependsOnTaskIndex: 0,
        type: 'finish_to_start',
      },
      {
        taskIndex: 2,
        dependsOnTaskIndex: 0,
        type: 'finish_to_start',
      },
      {
        taskIndex: 2,
        dependsOnTaskIndex: 1,
        type: 'start_to_start',
      },
      {
        taskIndex: 3,
        dependsOnTaskIndex: 1,
        type: 'finish_to_start',
      },
      {
        taskIndex: 3,
        dependsOnTaskIndex: 2,
        type: 'finish_to_start',
      },
      {
        taskIndex: 4,
        dependsOnTaskIndex: 3,
        type: 'finish_to_start',
      },
    ],
  };
}
