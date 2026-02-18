import { BreakdownInput, BreakdownResult } from '@/types/breakdown';

const ANTHROPIC_API_KEY = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;

/**
 * Break down a high-level input (issue, PRD, screenshot) into structured tasks
 */
export async function breakdownTask(input: BreakdownInput): Promise<BreakdownResult> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured. Please set ANTHROPIC_API_KEY environment variable.');
  }

  const prompt = createBreakdownPrompt(input);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Parse the JSON response
    const result = parseBreakdownResponse(content);
    return result;
  } catch (error) {
    console.error('Task breakdown error:', error);
    throw new Error(`Failed to breakdown task: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a detailed prompt for task breakdown
 */
function createBreakdownPrompt(input: BreakdownInput): string {
  const basePrompt = `You are an expert project manager and software architect. Your task is to break down the following ${input.type} into a structured project plan with epics, tasks, and subtasks.

INPUT TYPE: ${input.type.toUpperCase()}
INPUT CONTENT:
${input.content}

Please analyze this input and create a comprehensive breakdown following these guidelines:

1. **Epics**: Group related tasks into epics (large features or themes)
2. **Tasks**: Break down each epic into specific, actionable tasks
3. **Subtasks**: Further break down complex tasks into smaller subtasks if needed
4. **Definition of Done (DoD)**: Provide clear acceptance criteria for each task
5. **Test Notes**: Include testing strategies and key test cases
6. **Risk Assessment**: Identify potential risks (low, medium, high, critical) and mitigation strategies
7. **Effort Estimation**: Estimate hours required for each task
8. **Dependencies**: Identify task dependencies
9. **Required Skills**: List the technical skills needed for each task

Return your response as a JSON object with the following structure:
{
  "epics": [
    {
      "title": "Epic title",
      "description": "Detailed description",
      "priority": 3,
      "tags": ["tag1", "tag2"],
      "tasks": [
        {
          "title": "Task title",
          "description": "Detailed description",
          "priority": 3,
          "tags": ["tag1"],
          "definitionOfDone": "Clear acceptance criteria",
          "testNotes": "Testing strategy and key test cases",
          "riskLevel": "medium",
          "riskDescription": "Potential risks and mitigation",
          "estimatedHours": 8,
          "dependencies": [],
          "requiredSkills": ["React", "TypeScript"],
          "subtasks": [
            {
              "title": "Subtask title",
              "description": "Detailed description",
              "priority": 3,
              "definitionOfDone": "Clear acceptance criteria",
              "testNotes": "Testing notes",
              "riskLevel": "low",
              "riskDescription": "Potential risks",
              "estimatedHours": 2,
              "requiredSkills": ["React"]
            }
          ]
        }
      ]
    }
  ],
  "standaloneTasks": [],
  "totalEstimatedHours": 40,
  "suggestedSprint": "Sprint 1",
  "summary": "High-level summary of the project breakdown"
}

Priority levels: 1=Low, 2=Medium-Low, 3=Medium, 4=High, 5=Critical
Risk levels: low, medium, high, critical

Be thorough and practical. Consider real-world development constraints.`;

  return basePrompt;
}

/**
 * Parse the AI response into a BreakdownResult
 */
function parseBreakdownResponse(content: string): BreakdownResult {
  try {
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    const jsonContent = jsonMatch ? jsonMatch[1] : content;

    const parsed = JSON.parse(jsonContent);

    // Validate the structure
    if (!parsed.epics || !Array.isArray(parsed.epics)) {
      parsed.epics = [];
    }
    if (!parsed.standaloneTasks || !Array.isArray(parsed.standaloneTasks)) {
      parsed.standaloneTasks = [];
    }
    if (!parsed.totalEstimatedHours) {
      parsed.totalEstimatedHours = 0;
    }
    if (!parsed.summary) {
      parsed.summary = 'Task breakdown completed';
    }

    return parsed as BreakdownResult;
  } catch (error) {
    console.error('Failed to parse breakdown response:', error);
    console.error('Response content:', content);
    throw new Error('Failed to parse AI response. Please try again.');
  }
}

/**
 * Fallback breakdown using simple rule-based logic (no AI)
 * Used when API key is not available or as a demo
 */
export function createSimpleBreakdown(input: BreakdownInput): BreakdownResult {
  const lines = input.content.split('\n').filter(line => line.trim());
  const title = lines[0] || 'New Project';

  return {
    epics: [
      {
        title: `${title} - Implementation`,
        description: input.content,
        priority: 3,
        tags: ['auto-generated'],
        tasks: [
          {
            title: 'Setup and Configuration',
            description: 'Initial project setup and configuration',
            priority: 4,
            tags: ['setup'],
            definitionOfDone: 'Project structure created, dependencies installed, configuration files set up',
            testNotes: 'Verify all dependencies install correctly, configuration loads properly',
            riskLevel: 'low',
            riskDescription: 'Standard setup, low risk',
            estimatedHours: 4,
            dependencies: [],
            requiredSkills: ['Setup', 'Configuration'],
          },
          {
            title: 'Core Implementation',
            description: 'Implement main functionality',
            priority: 5,
            tags: ['implementation'],
            definitionOfDone: 'Core features implemented and working',
            testNotes: 'Unit tests for core functionality, integration tests',
            riskLevel: 'medium',
            riskDescription: 'Complex logic may require iterations',
            estimatedHours: 16,
            dependencies: ['Setup and Configuration'],
            requiredSkills: ['Development', 'Testing'],
            subtasks: [
              {
                title: 'Implement data models',
                description: 'Create necessary data structures',
                priority: 4,
                definitionOfDone: 'Data models defined and validated',
                testNotes: 'Schema validation tests',
                riskLevel: 'low',
                riskDescription: 'Straightforward task',
                estimatedHours: 4,
                requiredSkills: ['Database', 'Modeling'],
              },
              {
                title: 'Implement business logic',
                description: 'Create core business logic',
                priority: 5,
                definitionOfDone: 'Business rules implemented correctly',
                testNotes: 'Unit tests for all business logic paths',
                riskLevel: 'medium',
                riskDescription: 'May require multiple iterations',
                estimatedHours: 8,
                requiredSkills: ['Development'],
              },
              {
                title: 'Create user interface',
                description: 'Build UI components',
                priority: 4,
                definitionOfDone: 'UI matches design specs, responsive',
                testNotes: 'Visual regression tests, accessibility tests',
                riskLevel: 'low',
                riskDescription: 'Standard UI development',
                estimatedHours: 4,
                requiredSkills: ['Frontend', 'UI/UX'],
              },
            ],
          },
          {
            title: 'Testing and Quality Assurance',
            description: 'Comprehensive testing and bug fixes',
            priority: 4,
            tags: ['testing', 'qa'],
            definitionOfDone: 'All tests passing, no critical bugs',
            testNotes: 'End-to-end tests, performance tests, security review',
            riskLevel: 'low',
            riskDescription: 'Standard QA process',
            estimatedHours: 8,
            dependencies: ['Core Implementation'],
            requiredSkills: ['Testing', 'QA'],
          },
        ],
      },
    ],
    standaloneTasks: [],
    totalEstimatedHours: 28,
    suggestedSprint: 'Sprint 1',
    summary: `Automated breakdown for: ${title}. Includes setup, implementation, and testing phases.`,
  };
}
