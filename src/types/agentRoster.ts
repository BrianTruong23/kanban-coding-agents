export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type SkillCategory = 'frontend' | 'backend' | 'database' | 'devops' | 'mobile' | 'testing' | 'design' | 'ai-ml';

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  level: SkillLevel;
}

export interface PerformanceMetrics {
  tasksCompleted: number;
  tasksInProgress: number;
  averageCompletionTime: number; // in hours
  onTimeDeliveryRate: number; // percentage
  qualityScore: number; // 0-100
  lastUpdated: number;
}

export interface AgentAvailability {
  isAvailable: boolean;
  currentCapacity: number; // percentage (0-100)
  maxConcurrentTasks: number;
  currentTasks: string[]; // task IDs
}

export interface AgentRoster {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  avatarColor?: string;
  skills: Skill[];
  performance: PerformanceMetrics;
  availability: AgentAvailability;
  createdAt: number;
  updatedAt: number;
}

export interface AssignmentScore {
  agentId: string;
  score: number; // 0-100
  reasons: string[];
  skillMatch: number; // 0-100
  availabilityScore: number; // 0-100
  performanceScore: number; // 0-100
}

export interface AutoAssignmentConfig {
  preferSkillMatch: boolean;
  considerPerformance: boolean;
  balanceWorkload: boolean;
  respectCapacity: boolean;
}
