export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface AgentSkill {
  id: string;
  agentId: string;
  skillName: string;
  skillCategory: 'frontend' | 'backend' | 'devops' | 'mobile' | 'testing' | 'design' | 'database' | 'ai-ml' | 'other';
  level: SkillLevel;
  yearsOfExperience?: number;
  certifications?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface AgentPerformanceMetrics {
  id: string;
  agentId: string;
  totalTasksCompleted: number;
  totalTasksInProgress: number;
  averageCompletionTime: number; // in hours
  onTimeDeliveryRate: number; // percentage
  qualityScore: number; // 0-100
  collaborationScore: number; // 0-100
  currentWorkload: number; // number of active tasks
  capacity: number; // max concurrent tasks
  lastUpdated: number;
}

export interface AgentAvailability {
  id: string;
  agentId: string;
  isAvailable: boolean;
  availableFrom?: number; // timestamp
  availableUntil?: number; // timestamp
  timezone?: string;
  workingHours?: {
    start: string; // e.g., "09:00"
    end: string; // e.g., "17:00"
  };
  daysOff?: string[]; // e.g., ["saturday", "sunday"]
}

export interface AssignmentRule {
  id: string;
  name: string;
  description?: string;
  priority: number; // Higher number = higher priority
  conditions: {
    requiredSkills?: string[];
    minSkillLevel?: SkillLevel;
    maxWorkload?: number;
    minQualityScore?: number;
    taskPriority?: number[];
    taskTags?: string[];
  };
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AutoAssignmentSuggestion {
  taskId: string;
  suggestedAgentId: string;
  confidence: number; // 0-100
  reason: string;
  matchedSkills: string[];
  estimatedCompletionTime?: number; // in hours
  alternativeAgents?: Array<{
    agentId: string;
    confidence: number;
    reason: string;
  }>;
}

export interface AgentRoster {
  agentId: string;
  name: string;
  skills: AgentSkill[];
  performance: AgentPerformanceMetrics;
  availability: AgentAvailability;
  currentTasks: string[]; // task IDs
}

export interface OrchestrationConfig {
  autoAssignEnabled: boolean;
  considerWorkload: boolean;
  considerSkillLevel: boolean;
  considerPerformance: boolean;
  considerAvailability: boolean;
  minConfidenceThreshold: number; // 0-100, minimum confidence for auto-assignment
  balanceWorkload: boolean;
  prioritizeSpecialization: boolean;
}
