export interface Epic {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  priority: 1 | 2 | 3 | 4 | 5;
  createdAt: number;
  updatedAt: number;
  userId?: string;
}

export interface Ticket {
  id: string;
  epicId: string;
  taskId: string; // Display ID like "TICKET-1"
  title: string;
  description: string;
  status: 'backlog' | 'in-progress' | 'review' | 'done';
  priority: 1 | 2 | 3 | 4 | 5;
  assignedAgentId?: string;
  definitionOfDone: string[];
  testNotes: string;
  riskFlags: RiskFlag[];
  dependencies: string[]; // IDs of other tickets this depends on
  estimatedHours?: number;
  tags: string[];
  sprint?: string;
  createdAt: number;
  updatedAt: number;
  userId?: string;
}

export interface Subtask {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  assignedAgentId?: string;
  estimatedHours?: number;
  createdAt: number;
  updatedAt: number;
  userId?: string;
}

export interface RiskFlag {
  id: string;
  type: 'technical' | 'timeline' | 'dependency' | 'resource' | 'security' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigationPlan?: string;
  createdAt: number;
}

export interface TaskBreakdownInput {
  type: 'issue' | 'prd' | 'screenshot';
  content: string;
  attachments?: string[]; // URLs or file paths
  context?: string;
}

export interface TaskBreakdownResult {
  epic: Omit<Epic, 'id' | 'createdAt' | 'updatedAt'>;
  tickets: Omit<Ticket, 'id' | 'epicId' | 'createdAt' | 'updatedAt'>[];
  suggestedAssignments: Map<string, string>; // ticketId -> agentId
  dependencyGraph: DependencyNode[];
}

export interface DependencyNode {
  ticketId: string;
  title: string;
  dependsOn: string[];
  blockedBy: string[];
  criticalPath: boolean;
}
