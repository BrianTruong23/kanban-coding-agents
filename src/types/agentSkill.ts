export interface AgentSkill {
  id: string;
  agentId: string;
  skillName: string;
  proficiency: 1 | 2 | 3 | 4 | 5; // 1=Beginner, 5=Expert
  performanceScore: number; // Track performance over time
  tasksCompleted: number;
  createdAt: number;
}

export interface AgentWithSkills {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  avatarColor?: string;
  skills: AgentSkill[];
  createdAt: number;
}
