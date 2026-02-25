export type TaskStatus = 'backlog' | 'in-progress' | 'review' | 'done';
export type TaskType = 'epic' | 'story' | 'subtask';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type DependencyType = 'blocks' | 'blocked-by' | 'related-to';

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
  // Extended fields for Issue #8
  definitionOfDone?: string[];
  testNotes?: string;
  riskLevel?: RiskLevel;
  riskNotes?: string;
  parentEpicId?: string;
  parentTaskId?: string;
  taskType?: TaskType;
  estimatedHours?: number;
  actualHours?: number;
}

export interface Epic {
  id: string;
  epicId: string; // Display ID like "EPIC-1"
  title: string;
  description: string;
  status: 'planning' | 'in-progress' | 'review' | 'done' | 'cancelled';
  sprint?: string;
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  definitionOfDone?: string[];
  riskLevel?: RiskLevel;
  riskNotes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: DependencyType;
  createdAt: number;
}
