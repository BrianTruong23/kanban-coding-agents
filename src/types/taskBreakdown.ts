// Task breakdown types for parsing issues/PRDs into structured tasks

export type TaskType = 'epic' | 'ticket' | 'subtask';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface TaskDependency {
  taskId: string;
  type: 'blocks' | 'blocked-by' | 'relates-to';
}

export interface DefinitionOfDone {
  criteria: string[];
  acceptanceCriteria: string[];
}

export interface TestNotes {
  testCases: string[];
  testingApproach: string;
  edgeCases: string[];
}

export interface TaskBreakdownItem {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  parentId?: string; // For epics -> tickets -> subtasks hierarchy
  priority: 1 | 2 | 3 | 4 | 5;
  estimatedHours?: number;
  tags: string[];
  dependencies: TaskDependency[];
  definitionOfDone: DefinitionOfDone;
  testNotes: TestNotes;
  riskLevel: RiskLevel;
  riskNotes?: string;
  suggestedAgentSkills: string[]; // Skills needed for this task
}

export interface TaskBreakdownResult {
  epic?: TaskBreakdownItem;
  tickets: TaskBreakdownItem[];
  subtasks: TaskBreakdownItem[];
  summary: string;
  totalEstimatedHours: number;
}

export interface ParsedInput {
  type: 'issue' | 'prd' | 'screenshot' | 'text';
  content: string;
  metadata?: {
    issueNumber?: string;
    repository?: string;
    author?: string;
    labels?: string[];
  };
}
