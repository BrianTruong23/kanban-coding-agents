export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  description?: string;
  completed: boolean;
  orderIndex: number;
  createdAt: number;
  updatedAt: number;
}
