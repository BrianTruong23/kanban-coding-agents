/**
 * Budget Tracking Library
 *
 * Provides utility functions for tracking and managing budget resources.
 */

import {
  TaskBudget,
  BudgetLimit,
  ResourceUsage,
  BudgetAlert,
  BudgetMetrics,
  TOKEN_COSTS,
  ModelType,
  BudgetStatus,
  ResourceType,
} from '@/types/budget';

/**
 * Calculate percentage of resource used
 */
export function calculatePercentageUsed(
  usage: number,
  limit: number | undefined
): number | undefined {
  if (limit === undefined || limit === 0) return undefined;
  return (usage / limit) * 100;
}

/**
 * Calculate all percentage usage metrics
 */
export function calculatePercentages(
  usage: ResourceUsage,
  limits: BudgetLimit
): { tokens?: number; cost?: number; time?: number } {
  return {
    tokens: calculatePercentageUsed(usage.tokens, limits.tokens),
    cost: calculatePercentageUsed(usage.cost, limits.cost),
    time: calculatePercentageUsed(usage.time, limits.time),
  };
}

/**
 * Check if any resource has exceeded its limit
 */
export function hasExceededLimit(usage: ResourceUsage, limits: BudgetLimit): boolean {
  if (limits.tokens !== undefined && usage.tokens >= limits.tokens) return true;
  if (limits.cost !== undefined && usage.cost >= limits.cost) return true;
  if (limits.time !== undefined && usage.time >= limits.time) return true;
  if (limits.retries !== undefined && usage.retries >= limits.retries) return true;
  return false;
}

/**
 * Check if any resource has reached warning threshold
 */
export function hasReachedWarning(
  usage: ResourceUsage,
  limits: BudgetLimit,
  warningThresholds: { tokens?: number; cost?: number; time?: number }
): boolean {
  const percentages = calculatePercentages(usage, limits);

  if (
    percentages.tokens !== undefined &&
    warningThresholds.tokens !== undefined &&
    percentages.tokens >= warningThresholds.tokens
  ) {
    return true;
  }

  if (
    percentages.cost !== undefined &&
    warningThresholds.cost !== undefined &&
    percentages.cost >= warningThresholds.cost
  ) {
    return true;
  }

  if (
    percentages.time !== undefined &&
    warningThresholds.time !== undefined &&
    percentages.time >= warningThresholds.time
  ) {
    return true;
  }

  return false;
}

/**
 * Calculate cost from token usage
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: ModelType = 'claude-3-sonnet'
): number {
  const costs = TOKEN_COSTS[model];
  return inputTokens * costs.input + outputTokens * costs.output;
}

/**
 * Estimate tokens from text (rough approximation)
 */
export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token on average
  return Math.ceil(text.length / 4);
}

/**
 * Create a new budget alert
 */
export function createBudgetAlert(
  budgetId: string,
  type: 'warning' | 'critical' | 'exceeded',
  resourceType: ResourceType,
  currentUsage: number,
  limit: number,
  threshold: number
): Omit<BudgetAlert, 'id'> {
  const percentage = (currentUsage / limit) * 100;
  const message = `${resourceType} budget ${type}: ${percentage.toFixed(1)}% used (${currentUsage.toFixed(2)}/${limit})`;

  return {
    budgetId,
    timestamp: Date.now(),
    type,
    resourceType,
    message,
    threshold,
    currentUsage,
    limit,
  };
}

/**
 * Update usage with new resource consumption
 */
export function updateUsage(
  currentUsage: ResourceUsage,
  newConsumption: Partial<ResourceUsage>
): ResourceUsage {
  return {
    tokens: currentUsage.tokens + (newConsumption.tokens || 0),
    cost: currentUsage.cost + (newConsumption.cost || 0),
    time: currentUsage.time + (newConsumption.time || 0),
    retries: currentUsage.retries + (newConsumption.retries || 0),
    apiCalls: currentUsage.apiCalls + (newConsumption.apiCalls || 0),
    fileOperations: currentUsage.fileOperations + (newConsumption.fileOperations || 0),
  };
}

/**
 * Calculate budget metrics for multiple budgets
 */
