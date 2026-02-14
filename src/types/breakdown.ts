export interface TaskBreakdownInput {
  type: 'issue' | 'prd' | 'screenshot';
  content: string;
  imageUrl?: string; // For screenshot type
  title?: string;
}

export interface Epic {
  id: string;
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4 | 5;
  estimatedEffort: number; // in story points
  businessValue: string;
  createdAt: number;
}

export interface TaskDependency {
  id: string;
  sourceTaskId: string; // Task that must be completed first
  targetTaskId: string; // Task that depends on source
  dependencyType: 'blocks' | 'related' | 'duplicate';
  createdAt: number;
}

export interface Subtask {
  id: string;
  parentTaskId: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  assignedAgentId?: string;
  estimatedHours?: number;
  createdAt: number;
  updatedAt: number;
}

export interface DefinitionOfDone {
  id: string;
  taskId: string;
  criteria: string[];
  testNotes: string[];
  createdAt: number;
}

export interface RiskFlag {
  id: string;
  taskId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'technical' | 'dependency' | 'resource' | 'timeline' | 'scope';
  description: string;
  mitigation?: string;
  createdAt: number;
}

export interface BreakdownResult {
  epic?: Epic;
  tasks: Array<{
    title: string;
    description: string;
    priority: 1 | 2 | 3 | 4 | 5;
    estimatedHours: number;
    tags: string[];
    definitionOfDone: string[];
    testNotes: string[];
    riskFlags: Array<{
      severity: RiskFlag['severity'];
      category: RiskFlag['category'];
      description: string;
      mitigation?: string;
    }>;
    subtasks: Array<{
      title: string;
      description: string;
      estimatedHours: number;
    }>;
    dependencies: number[]; // Indices of tasks this depends on
  }>;
  dependencies: Array<{
    source: number; // Index in tasks array
    target: number; // Index in tasks array
    type: TaskDependency['dependencyType'];
  }>;
}
