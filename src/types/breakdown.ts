export type TaskType = 'epic' | 'ticket' | 'subtask';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface TaskDependency {
  id: string;
  dependsOn: string; // ID of the task this depends on
  type: 'blocks' | 'related' | 'child-of';
}

export interface DefinitionOfDone {
  id: string;
  description: string;
  completed: boolean;
}

export interface TestNote {
  id: string;
  description: string;
  type: 'unit' | 'integration' | 'e2e' | 'manual';
}

export interface RiskFlag {
  id: string;
  level: RiskLevel;
  description: string;
  mitigation?: string;
}

export interface BreakdownTask {
  id: string;
  taskId: string; // Display ID like "EPIC-1", "TICKET-1", "SUB-1"
  title: string;
  description: string;
  type: TaskType;
  parentId?: string; // Parent task ID for hierarchical structure
  status: 'backlog' | 'in-progress' | 'review' | 'done';
  assignedAgentId?: string;
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  sprint?: string;
  estimatedHours?: number;
  actualHours?: number;
  definitionOfDone: DefinitionOfDone[];
  testNotes: TestNote[];
  riskFlags: RiskFlag[];
  dependencies: TaskDependency[];
  createdAt: number;
  updatedAt: number;
}

export interface TaskBreakdownRequest {
  id: string;
  type: 'issue' | 'prd' | 'screenshot';
  content: string;
  imageUrl?: string; // For screenshots
  createdAt: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface TaskBreakdownResult {
  requestId: string;
  epics: BreakdownTask[];
  tickets: BreakdownTask[];
  subtasks: BreakdownTask[];
  dependencies: TaskDependency[];
  suggestedAssignments: Map<string, string>; // taskId -> agentId
  createdAt: number;
}
