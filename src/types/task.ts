export type TaskStatus = 'backlog' | 'in-progress' | 'review' | 'done';
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
  epicId?: string; // Link to parent epic
  parentTaskId?: string; // For subtasks
  definitionOfDone?: string[]; // Checklist items
  testNotes?: string; // Testing instructions
  riskLevel?: RiskLevel; // Risk assessment
  riskFlags?: string[]; // Specific risk flags
  estimatedHours?: number; // Time estimate
  createdAt: number;
  updatedAt: number;
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: 'blocks' | 'relates_to' | 'duplicates';
  createdAt: number;
}
