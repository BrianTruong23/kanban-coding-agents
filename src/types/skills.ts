// Types for agent skills and performance tracking

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  level: 1 | 2 | 3 | 4 | 5; // 1 = beginner, 5 = expert
}

export type SkillCategory =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'devops'
  | 'mobile'
  | 'testing'
  | 'design'
  | 'security'
  | 'ai-ml'
  | 'other';

export interface AgentPerformance {
  agentId: string;
  tasksCompleted: number;
  tasksInProgress: number;
  averageCompletionTime: number; // in hours
  successRate: number; // percentage
  qualityScore: number; // 1-5
  lastActive: number;
  velocity: number; // tasks per week
  specializations: SkillCategory[];
}

export interface AgentSkills {
  agentId: string;
  skills: Skill[];
  totalExperience: number; // in months
  preferredTaskTypes: string[];
  availability: 'available' | 'busy' | 'offline';
  workload: number; // current number of assigned tasks
}

export interface AssignmentScore {
  agentId: string;
  score: number; // 0-100
  reasons: string[];
  skillMatch: number; // 0-100
  performanceMatch: number; // 0-100
  availabilityMatch: number; // 0-100
  workloadMatch: number; // 0-100
}

export interface AssignmentRecommendation {
  taskId: string;
  recommendations: AssignmentScore[];
  bestMatch: AssignmentScore;
  confidence: number; // 0-100
}
