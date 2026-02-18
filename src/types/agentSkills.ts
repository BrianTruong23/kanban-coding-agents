import { CodingAgent } from './agent';

export type SkillCategory =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'devops'
  | 'testing'
  | 'ui-ux'
  | 'architecture'
  | 'security'
  | 'mobile'
  | 'api-design';

export interface AgentSkill {
  id: string;
  category: SkillCategory;
  name: string;
  proficiency: 1 | 2 | 3 | 4 | 5; // 1 = beginner, 5 = expert
  experienceYears?: number;
}

export interface AgentPerformanceMetrics {
  agentId: string;
  tasksCompleted: number;
  tasksInProgress: number;
  averageCompletionTime: number; // in hours
  successRate: number; // 0-100
  onTimeDeliveryRate: number; // 0-100
  qualityScore: number; // 0-100, based on reviews/feedback
  lastActive: number;
  totalHoursWorked: number;
  specializations: SkillCategory[];
}

export interface AgentWorkload {
  agentId: string;
  currentTasks: number;
  estimatedHoursRemaining: number;
  availability: 'available' | 'busy' | 'overloaded' | 'offline';
}

export interface ExtendedAgent extends CodingAgent {
  skills: AgentSkill[];
  performance: AgentPerformanceMetrics;
  workload: AgentWorkload;
  preferences?: {
    preferredTaskTypes?: ('epic' | 'ticket' | 'subtask')[];
    preferredComplexity?: ('low' | 'medium' | 'high')[];
    maxConcurrentTasks?: number;
  };
  status: 'active' | 'inactive' | 'on-leave';
}

export interface AgentAssignmentScore {
  agentId: string;
  score: number; // 0-100
  reasons: string[];
  skillMatch: number; // 0-100
  availabilityScore: number; // 0-100
  performanceScore: number; // 0-100
  workloadScore: number; // 0-100
}
