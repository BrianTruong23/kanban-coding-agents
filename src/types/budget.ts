export interface Budget {
  // Cost budget in USD
  costBudget?: number;
  costSpent: number;

  // Token budget
  tokenBudget?: number;
  tokensUsed: number;

  // Time budget in milliseconds
  timeBudget?: number;
  timeSpent: number;

  // Retry configuration
  maxRetries?: number;
  retriesUsed: number;

  // Status
  isPaused: boolean;
  pauseReason?: 'budget_exceeded' | 'manual' | 'error';
}

export interface BudgetUsage {
  timestamp: number;
  costDelta: number;
  tokenDelta: number;
  timeDelta: number;
  operation: string;
  success: boolean;
}

export interface TaskBudgetConfig {
  costBudget?: number;
  tokenBudget?: number;
  timeBudget?: number; // in milliseconds
  maxRetries?: number;
  autoPauseOnExceed?: boolean;
}

export interface AgentBudgetStats {
  agentId: string;
  totalCost: number;
  totalTokens: number;
  totalTime: number;
  tasksCount: number;
  avgCostPerTask: number;
  avgTokensPerTask: number;
  avgTimePerTask: number;
}

export type BudgetStatus = 'under_budget' | 'warning' | 'exceeded' | 'paused';

export interface BudgetAlert {
  id: string;
  taskId: string;
  type: 'cost' | 'token' | 'time' | 'retry';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
}
