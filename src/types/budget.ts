/**
 * Budget and Resource Management Types
 *
 * These types define the structure for tracking costs, tokens, and time budgets for agent tasks.
 */

export type BudgetStatus = 'active' | 'paused' | 'exceeded' | 'completed' | 'cancelled';

export type ResourceType = 'tokens' | 'cost' | 'time' | 'retries';

export interface BudgetLimit {
  tokens?: number; // Maximum tokens allowed
  cost?: number; // Maximum cost in USD
  time?: number; // Maximum time in milliseconds
  retries?: number; // Maximum number of retry attempts
}

export interface ResourceUsage {
  tokens: number;
  cost: number; // in USD
  time: number; // in milliseconds
  retries: number;
  apiCalls: number;
  fileOperations: number;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  timestamp: number;
  type: 'warning' | 'critical' | 'exceeded';
  resourceType: ResourceType;
  message: string;
  threshold: number; // percentage (e.g., 80 for 80%)
  currentUsage: number;
  limit: number;
}

export interface TaskBudget {
  id: string;
  taskId: string; // reference to the task
  agentId?: string; // reference to the agent
  status: BudgetStatus;
  limits: BudgetLimit;
  usage: ResourceUsage;
  alerts: BudgetAlert[];
  warningThresholds: {
    tokens?: number; // percentage (e.g., 80 for 80%)
    cost?: number;
    time?: number;
  };
  autoActionsEnabled: boolean;
  autoPauseOnExceed: boolean;
  createdAt: number;
  updatedAt: number;
  pausedAt?: number;
  resumedAt?: number;
  completedAt?: number;
}

export interface BudgetMetrics {
  totalBudgeted: BudgetLimit;
  totalUsed: ResourceUsage;
  percentageUsed: {
    tokens?: number;
    cost?: number;
    time?: number;
  };
  projectedCompletion: {
    tokens?: number;
    cost?: number;
    time?: number;
  };
  efficiency: {
    tokensPerTask: number;
    costPerTask: number;
    timePerTask: number;
  };
}

export interface BudgetHistory {
  id: string;
  budgetId: string;
  timestamp: number;
  action: 'created' | 'updated' | 'paused' | 'resumed' | 'exceeded' | 'completed' | 'cancelled';
  resourceSnapshot: ResourceUsage;
  triggeredBy: 'user' | 'system' | 'auto';
  notes?: string;
}

export interface BudgetFilter {
  taskId?: string;
  agentId?: string;
  status?: BudgetStatus;
  createdFrom?: number;
  createdTo?: number;
  exceededOnly?: boolean;
}

export interface BudgetSummary {
  id: string;
  taskId: string;
  taskTitle?: string;
  agentId?: string;
  agentName?: string;
  status: BudgetStatus;
  limits: BudgetLimit;
  usage: ResourceUsage;
  percentageUsed: {
    tokens?: number;
    cost?: number;
    time?: number;
  };
  alertCount: number;
  createdAt: number;
  updatedAt: number;
}

// Cost estimation constants (can be configured per model)
export const TOKEN_COSTS = {
  'claude-3-opus': {
    input: 15 / 1_000_000, // $15 per million tokens
    output: 75 / 1_000_000, // $75 per million tokens
  },
  'claude-3-sonnet': {
    input: 3 / 1_000_000, // $3 per million tokens
    output: 15 / 1_000_000, // $15 per million tokens
  },
  'claude-3-haiku': {
    input: 0.25 / 1_000_000, // $0.25 per million tokens
    output: 1.25 / 1_000_000, // $1.25 per million tokens
  },
  'gpt-4': {
    input: 30 / 1_000_000, // $30 per million tokens
    output: 60 / 1_000_000, // $60 per million tokens
  },
  'gpt-3.5-turbo': {
    input: 0.5 / 1_000_000, // $0.50 per million tokens
    output: 1.5 / 1_000_000, // $1.50 per million tokens
  },
} as const;

export type ModelType = keyof typeof TOKEN_COSTS;
