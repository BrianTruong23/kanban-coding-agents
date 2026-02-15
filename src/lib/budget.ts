import { TaskBudget, BudgetStatus, BudgetLimits, ProjectBudget, AgentPerformanceMetrics } from '@/types/budget';
import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';

/**
 * Calculate the budget status based on current usage and limits
 */
export const calculateBudgetStatus = (budget: TaskBudget): BudgetStatus => {
  if (budget.isPaused) {
    return 'paused';
  }

  const costPercent = budget.maxCost ? (budget.actualCost / budget.maxCost) * 100 : 0;
  const tokenPercent = budget.maxTokens ? (budget.actualTokens / budget.maxTokens) * 100 : 0;
  const timePercent = budget.maxTime ? (budget.actualTime / budget.maxTime) * 100 : 0;
  const retryPercent = (budget.retryCount / budget.maxRetries) * 100;

  const maxPercent = Math.max(costPercent, tokenPercent, timePercent, retryPercent);

  if (maxPercent >= 100) {
    return 'exceeded';
  } else if (maxPercent >= 80) {
    return 'warning';
  }

  return 'within-budget';
};

/**
 * Check if a task should be paused based on budget limits
 */
export const shouldPauseTask = (budget: TaskBudget): { shouldPause: boolean; reason?: string } => {
  if (budget.maxCost && budget.actualCost >= budget.maxCost) {
    return { shouldPause: true, reason: 'Cost limit exceeded' };
  }

  if (budget.maxTokens && budget.actualTokens >= budget.maxTokens) {
    return { shouldPause: true, reason: 'Token limit exceeded' };
  }

  if (budget.maxTime && budget.actualTime >= budget.maxTime) {
    return { shouldPause: true, reason: 'Time limit exceeded' };
  }

  if (budget.retryCount >= budget.maxRetries) {
    return { shouldPause: true, reason: 'Maximum retries exceeded' };
  }

  return { shouldPause: false };
};

/**
 * Update budget with new usage data
 */
export const updateBudgetUsage = (
  budget: TaskBudget,
  usage: {
    cost?: number;
    tokens?: number;
    time?: number;
    retries?: number;
  }
): TaskBudget => {
  const updatedBudget = {
    ...budget,
    actualCost: budget.actualCost + (usage.cost || 0),
    actualTokens: budget.actualTokens + (usage.tokens || 0),
    actualTime: budget.actualTime + (usage.time || 0),
    retryCount: usage.retries !== undefined ? usage.retries : budget.retryCount,
    lastUpdatedAt: Date.now(),
  };

  // Check if task should be paused
  const { shouldPause, reason } = shouldPauseTask(updatedBudget);
  if (shouldPause) {
    updatedBudget.isPaused = true;
    updatedBudget.pauseReason = reason;
  }

  // Update status
  updatedBudget.status = calculateBudgetStatus(updatedBudget);

  return updatedBudget;
};

/**
 * Create a new budget with default values
 */
export const createDefaultBudget = (limits?: BudgetLimits): TaskBudget => {
  return {
    actualCost: 0,
    actualTokens: 0,
    actualTime: 0,
    retryCount: 0,
    maxRetries: limits?.maxRetries || 3,
    status: 'within-budget',
    isPaused: false,
    lastUpdatedAt: Date.now(),
    ...(limits?.maxCost && { maxCost: limits.maxCost }),
    ...(limits?.maxTokens && { maxTokens: limits.maxTokens }),
    ...(limits?.maxTime && { maxTime: limits.maxTime }),
  };
};

/**
 * Calculate project-wide budget statistics
 */
