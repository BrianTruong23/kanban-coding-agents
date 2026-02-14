export type BudgetType = 'cost' | 'token' | 'time';
export type BudgetStatus = 'active' | 'paused' | 'exceeded' | 'completed';

export interface TaskBudget {
  id: string;
  taskId: string; // Foreign key to Task.id
  type: BudgetType;

  // Budget limits
  maxCost?: number; // in dollars
  maxTokens?: number; // token count
  maxTime?: number; // in minutes

  // Current usage
  currentCost: number;
  currentTokens: number;
  currentTime: number; // in minutes

  // Retry tracking
  maxRetries?: number;
  currentRetries: number;

  // Status
  status: BudgetStatus;

  // Metadata
  lastUpdated: number;
  createdAt: number;
}

export interface BudgetLog {
  id: string;
  taskBudgetId: string; // Foreign key to TaskBudget.id
  timestamp: number;

  // What changed
  costDelta: number;
  tokensDelta: number;
  timeDelta: number;

  // Context
  agentId?: string;
  action: string; // e.g., "task_execution", "retry", "manual_adjustment"
  notes?: string;
}

export interface ProjectBudget {
  id: string;
  userId: string;
  name: string;

  // Overall limits
  totalMaxCost?: number;
  totalMaxTokens?: number;
  totalMaxTime?: number;

  // Current totals (aggregated from tasks)
  totalCurrentCost: number;
  totalCurrentTokens: number;
  totalCurrentTime: number;

  // Task count
  totalTasks: number;
  activeTasks: number;
  pausedTasks: number;
  exceededTasks: number;
  completedTasks: number;

  // Metadata
  createdAt: number;
  updatedAt: number;
}

// Budget alert thresholds
export interface BudgetAlert {
  id: string;
  taskBudgetId?: string;
  projectBudgetId?: string;

  type: 'warning' | 'critical' | 'exceeded';
  budgetType: BudgetType;
  threshold: number; // percentage (e.g., 80 for 80%)

  message: string;
  triggeredAt: number;
  acknowledged: boolean;
}

// Helper types for budget calculation
export interface BudgetUtilization {
  type: BudgetType;
  max: number;
  current: number;
  percentage: number;
  status: 'safe' | 'warning' | 'critical' | 'exceeded';
}
