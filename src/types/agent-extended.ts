// Extended agent types for skills and performance tracking

export type SkillCategory =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'devops'
  | 'testing'
  | 'mobile'
  | 'ui-ux'
  | 'api-design';

export interface AgentSkill {
  id: string;
  agentId: string;
  category: SkillCategory;
  name: string; // e.g., "React", "Node.js", "PostgreSQL"
  proficiency: 1 | 2 | 3 | 4 | 5; // 1 = beginner, 5 = expert
  createdAt: number;
  updatedAt: number;
}

export interface AgentPerformanceMetrics {
  id: string;
  agentId: string;
  tasksCompleted: number;
  tasksInProgress: number;
  averageCompletionTime: number; // in hours
  successRate: number; // percentage (0-100)
  lastTaskCompletedAt?: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  currentWorkload: number; // number of active tasks
  createdAt: number;
  updatedAt: number;
}

export interface AgentAvailability {
  id: string;
  agentId: string;
  available: boolean;
  maxConcurrentTasks: number;
  currentTasks: number;
  notes?: string;
  updatedAt: number;
}

export interface AutoAssignmentScore {
  agentId: string;
  score: number;
  reasons: string[];
  skillMatch: number; // 0-1
  availabilityScore: number; // 0-1
  performanceScore: number; // 0-1
  workloadScore: number; // 0-1
}

export interface AgentRoster {
  agents: Array<{
    id: string;
    name: string;
    description?: string;
    avatar?: string;
    avatarColor?: string;
    skills: AgentSkill[];
    performance: AgentPerformanceMetrics;
    availability: AgentAvailability;
  }>;
}
