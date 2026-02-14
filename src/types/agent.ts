export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface AgentSkill {
  id: string;
  agentId: string;
  skillName: string;
  level: SkillLevel;
  yearsExperience?: number;
  createdAt: number;
}

export interface AgentPerformance {
  id: string;
  agentId: string;
  tasksCompleted: number;
  tasksOnTime: number;
  tasksLate: number;
  averageCompletionTime: number; // in hours
  qualityScore: number; // 0-100
  lastUpdated: number;
}

export interface CodingAgent {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  avatarColor?: string; // For colored avatar circles
  isAvailable?: boolean;
  currentWorkload?: number;
  skills?: AgentSkill[];
  performance?: AgentPerformance;
  createdAt: number;
}
