import { Task, RiskLevel } from './task';
import { Epic } from './epic';
import { TaskDependency } from './dependency';

export interface TaskBreakdownInput {
  type: 'issue' | 'prd' | 'screenshot';
  content: string; // Issue text, PRD text, or screenshot URL
  context?: string; // Additional context
}

export interface TaskBreakdownResult {
  epics: Epic[];
  tasks: Task[];
  dependencies: TaskDependency[];
  suggestedAssignments: SuggestedAssignment[];
}

export interface SuggestedAssignment {
  taskId: string;
  agentId: string;
  agentName: string;
  reason: string;
  confidence: number; // 0-1
}

export interface GeneratedTask {
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4 | 5;
  estimatedHours?: number;
  definitionOfDone: string[];
  testNotes: string[];
  riskLevel: RiskLevel;
  tags: string[];
  requiredSkills: string[];
  dependencies?: string[]; // Task titles that this depends on
}

export interface GeneratedEpic {
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4 | 5;
  tasks: GeneratedTask[];
}

export interface AIBreakdownResponse {
  epics: GeneratedEpic[];
  overallEstimate?: number;
  risks: string[];
  recommendations: string[];
}
