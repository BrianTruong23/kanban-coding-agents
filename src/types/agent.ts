export interface CodingAgent {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  avatarColor?: string; // For colored avatar circles
  createdAt: number;
}

export interface AgentSkill {
  id: string;
  agentId: string;
  skillName: string;
  skillLevel: 1 | 2 | 3 | 4 | 5; // 1=beginner, 5=expert
  createdAt: number;
}

export interface AgentPerformance {
  id: string;
  agentId: string;
  taskId: string;
  completionTimeHours?: number;
  qualityScore?: 1 | 2 | 3 | 4 | 5; // 1=poor, 5=excellent
  completedAt: number;
}

export interface AgentWithSkills extends CodingAgent {
  skills: AgentSkill[];
  performanceMetrics?: {
    averageCompletionTime?: number;
    averageQualityScore?: number;
    tasksCompleted: number;
  };
}
