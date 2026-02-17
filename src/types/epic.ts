export type EpicStatus = 'planning' | 'active' | 'completed' | 'cancelled';

export interface Epic {
  id: string;
  epicId: string; // Display ID like "EPIC-1"
  title: string;
  description: string;
  status: EpicStatus;
  userId: string;
  taskIds: string[]; // References to tasks that belong to this epic
  startDate?: number;
  endDate?: number;
  progress: number; // 0-100
  createdAt: number;
  updatedAt: number;
}
