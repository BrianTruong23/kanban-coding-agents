export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ItemType = 'epic' | 'ticket' | 'subtask';

export interface DefinitionOfDone {
  id: string;
  description: string;
  completed: boolean;
}

export interface TestNote {
  id: string;
  category: 'unit' | 'integration' | 'e2e' | 'manual' | 'performance';
  description: string;
  estimatedEffort?: number; // in hours
}

export interface RiskFlag {
  id: string;
  level: RiskLevel;
  description: string;
  mitigation?: string;
  identified: boolean;
}

export interface Dependency {
  id: string;
  fromItemId: string;
  toItemId: string;
  type: 'blocks' | 'requires' | 'relates-to';
  description?: string;
}

export interface TaskBreakdownItem {
  id: string;
  type: ItemType;
  parentId?: string; // For tickets under epics, subtasks under tickets
  taskId: string; // Display ID like "EPIC-1", "TICKET-5", "SUB-12"
  title: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'blocked' | 'review' | 'done';
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  assignedAgentId?: string;
  definitionOfDone: DefinitionOfDone[];
  testNotes: TestNote[];
  riskFlags: RiskFlag[];
  estimatedEffort?: number; // in hours
  actualEffort?: number; // in hours
  createdAt: number;
  updatedAt: number;
}

export interface Epic extends TaskBreakdownItem {
  type: 'epic';
  businessValue?: string;
  acceptanceCriteria?: string[];
}

export interface Ticket extends TaskBreakdownItem {
  type: 'ticket';
  storyPoints?: number;
  sprint?: string;
}

export interface Subtask extends TaskBreakdownItem {
  type: 'subtask';
  checklistItem?: boolean;
}

// Input types for task breakdown
export interface TaskBreakdownInput {
  type: 'issue' | 'prd' | 'screenshot' | 'text';
  content: string;
  imageData?: string; // base64 for screenshots
  context?: string; // additional context
}

export interface TaskBreakdownResult {
  epics: Epic[];
  tickets: Ticket[];
  subtasks: Subtask[];
  dependencies: Dependency[];
  summary: {
    totalEstimatedEffort: number;
    riskAssessment: string;
    recommendedSprints: number;
  };
}
