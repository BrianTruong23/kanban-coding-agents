export type SkillCategory =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'devops'
  | 'testing'
  | 'mobile'
  | 'design'
  | 'architecture';

export interface AgentSkill {
  id: string;
  name: string; // e.g., "React", "Node.js", "PostgreSQL"
  category: SkillCategory;
  proficiencyLevel: 1 | 2 | 3 | 4 | 5; // 1 = beginner, 5 = expert
  yearsOfExperience?: number;
}

export interface AgentPerformanceMetrics {
  tasksCompleted: number;
  tasksInProgress: number;
  averageCompletionTime: number; // in hours
  onTimeDeliveryRate: number; // 0-1
  codeQualityScore: number; // 0-100
  bugRate: number; // bugs per 100 tasks
  collaborationScore: number; // 0-100
  lastActive: number; // timestamp
}

export interface AgentAvailability {
  status: 'available' | 'busy' | 'offline';
  currentLoad: number; // number of tasks assigned
  maxLoad: number; // max concurrent tasks
  availableFrom?: number; // timestamp
}

export interface EnhancedAgent {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  avatarColor?: string;

  // New fields
  skills: AgentSkill[];
  performance: AgentPerformanceMetrics;
  availability: AgentAvailability;
  preferences?: {
    preferredTaskTypes?: string[];
    workingHours?: {
      start: number; // hour 0-23
      end: number;
    };
  };

  createdAt: number;
}

export interface AgentMatchScore {
  agentId: string;
  score: number; // 0-100
  reasons: {
    factor: string;
    impact: number; // positive or negative
    description: string;
  }[];
}
