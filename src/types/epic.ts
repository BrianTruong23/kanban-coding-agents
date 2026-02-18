export type EpicStatus = 'planning' | 'in-progress' | 'review' | 'done';

export interface Epic {
  id: string;
  epicId: string; // Display ID like "EPIC-1"
  title: string;
  description: string;
  status: EpicStatus;
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  sprint?: string;
  createdAt: number;
  updatedAt: number;
  taskIds: string[]; // IDs of tasks/tickets belonging to this epic
}

export interface Subtask {
  id: string;
  subtaskId: string; // Display ID like "SUB-1"
  parentTaskId: string; // The task this subtask belongs to
  title: string;
  description: string;
  completed: boolean;
  assignedAgentId?: string;
  createdAt: number;
  updatedAt: number;
}
