export type TaskType = 'epic' | 'ticket' | 'subtask';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface DefinitionOfDone {
  id: string;
  description: string;
  completed: boolean;
}

export interface TestNote {
  id: string;
  type: 'unit' | 'integration' | 'e2e' | 'manual';
  description: string;
  status: 'pending' | 'passed' | 'failed' | 'skipped';
}

export interface RiskFlag {
  id: string;
  level: RiskLevel;
  description: string;
  mitigation?: string;
  resolved: boolean;
}

export interface TaskDependency {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  type: 'blocks' | 'depends-on' | 'related-to';
  createdAt: number;
}

export interface TaskBreakdown {
  id: string;
  taskId: string; // References the main Task
  type: TaskType;
  parentId?: string; // For subtasks referencing tickets, or tickets referencing epics
  childIds: string[]; // IDs of child tasks
  definitionOfDone: DefinitionOfDone[];
  testNotes: TestNote[];
  riskFlags: RiskFlag[];
  estimatedHours?: number;
  actualHours?: number;
  acceptanceCriteria: string[];
  technicalNotes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TaskHierarchy {
  epic?: TaskBreakdown;
  tickets: TaskBreakdown[];
  subtasks: TaskBreakdown[];
}

export interface ParsedTaskInput {
  type: 'issue' | 'prd' | 'screenshot';
  content: string;
  imageUrl?: string; // For screenshots
  metadata?: Record<string, any>;
}

export interface BreakdownResult {
  hierarchy: TaskHierarchy;
  dependencies: TaskDependency[];
  suggestedAssignments: Array<{
    taskId: string;
    agentId: string;
    confidence: number;
    reason: string;
  }>;
}
