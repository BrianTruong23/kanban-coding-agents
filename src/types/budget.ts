export interface TaskBudget {
  id: string;
  taskId: string;
  maxCost?: number; // Max cost in dollars
  maxTokens?: number; // Max tokens allowed
  maxTime?: number; // Max time in seconds
  currentCost: number; // Current spent cost
  currentTokens: number; // Current used tokens
  currentTime: number; // Current used time in seconds
  retryCount: number; // Number of retries attempted
  maxRetries: number; // Max retries allowed
  status: 'active' | 'paused' | 'exceeded' | 'completed';
  createdAt: number;
  updatedAt: number;
}

export interface BudgetUsageLog {
  id: string;
  taskId: string;
  timestamp: number;
  cost: number;
  tokens: number;
  timeSpent: number; // in seconds
  operation: string; // e.g., "api_call", "retry", "completion"
  notes?: string;
}

export interface ProjectBudget {
  id: string;
  userId: string;
  name: string;
  description?: string;
  totalBudget: number; // Total budget in dollars
  spentBudget: number; // Spent budget in dollars
  totalTokens?: number; // Total token limit
  usedTokens?: number; // Used tokens
  startDate: number;
  endDate?: number;
  status: 'active' | 'completed' | 'exceeded';
  createdAt: number;
  updatedAt: number;
}

export interface BudgetAlert {
  id: string;
  taskId?: string;
  projectId?: string;
  type: 'warning' | 'critical' | 'exceeded';
  threshold: number; // Percentage threshold (e.g., 80 for 80%)
  message: string;
  triggeredAt: number;
  acknowledged: boolean;
}

export type BudgetMetrics = {
  totalTasks: number;
  activeTasks: number;
  pausedTasks: number;
  exceededTasks: number;
  completedTasks: number;
  totalCost: number;
  totalTokens: number;
  totalTime: number;
  averageCostPerTask: number;
  averageTokensPerTask: number;
  averageTimePerTask: number;
};
