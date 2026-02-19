export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskFlag {
  id: string;
  taskId: string;
  riskLevel: RiskLevel;
  description: string;
  mitigationStrategy?: string;
  resolved: boolean;
  createdAt: number;
  updatedAt: number;
}
