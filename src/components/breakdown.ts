import { RiskLevel } from './subtask';

export type BreakdownInputType = 'issue' | 'prd' | 'screenshot' | 'text';

export interface BreakdownInput {
  type: BreakdownInputType;
  content: string;
  imageUrl?: string; // For screenshot type
}

export interface BreakdownTask {
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  definitionOfDone: string;
  testNotes: string;
  riskLevel: RiskLevel;
  riskDescription: string;
  estimatedHours: number;
  dependencies: string[]; // Indices or titles of dependent tasks
  requiredSkills: string[]; // Skills needed for this task
  subtasks?: BreakdownSubtask[];
}

export interface BreakdownSubtask {
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4 | 5;
  definitionOfDone: string;
  testNotes: string;
  riskLevel: RiskLevel;
  riskDescription: string;
  estimatedHours: number;
  requiredSkills: string[];
}

export interface BreakdownEpic {
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  tasks: BreakdownTask[];
}

export interface BreakdownResult {
  epics: BreakdownEpic[];
  standaloneTasks: BreakdownTask[];
  totalEstimatedHours: number;
  suggestedSprint?: string;
  summary: string;
}

export interface TaskBreakdownHistory {
  id: string;
  inputType: BreakdownInputType;
  inputContent: string;
  breakdownResult: BreakdownResult;
  createdAt: number;
}
