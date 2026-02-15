import { Budget } from '@/types/budget';

/**
 * Check if a budget allows task execution
 */
export const canExecuteTask = (budget: Budget): { allowed: boolean; reason?: string } => {
  if (budget.status === 'paused') {
    return {
      allowed: false,
      reason: budget.pausedReason || 'Task is paused',
    };
  }

  if (budget.status === 'exceeded') {
    return {
      allowed: false,
      reason: 'Budget exceeded',
    };
  }

  // Check if any budget limit is exceeded
  if (budget.maxCost && budget.currentCost >= budget.maxCost) {
    return {
      allowed: false,
      reason: 'Cost budget exceeded',
    };
  }

  if (budget.maxTokens && budget.currentTokens >= budget.maxTokens) {
    return {
      allowed: false,
      reason: 'Token budget exceeded',
    };
  }

  if (budget.maxTime && budget.currentTime >= budget.maxTime) {
    return {
      allowed: false,
      reason: 'Time budget exceeded',
    };
  }

  if (budget.maxRetries && budget.currentRetries >= budget.maxRetries) {
    return {
      allowed: false,
      reason: 'Maximum retries reached',
    };
  }

  return { allowed: true };
};

/**
 * Calculate remaining budget for a task
 */
export const getRemainingBudget = (budget: Budget) => {
  return {
    cost: budget.maxCost ? budget.maxCost - budget.currentCost : undefined,
    tokens: budget.maxTokens ? budget.maxTokens - budget.currentTokens : undefined,
    time: budget.maxTime ? budget.maxTime - budget.currentTime : undefined,
    retries: budget.maxRetries ? budget.maxRetries - budget.currentRetries : undefined,
  };
};

/**
 * Calculate budget usage percentage
 */
export const getBudgetUsagePercentage = (budget: Budget) => {
  const percentages: Record<string, number> = {};

  if (budget.maxCost) {
    percentages.cost = (budget.currentCost / budget.maxCost) * 100;
  }

  if (budget.maxTokens) {
    percentages.tokens = (budget.currentTokens / budget.maxTokens) * 100;
  }

  if (budget.maxTime) {
    percentages.time = (budget.currentTime / budget.maxTime) * 100;
  }

  if (budget.maxRetries) {
    percentages.retries = (budget.currentRetries / budget.maxRetries) * 100;
  }

  return percentages;
};

/**
 * Determine if budget is approaching limit
 */
export const isBudgetApproachingLimit = (budget: Budget, threshold = 75): boolean => {
  const percentages = getBudgetUsagePercentage(budget);
  return Object.values(percentages).some((pct) => pct >= threshold);
};

/**
 * Get budget health status
 */
export const getBudgetHealth = (
  budget: Budget
): 'healthy' | 'warning' | 'critical' | 'exceeded' => {
  if (budget.status === 'exceeded') {
    return 'exceeded';
  }

  const percentages = getBudgetUsagePercentage(budget);
  const maxPercentage = Math.max(...Object.values(percentages), 0);

  if (maxPercentage >= 90) {
    return 'critical';
  } else if (maxPercentage >= 75) {
    return 'warning';
  } else {
    return 'healthy';
  }
};

/**
 * Estimate if proposed usage fits within budget
 */
export const canAffordUsage = (
  budget: Budget,
  proposedUsage: {
    cost?: number;
    tokens?: number;
    time?: number;
  }
): { canAfford: boolean; reason?: string } => {
  // Check if task is executable
  const executionCheck = canExecuteTask(budget);
  if (!executionCheck.allowed) {
    return { canAfford: false, reason: executionCheck.reason };
  }

  // Check if proposed usage would exceed limits
  if (proposedUsage.cost && budget.maxCost) {
    if (budget.currentCost + proposedUsage.cost > budget.maxCost) {
      return {
        canAfford: false,
        reason: `Would exceed cost budget (${proposedUsage.cost} + ${budget.currentCost} > ${budget.maxCost})`,
      };
    }
  }

  if (proposedUsage.tokens && budget.maxTokens) {
    if (budget.currentTokens + proposedUsage.tokens > budget.maxTokens) {
      return {
        canAfford: false,
        reason: `Would exceed token budget (${proposedUsage.tokens} + ${budget.currentTokens} > ${budget.maxTokens})`,
      };
    }
  }

  if (proposedUsage.time && budget.maxTime) {
    if (budget.currentTime + proposedUsage.time > budget.maxTime) {
      return {
        canAfford: false,
        reason: `Would exceed time budget (${proposedUsage.time} + ${budget.currentTime} > ${budget.maxTime})`,
      };
    }
  }

  return { canAfford: true };
};
