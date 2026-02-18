export type EpicStatus = 'planning' | 'in-progress' | 'review' | 'done' | 'blocked';

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
}
