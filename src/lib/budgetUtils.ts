import { TaskBudget, BudgetStatus, BudgetWarning, BudgetUpdate, BudgetSummary } from '@/types/budget';
import { Task } from '@/types/task';

/**
 * Calculate the percentage of budget used
 */
export const calculatePercentage = (current: number, max: number | undefined): number => {
  if (!max || max === 0) return 0;
  return Math.min((current / max) * 100, 100);
};

/**
 * Check if a budget metric is over budget
 */
export const isOverBudget = (current: number, max: number | undefined): boolean => {
  if (!max) return false;
  return current >= max;
};

/**
 * Get the severity level based on percentage
 */
export const getSeverity = (percentage: number): 'info' | 'warning' | 'critical' => {
  if (percentage >= 100) return 'critical';
  if (percentage >= 80) return 'warning';
  return 'info';
};

/**
 * Calculate budget status for a task
 */
export const calculateBudgetStatus = (budget: TaskBudget): BudgetStatus => {
  const costPercentage = calculatePercentage(budget.currentCostUsd, budget.maxCostUsd);
  const tokenPercentage = calculatePercentage(budget.currentTokens, budget.maxTokens);
  const timePercentage = calculatePercentage(budget.currentTimeMinutes, budget.maxTimeMinutes);
  const retriesPercentage = calculatePercentage(budget.currentRetries, budget.maxRetries);

  const warnings: BudgetWarning[] = [];

  // Cost warnings
  if (budget.maxCostUsd && costPercentage >= 80) {
    warnings.push({
      type: 'cost',
      severity: getSeverity(costPercentage),
      message: `Cost budget at ${costPercentage.toFixed(1)}% ($${budget.currentCostUsd.toFixed(2)} / $${budget.maxCostUsd.toFixed(2)})`,
      percentage: costPercentage,
    });
  }

  // Token warnings
  if (budget.maxTokens && tokenPercentage >= 80) {
    warnings.push({
      type: 'token',
      severity: getSeverity(tokenPercentage),
      message: `Token budget at ${tokenPercentage.toFixed(1)}% (${budget.currentTokens.toLocaleString()} / ${budget.maxTokens.toLocaleString()})`,
      percentage: tokenPercentage,
    });
  }

  // Time warnings
  if (budget.maxTimeMinutes && timePercentage >= 80) {
    warnings.push({
      type: 'time',
      severity: getSeverity(timePercentage),
      message: `Time budget at ${timePercentage.toFixed(1)}% (${budget.currentTimeMinutes} / ${budget.maxTimeMinutes} minutes)`,
      percentage: timePercentage,
    });
  }

  // Retry warnings
  if (budget.maxRetries && retriesPercentage >= 80) {
    warnings.push({
      type: 'retry',
      severity: getSeverity(retriesPercentage),
      message: `Retry limit at ${retriesPercentage.toFixed(1)}% (${budget.currentRetries} / ${budget.maxRetries})`,
      percentage: retriesPercentage,
    });
  }

  return {
    isOverBudget:
      isOverBudget(budget.currentCostUsd, budget.maxCostUsd) ||
      isOverBudget(budget.currentTokens, budget.maxTokens) ||
      isOverBudget(budget.currentTimeMinutes, budget.maxTimeMinutes) ||
      isOverBudget(budget.currentRetries, budget.maxRetries),
    costPercentage,
    tokenPercentage,
    timePercentage,
    retriesPercentage,
    warnings,
  };
};

/**
 * Update budget with new usage data
 */
export const updateBudget = (budget: TaskBudget, update: BudgetUpdate): TaskBudget => {
  const updatedBudget: TaskBudget = {
    ...budget,
    currentCostUsd: budget.currentCostUsd + (update.costUsd || 0),
    currentTokens: budget.currentTokens + (update.tokens || 0),
    currentTimeMinutes: budget.currentTimeMinutes + (update.timeMinutes || 0),
    currentRetries: budget.currentRetries + (update.retries || 0),
    lastUpdatedAt: Date.now(),
  };

  // Check if we should pause the task
  const status = calculateBudgetStatus(updatedBudget);
  if (status.isOverBudget && !updatedBudget.isPaused) {
    updatedBudget.isPaused = true;
    updatedBudget.pausedAt = Date.now();
    updatedBudget.pausedReason = 'Budget limit exceeded';
  }

  return updatedBudget;
};

/**
 * Calculate budget summary across all tasks
 */
export const calculateBudgetSummary = (tasks: Task[]): BudgetSummary => {
  const summary: BudgetSummary = {
    totalTasks: tasks.length,
    totalBudgetUsd: 0,
    totalSpentUsd: 0,
    totalBudgetTokens: 0,
    totalSpentTokens: 0,
    totalBudgetTime: 0,
    totalSpentTime: 0,
    pausedTasks: 0,
    overBudgetTasks: 0,
    tasksByStatus: {
      backlog: 0,
      'in-progress': 0,
      review: 0,
      done: 0,
    },
  };

  tasks.forEach((task) => {
    // Count by status
    summary.tasksByStatus[task.status]++;

    // Budget calculations
    if (task.budget) {
      summary.totalSpentUsd += task.budget.currentCostUsd;
      summary.totalSpentTokens += task.budget.currentTokens;
      summary.totalSpentTime += task.budget.currentTimeMinutes;

      if (task.budget.maxCostUsd) {
        summary.totalBudgetUsd += task.budget.maxCostUsd;
      }
      if (task.budget.maxTokens) {
        summary.totalBudgetTokens += task.budget.maxTokens;
      }
      if (task.budget.maxTimeMinutes) {
        summary.totalBudgetTime += task.budget.maxTimeMinutes;
      }

      if (task.budget.isPaused) {
        summary.pausedTasks++;
      }

      const status = calculateBudgetStatus(task.budget);
      if (status.isOverBudget) {
        summary.overBudgetTasks++;
      }
    }
  });

  return summary;
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format time duration
 */
export const formatTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Format tokens with K/M suffix
 */
export const formatTokens = (tokens: number): string => {
  if (tokens < 1000) {
    return tokens.toString();
  }
  if (tokens < 1000000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return `${(tokens / 1000000).toFixed(1)}M`;
};

/**
 * Check if task can be resumed (unpaused)
 */
export const canResumeTask = (budget: TaskBudget): boolean => {
  if (!budget.isPaused) return false;
  const status = calculateBudgetStatus(budget);
  return !status.isOverBudget;
};

/**
 * Resume a paused task
 */
export const resumeTask = (budget: TaskBudget): TaskBudget => {
  if (!canResumeTask(budget)) {
    throw new Error('Cannot resume task: still over budget');
  }

  return {
    ...budget,
    isPaused: false,
    pausedReason: undefined,
    pausedAt: undefined,
    lastUpdatedAt: Date.now(),
  };
};

/**
 * Manually pause a task
 */
export const pauseTask = (budget: TaskBudget, reason: string): TaskBudget => {
  return {
    ...budget,
    isPaused: true,
    pausedReason: reason,
    pausedAt: Date.now(),
    lastUpdatedAt: Date.now(),
  };
};
