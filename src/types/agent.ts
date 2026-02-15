export type SkillCategory =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'devops'
  | 'mobile'
  | 'testing'
  | 'design'
  | 'architecture';

export interface Skill {
  id: string;
  category: SkillCategory;
  name: string;
  proficiency: 1 | 2 | 3 | 4 | 5; // 1-5 scale
}

export interface AgentAvailability {
  status: 'available' | 'busy' | 'offline';
  currentWorkload: number;
  capacity: number; // max concurrent tasks
  hoursPerWeek: number; // available hours per week
}

export interface AgentPerformance {
  tasksCompleted: number;
  tasksOnTime: number;
  qualityScore: number; // 0-100
}

export interface CodingAgent {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  avatarColor?: string; // For colored avatar circles
  createdAt: number;
  skills?: Skill[];
  availability?: AgentAvailability;
  performance?: AgentPerformance;
}