export function calculateBudgetMetrics(budgets: TaskBudget[]): BudgetMetrics {
  const totalBudgeted: BudgetLimit = {
    tokens: 0,
    cost: 0,
    time: 0,
    retries: 0,
  };

  const totalUsed: ResourceUsage = {
    tokens: 0,
    cost: 0,
    time: 0,
    retries: 0,
    apiCalls: 0,
    fileOperations: 0,
  };

  budgets.forEach((budget) => {
    // Sum budgeted amounts
    if (budget.limits.tokens) totalBudgeted.tokens! += budget.limits.tokens;
    if (budget.limits.cost) totalBudgeted.cost! += budget.limits.cost;
    if (budget.limits.time) totalBudgeted.time! += budget.limits.time;
    if (budget.limits.retries) totalBudgeted.retries! += budget.limits.retries;

    // Sum used amounts
    totalUsed.tokens += budget.usage.tokens;
    totalUsed.cost += budget.usage.cost;
    totalUsed.time += budget.usage.time;
    totalUsed.retries += budget.usage.retries;
    totalUsed.apiCalls += budget.usage.apiCalls;
    totalUsed.fileOperations += budget.usage.fileOperations;
  });

  const percentageUsed = {
    tokens: calculatePercentageUsed(totalUsed.tokens, totalBudgeted.tokens),
    cost: calculatePercentageUsed(totalUsed.cost, totalBudgeted.cost),
    time: calculatePercentageUsed(totalUsed.time, totalBudgeted.time),
  };

  const completedBudgets = budgets.filter((b) => b.status === 'completed').length;
  const efficiency = {
    tokensPerTask: completedBudgets > 0 ? totalUsed.tokens / completedBudgets : 0,
    costPerTask: completedBudgets > 0 ? totalUsed.cost / completedBudgets : 0,
    timePerTask: completedBudgets > 0 ? totalUsed.time / completedBudgets : 0,
  };

  // Simple projection based on current usage rate
  const activeBudgets = budgets.filter((b) => b.status === 'active').length;
  const projectedCompletion = {
    tokens:
      activeBudgets > 0 && efficiency.tokensPerTask > 0
        ? totalUsed.tokens + efficiency.tokensPerTask * activeBudgets
        : undefined,
    cost:
      activeBudgets > 0 && efficiency.costPerTask > 0
        ? totalUsed.cost + efficiency.costPerTask * activeBudgets
        : undefined,
    time:
      activeBudgets > 0 && efficiency.timePerTask > 0
        ? totalUsed.time + efficiency.timePerTask * activeBudgets
        : undefined,
  };

  return {
    totalBudgeted,
    totalUsed,
    percentageUsed,
    projectedCompletion,
    efficiency,
  };
}

/**
 * Determine the appropriate budget status based on usage
 */
export function determineBudgetStatus(
  currentStatus: BudgetStatus,
  usage: ResourceUsage,
  limits: BudgetLimit,
  autoPauseOnExceed: boolean
): BudgetStatus {
  // Don't change if already completed or cancelled
  if (currentStatus === 'completed' || currentStatus === 'cancelled') {
    return currentStatus;
  }

  // Check if exceeded
  if (hasExceededLimit(usage, limits)) {
    return autoPauseOnExceed ? 'exceeded' : currentStatus;
  }

  // If was paused but not exceeded anymore, keep paused (manual resume needed)
  if (currentStatus === 'paused' || currentStatus === 'exceeded') {
    return currentStatus;
  }

  return 'active';
}

/**
 * Format time duration for display
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

/**
 * Format token count for display
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(2)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return tokens.toString();
}

/**
 * Get resource utilization color (for UI)
 */
export function getUtilizationColor(percentage: number | undefined): string {
  if (percentage === undefined) return 'gray';
  if (percentage >= 100) return 'red';
  if (percentage >= 80) return 'orange';
  if (percentage >= 60) return 'yellow';
  return 'green';
}

/**
 * Create a default budget for a task
 */
export function createDefaultBudget(
  taskId: string,
  agentId?: string
): Omit<TaskBudget, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    taskId,
    agentId,
    status: 'active',
    limits: {
      tokens: 100_000, // 100K tokens
      cost: 5.0, // $5
      time: 3600000, // 1 hour in milliseconds
      retries: 3,
    },
    usage: {
      tokens: 0,
      cost: 0,
      time: 0,
      retries: 0,
      apiCalls: 0,
      fileOperations: 0,
    },
    alerts: [],
    warningThresholds: {
      tokens: 80,
      cost: 80,
      time: 80,
    },
    autoActionsEnabled: true,
    autoPauseOnExceed: true,
  };
}
