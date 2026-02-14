export type SkillCategory =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'devops'
  | 'testing'
  | 'mobile'
  | 'ai-ml'
  | 'security'
  | 'design'
  | 'documentation';

export interface Skill {
  id: string;
  category: SkillCategory;
  name: string;
  proficiencyLevel: 1 | 2 | 3 | 4 | 5; // 1=Beginner, 5=Expert
}

export interface PerformanceMetric {
  taskId: string;
  taskTitle: string;
  completedAt: number;
  estimatedHours?: number;
  actualHours?: number;
  qualityScore: 1 | 2 | 3 | 4 | 5; // 1=Poor, 5=Excellent
  onTime: boolean;
  feedback?: string;
}

export interface AgentRoster {
  agentId: string;
  name: string;
  avatar?: string;
  avatarColor?: string;
  skills: Skill[];
  performanceMetrics: PerformanceMetric[];
  availability: 'available' | 'busy' | 'unavailable';
  currentWorkload: number; // Number of tasks assigned
  averageQualityScore?: number;
  completionRate?: number; // Percentage of tasks completed on time
  totalTasksCompleted: number;
  createdAt: number;
  updatedAt: number;
}

export interface AssignmentScore {
  agentId: string;
  score: number;
  reasons: string[];
}
