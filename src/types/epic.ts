export interface Epic {
  id: string;
  epicId: string; // Display ID like "EPIC-1"
  title: string;
  description: string;
  status: 'planning' | 'in-progress' | 'completed' | 'cancelled';
  priority: 1 | 2 | 3 | 4 | 5;
  sprint?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Subtask {
  id: string;
  taskId: string; // Parent task ID
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  assignedAgentId?: string;
  order: number; // For ordering subtasks
  createdAt: number;
  updatedAt: number;
}

export interface DefinitionOfDone {
  id: string;
  taskId: string; // Parent task ID
  criteria: string;
  isCompleted: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface TestNote {
  id: string;
  taskId: string; // Parent task ID
  type: 'unit' | 'integration' | 'e2e' | 'manual' | 'performance';
  description: string;
  isPassed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface RiskFlag {
  id: string;
  taskId: string; // Parent task ID
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'technical' | 'dependency' | 'resource' | 'timeline' | 'quality';
  description: string;
  mitigation?: string;
  status: 'identified' | 'mitigating' | 'resolved' | 'accepted';
  createdAt: number;
  updatedAt: number;
}

export interface TaskDependency {
  id: string;
  dependentTaskId: string; // Task that depends on another
  blockedByTaskId: string; // Task that blocks the dependent task
  type: 'blocks' | 'relates-to' | 'duplicates' | 'parent-of';
  createdAt: number;
}
