export type SkillCategory =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'devops'
  | 'mobile'
  | 'testing'
  | 'design'
  | 'api';

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  proficiencyLevel: 1 | 2 | 3 | 4 | 5; // 1 = Beginner, 5 = Expert
}

export interface AgentSkill {
  agentId: string;
  skillId: string;
  proficiencyLevel: 1 | 2 | 3 | 4 | 5;
  createdAt: number;
}

export interface AgentPerformance {
  id: string;
  agentId: string;
  tasksCompleted: number;
  tasksOnTime: number;
  averageCompletionTime: number; // in hours
  qualityScore: number; // 0-100
  lastUpdated: number;
}

export interface AutoAssignmentConfig {
  enabled: boolean;
  considerSkills: boolean;
  considerWorkload: boolean;
  considerPerformance: boolean;
  balanceWorkload: boolean;
}
