export type TaskType = 'epic' | 'ticket' | 'subtask';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface DefinitionOfDone {
  id: string;
  description: string;
  completed: boolean;
}

export interface TestNote {
  id: string;
  description: string;
  testType: 'unit' | 'integration' | 'e2e' | 'manual';
  priority: 1 | 2 | 3;
}

export interface RiskFlag {
  id: string;
  description: string;
  level: RiskLevel;
  mitigation?: string;
}

export interface TaskDependency {
  id: string;
  dependsOn: string; // ID of the task this depends on
  type: 'blocks' | 'relates-to' | 'duplicates';
}

export interface HierarchicalTask {
  id: string;
  taskId: string;
  title: string;
  description: string;
  type: TaskType;
  parentId?: string; // For subtasks and tickets under epics
  status: 'backlog' | 'in-progress' | 'review' | 'done';
  sprint?: string;
  assignedAgentId?: string;
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  estimatedHours?: number;
  actualHours?: number;

  // Enhanced fields
  definitionOfDone: DefinitionOfDone[];
  testNotes: TestNote[];
  riskFlags: RiskFlag[];
  dependencies: TaskDependency[];

  // Metadata
  createdAt: number;
  updatedAt: number;
  completedAt?: number;

  // For UI
  commentsCount?: number;
  attachmentsCount?: number;
}

export interface TaskBreakdownRequest {
  source: 'issue' | 'prd' | 'screenshot' | 'text';
  content: string;
  imageUrl?: string; // For screenshots
  context?: {
    projectType?: string;
    techStack?: string[];
    sprintDuration?: number;
  };
}

export interface TaskBreakdownResult {
  epics: HierarchicalTask[];
  tickets: HierarchicalTask[];
  subtasks: HierarchicalTask[];
  dependencies: TaskDependency[];
  suggestedAssignments: {
    taskId: string;
    agentId: string;
    reason: string;
    confidence: number; // 0-1
  }[];
}
