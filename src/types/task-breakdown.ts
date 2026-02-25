export type HierarchyType = 'epic' | 'ticket' | 'subtask';

export type DependencyType = 'blocks' | 'related' | 'duplicate';

export type RiskFlag =
  | 'high-complexity'
  | 'external-dependency'
  | 'security'
  | 'performance'
  | 'data-migration'
  | 'breaking-change'
  | 'technical-debt';

export interface TaskHierarchy {
  id: string;
  userId: string;
  taskId: string;
  parentId?: string;
  hierarchyType: HierarchyType;
  position: number;
  definitionOfDone?: string;
  testNotes?: string;
  riskFlags: RiskFlag[];
  estimatedEffort?: number; // Story points or hours
  createdAt: number;
  updatedAt: number;
}

export interface TaskDependency {
  id: string;
  userId: string;
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: DependencyType;
  createdAt: number;
}

export interface TaskBreakdownNode {
  task: import('./task').Task;
  hierarchy: TaskHierarchy;
  children: TaskBreakdownNode[];
  dependencies: TaskDependency[];
}

export interface TaskBreakdownResult {
  epic?: TaskBreakdownNode;
  tickets: TaskBreakdownNode[];
  allTasks: import('./task').Task[];
  allHierarchies: TaskHierarchy[];
  allDependencies: TaskDependency[];
}

export interface TaskBreakdownInput {
  title: string;
  description: string;
  type: 'issue' | 'prd' | 'screenshot';
  content: string;
  imageUrl?: string;
}
