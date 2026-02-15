import { TaskBudget, BudgetMetrics } from '@/types/budget';

/**
 * Calculate budget metrics and percentages for a task budget
 */
export function calculateBudgetMetrics(budget: TaskBudget): BudgetMetrics {
  const tokensPercent = budget.maxTokens
    ? Math.min((budget.tokensUsed / budget.maxTokens) * 100, 100)
    : 0;

  const costPercent = budget.maxCost
    ? Math.min((budget.costUsed / budget.maxCost) * 100, 100)
    : 0;

  const timePercent = budget.maxTimeMinutes
    ? Math.min((budget.timeUsedMinutes / budget.maxTimeMinutes) * 100, 100)
    : 0;

  const retriesPercent = budget.maxRetries
    ? Math.min((budget.retriesUsed / budget.maxRetries) * 100, 100)
    : 0;

  // Calculate overall percentage (average of active limits)
  const activePercentages = [
    budget.maxTokens ? tokensPercent : null,
    budget.maxCost ? costPercent : null,
    budget.maxTimeMinutes ? timePercent : null,
    budget.maxRetries ? retriesPercent : null,
  ].filter((p): p is number => p !== null);

  const overallPercent = activePercentages.length > 0
    ? activePercentages.reduce((sum, p) => sum + p, 0) / activePercentages.length
    : 0;

  const isNearLimit = overallPercent >= 80;
  const isExceeded = overallPercent >= 100;

  return {
    tokensPercent,
    costPercent,
    timePercent,
    retriesPercent,
    overallPercent,
    isNearLimit,
    isExceeded,
  };
}

/**
 * Check if a budget has exceeded any limits
 */
export function isBudgetExceeded(budget: TaskBudget): boolean {
  if (budget.maxTokens && budget.tokensUsed >= budget.maxTokens) return true;
  if (budget.maxCost && budget.costUsed >= budget.maxCost) return true;
  if (budget.maxTimeMinutes && budget.timeUsedMinutes >= budget.maxTimeMinutes) return true;
  if (budget.maxRetries && budget.retriesUsed >= budget.maxRetries) return true;
  return false;
}

/**
 * Check if a budget is near its limit (>= 80%)
 */
export function isBudgetNearLimit(budget: TaskBudget): boolean {
  const metrics = calculateBudgetMetrics(budget);
  return metrics.isNearLimit;
}

/**
 * Get the most critical resource (highest percentage used)
 */
export function getMostCriticalResource(budget: TaskBudget): {
  type: 'tokens' | 'cost' | 'time' | 'retries' | null;
  percentage: number;
} {
  const metrics = calculateBudgetMetrics(budget);

  const resources = [
    { type: 'tokens' as const, percentage: metrics.tokensPercent, hasLimit: !!budget.maxTokens },
    { type: 'cost' as const, percentage: metrics.costPercent, hasLimit: !!budget.maxCost },
    { type: 'time' as const, percentage: metrics.timePercent, hasLimit: !!budget.maxTimeMinutes },
    { type: 'retries' as const, percentage: metrics.retriesPercent, hasLimit: !!budget.maxRetries },
  ].filter(r => r.hasLimit);

  if (resources.length === 0) {
    return { type: null, percentage: 0 };
  }

  const critical = resources.reduce((max, r) =>
    r.percentage > max.percentage ? r : max
  );

  return { type: critical.type, percentage: critical.percentage };
}

/**
 * Format cost as USD string
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

/**
 * Format tokens with thousands separator
 */
export function formatTokens(tokens: number): string {
  return tokens.toLocaleString();
}

/**
 * Format time in a human-readable format
 */
export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Calculate remaining budget
 */
export function getRemainingBudget(budget: TaskBudget): {
  tokens: number | null;
  cost: number | null;
  time: number | null;
  retries: number | null;
} {
  return {
    tokens: budget.maxTokens ? Math.max(0, budget.maxTokens - budget.tokensUsed) : null,
    cost: budget.maxCost ? Math.max(0, budget.maxCost - budget.costUsed) : null,
    time: budget.maxTimeMinutes ? Math.max(0, budget.maxTimeMinutes - budget.timeUsedMinutes) : null,
    retries: budget.maxRetries ? Math.max(0, budget.maxRetries - budget.retriesUsed) : null,
  };
}

/**
 * Get budget status color for UI
 */
export function getBudgetStatusColor(budget: TaskBudget): string {
  const metrics = calculateBudgetMetrics(budget);

  if (metrics.isExceeded) {
    return 'red';
  } else if (metrics.isNearLimit) {
    return 'yellow';
  } else if (metrics.overallPercent > 50) {
    return 'blue';
  } else {
    return 'green';
  }
}

/**
 * Determine if task should be paused based on budget
 */
export function shouldPauseTask(budget: TaskBudget): { shouldPause: boolean; reason?: string } {
  if (budget.status === 'paused') {
    return { shouldPause: true, reason: budget.pausedReason };
  }

  if (isBudgetExceeded(budget)) {
    const critical = getMostCriticalResource(budget);
    if (critical.type) {
      return {
        shouldPause: true,
        reason: `${critical.type.charAt(0).toUpperCase() + critical.type.slice(1)} budget exceeded (${critical.percentage.toFixed(0)}%)`
      };
    }
  }

  return { shouldPause: false };
}
