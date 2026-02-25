export type TaskStatus = 'backlog' | 'in-progress' | 'review' | 'done';
export type TaskType = 'epic' | 'task' | 'subtask';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  taskId: string; // Display ID like "TASK-1"
  title: string;
  description: string;
  status: TaskStatus;
  sprint?: string;
  assignedAgentId?: string;
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  commentsCount?: number;
  attachmentsCount?: number;
  createdAt: number;
  updatedAt: number;
  // New fields for task breakdown
  taskType?: TaskType;
  epicId?: string;
  parentTaskId?: string;
  definitionOfDone?: string;
  testNotes?: string;
  riskLevel?: RiskLevel;
  estimatedHours?: number;
}
