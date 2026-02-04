export type TaskStatus = 'backlog' | 'in-progress' | 'review' | 'done';

export interface Task {
  id: string;
  taskId: string; // Display ID like "TASK-1"
  title: string;
  description: string;
  status: TaskStatus;
  assignedAgentId?: string;
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  commentsCount?: number;
  attachmentsCount?: number;
  createdAt: number;
  updatedAt: number;
}
