export type DependencyType = 'blocks' | 'blocked-by' | 'relates-to' | 'duplicates';

export interface TaskDependency {
  id: string;
  sourceTaskId: string; // The task that has the dependency
  targetTaskId: string; // The task it depends on
  type: DependencyType;
  createdAt: number;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskFlag {
  id: string;
  taskId: string;
  level: RiskLevel;
  category: string; // e.g., "technical-debt", "security", "performance", "complexity"
  description: string;
  mitigation?: string;
  createdAt: number;
  resolvedAt?: number;
}

export interface DefinitionOfDone {
  id: string;
  taskId: string;
  criteria: string[];
  completedCriteria: string[];
  createdAt: number;
  updatedAt: number;
}

export interface TestNote {
  id: string;
  taskId: string;
  description: string;
  testType: 'unit' | 'integration' | 'e2e' | 'manual' | 'performance';
  status: 'pending' | 'passed' | 'failed';
  createdAt: number;
  updatedAt: number;
}
