export interface TaskBudget {
  id: string;
  taskId: string; // References task.id
  // Budget limits
  maxTokens?: number;
  maxCost?: number; // in USD
  maxTimeMinutes?: number;
  maxRetries?: number;

  // Current usage
  tokensUsed: number;
  costUsed: number;
  timeUsedMinutes: number;
  retriesUsed: number;

  // Status
  status: 'active' | 'paused' | 'exceeded' | 'completed';
  pausedReason?: string;

  // Metadata
  createdAt: number;
  updatedAt: number;
}

export interface BudgetUsageLog {
  id: string;
  budgetId: string;
  taskId: string;

  // Usage details
  tokensUsed: number;
  costIncurred: number;
  timeSpentMinutes: number;

  // Event details
  eventType: 'execution' | 'retry' | 'pause' | 'resume' | 'manual_adjustment';
  description?: string;
  agentId?: string;

  timestamp: number;
}

export interface ProjectBudget {
  id: string;
  userId: string;
  name: string;

  // Aggregate limits (optional - for project-wide limits)
  maxTokens?: number;
  maxCost?: number;
  maxTimeMinutes?: number;

  // Current totals
  totalTokensUsed: number;
  totalCostUsed: number;
  totalTimeUsedMinutes: number;
  totalTasksCompleted: number;

  // Metadata
  createdAt: number;
  updatedAt: number;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  taskId?: string;

  alertType: 'warning' | 'critical' | 'exceeded';
  resourceType: 'tokens' | 'cost' | 'time' | 'retries';
  threshold: number; // percentage (e.g., 80 for 80%)
  message: string;

  acknowledged: boolean;
  timestamp: number;
}

// Helper types for budget calculations
export interface BudgetMetrics {
  tokensPercent: number;
  costPercent: number;
  timePercent: number;
  retriesPercent: number;
  overallPercent: number;
  isNearLimit: boolean; // 80% or more
  isExceeded: boolean;
}

export interface BudgetUpdateInput {
  tokensUsed?: number;
  costIncurred?: number;
  timeSpentMinutes?: number;
  retriesUsed?: number;
  description?: string;
}
