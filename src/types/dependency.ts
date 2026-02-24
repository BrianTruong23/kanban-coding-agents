export type DependencyType = 'blocks' | 'related' | 'duplicate';

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
  priority: number;
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: DependencyType;
}
