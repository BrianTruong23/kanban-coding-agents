export interface AgentSkill {
  id: string;
  userId: string;
  agentId: string;
  skillName: string;
  skillLevel: 1 | 2 | 3 | 4 | 5; // 1=Beginner, 5=Expert
  createdAt: number;
  updatedAt: number;
}

export interface AgentPerformance {
  id: string;
  userId: string;
  agentId: string;
  taskId: string;
  completionTimeHours?: number;
  qualityScore?: 1 | 2 | 3 | 4 | 5;
  onTime: boolean;
  notes?: string;
  createdAt: number;
}

export interface AgentWithSkills extends import('./agent').CodingAgent {
  skills: AgentSkill[];
  performanceMetrics?: {
    averageCompletionTime: number;
    averageQualityScore: number;
    onTimePercentage: number;
    totalTasksCompleted: number;
  };
}

export interface AgentAssignmentRecommendation {
  agentId: string;
  agentName: string;
  score: number; // 0-100
  reasons: string[];
  matchedSkills: string[];
  availabilityScore: number;
  performanceScore: number;
}
