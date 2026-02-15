export interface Budget {
  id: string;
  taskId: string; // References Task.id
  userId: string;

  // Budget limits
  maxCost?: number; // In dollars
  maxTokens?: number; // Token count
  maxTime?: number; // In minutes

  // Current usage
  currentCost: number; // In dollars
  currentTokens: number; // Token count
  currentTime: number; // In minutes

  // Retry budget
  maxRetries?: number;
  currentRetries: number;

  // Budget status
  status: 'active' | 'paused' | 'exceeded' | 'completed';
  pausedReason?: string;

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

export interface BudgetUsage {
  id: string;
  budgetId: string;
  taskId: string;

  // Usage details
  cost: number; // Cost of this specific operation
  tokens: number; // Tokens used in this operation
  time: number; // Time taken in minutes

  operation: string; // Description of what was done
  agentId?: string; // Which agent performed this

  // Metadata
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  taskId: string;

  type: 'warning' | 'critical' | 'exceeded';
  category: 'cost' | 'tokens' | 'time' | 'retries';
  message: string;

  threshold: number; // Percentage of budget used when alert was triggered
  currentValue: number;
  maxValue: number;

  createdAt: number;
  acknowledged: boolean;
}

export interface BudgetSummary {
  totalTasks: number;
  activeBudgets: number;
  pausedBudgets: number;
  exceededBudgets: number;

  totalCostBudget: number;
  totalCostUsed: number;

  totalTokensBudget: number;
  totalTokensUsed: number;

  totalTimeBudget: number;
  totalTimeUsed: number;

  alerts: BudgetAlert[];
}
