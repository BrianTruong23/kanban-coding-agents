export type DependencyType = 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';

export interface TaskDependency {
  id: string;
  taskId: string; // Can be task or subtask
  dependsOnTaskId: string; // Can be task or subtask
  dependencyType: DependencyType;
  createdAt: number;
}

export interface DependencyNode {
  id: string;
  title: string;
  status: string;
  type: 'task' | 'subtask' | 'epic';
  dependencies: string[]; // IDs of tasks this depends on
}
