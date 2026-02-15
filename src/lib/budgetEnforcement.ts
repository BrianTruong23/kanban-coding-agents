import { Budget, BudgetUsageEntry } from '@/types/budget';

export interface BudgetCheckResult {
  allowed: boolean;
  reason?: string;
  exceededLimits: Array<'cost' | 'tokens' | 'time' | 'retries'>;
  warnings: Array<{
    type: 'cost' | 'tokens' | 'time';
    message: string;
    percentage: number;
  }>;
}

/**
 * Check if a task can proceed based on budget constraints
 */
export const checkBudgetAllowance = (
  budget: Budget,
  estimatedCost?: number,
  estimatedTokens?: number,
  estimatedTime?: number
): BudgetCheckResult => {
  const result: BudgetCheckResult = {
    allowed: true,
    exceededLimits: [],
    warnings: [],
  };

  // Check if budget is paused
  if (budget.status === 'paused') {
    result.allowed = false;
    result.reason = `Budget is paused: ${budget.pausedReason || 'No reason provided'}`;
    return result;
  }

  // Check if budget is already exceeded
  if (budget.status === 'exceeded') {
    result.allowed = false;
    result.reason = 'Budget has already been exceeded';
    return result;
  }

  // Check retry limits
  if (budget.currentRetries >= budget.maxRetries) {
    result.allowed = false;
    result.exceededLimits.push('retries');
    result.reason = `Maximum retries (${budget.maxRetries}) reached`;
    return result;
  }

  // Check cost limits
  if (budget.maxCost !== undefined) {
    const projectedCost = budget.currentCost + (estimatedCost || 0);
    const costPercentage = (projectedCost / budget.maxCost) * 100;

    if (projectedCost > budget.maxCost) {
      result.allowed = false;
      result.exceededLimits.push('cost');
    } else if (costPercentage >= 80) {
      result.warnings.push({
        type: 'cost',
        message: `Cost budget at ${costPercentage.toFixed(1)}%`,
        percentage: costPercentage,
      });
    }
  }

  // Check token limits
  if (budget.maxTokens !== undefined) {
    const projectedTokens = budget.currentTokens + (estimatedTokens || 0);
    const tokensPercentage = (projectedTokens / budget.maxTokens) * 100;

    if (projectedTokens > budget.maxTokens) {
      result.allowed = false;
      result.exceededLimits.push('tokens');
    } else if (tokensPercentage >= 80) {
      result.warnings.push({
        type: 'tokens',
        message: `Token budget at ${tokensPercentage.toFixed(1)}%`,
        percentage: tokensPercentage,
      });
    }
  }

  // Check time limits
  if (budget.maxTime !== undefined) {
    const projectedTime = budget.currentTime + (estimatedTime || 0);
    const timePercentage = (projectedTime / budget.maxTime) * 100;

    if (projectedTime > budget.maxTime) {
      result.allowed = false;
      result.exceededLimits.push('time');
    } else if (timePercentage >= 80) {
      result.warnings.push({
        type: 'time',
        message: `Time budget at ${timePercentage.toFixed(1)}%`,
        percentage: timePercentage,
      });
    }
  }

  // Set reason if not allowed
  if (!result.allowed && !result.reason) {
    const limitsText = result.exceededLimits.join(', ');
    result.reason = `Would exceed budget limits: ${limitsText}`;
  }

  return result;
};

/**
 * Calculate the remaining budget for a task
 */
export const calculateRemainingBudget = (budget: Budget) => {
  return {
    remainingCost: budget.maxCost ? budget.maxCost - budget.currentCost : Infinity,
    remainingTokens: budget.maxTokens ? budget.maxTokens - budget.currentTokens : Infinity,
    remainingTime: budget.maxTime ? budget.maxTime - budget.currentTime : Infinity,
    remainingRetries: budget.maxRetries - budget.currentRetries,
  };
};

/**
 * Estimate the cost based on token usage
 * Using approximate pricing for common AI models
 */
export const estimateCostFromTokens = (tokens: number, model: string = 'gpt-4'): number => {
  // Approximate pricing per 1K tokens (as of 2024)
  const pricingMap: Record<string, { input: number; output: number }> = {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    'claude-3-opus': { input: 0.015, output: 0.075 },
    'claude-3-sonnet': { input: 0.003, output: 0.015 },
    'claude-3-haiku': { input: 0.00025, output: 0.00125 },
  };

  const pricing = pricingMap[model] || pricingMap['gpt-3.5-turbo'];
  // Assume 50/50 split between input and output tokens
  const inputTokens = tokens * 0.5;
  const outputTokens = tokens * 0.5;

  return (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
};

/**
 * Create a budget usage entry helper
 */
export const createUsageEntry = (
  budgetId: string,
  taskId: string,
  options: {
    costIncurred?: number;
    tokensUsed?: number;
    timeSpent?: number;
    agentId?: string;
    operation: string;
    success?: boolean;
    errorMessage?: string;
  }
): Omit<BudgetUsageEntry, 'id' | 'timestamp'> => {
  return {
    budgetId,
    taskId,
    costIncurred: options.costIncurred || 0,
    tokensUsed: options.tokensUsed || 0,
    timeSpent: options.timeSpent || 0,
    agentId: options.agentId,
    operation: options.operation,
    success: options.success !== false,
    errorMessage: options.errorMessage,
  };
};

/**
 * Validate budget configuration
 */
export const validateBudgetConfig = (budget: Partial<Budget>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // At least one limit must be set
  if (!budget.maxCost && !budget.maxTokens && !budget.maxTime) {
    errors.push('At least one budget limit (cost, tokens, or time) must be set');
  }

  // Validate positive values
  if (budget.maxCost !== undefined && budget.maxCost <= 0) {
    errors.push('Max cost must be greater than 0');
  }

  if (budget.maxTokens !== undefined && budget.maxTokens <= 0) {
    errors.push('Max tokens must be greater than 0');
  }

  if (budget.maxTime !== undefined && budget.maxTime <= 0) {
    errors.push('Max time must be greater than 0');
  }

  if (budget.maxRetries !== undefined && budget.maxRetries < 0) {
    errors.push('Max retries must be 0 or greater');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Format budget values for display
 */
export const formatBudgetValue = (value: number | undefined, type: 'cost' | 'tokens' | 'time'): string => {
  if (value === undefined) return 'Not set';

  switch (type) {
    case 'cost':
      return `$${value.toFixed(2)}`;
    case 'tokens':
      return value.toLocaleString();
    case 'time':
      return `${value} min`;
    default:
      return value.toString();
  }
};

/**
 * Calculate budget utilization percentage
 */
export const calculateUtilization = (
  current: number,
  max: number | undefined
): { percentage: number; status: 'low' | 'medium' | 'high' | 'critical' | 'exceeded' } => {
  if (max === undefined || max === 0) {
    return { percentage: 0, status: 'low' };
  }

  const percentage = (current / max) * 100;

  let status: 'low' | 'medium' | 'high' | 'critical' | 'exceeded';
  if (percentage >= 100) {
    status = 'exceeded';
  } else if (percentage >= 95) {
    status = 'critical';
  } else if (percentage >= 80) {
    status = 'high';
  } else if (percentage >= 60) {
    status = 'medium';
  } else {
    status = 'low';
  }

  return { percentage: Math.min(percentage, 100), status };
};
