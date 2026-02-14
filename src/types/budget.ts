export type BudgetType = 'tokens' | 'cost' | 'time';
export type BudgetStatus = 'active' | 'paused' | 'exceeded' | 'completed';

export interface Budget {
  id: string;
  userId: string;
  taskId: string;

  // Budget limits
  tokenLimit?: number;
  costLimit?: number; // in USD cents
  timeLimit?: number; // in minutes

  // Current usage
  tokensUsed: number;
  costUsed: number; // in USD cents
  timeUsed: number; // in minutes

  // Retry configuration
  maxRetries: number;
  retriesUsed: number;

  // Status
  status: BudgetStatus;
  isPaused: boolean;

  // Timestamps
  createdAt: number;
  updatedAt: number;
  pausedAt?: number;
  completedAt?: number;
}

export interface BudgetUsage {
  id: string;
  budgetId: string;
  taskId: string;

  // Usage details
  tokens: number;
  cost: number; // in USD cents
  timeSpent: number; // in minutes

  // Context
  agentId?: string;
  operation: string; // e.g., "task_execution", "retry", "refinement"
  success: boolean;
  errorMessage?: string;

  // Metadata
  metadata?: Record<string, unknown>;

  createdAt: number;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  taskId: string;

  type: 'warning' | 'critical' | 'exceeded';
  message: string;
  threshold: number; // percentage (e.g., 75 for 75%)

  currentUsage: number;
  limit: number;
  budgetType: BudgetType;

  acknowledged: boolean;
  createdAt: number;
  acknowledgedAt?: number;
}

export interface BudgetSummary {
  taskId: string;
  taskTitle: string;
  budget: Budget;

  // Percentages
  tokenUsagePercent: number;
  costUsagePercent: number;
  timeUsagePercent: number;

  // Status indicators
  hasWarnings: boolean;
  hasCriticalAlerts: boolean;
  isExceeded: boolean;

  // Recent activity
  recentUsages: BudgetUsage[];
  activeAlerts: BudgetAlert[];
}

export interface PMDashboardStats {
  // Overall stats
  totalTasks: number;
  tasksWithBudget: number;
  activeTasksCount: number;
  pausedTasksCount: number;
  exceededTasksCount: number;

  // Aggregate usage
  totalTokensUsed: number;
  totalCostUsed: number; // in USD cents
  totalTimeUsed: number; // in minutes

  totalTokenLimit: number;
  totalCostLimit: number;
  totalTimeLimit: number;

  // Efficiency metrics
  averageTokensPerTask: number;
  averageCostPerTask: number;
  averageTimePerTask: number;

  // Alerts
  totalAlerts: number;
  criticalAlerts: number;
  unacknowledgedAlerts: number;

  // Budget summaries by task
  taskSummaries: BudgetSummary[];
}
