import { Task, TaskType, RiskLevel, DefinitionOfDone, TestNotes, RiskFlag } from '@/types/task';
import { generateId, generateTaskId } from './utils';

export interface BreakdownInput {
  title: string;
  description: string;
  type: 'issue' | 'prd' | 'screenshot' | 'text';
  content: string;
}

export interface BreakdownResult {
  epic: Task;
  tickets: Task[];
  subtasks: Task[];
}

/**
 * Analyzes text to extract key sections and requirements
 */
function analyzeContent(content: string): {
  requirements: string[];
  risks: string[];
  testScenarios: string[];
} {
  const requirements: string[] = [];
  const risks: string[] = [];
  const testScenarios: string[] = [];

  // Split content into lines
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Look for patterns indicating requirements
  const requirementPatterns = [
    /^[-*]\s*(.+)$/,
    /^(\d+)\.\s*(.+)$/,
    /must\s+(.+)/i,
    /should\s+(.+)/i,
    /need\s+to\s+(.+)/i,
  ];

  // Look for risk indicators
  const riskKeywords = ['risk', 'concern', 'challenge', 'blocker', 'dependency', 'limitation'];

  // Look for test indicators
  const testKeywords = ['test', 'verify', 'validate', 'acceptance criteria', 'AC:'];

  lines.forEach(line => {
    // Check for requirements
    for (const pattern of requirementPatterns) {
      const match = line.match(pattern);
      if (match) {
        const requirement = match[2] || match[1];
        if (requirement && requirement.length > 3) {
          requirements.push(requirement);
          break;
        }
      }
    }

    // Check for risks
    const lowerLine = line.toLowerCase();
    if (riskKeywords.some(keyword => lowerLine.includes(keyword))) {
      risks.push(line);
    }

    // Check for test scenarios
    if (testKeywords.some(keyword => lowerLine.includes(keyword))) {
      testScenarios.push(line);
    }
  });

  return { requirements, risks, testScenarios };
}

/**
 * Determines risk level based on keywords and context
 */
function assessRiskLevel(riskText: string): RiskLevel {
  const lowerText = riskText.toLowerCase();
  if (lowerText.includes('critical') || lowerText.includes('blocker')) {
    return 'critical';
  }
  if (lowerText.includes('high') || lowerText.includes('major')) {
    return 'high';
  }
  if (lowerText.includes('medium') || lowerText.includes('moderate')) {
    return 'medium';
  }
  return 'low';
}

/**
 * Breaks down a requirement into smaller subtasks
 */
