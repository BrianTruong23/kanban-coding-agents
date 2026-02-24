export interface AgentSkill {
  id: string;
  agentId: string;
  skillName: string;
  proficiencyLevel: 1 | 2 | 3 | 4 | 5;
  createdAt: number;
}

export interface AgentPerformance {
  id: string;
  agentId: string;
  taskId: string;
  completedOnTime: boolean;
  qualityScore?: 1 | 2 | 3 | 4 | 5;
  createdAt: number;
}

export interface AgentStats {
  agentId: string;
  totalTasks: number;
  completedTasks: number;
  onTimeRate: number; // percentage
  averageQualityScore: number;
  topSkills: AgentSkill[];
}

export interface AgentWithSkills {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  avatarColor?: string;
  skills: AgentSkill[];
  stats?: AgentStats;
  createdAt: number;
}
