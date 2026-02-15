export type SkillCategory =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'devops'
  | 'mobile'
  | 'testing'
  | 'ui-ux'
  | 'security';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  level: SkillLevel;
}

export interface AgentSkill {
  id: string;
  agentId: string;
  skillName: string;
  skillCategory: SkillCategory;
  proficiencyLevel: SkillLevel;
  yearsOfExperience?: number;
  createdAt: number;
  updatedAt: number;
}

export interface AgentPerformanceMetrics {
  id: string;
  agentId: string;
  totalTasksCompleted: number;
  totalTasksAssigned: number;
  averageCompletionTime: number; // in hours
  successRate: number; // 0-100
  onTimeDeliveryRate: number; // 0-100
  codeQualityScore?: number; // 0-100
  lastUpdated: number;
}

export interface AgentAvailability {
  id: string;
  agentId: string;
  currentWorkload: number; // Number of tasks in progress
  maxCapacity: number; // Maximum concurrent tasks
  isAvailable: boolean;
  availableFrom?: number; // Timestamp when they'll be available
  createdAt: number;
  updatedAt: number;
}

export interface EnhancedAgent {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  avatarColor?: string;
  skills: AgentSkill[];
  performance?: AgentPerformanceMetrics;
  availability?: AgentAvailability;
  createdAt: number;
}

export interface AgentMatchScore {
  agentId: string;
  agentName: string;
  score: number; // 0-100
  matchReasons: string[];
  skillMatches: Array<{
    skillName: string;
    required: boolean;
    agentLevel: SkillLevel;
  }>;
  workloadFactor: number; // 0-1, lower is better
  performanceFactor: number; // 0-1, higher is better
}

export interface AutoAssignmentCriteria {
  requiredSkills: Array<{
    skillName: string;
    category: SkillCategory;
    minLevel?: SkillLevel;
    weight?: number; // Importance weight, default 1
  }>;
  preferredSkills?: Array<{
    skillName: string;
    category: SkillCategory;
    weight?: number;
  }>;
  priority: 1 | 2 | 3 | 4 | 5;
  estimatedHours?: number;
  considerWorkload?: boolean;
  considerPerformance?: boolean;
}
