export type SubtaskStatus = 'todo' | 'in-progress' | 'review' | 'done' | 'blocked';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Subtask {
  id: string;
  parentTaskId: string;
  subtaskId: string; // Display ID like "SUBTASK-1"
  title: string;
  description: string;
  status: SubtaskStatus;
  priority: 1 | 2 | 3 | 4 | 5;
  assignedAgentId?: string;
  definitionOfDone?: string;
  testNotes?: string;
  riskLevel: RiskLevel;
  riskDescription?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: number;
  updatedAt: number;
}
