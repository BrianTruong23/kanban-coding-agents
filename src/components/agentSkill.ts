export type SkillCategory = 'frontend' | 'backend' | 'devops' | 'testing' | 'mobile' | 'database' | 'ai' | 'design' | 'other';

export interface AgentSkill {
  id: string;
  agentId: string;
  skillName: string;
  skillCategory: SkillCategory;
  proficiencyLevel: 1 | 2 | 3 | 4 | 5; // 1=Beginner, 5=Expert
  createdAt: number;
  updatedAt: number;
}

export interface AgentPerformance {
  id: string;
  agentId: string;
  taskId?: string;
  subtaskId?: string;
  completedAt: number;
  estimatedHours?: number;
  actualHours?: number;
  qualityScore?: 1 | 2 | 3 | 4 | 5; // 1-5 rating
  notes?: string;
  createdAt: number;
}

export interface AgentWorkload {
  totalTasks: number;
  inProgressTasks: number;
  avgQualityScore: number;
}
