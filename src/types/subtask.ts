export interface Subtask {
  id: string;
  parentTaskId: string;
  title: string;
  description: string;
  completed: boolean;
  assignedAgentId?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: number;
  updatedAt: number;
}
