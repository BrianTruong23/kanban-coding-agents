import { Task, TaskBudget } from '@/types/task';

/**
 * Budget utility functions for task resource management
 */

export interface BudgetStatus {
  isOverBudget: boolean;
  isNearLimit: boolean; // > 80% of budget
  percentUsed: {
    tokens?: number;
    cost?: number;
    time?: number;
  };
  exceeded: {
    tokens: boolean;
    cost: boolean;
    time: boolean;
  };
}

/**
 * Check if a task has exceeded any budget limits
 */
export const checkBudgetStatus = (budget?: TaskBudget): BudgetStatus => {
  if (!budget) {
    return {
      isOverBudget: false,
      isNearLimit: false,
      percentUsed: {},
      exceeded: { tokens: false, cost: false, time: false },
    };
  }

  const exceeded = {
    tokens: budget.maxTokens ? budget.usedTokens >= budget.maxTokens : false,
    cost: budget.maxCost ? budget.usedCost >= budget.maxCost : false,
    time: budget.maxTimeMinutes ? budget.usedTimeMinutes >= budget.maxTimeMinutes : false,
  };

  const percentUsed = {
    tokens: budget.maxTokens ? (budget.usedTokens / budget.maxTokens) * 100 : undefined,
    cost: budget.maxCost ? (budget.usedCost / budget.maxCost) * 100 : undefined,
    time: budget.maxTimeMinutes ? (budget.usedTimeMinutes / budget.maxTimeMinutes) * 100 : undefined,
  };

  const isOverBudget = exceeded.tokens || exceeded.cost || exceeded.time;
  const isNearLimit =
    (percentUsed.tokens !== undefined && percentUsed.tokens > 80) ||
    (percentUsed.cost !== undefined && percentUsed.cost > 80) ||
    (percentUsed.time !== undefined && percentUsed.time > 80);

  return {
    isOverBudget,
    isNearLimit,
    percentUsed,
    exceeded,
  };
};

/**
 * Calculate if a task should be paused based on budget
 */
export const shouldPauseTask = (budget?: TaskBudget): { shouldPause: boolean; reason?: string } => {
  if (!budget) {
    return { shouldPause: false };
  }

  const status = checkBudgetStatus(budget);

  if (status.isOverBudget) {
    const reasons: string[] = [];
    if (status.exceeded.tokens) reasons.push('token limit exceeded');
    if (status.exceeded.cost) reasons.push('cost limit exceeded');
    if (status.exceeded.time) reasons.push('time limit exceeded');
    return {
      shouldPause: true,
      reason: reasons.join(', '),
    };
  }

  if (budget.maxRetries && budget.currentRetries >= budget.maxRetries) {
    return {
      shouldPause: true,
      reason: 'maximum retries exceeded',
    };
  }

  return { shouldPause: false };
};

/**
 * Update task budget with new usage
 */
export const updateBudgetUsage = (
  budget: TaskBudget,
  usage: {
    tokens?: number;
    cost?: number;
    timeMinutes?: number;
  }
): TaskBudget => {
  return {
    ...budget,
    usedTokens: budget.usedTokens + (usage.tokens || 0),
    usedCost: budget.usedCost + (usage.cost || 0),
    usedTimeMinutes: budget.usedTimeMinutes + (usage.timeMinutes || 0),
  };
};

/**
 * Increment retry count for a task
 */
export const incrementRetries = (budget: TaskBudget): TaskBudget => {
  return {
    ...budget,
    currentRetries: budget.currentRetries + 1,
  };
};

/**
 * Pause a task with a reason
 */
export const pauseTask = (budget: TaskBudget, reason: string): TaskBudget => {
  return {
    ...budget,
    isPaused: true,
    pauseReason: reason,
  };
};

/**
 * Resume a paused task
 */
export const resumeTask = (budget: TaskBudget): TaskBudget => {
  return {
    ...budget,
    isPaused: false,
    pauseReason: undefined,
  };
};

/**
 * Format cost to currency string
 */
export const formatCost = (cost: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(cost);
};

/**
 * Format tokens with thousand separators
 */
export const formatTokens = (tokens: number): string => {
  return new Intl.NumberFormat('en-US').format(tokens);
};

/**
 * Format time in minutes to human-readable string
 */
export const formatTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

/**
 * Calculate total budget metrics across all tasks
 */
export const calculateTotalBudget = (tasks: Task[]) => {
  return tasks.reduce(
    (acc, task) => {
      if (task.budget) {
        acc.totalUsedTokens += task.budget.usedTokens;
        acc.totalUsedCost += task.budget.usedCost;
        acc.totalUsedTime += task.budget.usedTimeMinutes;

        if (task.budget.maxTokens) acc.totalMaxTokens += task.budget.maxTokens;
        if (task.budget.maxCost) acc.totalMaxCost += task.budget.maxCost;
        if (task.budget.maxTimeMinutes) acc.totalMaxTime += task.budget.maxTimeMinutes;

        const status = checkBudgetStatus(task.budget);
        if (status.isOverBudget) acc.overBudgetTasks++;
        if (status.isNearLimit) acc.nearLimitTasks++;
      }
      return acc;
    },
    {
      totalUsedTokens: 0,
      totalUsedCost: 0,
      totalUsedTime: 0,
      totalMaxTokens: 0,
      totalMaxCost: 0,
      totalMaxTime: 0,
      overBudgetTasks: 0,
      nearLimitTasks: 0,
    }
  );
};

/**
 * Create a default budget for a new task
 */
export const createDefaultBudget = (): TaskBudget => {
  return {
    usedTokens: 0,
    usedCost: 0,
    usedTimeMinutes: 0,
    currentRetries: 0,
    isPaused: false,
  };
};
