export type BudgetType = 'cost' | 'tokens' | 'time';

export interface Budget {
  id: string;
  taskId: string; // References task.id
  userId: string;

  // Budget limits
  maxCost?: number; // in dollars
  maxTokens?: number; // total tokens
  maxTime?: number; // in minutes

  // Current usage
  currentCost: number;
  currentTokens: number;
  currentTime: number; // in minutes

  // Retry management
  maxRetries: number;
  currentRetries: number;

  // Status
  status: 'active' | 'paused' | 'exceeded' | 'completed';
  pausedReason?: string;

  // Metadata
  createdAt: number;
  updatedAt: number;
}

export interface BudgetUsageEntry {
  id: string;
  budgetId: string;
  taskId: string;

  // Usage details
  costIncurred: number;
  tokensUsed: number;
  timeSpent: number; // in minutes

  // Execution details
  agentId?: string;
  operation: string; // description of what was done
  success: boolean;
  errorMessage?: string;

  timestamp: number;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  taskId: string;

  alertType: 'warning' | 'critical' | 'exceeded';
  budgetType: BudgetType;
  message: string;

  // Threshold that triggered the alert (e.g., 80% for warning, 95% for critical)
  threshold: number;
  currentUsage: number;
  limit: number;

  acknowledged: boolean;
  createdAt: number;
}

export interface BudgetSummary {
  totalBudgets: number;
  activeBudgets: number;
  pausedBudgets: number;
  exceededBudgets: number;

  totalAllocatedCost: number;
  totalSpentCost: number;

  totalAllocatedTokens: number;
  totalSpentTokens: number;

  totalAllocatedTime: number;
  totalSpentTime: number;
}
