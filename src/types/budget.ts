export interface TaskBudget {
  // Cost-based budgets
  maxCostUsd?: number;
  currentCostUsd: number;

  // Token-based budgets
  maxTokens?: number;
  currentTokens: number;

  // Time-based budgets
  maxTimeMinutes?: number;
  currentTimeMinutes: number;

  // Retry configuration
  maxRetries?: number;
  currentRetries: number;

  // Status tracking
  isPaused: boolean;
  pausedReason?: string;
  pausedAt?: number;

  // Timestamps
  budgetStartedAt?: number;
  lastUpdatedAt: number;
}

export interface BudgetUpdate {
  costUsd?: number;
  tokens?: number;
  timeMinutes?: number;
  retries?: number;
}

export interface BudgetStatus {
  isOverBudget: boolean;
  costPercentage: number;
  tokenPercentage: number;
  timePercentage: number;
  retriesPercentage: number;
  warnings: BudgetWarning[];
}

export interface BudgetWarning {
  type: 'cost' | 'token' | 'time' | 'retry';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  percentage: number;
}

export interface BudgetSummary {
  totalTasks: number;
  totalBudgetUsd: number;
  totalSpentUsd: number;
  totalBudgetTokens: number;
  totalSpentTokens: number;
  totalBudgetTime: number;
  totalSpentTime: number;
  pausedTasks: number;
  overBudgetTasks: number;
  tasksByStatus: {
    backlog: number;
    'in-progress': number;
    review: number;
    done: number;
  };
}

export const DEFAULT_BUDGET: TaskBudget = {
  currentCostUsd: 0,
  currentTokens: 0,
  currentTimeMinutes: 0,
  currentRetries: 0,
  isPaused: false,
  lastUpdatedAt: Date.now(),
};
