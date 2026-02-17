// Types for automated task breakdown and orchestration

export interface Epic {
  id: string;
  title: string;
  description: string;
  userId: string;
  tickets: string[]; // ticket IDs
  status: 'planning' | 'in-progress' | 'completed' | 'blocked';
  createdAt: number;
  updatedAt: number;
}

export interface Ticket {
  id: string;
  epicId?: string;
  taskId: string; // Display ID like "TICKET-1"
  title: string;
  description: string;
  userId: string;
  subtasks: string[]; // subtask IDs
  definitionOfDone: DefinitionOfDone;
  testNotes: TestNote[];
  riskFlags: RiskFlag[];
  dependencies: string[]; // IDs of other tickets/subtasks this depends on
  blockedBy: string[]; // IDs of tickets/subtasks blocking this one
  status: 'backlog' | 'in-progress' | 'review' | 'done';
  priority: 1 | 2 | 3 | 4 | 5;
  assignedAgentId?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Subtask {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  userId: string;
  definitionOfDone: DefinitionOfDone;
  testNotes: TestNote[];
  riskFlags: RiskFlag[];
  dependencies: string[]; // IDs of other subtasks this depends on
  status: 'todo' | 'in-progress' | 'done';
  assignedAgentId?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface DefinitionOfDone {
  criteria: DoDCriteria[];
  acceptanceTests: string[];
}

export interface DoDCriteria {
  id: string;
  description: string;
  completed: boolean;
}

export interface TestNote {
  id: string;
  type: 'unit' | 'integration' | 'e2e' | 'manual';
  description: string;
  testCase?: string;
  expectedResult?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface RiskFlag {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'technical' | 'timeline' | 'dependency' | 'resource' | 'quality';
  description: string;
  mitigation?: string;
  status: 'identified' | 'mitigating' | 'resolved' | 'accepted';
}

export interface TaskDependency {
  id: string;
  sourceId: string; // ID of dependent task/subtask
  targetId: string; // ID of task/subtask being depended on
  type: 'blocks' | 'relates-to' | 'duplicates';
  description?: string;
  createdAt: number;
}

// Input types for task breakdown
export interface IssueInput {
  type: 'github-issue' | 'prd' | 'screenshot' | 'text';
  content: string;
  attachments?: {
    type: 'image' | 'document';
    url: string;
    description?: string;
  }[];
  metadata?: {
    issueNumber?: number;
    repository?: string;
    labels?: string[];
    priority?: number;
  };
}

export interface BreakdownResult {
  epics: Epic[];
  tickets: Ticket[];
  subtasks: Subtask[];
  dependencies: TaskDependency[];
  suggestedAssignments: {
    ticketId: string;
    agentId: string;
    confidence: number;
    reason: string;
  }[];
}
