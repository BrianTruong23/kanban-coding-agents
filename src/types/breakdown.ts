export type TaskLevel = 'epic' | 'ticket' | 'subtask';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface TaskDependency {
  id: string;
  fromTaskId: string; // The task that depends on another
  toTaskId: string;   // The task that is depended upon
  type: 'blocks' | 'relates-to' | 'duplicates' | 'requires';
  createdAt: number;
}

export interface DefinitionOfDone {
  id: string;
  criteria: string;
  completed: boolean;
}

export interface TestNote {
  id: string;
  description: string;
  testType: 'unit' | 'integration' | 'e2e' | 'manual' | 'performance';
  priority: 1 | 2 | 3 | 4 | 5;
}

export interface RiskFlag {
  id: string;
  description: string;
  level: RiskLevel;
  mitigation?: string;
  acknowledged: boolean;
}

export interface TaskBreakdown {
  id: string;
  userId: string;
  epicId?: string; // For tickets: which epic they belong to
  ticketId?: string; // For subtasks: which ticket they belong to
  level: TaskLevel;
  taskId: string; // The actual task ID reference
  definitionOfDone: DefinitionOfDone[];
  testNotes: TestNote[];
  riskFlags: RiskFlag[];
  estimatedHours?: number;
  actualHours?: number;
  createdAt: number;
  updatedAt: number;
}

export interface BreakdownInput {
  source: 'issue' | 'prd' | 'screenshot' | 'text';
  content: string;
  imageUrl?: string; // For screenshot analysis
  context?: string; // Additional context
}

export interface BreakdownResult {
  epics: TaskBreakdown[];
  tickets: TaskBreakdown[];
  subtasks: TaskBreakdown[];
  dependencies: TaskDependency[];
  suggestedAgentAssignments: Map<string, string>; // taskId -> agentId
}
