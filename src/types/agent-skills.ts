export type SkillCategory =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'devops'
  | 'testing'
  | 'design'
  | 'mobile'
  | 'ai-ml'
  | 'security';

export interface AgentSkill {
  id: string;
  agentId: string;
  category: SkillCategory;
  name: string; // e.g., "React", "Node.js", "PostgreSQL"
  proficiency: 1 | 2 | 3 | 4 | 5; // 1 = beginner, 5 = expert
  yearsOfExperience?: number;
  createdAt: number;
  updatedAt: number;
}

export interface AgentPerformance {
  id: string;
  agentId: string;
  taskId: string;
  completionTime: number; // in milliseconds
  qualityScore: 1 | 2 | 3 | 4 | 5; // 1 = poor, 5 = excellent
  onTime: boolean;
  requiresRevision: boolean;
  notes?: string;
  createdAt: number;
}

export interface AgentMetrics {
  agentId: string;
  totalTasksCompleted: number;
  averageCompletionTime: number;
  averageQualityScore: number;
  onTimePercentage: number;
  revisionRate: number;
  skillMatch: number; // 0-100 percentage match with task requirements
}

export interface TaskRequirement {
  id: string;
  taskId: string;
  skillCategory: SkillCategory;
  skillName: string;
  requiredProficiency: 1 | 2 | 3 | 4 | 5;
  importance: 'required' | 'preferred' | 'nice-to-have';
  createdAt: number;
}
