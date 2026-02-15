export type BudgetStatus = 'within-budget' | 'warning' | 'exceeded' | 'paused';

export interface TaskBudget {
  // Cost tracking
  estimatedCost?: number; // Estimated cost in dollars
  actualCost: number; // Current actual cost
  maxCost?: number; // Maximum allowed cost

  // Token tracking
  estimatedTokens?: number; // Estimated token count
  actualTokens: number; // Actual tokens used
  maxTokens?: number; // Maximum allowed tokens

  // Time tracking (in milliseconds)
  estimatedTime?: number; // Estimated time to complete
  actualTime: number; // Actual time spent
  maxTime?: number; // Maximum allowed time

  // Execution tracking
  retryCount: number; // Number of retries attempted
  maxRetries: number; // Maximum allowed retries

  // Status
  status: BudgetStatus;
  isPaused: boolean; // Whether task is paused due to budget
  pauseReason?: string; // Reason for pause

  // Timestamps
  startedAt?: number; // When task execution started
  lastUpdatedAt: number; // Last budget update
}

export interface BudgetLimits {
  maxCost?: number;
  maxTokens?: number;
  maxTime?: number;
  maxRetries?: number;
  warningThreshold?: number; // Percentage (e.g., 80 = warn at 80% of budget)
}

export interface ProjectBudget {
  totalEstimatedCost: number;
  totalActualCost: number;
  totalEstimatedTokens: number;
  totalActualTokens: number;
  totalEstimatedTime: number;
  totalActualTime: number;
  totalTasks: number;
  tasksWithinBudget: number;
  tasksAtWarning: number;
  tasksExceeded: number;
  tasksPaused: number;
}

export interface AgentPerformanceMetrics {
  agentId: string;
  agentName: string;
  totalTasksCompleted: number;
  averageCost: number;
  averageTokens: number;
  averageTime: number;
  totalCost: number;
  totalTokens: number;
  totalTime: number;
  successRate: number; // Percentage of tasks completed within budget
}

export interface BudgetAlert {
  id: string;
  taskId: string;
  taskTitle: string;
  type: 'warning' | 'exceeded' | 'paused';
  message: string;
  timestamp: number;
  acknowledged: boolean;
}
