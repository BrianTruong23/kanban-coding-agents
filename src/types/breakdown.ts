export type TaskType = 'epic' | 'ticket' | 'subtask';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Epic {
  id: string;
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4 | 5;
  estimatedEffort: number; // in hours
  tickets: string[]; // ticket IDs
  createdAt: number;
  updatedAt: number;
}

export interface Ticket {
  id: string;
  epicId?: string;
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4 | 5;
  estimatedEffort: number; // in hours
  definitionOfDone: string[];
  testNotes: string[];
  riskFlags: RiskFlag[];
  subtasks: string[]; // subtask IDs
  dependencies: string[]; // other ticket/subtask IDs
  assignedAgentId?: string;
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
  estimatedEffort: number; // in hours
  assignedAgentId?: string;
  status: 'backlog' | 'in-progress' | 'review' | 'done';
  dependencies: string[]; // other subtask IDs
  createdAt: number;
  updatedAt: number;
}

export interface RiskFlag {
  id: string;
  level: RiskLevel;
  description: string;
  mitigation?: string;
  createdAt: number;
}

export interface DependencyEdge {
  from: string; // task/ticket/subtask ID
  to: string; // task/ticket/subtask ID
  type: 'blocks' | 'requires' | 'related';
}

export interface TaskBreakdown {
  sourceType: 'issue' | 'prd' | 'screenshot' | 'text';
  sourceContent: string;
  epics: Epic[];
  tickets: Ticket[];
  subtasks: Subtask[];
  dependencies: DependencyEdge[];
  metadata: {
    generatedAt: number;
    estimatedTotalEffort: number;
  };
}
