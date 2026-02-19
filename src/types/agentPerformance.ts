export interface AgentPerformance {
  id: string;
  agentId: string;
  taskId: string;
  completionTimeHours?: number;
  qualityRating?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  createdAt: number;
}
