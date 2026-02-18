import { Task, TaskStatus } from './task';

export type TaskType = 'epic' | 'ticket' | 'subtask';

export interface TaskDependency {
  id: string;
  dependsOnTaskId: string; // The task that must be completed first
  dependentTaskId: string; // The task that depends on the other
  dependencyType: 'blocks' | 'relates-to' | 'required-for';
  createdAt: number;
}

export interface DefinitionOfDone {
  id: string;
  description: string;
  completed: boolean;
}

export interface TestNote {
  id: string;
  description: string;
  testType: 'unit' | 'integration' | 'e2e' | 'manual';
  priority: 'low' | 'medium' | 'high';
}

export interface RiskFlag {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation?: string;
  status: 'open' | 'mitigated' | 'accepted';
}

export interface ExtendedTask extends Task {
  taskType: TaskType;
  parentTaskId?: string; // For subtasks/tickets that belong to epics/tickets
  definitionOfDone: DefinitionOfDone[];
  testNotes: TestNote[];
  riskFlags: RiskFlag[];
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string[]; // Array of task IDs this task depends on
  blockedBy?: string[]; // Array of task IDs blocking this task
  complexity?: 'low' | 'medium' | 'high';
  skillsRequired?: string[];
}

export interface TaskBreakdownRequest {
  source: 'issue' | 'prd' | 'screenshot' | 'text';
  content: string;
  imageUrl?: string; // For screenshot analysis
  projectContext?: string;
  existingTasks?: Task[];
}

export interface TaskBreakdownResult {
  epics: ExtendedTask[];
  tickets: ExtendedTask[];
  subtasks: ExtendedTask[];
  dependencies: TaskDependency[];
  suggestedAgentAssignments: Map<string, string>; // taskId -> agentId
  estimatedTotalHours: number;
  riskSummary: {
    high: number;
    medium: number;
    low: number;
  };
}
