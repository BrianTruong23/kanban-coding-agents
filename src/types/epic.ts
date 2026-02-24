export type EpicStatus = 'planning' | 'in-progress' | 'review' | 'completed' | 'cancelled';

export interface Epic {
  id: string;
  epicId: string;
  title: string;
  description: string;
  status: EpicStatus;
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  sprint?: string;
  createdAt: number;
  updatedAt: number;
}
