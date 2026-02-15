// Task Breakdown Types for Automated Issue Processing

export type TaskHierarchy = 'epic' | 'ticket' | 'subtask';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type InputSourceType = 'issue' | 'prd' | 'screenshot' | 'text';

export interface DefinitionOfDone {
  id: string;
  description: string;
  completed: boolean;
  verificationMethod?: string;
}

export interface TestNote {
  id: string;
  type: 'unit' | 'integration' | 'e2e' | 'manual' | 'performance';
  description: string;
  testCase?: string;
  expectedOutcome?: string;
}

export interface RiskFlag {
  id: string;
  level: RiskLevel;
  description: string;
  mitigation?: string;
  impact?: string;
}

export interface TaskDependency {
  dependsOn: string; // Task ID
  type: 'blocks' | 'blocked-by' | 'relates-to';
  description?: string;
}

export interface Epic {
  id: string;
  title: string;
  description: string;
  hierarchy: 'epic';
  tickets: string[]; // Ticket IDs
  estimatedHours?: number;
  businessValue?: string;
  acceptanceCriteria: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Ticket {
  id: string;
  epicId?: string;
  title: string;
  description: string;
  hierarchy: 'ticket';
  subtasks: string[]; // Subtask IDs
  definitionOfDone: DefinitionOfDone[];
  testNotes: TestNote[];
  riskFlags: RiskFlag[];
  dependencies: TaskDependency[];
  estimatedHours?: number;
  assignedAgentId?: string;
  requiredSkills: string[];
  priority: 1 | 2 | 3 | 4 | 5;
  status: 'backlog' | 'in-progress' | 'review' | 'done';
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Subtask {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  hierarchy: 'subtask';
  definitionOfDone: DefinitionOfDone[];
  testNotes: TestNote[];
  riskFlags: RiskFlag[];
  dependencies: TaskDependency[];
  estimatedHours?: number;
  assignedAgentId?: string;
  requiredSkills: string[];
  priority: 1 | 2 | 3 | 4 | 5;
  status: 'backlog' | 'in-progress' | 'review' | 'done';
  createdAt: number;
  updatedAt: number;
}

export interface InputSource {
  type: InputSourceType;
  content: string;
  metadata?: {
    issueNumber?: string;
    repository?: string;
    author?: string;
    imageUrl?: string;
    [key: string]: unknown;
  };
}

export interface BreakdownResult {
  epics: Epic[];
  tickets: Ticket[];
  subtasks: Subtask[];
  summary: string;
  totalEstimatedHours?: number;
  suggestedSprint?: string;
}

export interface BreakdownOptions {
  maxSubtasksPerTicket?: number;
  maxTicketsPerEpic?: number;
  autoAssignAgents?: boolean;
  generateTestNotes?: boolean;
  identifyRisks?: boolean;
  estimateEffort?: boolean;
}
