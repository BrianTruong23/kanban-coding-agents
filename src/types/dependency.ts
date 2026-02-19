export type DependencyType = 'blocks' | 'blocked-by' | 'related-to';

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: DependencyType;
  createdAt: number;
}
