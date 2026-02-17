export type DependencyType = 'blocks' | 'blocked-by' | 'relates-to';

export interface TaskDependency {
  id: string;
  sourceTaskId: string; // The task that has the dependency
  targetTaskId: string; // The task it depends on
  type: DependencyType;
  createdAt: number;
}