export const calculateProjectBudget = (tasks: Task[]): ProjectBudget => {
  const stats: ProjectBudget = {
    totalEstimatedCost: 0,
    totalActualCost: 0,
    totalEstimatedTokens: 0,
    totalActualTokens: 0,
    totalEstimatedTime: 0,
    totalActualTime: 0,
    totalTasks: tasks.length,
    tasksWithinBudget: 0,
    tasksAtWarning: 0,
    tasksExceeded: 0,
    tasksPaused: 0,
  };

  tasks.forEach((task) => {
    if (!task.budget) return;

    stats.totalEstimatedCost += task.budget.estimatedCost || 0;
    stats.totalActualCost += task.budget.actualCost;
    stats.totalEstimatedTokens += task.budget.estimatedTokens || 0;
    stats.totalActualTokens += task.budget.actualTokens;
    stats.totalEstimatedTime += task.budget.estimatedTime || 0;
    stats.totalActualTime += task.budget.actualTime;

    switch (task.budget.status) {
      case 'within-budget':
        stats.tasksWithinBudget++;
        break;
      case 'warning':
        stats.tasksAtWarning++;
        break;
      case 'exceeded':
        stats.tasksExceeded++;
        break;
      case 'paused':
        stats.tasksPaused++;
        break;
    }
  });

  return stats;
};

/**
 * Calculate agent performance metrics
 */
export const calculateAgentMetrics = (
  tasks: Task[],
  agents: CodingAgent[]
): AgentPerformanceMetrics[] => {
  const metricsMap = new Map<string, AgentPerformanceMetrics>();

  // Initialize metrics for all agents
  agents.forEach((agent) => {
    metricsMap.set(agent.id, {
      agentId: agent.id,
      agentName: agent.name,
      totalTasksCompleted: 0,
      averageCost: 0,
      averageTokens: 0,
      averageTime: 0,
      totalCost: 0,
      totalTokens: 0,
      totalTime: 0,
      successRate: 0,
    });
  });

  // Calculate metrics from completed tasks
  const completedTasks = tasks.filter((task) => task.status === 'done' && task.assignedAgentId);

  completedTasks.forEach((task) => {
    if (!task.assignedAgentId || !task.budget) return;

    const metrics = metricsMap.get(task.assignedAgentId);
    if (!metrics) return;

    metrics.totalTasksCompleted++;
    metrics.totalCost += task.budget.actualCost;
    metrics.totalTokens += task.budget.actualTokens;
    metrics.totalTime += task.budget.actualTime;
  });

  // Calculate averages and success rates
  metricsMap.forEach((metrics) => {
    if (metrics.totalTasksCompleted > 0) {
      metrics.averageCost = metrics.totalCost / metrics.totalTasksCompleted;
      metrics.averageTokens = metrics.totalTokens / metrics.totalTasksCompleted;
      metrics.averageTime = metrics.totalTime / metrics.totalTasksCompleted;

      // Success rate: tasks completed within budget
      const agentTasks = completedTasks.filter((t) => t.assignedAgentId === metrics.agentId);
      const successfulTasks = agentTasks.filter(
        (t) => t.budget && (t.budget.status === 'within-budget' || t.budget.status === 'warning')
      );
      metrics.successRate = (successfulTasks.length / agentTasks.length) * 100;
    }
  });

  return Array.from(metricsMap.values());
};

/**
 * Format cost for display
 */
export const formatCost = (cost: number): string => {
  return `$${cost.toFixed(2)}`;
};

/**
 * Format tokens for display
 */
export const formatTokens = (tokens: number): string => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
};

/**
 * Format time duration for display
 */
export const formatTime = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

/**
 * Get budget status color for UI
 */
export const getBudgetStatusColor = (status: BudgetStatus): string => {
  switch (status) {
    case 'within-budget':
      return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30';
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30';
    case 'exceeded':
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30';
    case 'paused':
      return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30';
  }
};

/**
 * Calculate percentage of budget used
 */
export const getBudgetPercentage = (budget: TaskBudget): number => {
  const percentages: number[] = [];

  if (budget.maxCost) {
    percentages.push((budget.actualCost / budget.maxCost) * 100);
  }

  if (budget.maxTokens) {
    percentages.push((budget.actualTokens / budget.maxTokens) * 100);
  }

  if (budget.maxTime) {
    percentages.push((budget.actualTime / budget.maxTime) * 100);
  }

  percentages.push((budget.retryCount / budget.maxRetries) * 100);

  return percentages.length > 0 ? Math.max(...percentages) : 0;
};
