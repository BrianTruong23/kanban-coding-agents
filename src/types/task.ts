export type TaskStatus = 'backlog' | 'in-progress' | 'review' | 'done';
export type TaskType = 'epic' | 'task' | 'subtask';

export interface Task {
  id: string;
  taskId: string; // Display ID like "TASK-1"
  title: string;
  description: string;
  status: TaskStatus;
  type?: TaskType;
  sprint?: string;
  epicId?: string;
  parentTaskId?: string;
  assignedAgentId?: string;
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  estimatedHours?: number;
  actualHours?: number;
  commentsCount?: number;
  attachmentsCount?: number;
  createdAt: number;
  updatedAt: number;
}
