'use client';

import { useState, useCallback, useMemo } from 'react';
import { Task } from '@/types/task';
import { Budget, BudgetUsage, BudgetStatus, BudgetAlert, AgentBudgetStats } from '@/types/budget';
import { generateId } from '@/lib/utils';

export const useBudget = (tasks: Task[]) => {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);

  /**
   * Calculate budget status for a task
   */
  const getBudgetStatus = useCallback((task: Task): BudgetStatus => {
    if (!task.budget || !task.budgetConfig) return 'under_budget';

    if (task.budget.isPaused) return 'paused';

    const { budget, budgetConfig } = task;
    const costRatio = budgetConfig.costBudget ? budget.costSpent / budgetConfig.costBudget : 0;
    const tokenRatio = budgetConfig.tokenBudget ? budget.tokensUsed / budgetConfig.tokenBudget : 0;
    const timeRatio = budgetConfig.timeBudget ? budget.timeSpent / budgetConfig.timeBudget : 0;

    const maxRatio = Math.max(costRatio, tokenRatio, timeRatio);

    if (maxRatio >= 1.0) return 'exceeded';
    if (maxRatio >= 0.8) return 'warning';
    return 'under_budget';
  }, []);

  /**
   * Calculate percentage used for a specific budget type
   */
  const getBudgetPercentage = useCallback((task: Task, type: 'cost' | 'token' | 'time'): number => {
    if (!task.budget || !task.budgetConfig) return 0;

    const { budget, budgetConfig } = task;

    switch (type) {
      case 'cost':
        return budgetConfig.costBudget ? (budget.costSpent / budgetConfig.costBudget) * 100 : 0;
      case 'token':
        return budgetConfig.tokenBudget ? (budget.tokensUsed / budgetConfig.tokenBudget) * 100 : 0;
      case 'time':
        return budgetConfig.timeBudget ? (budget.timeSpent / budgetConfig.timeBudget) * 100 : 0;
      default:
        return 0;
    }
  }, []);

  /**
   * Record budget usage for a task
   */
  const recordBudgetUsage = useCallback((
    task: Task,
    usage: Omit<BudgetUsage, 'timestamp'>
  ): Task => {
    if (!task.budget) {
      // Initialize budget if it doesn't exist
      task.budget = {
        costSpent: 0,
        tokensUsed: 0,
        timeSpent: 0,
        retriesUsed: 0,
        isPaused: false,
      };
    }

    const updatedBudget: Budget = {
      ...task.budget,
      costSpent: task.budget.costSpent + usage.costDelta,
      tokensUsed: task.budget.tokensUsed + usage.tokenDelta,
      timeSpent: task.budget.timeSpent + usage.timeDelta,
    };

    const budgetUsage: BudgetUsage = {
      ...usage,
      timestamp: Date.now(),
    };

    const updatedHistory = [...(task.budgetHistory || []), budgetUsage];

    const updatedTask: Task = {
      ...task,
      budget: updatedBudget,
      budgetHistory: updatedHistory,
    };

    // Check if budget exceeded and auto-pause is enabled
    if (task.budgetConfig?.autoPauseOnExceed) {
      const status = getBudgetStatus(updatedTask);
      if (status === 'exceeded' && !updatedBudget.isPaused) {
        updatedTask.budget = {
          ...updatedBudget,
          isPaused: true,
          pauseReason: 'budget_exceeded',
        };

        // Create alert
        const alert: BudgetAlert = {
          id: generateId(),
          taskId: task.id,
          type: 'cost',
          severity: 'critical',
          message: `Task ${task.taskId} has exceeded its budget and has been paused.`,
          timestamp: Date.now(),
          resolved: false,
        };
        setAlerts(prev => [alert, ...prev]);
      }
    }

    return updatedTask;
  }, [getBudgetStatus]);

  /**
   * Pause/resume a task manually
   */
  const toggleTaskPause = useCallback((task: Task, pause: boolean, reason?: 'manual' | 'error'): Task => {
    if (!task.budget) {
      task.budget = {
        costSpent: 0,
        tokensUsed: 0,
        timeSpent: 0,
        retriesUsed: 0,
        isPaused: false,
      };
    }

    return {
      ...task,
      budget: {
        ...task.budget,
        isPaused: pause,
        pauseReason: pause ? reason || 'manual' : undefined,
      },
    };
  }, []);

  /**
   * Increment retry count for a task
   */
  const incrementRetry = useCallback((task: Task): Task => {
    if (!task.budget) {
      task.budget = {
        costSpent: 0,
        tokensUsed: 0,
        timeSpent: 0,
        retriesUsed: 0,
        isPaused: false,
      };
    }

    const newRetryCount = task.budget.retriesUsed + 1;
    const maxRetries = task.budgetConfig?.maxRetries;

    const updatedBudget: Budget = {
      ...task.budget,
      retriesUsed: newRetryCount,
    };

    // Check if max retries exceeded
    if (maxRetries && newRetryCount >= maxRetries) {
      updatedBudget.isPaused = true;
      updatedBudget.pauseReason = 'error';

      const alert: BudgetAlert = {
        id: generateId(),
        taskId: task.id,
        type: 'retry',
        severity: 'critical',
        message: `Task ${task.taskId} has exceeded maximum retries (${maxRetries}) and has been paused.`,
        timestamp: Date.now(),
        resolved: false,
      };
      setAlerts(prev => [alert, ...prev]);
    }

    return {
      ...task,
      budget: updatedBudget,
    };
  }, []);

  /**
   * Get aggregated budget stats by agent
   */
  const getAgentBudgetStats = useCallback((agentId: string): AgentBudgetStats => {
    const agentTasks = tasks.filter(t => t.assignedAgentId === agentId && t.budget);

    const totalCost = agentTasks.reduce((sum, t) => sum + (t.budget?.costSpent || 0), 0);
    const totalTokens = agentTasks.reduce((sum, t) => sum + (t.budget?.tokensUsed || 0), 0);
    const totalTime = agentTasks.reduce((sum, t) => sum + (t.budget?.timeSpent || 0), 0);
    const tasksCount = agentTasks.length;

    return {
      agentId,
      totalCost,
      totalTokens,
      totalTime,
      tasksCount,
      avgCostPerTask: tasksCount > 0 ? totalCost / tasksCount : 0,
      avgTokensPerTask: tasksCount > 0 ? totalTokens / tasksCount : 0,
      avgTimePerTask: tasksCount > 0 ? totalTime / tasksCount : 0,
    };
  }, [tasks]);

  /**
   * Get overall project budget stats
   */
  const getProjectBudgetStats = useMemo(() => {
    const tasksWithBudget = tasks.filter(t => t.budget);

    const totalCost = tasksWithBudget.reduce((sum, t) => sum + (t.budget?.costSpent || 0), 0);
    const totalTokens = tasksWithBudget.reduce((sum, t) => sum + (t.budget?.tokensUsed || 0), 0);
    const totalTime = tasksWithBudget.reduce((sum, t) => sum + (t.budget?.timeSpent || 0), 0);

    const totalCostBudget = tasksWithBudget.reduce((sum, t) => sum + (t.budgetConfig?.costBudget || 0), 0);
    const totalTokenBudget = tasksWithBudget.reduce((sum, t) => sum + (t.budgetConfig?.tokenBudget || 0), 0);
    const totalTimeBudget = tasksWithBudget.reduce((sum, t) => sum + (t.budgetConfig?.timeBudget || 0), 0);

    const pausedTasks = tasksWithBudget.filter(t => t.budget?.isPaused).length;
    const exceededTasks = tasksWithBudget.filter(t => getBudgetStatus(t) === 'exceeded').length;
    const warningTasks = tasksWithBudget.filter(t => getBudgetStatus(t) === 'warning').length;

    return {
      totalCost,
      totalTokens,
      totalTime,
      totalCostBudget,
      totalTokenBudget,
      totalTimeBudget,
      tasksWithBudget: tasksWithBudget.length,
      pausedTasks,
      exceededTasks,
      warningTasks,
      costPercentage: totalCostBudget > 0 ? (totalCost / totalCostBudget) * 100 : 0,
      tokenPercentage: totalTokenBudget > 0 ? (totalTokens / totalTokenBudget) * 100 : 0,
      timePercentage: totalTimeBudget > 0 ? (totalTime / totalTimeBudget) * 100 : 0,
    };
  }, [tasks, getBudgetStatus]);

  /**
   * Resolve an alert
   */
  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  }, []);

  /**
   * Clear all resolved alerts
   */
  const clearResolvedAlerts = useCallback(() => {
    setAlerts(prev => prev.filter(alert => !alert.resolved));
  }, []);

  return {
    getBudgetStatus,
    getBudgetPercentage,
    recordBudgetUsage,
    toggleTaskPause,
    incrementRetry,
    getAgentBudgetStats,
    getProjectBudgetStats,
    alerts,
    resolveAlert,
    clearResolvedAlerts,
  };
};