function generateSubtasks(requirement: string, parentId: string, epicId: string, startIndex: number): Task[] {
  const subtasks: Task[] = [];

  // Simple heuristic: if requirement is complex (mentions "and", multiple verbs), break it down
  const hasMultipleParts = requirement.includes(' and ') || requirement.includes(',');

  if (hasMultipleParts) {
    const parts = requirement.split(/\s+and\s+|,/).map(p => p.trim()).filter(p => p.length > 0);
    parts.forEach((part, idx) => {
      if (part.length > 5) {
        subtasks.push({
          id: generateId(),
          taskId: generateTaskId(startIndex + idx),
          title: part.charAt(0).toUpperCase() + part.slice(1),
          description: `Subtask for: ${requirement}`,
          status: 'backlog',
          type: 'subtask',
          parentTaskId: parentId,
          epicId: epicId,
          priority: 3,
          tags: ['auto-generated', 'subtask'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    });
  } else {
    // Single subtask
    subtasks.push({
      id: generateId(),
      taskId: generateTaskId(startIndex),
      title: requirement.charAt(0).toUpperCase() + requirement.slice(1),
      description: `Subtask: ${requirement}`,
      status: 'backlog',
      type: 'subtask',
      parentTaskId: parentId,
      epicId: epicId,
      priority: 3,
      tags: ['auto-generated', 'subtask'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  return subtasks;
}

/**
 * Main function to break down input into structured tasks
 */
export function breakdownTask(input: BreakdownInput, existingTaskCount: number = 0): BreakdownResult {
  const analysis = analyzeContent(input.content);

  let taskCounter = existingTaskCount;

  // Create Epic
  const epicId = generateId();
  const epic: Task = {
    id: epicId,
    taskId: generateTaskId(++taskCounter),
    title: input.title,
    description: input.description,
    status: 'backlog',
    type: 'epic',
    priority: 4,
    tags: ['epic', 'auto-generated'],
    definitionOfDone: {
      criteria: ['All child tickets completed', 'All acceptance criteria met', 'Code reviewed and merged'],
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Add risk flags to epic
  if (analysis.risks.length > 0) {
    epic.riskFlags = analysis.risks.map(risk => ({
      level: assessRiskLevel(risk),
      description: risk,
      createdAt: Date.now(),
    }));
  }

  // Create Tickets from requirements
  const tickets: Task[] = [];
  const allSubtasks: Task[] = [];

  // Group requirements into logical tickets (every 2-3 requirements becomes a ticket)
  const ticketSize = 3;
  const numTickets = Math.ceil(analysis.requirements.length / ticketSize);

  for (let i = 0; i < numTickets; i++) {
    const ticketRequirements = analysis.requirements.slice(i * ticketSize, (i + 1) * ticketSize);
    if (ticketRequirements.length === 0) continue;

    const ticketId = generateId();
    const ticket: Task = {
      id: ticketId,
      taskId: generateTaskId(++taskCounter),
      title: ticketRequirements[0].substring(0, 60) + (ticketRequirements[0].length > 60 ? '...' : ''),
      description: ticketRequirements.join('\n'),
      status: 'backlog',
      type: 'ticket',
      parentTaskId: epicId,
      epicId: epicId,
      priority: 3,
      tags: ['auto-generated', 'ticket'],
      definitionOfDone: {
        criteria: ticketRequirements.map(req => `Complete: ${req}`),
      },
      testNotes: {
        acceptanceCriteria: ticketRequirements,
        testCases: analysis.testScenarios.slice(0, 2), // Add some test scenarios
      },
      estimatedHours: ticketRequirements.length * 2, // Rough estimate: 2 hours per requirement
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    tickets.push(ticket);

    // Generate subtasks for this ticket
    ticketRequirements.forEach((req, idx) => {
      const subtasks = generateSubtasks(req, ticketId, epicId, ++taskCounter);
      allSubtasks.push(...subtasks);
      taskCounter += subtasks.length - 1;
    });
  }

  return {
    epic,
    tickets,
    subtasks: allSubtasks,
  };
}

/**
 * Quick breakdown for simpler scenarios - creates a single ticket with subtasks
 */
export function quickBreakdown(title: string, description: string, existingTaskCount: number = 0): Task[] {
  const analysis = analyzeContent(description);

  let taskCounter = existingTaskCount;

  // Create main ticket
  const ticketId = generateId();
  const ticket: Task = {
    id: ticketId,
    taskId: generateTaskId(++taskCounter),
    title,
    description,
    status: 'backlog',
    type: 'ticket',
    priority: 3,
    tags: ['auto-generated'],
    definitionOfDone: {
      criteria: analysis.requirements.slice(0, 5),
    },
    testNotes: {
      acceptanceCriteria: analysis.requirements.slice(0, 3),
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const tasks: Task[] = [ticket];

  // Add subtasks if requirements found
  if (analysis.requirements.length > 0) {
    analysis.requirements.slice(0, 5).forEach((req, idx) => {
      const subtask: Task = {
        id: generateId(),
        taskId: generateTaskId(++taskCounter),
        title: req.substring(0, 60) + (req.length > 60 ? '...' : ''),
        description: req,
        status: 'backlog',
        type: 'subtask',
        parentTaskId: ticketId,
        priority: 3,
        tags: ['auto-generated', 'subtask'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      tasks.push(subtask);
    });
  }

  return tasks;
}
