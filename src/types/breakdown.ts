import { Task } from './task';
import { Subtask } from './subtask';
import { TaskDependency } from './dependency';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface DefinitionOfDone {
  criteria: string[];
}

export interface TestNote {
  id: string;
  title: string;
  description: string;
  testType: 'unit' | 'integration' | 'e2e' | 'manual';
}

export interface RiskFlag {
  id: string;
  level: RiskLevel;
  description: string;
  mitigation?: string;
}

export interface TaskBreakdown {
  epicTitle?: string;
  epicDescription?: string;
  tasks: Task[];
  subtasks: Subtask[];
  dependencies: TaskDependency[];
  definitionsOfDone: Map<string, DefinitionOfDone>; // taskId -> DoD
  testNotes: Map<string, TestNote[]>; // taskId -> test notes
  riskFlags: Map<string, RiskFlag[]>; // taskId -> risk flags
}

export interface BreakdownInput {
  type: 'issue' | 'prd' | 'screenshot';
  content: string;
  imageData?: string; // base64 for screenshots
  context?: string; // Additional context
}
