// Extended types for automated task breakdown and orchestration

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: 'blocks' | 'blocked-by' | 'relates-to';
  createdAt: number;
}

export interface DefinitionOfDone {
  id: string;
  taskId: string;
  description: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TestNote {
  id: string;
  taskId: string;
  description: string;
  testType: 'unit' | 'integration' | 'e2e' | 'manual';
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface RiskFlag {
  id: string;
  taskId: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigationPlan?: string;
  resolved: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Epic {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'archived';
  priority: 1 | 2 | 3 | 4 | 5;
  sprint?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Subtask {
  id: string;
  parentTaskId: string;
  title: string;
  description: string;
  completed: boolean;
  assignedAgentId?: string;
  estimatedHours?: number;
  createdAt: number;
  updatedAt: number;
}

export interface TaskBreakdownResult {
  epic?: Epic;
  tasks: Array<{
    title: string;
    description: string;
    priority: 1 | 2 | 3 | 4 | 5;
    tags: string[];
    estimatedHours?: number;
    subtasks?: Omit<Subtask, 'id' | 'parentTaskId' | 'createdAt' | 'updatedAt'>[];
    definitionsOfDone?: Omit<DefinitionOfDone, 'id' | 'taskId' | 'createdAt' | 'updatedAt'>[];
    testNotes?: Omit<TestNote, 'id' | 'taskId' | 'createdAt' | 'updatedAt'>[];
    riskFlags?: Omit<RiskFlag, 'id' | 'taskId' | 'createdAt' | 'updatedAt'>[];
    suggestedAgentSkills?: string[];
  }>;
  dependencies?: Array<{
    fromTaskIndex: number;
    toTaskIndex: number;
    dependencyType: 'blocks' | 'blocked-by' | 'relates-to';
  }>;
}

export interface ParsedRequirement {
  type: 'feature' | 'bug' | 'enhancement' | 'research';
  title: string;
  description: string;
  acceptanceCriteria?: string[];
  technicalNotes?: string[];
  estimatedComplexity?: 'low' | 'medium' | 'high' | 'very-high';
}
