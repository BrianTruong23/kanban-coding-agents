// Agent skills and performance tracking types

export type SkillCategory =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'devops'
  | 'testing'
  | 'ui-ux'
  | 'mobile'
  | 'api-design';

export interface AgentSkill {
  id: string;
  agentId: string;
  skillName: string;
  category: SkillCategory;
  proficiencyLevel: 1 | 2 | 3 | 4 | 5; // 1 = beginner, 5 = expert
  createdAt: number;
  updatedAt: number;
}

export interface AgentPerformanceMetrics {
  id: string;
  agentId: string;
  tasksCompleted: number;
  tasksInProgress: number;
  averageCompletionTime: number; // in hours
  successRate: number; // 0-100
  lastActivityAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface TaskAssignment {
  taskId: string;
  agentId: string;
  assignedAt: number;
  completedAt?: number;
  wasAutoAssigned: boolean;
  matchScore: number; // 0-100, how well the agent matched the task requirements
}

export interface AgentAvailability {
  agentId: string;
  isAvailable: boolean;
  currentWorkload: number; // number of tasks in progress
  maxCapacity: number; // maximum tasks the agent can handle
}

export interface SkillMatchResult {
  agentId: string;
  agentName: string;
  matchScore: number;
  matchingSkills: string[];
  currentWorkload: number;
  successRate: number;
  averageCompletionTime: number;
  recommended: boolean;
}
