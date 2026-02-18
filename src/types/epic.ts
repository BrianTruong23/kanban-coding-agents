export type EpicStatus = 'planning' | 'in-progress' | 'completed' | 'cancelled';

export interface Epic {
  id: string;
  epicId: string; // Display ID like "EPIC-1"
  title: string;
  description: string;
  status: EpicStatus;
  priority: 1 | 2 | 3 | 4 | 5;
  createdAt: number;
  updatedAt: number;
}
