import { TaskBudget } from '@/types/budget';

export interface BudgetCheckResult {
  allowed: boolean;
  reason?: string;
  exceededLimits?: string[];
}

export class BudgetEnforcer {
  /**
   * Check if a task can execute based on its budget limits
   */
  static canExecute(budget: TaskBudget | undefined): BudgetCheckResult {
    if (!budget) {
      return { allowed: true };
    }

    // Check if task is paused
    if (budget.status === 'paused') {
      return {
        allowed: false,
        reason: 'Task is paused',
      };
    }

    // Check if budget is exceeded
    if (budget.status === 'exceeded') {
      return {
        allowed: false,
        reason: 'Budget limits exceeded',
      };
    }

    const exceededLimits: string[] = [];

    // Check cost limit
    if (budget.maxCost !== undefined && budget.currentCost >= budget.maxCost) {
      exceededLimits.push(`cost ($${budget.currentCost.toFixed(2)} / $${budget.maxCost.toFixed(2)})`);
    }

    // Check token limit
    if (budget.maxTokens !== undefined && budget.currentTokens >= budget.maxTokens) {
      exceededLimits.push(`tokens (${budget.currentTokens} / ${budget.maxTokens})`);
    }

    // Check time limit
    if (budget.maxTime !== undefined && budget.currentTime >= budget.maxTime) {
      exceededLimits.push(`time (${budget.currentTime}s / ${budget.maxTime}s)`);
    }

    // Check retry limit
    if (budget.retryCount >= budget.maxRetries) {
      exceededLimits.push(`retries (${budget.retryCount} / ${budget.maxRetries})`);
    }

    if (exceededLimits.length > 0) {
      return {
        allowed: false,
        reason: 'Budget limits exceeded',
        exceededLimits,
      };
    }

    return { allowed: true };
  }

  /**
   * Calculate remaining budget percentages
   */
  static getRemainingBudget(budget: TaskBudget): {
    costPercentage: number;
    tokenPercentage: number;
    timePercentage: number;
    retryPercentage: number;
  } {
    return {
      costPercentage: budget.maxCost
        ? ((budget.maxCost - budget.currentCost) / budget.maxCost) * 100
        : 100,
      tokenPercentage: budget.maxTokens
        ? ((budget.maxTokens - budget.currentTokens) / budget.maxTokens) * 100
        : 100,
      timePercentage: budget.maxTime
        ? ((budget.maxTime - budget.currentTime) / budget.maxTime) * 100
        : 100,
      retryPercentage: ((budget.maxRetries - budget.retryCount) / budget.maxRetries) * 100,
    };
  }

  /**
   * Get the lowest remaining percentage (most constrained resource)
   */
  static getMostConstrainedResource(budget: TaskBudget): {
    resource: 'cost' | 'tokens' | 'time' | 'retries';
    percentage: number;
  } {
    const remaining = this.getRemainingBudget(budget);

    const resources = [
      { resource: 'cost' as const, percentage: remaining.costPercentage },
      { resource: 'tokens' as const, percentage: remaining.tokenPercentage },
      { resource: 'time' as const, percentage: remaining.timePercentage },
      { resource: 'retries' as const, percentage: remaining.retryPercentage },
    ];

    return resources.reduce((min, current) =>
      current.percentage < min.percentage ? current : min
    );
  }

  /**
   * Estimate if there's enough budget for an operation
   */
  static hasEnoughBudget(
    budget: TaskBudget,
    estimatedCost: number = 0,
    estimatedTokens: number = 0,
    estimatedTime: number = 0
  ): BudgetCheckResult {
    const exceededLimits: string[] = [];

    // Check cost limit
    if (budget.maxCost !== undefined && budget.currentCost + estimatedCost > budget.maxCost) {
      exceededLimits.push('cost');
    }

    // Check token limit
    if (budget.maxTokens !== undefined && budget.currentTokens + estimatedTokens > budget.maxTokens) {
      exceededLimits.push('tokens');
    }

    // Check time limit
    if (budget.maxTime !== undefined && budget.currentTime + estimatedTime > budget.maxTime) {
      exceededLimits.push('time');
    }

    if (exceededLimits.length > 0) {
      return {
        allowed: false,
        reason: 'Estimated operation would exceed budget',
        exceededLimits,
      };
    }

    return { allowed: true };
  }

  /**
   * Calculate warning threshold (returns true if any resource is at or above threshold percentage)
   */
  static isAtWarningThreshold(budget: TaskBudget, thresholdPercentage: number = 75): boolean {
    if (budget.maxCost !== undefined) {
      const costUsage = (budget.currentCost / budget.maxCost) * 100;
      if (costUsage >= thresholdPercentage) return true;
    }

    if (budget.maxTokens !== undefined) {
      const tokenUsage = (budget.currentTokens / budget.maxTokens) * 100;
      if (tokenUsage >= thresholdPercentage) return true;
    }

    if (budget.maxTime !== undefined) {
      const timeUsage = (budget.currentTime / budget.maxTime) * 100;
      if (timeUsage >= thresholdPercentage) return true;
    }

    const retryUsage = (budget.retryCount / budget.maxRetries) * 100;
    if (retryUsage >= thresholdPercentage) return true;

    return false;
  }

  /**
   * Get budget status with color coding
   */
  static getBudgetStatus(budget: TaskBudget): {
    status: 'healthy' | 'warning' | 'critical' | 'exceeded';
    color: string;
  } {
    const remaining = this.getRemainingBudget(budget);
    const minPercentage = Math.min(
      remaining.costPercentage,
      remaining.tokenPercentage,
      remaining.timePercentage,
      remaining.retryPercentage
    );

    if (minPercentage <= 0) {
      return { status: 'exceeded', color: 'red' };
    } else if (minPercentage <= 10) {
      return { status: 'critical', color: 'orange' };
    } else if (minPercentage <= 25) {
      return { status: 'warning', color: 'yellow' };
    } else {
      return { status: 'healthy', color: 'green' };
    }
  }
}
