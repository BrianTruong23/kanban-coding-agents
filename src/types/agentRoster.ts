export interface AgentSkill {
  id: string;
  name: string;
  category: 'frontend' | 'backend' | 'devops' | 'mobile' | 'testing' | 'database' | 'security' | 'ml' | 'other';
  proficiencyLevel: 1 | 2 | 3 | 4 | 5; // 1 = beginner, 5 = expert
}

export interface AgentPerformanceMetrics {
  agentId: string;
  tasksCompleted: number;
  tasksInProgress: number;
  averageCompletionTime: number; // in hours
  successRate: number; // 0-1
  qualityScore: number; // 0-5
  lastActive: number;
  workload: number; // current workload score
}

export interface EnhancedAgent {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  avatarColor?: string;
  skills: AgentSkill[];
  specializations: string[];
  availability: 'available' | 'busy' | 'offline';
  maxConcurrentTasks: number;
  performanceMetrics: AgentPerformanceMetrics;
  createdAt: number;
  userId?: string;
}

export interface AgentAssignmentScore {
  agentId: string;
  score: number;
  reasons: string[];
  skillMatch: number;
  workloadScore: number;
  performanceScore: number;
}

export interface AutoAssignmentConfig {
  considerSkills: boolean;
  considerWorkload: boolean;
  considerPerformance: boolean;
  preferSpecialists: boolean;
  balanceWorkload: boolean;
}
