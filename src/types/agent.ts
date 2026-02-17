export type AgentSkill = 'frontend' | 'backend' | 'fullstack' | 'devops' | 'mobile' | 'database' | 'testing' | 'ui-ux' | 'api' | 'security';

export interface AgentPerformanceMetrics {
  tasksCompleted: number;
  averageCompletionTime: number; // in hours
  successRate: number; // 0-100
  currentWorkload: number; // number of active tasks
  skillRatings: Map<AgentSkill, number>; // skill -> rating (0-5)
}

export interface CodingAgent {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  avatarColor?: string; // For colored avatar circles
  skills: AgentSkill[];
  performance?: AgentPerformanceMetrics;
  isActive: boolean;
  maxConcurrentTasks: number;
  createdAt: number;
}
