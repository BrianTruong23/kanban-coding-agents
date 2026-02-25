export interface CodingAgent {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  avatarColor?: string; // For colored avatar circles
  createdAt: number;
  // Extended fields for Issue #8
  skills?: AgentSkill[];
  performance?: AgentPerformanceMetrics;
}

export interface AgentSkill {
  id: string;
  agentId: string;
  skillName: string;
  skillLevel: 1 | 2 | 3 | 4 | 5; // 1=Beginner, 5=Expert
  createdAt: number;
  updatedAt: number;
}

export interface AgentPerformance {
  id: string;
  agentId: string;
  taskId: string;
  completionTimeHours?: number;
  qualityScore?: 1 | 2 | 3 | 4 | 5; // 1=Poor, 5=Excellent
  onTime?: boolean;
  notes?: string;
  createdAt: number;
}

export interface AgentPerformanceMetrics {
  tasksCompleted: number;
  averageQualityScore: number;
  averageCompletionTime: number;
  onTimePercentage: number;
}
