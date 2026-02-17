// Task hierarchy types
export type TaskType = 'epic' | 'ticket' | 'subtask';

export interface DefinitionOfDone {
  id: string;
  description: string;
  completed: boolean;
  createdAt: number;
}

export interface TestNote {
  id: string;
  description: string;
  testType: 'unit' | 'integration' | 'e2e' | 'manual' | 'performance';
  status: 'pending' | 'passed' | 'failed' | 'skipped';
  createdAt: number;
}

export interface RiskFlag {
  id: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation?: string;
  impact: string;
  probability: 'low' | 'medium' | 'high';
  createdAt: number;
  resolved: boolean;
  resolvedAt?: number;
}

export interface TaskDependency {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  type: 'blocks' | 'blocked_by' | 'relates_to' | 'duplicates';
  createdAt: number;
}

export interface Epic {
  id: string;
  epicId: string; // Display ID like "EPIC-1"
  title: string;
  description: string;
  goals: string[];
  status: 'planning' | 'in-progress' | 'review' | 'done' | 'cancelled';
  priority: 1 | 2 | 3 | 4 | 5;
  sprint?: string;
  estimatedEffort?: number; // in story points
  actualEffort?: number;
  tags: string[];
  definitionsOfDone: DefinitionOfDone[];
  riskFlags: RiskFlag[];
  createdAt: number;
  updatedAt: number;
  startDate?: number;
  targetDate?: number;
  completedAt?: number;
}

export interface Ticket {
  id: string;
  ticketId: string; // Display ID like "TICKET-1"
  epicId?: string; // Link to parent epic
  title: string;
  description: string;
  type: 'feature' | 'bug' | 'improvement' | 'task' | 'research';
  status: 'backlog' | 'in-progress' | 'review' | 'done' | 'blocked';
  priority: 1 | 2 | 3 | 4 | 5;
  sprint?: string;
  assignedAgentId?: string;
  estimatedEffort?: number; // in hours or story points
  actualEffort?: number;
  tags: string[];
  definitionsOfDone: DefinitionOfDone[];
  testNotes: TestNote[];
  riskFlags: RiskFlag[];
  acceptanceCriteria: string[];
  technicalNotes?: string;
  createdAt: number;
  updatedAt: number;
  startDate?: number;
  dueDate?: number;
  completedAt?: number;
}

export interface Subtask {
  id: string;
  subtaskId: string; // Display ID like "SUB-1"
  ticketId: string; // Link to parent ticket
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  assignedAgentId?: string;
  estimatedEffort?: number; // in hours
  actualEffort?: number;
  testNotes: TestNote[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

// Input source types for automated breakdown
export type InputSourceType = 'issue' | 'prd' | 'screenshot' | 'text';

export interface InputSource {
  type: InputSourceType;
  content: string; // For issue/PRD text or screenshot description
  imageUrl?: string; // For screenshot type
  metadata?: Record<string, unknown>;
}

// Result of automated task breakdown
export interface TaskBreakdownResult {
  epics: Epic[];
  tickets: Ticket[];
  subtasks: Subtask[];
  dependencies: TaskDependency[];
  summary: string;
  confidence: number; // 0-1 score of how confident the AI is
  generatedAt: number;
}

// Configuration for task breakdown
export interface BreakdownConfig {
  maxEpics?: number;
  maxTicketsPerEpic?: number;
  maxSubtasksPerTicket?: number;
  includeTestNotes?: boolean;
  includeRiskFlags?: boolean;
  includeDependencies?: boolean;
  estimationUnit?: 'hours' | 'story_points';
  defaultPriority?: 1 | 2 | 3 | 4 | 5;
}
