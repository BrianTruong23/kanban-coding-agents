export type DependencyType = 'blocks' | 'related' | 'parent-child';

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: DependencyType;
  createdAt: number;
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export interface DependencyNode {
  id: string;
  taskId: string;
  title: string;
  status: string;
  type: 'epic' | 'task' | 'subtask';
}

export interface DependencyEdge {
  id: string;
  from: string;
  to: string;
  type: DependencyType;
}
