export interface Epic {
  id: string;
  epicId: string; // Display ID like "EPIC-1"
  title: string;
  description: string;
  status: 'backlog' | 'in-progress' | 'review' | 'done';
  priority: 1 | 2 | 3 | 4 | 5;
  createdAt: number;
  updatedAt: number;
}
