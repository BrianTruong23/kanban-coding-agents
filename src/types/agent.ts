export interface AgentSkill {
  name: string;
  level: 1 | 2 | 3 | 4 | 5; // 1 = Beginner, 5 = Expert
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'mobile' | 'testing' | 'design' | 'other';
}

export interface AgentPerformanceMetrics {
  tasksCompleted: number;
  tasksInProgress: number;
  averageCompletionTime: number; // in hours
  successRate: number; // 0-1
  lastActiveDate?: number;
  specializations: string[]; // Tags they excel at
}

export interface CodingAgent {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  avatarColor?: string; // For colored avatar circles
  skills?: AgentSkill[];
  performance?: AgentPerformanceMetrics;
  availability?: 'available' | 'busy' | 'offline';
  maxConcurrentTasks?: number;
  createdAt: number;
}
