export type SubtaskStatus = 'pending' | 'in-progress' | 'completed' | 'blocked';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Subtask {
  id: string;
  taskId: string;
  subtaskId: string;
  title: string;
  description: string;
  status: SubtaskStatus;
  assignedAgentId?: string;
  definitionOfDone?: string;
  testNotes?: string;
  riskLevel?: RiskLevel;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: number;
  updatedAt: number;
}
