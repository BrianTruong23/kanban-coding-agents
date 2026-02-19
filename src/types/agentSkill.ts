export interface AgentSkill {
  id: string;
  agentId: string;
  skillName: string;
  proficiencyLevel: 1 | 2 | 3 | 4 | 5; // 1=Beginner, 5=Expert
  createdAt: number;
  updatedAt: number;
}
