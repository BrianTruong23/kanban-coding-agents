// Agent skill levels
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// Agent skill interface
export interface AgentSkill {
  name: string;
  level: SkillLevel;
  yearsOfExperience?: number;
}

// Agent performance metrics
export interface AgentPerformance {
  tasksCompleted: number;
  tasksInProgress: number;
  successRate: number; // 0-1
  averageCompletionTime: number; // in hours
  qualityScore: number; // 0-100
  reliability: number; // 0-100
  totalHoursWorked: number;
  lastActiveAt: number; // timestamp
}

// Agent availability
export interface AgentAvailability {
  status: 'available' | 'busy' | 'offline';
  currentWorkload: number; // percentage 0-100
  maxCapacity: number; // max concurrent tasks
  timezone?: string;
}

export interface CodingAgent {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  avatarColor?: string; // For colored avatar circles
  createdAt: number;
  skills: AgentSkill[];
  specializations?: string[];
  performance: AgentPerformance;
  availability: AgentAvailability;
}
