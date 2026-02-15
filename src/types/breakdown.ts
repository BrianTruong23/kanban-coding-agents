// Types for automated task breakdown system

export type TaskType = 'epic' | 'story' | 'task' | 'subtask';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type TaskDependencyType = 'blocks' | 'blocked_by' | 'relates_to';

export interface DefinitionOfDone {
  criteria: string[];
  acceptanceCriteria: string[];
}

export interface TestNotes {
  testCases: string[];
  testingStrategy: string;
  edgeCases: string[];
}

export interface RiskFlag {
  level: RiskLevel;
  description: string;
  mitigation?: string;
}

export interface TaskDependency {
  taskId: string; // The related task ID
  type: TaskDependencyType;
}

export interface BreakdownTask {
  id: string;
  taskId: string; // Display ID like "EPIC-1", "STORY-2", "TASK-3"
  title: string;
  description: string;
  type: TaskType;
  parentId?: string; // For nested tasks
  priority: 1 | 2 | 3 | 4 | 5;
  estimatedHours?: number;
  tags: string[];
  definitionOfDone: DefinitionOfDone;
  testNotes: TestNotes;
  riskFlags: RiskFlag[];
  dependencies: TaskDependency[];
  suggestedAgentId?: string; // AI-suggested agent based on skills
  assignedAgentId?: string;
  status: string;
  createdAt: number;
  updatedAt: number;
}

export interface TaskBreakdownInput {
  type: 'issue' | 'prd' | 'screenshot' | 'text';
  content: string; // Issue text, PRD content, screenshot description, or free text
  context?: string; // Additional context
}

export interface TaskBreakdownResult {
  tasks: BreakdownTask[];
  summary: string;
  totalEstimatedHours: number;
}
