export type BudgetLogType = 'token' | 'cost' | 'time' | 'retry' | 'pause' | 'resume';

export interface BudgetLimits {
  tokenBudget?: number;
  costBudget?: number; // in cents
  timeBudget?: number; // in minutes
  maxRetries?: number;
}

export interface BudgetUsage {
  tokenSpent: number;
  costSpent: number; // in cents
  timeSpent: number; // in minutes
  retryCount: number;
}

export interface BudgetStatus {
  limits: BudgetLimits;
  usage: BudgetUsage;
  isPaused: boolean;
  pauseReason?: string;
  isOverBudget: boolean;
  percentages: {
    tokens?: number;
    cost?: number;
    time?: number;
  };
}

export interface TaskBudgetLog {
  id: string;
  taskId: string;
  userId: string;
  logType: BudgetLogType;
  tokensUsed: number;
  costIncurred: number; // in cents
  timeTaken: number; // in minutes
  details?: string;
  createdAt: number;
}

export interface BudgetAlert {
  type: 'warning' | 'critical' | 'exceeded';
  resource: 'tokens' | 'cost' | 'time' | 'retries';
  message: string;
  percentage: number;
}
