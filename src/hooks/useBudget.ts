'use client';

import { useState, useCallback, useMemo } from 'react';
import { Task } from '@/types/task';
import { TaskBudget, BudgetAlert, ProjectBudget } from '@/types/budget';
import {
  updateBudgetUsage,
  calculateProjectBudget,
  calculateBudgetStatus,
  shouldPauseTask,
} from '@/lib/budget';

export const useBudget = (tasks: Task[], onUpdateTask: (task: Task) => void) => {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);

  /**
   * Update budget for a specific task
   */
  const updateTaskBudget = useCallback(
    (
      taskId: string,
      usage: {
        cost?: number;
        tokens?: number;
        time?: number;
        retries?: number;
      }
    ) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || !task.budget) return;

      const updatedBudget = updateBudgetUsage(task.budget, usage);
      const previousStatus = task.budget.status;

      // Check if status changed and create alert
      if (updatedBudget.status !== previousStatus) {
        const alert: BudgetAlert = {
          id: `${taskId}-${Date.now()}`,
          taskId: task.id,
          taskTitle: task.title,
          type: updatedBudget.status === 'paused' ? 'paused' : updatedBudget.status,
          message: getBudgetAlertMessage(task, updatedBudget),
          timestamp: Date.now(),
          acknowledged: false,
        };
        setAlerts((prev) => [alert, ...prev]);
      }

      onUpdateTask({
        ...task,
        budget: updatedBudget,
      });
    },
    [tasks, onUpdateTask]
  );

  /**
   * Start tracking time for a task
   */
  const startTaskTimer = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || !task.budget) return;

      onUpdateTask({
        ...task,
        budget: {
          ...task.budget,
          startedAt: Date.now(),
        },
      });
    },
    [tasks, onUpdateTask]
  );

  /**
   * Stop tracking time for a task and update actual time
   */
  const stopTaskTimer = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || !task.budget || !task.budget.startedAt) return;

      const elapsed = Date.now() - task.budget.startedAt;
      updateTaskBudget(taskId, { time: elapsed });
    },
    [tasks, updateTaskBudget]
  );

  /**
   * Pause a task manually
   */
  const pauseTask = useCallback(
    (taskId: string, reason: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || !task.budget) return;

      onUpdateTask({
        ...task,
        budget: {
          ...task.budget,
          isPaused: true,
          pauseReason: reason,
          status: 'paused',
        },
      });

      const alert: BudgetAlert = {
        id: `${taskId}-${Date.now()}`,
        taskId: task.id,
        taskTitle: task.title,
        type: 'paused',
        message: `Task paused: ${reason}`,
        timestamp: Date.now(),
        acknowledged: false,
      };
      setAlerts((prev) => [alert, ...prev]);
    },
    [tasks, onUpdateTask]
  );

  /**
   * Resume a paused task
   */
  const resumeTask = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || !task.budget) return;

      const updatedBudget = {
        ...task.budget,
        isPaused: false,
        pauseReason: undefined,
      };
      updatedBudget.status = calculateBudgetStatus(updatedBudget);

      onUpdateTask({
        ...task,
        budget: updatedBudget,
      });
    },
    [tasks, onUpdateTask]
  );

  /**
   * Increment retry count for a task
   */
  const incrementRetry = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || !task.budget) return;

      const newRetryCount = task.budget.retryCount + 1;
      updateTaskBudget(taskId, { retries: newRetryCount });

      // Check if max retries reached
      if (newRetryCount >= task.budget.maxRetries) {
        pauseTask(taskId, 'Maximum retries exceeded');
      }
    },
    [tasks, updateTaskBudget, pauseTask]
  );

  /**
   * Acknowledge an alert
   */
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === alertId ? { ...alert, acknowledged: true } : alert))
    );
  }, []);

  /**
   * Clear all acknowledged alerts
   */
  const clearAcknowledgedAlerts = useCallback(() => {
    setAlerts((prev) => prev.filter((alert) => !alert.acknowledged));
  }, []);

  /**
   * Get project-wide budget statistics
   */
  const projectBudget: ProjectBudget = useMemo(() => {
    return calculateProjectBudget(tasks);
  }, [tasks]);

  /**
   * Get active alerts (unacknowledged)
   */
  const activeAlerts = useMemo(() => {
    return alerts.filter((alert) => !alert.acknowledged);
  }, [alerts]);

  /**
   * Get tasks that need attention (warning, exceeded, or paused)
   */
  const tasksNeedingAttention = useMemo(() => {
    return tasks.filter(
      (task) =>
        task.budget &&
        (task.budget.status === 'warning' ||
          task.budget.status === 'exceeded' ||
          task.budget.status === 'paused')
    );
  }, [tasks]);

  return {
    // Actions
    updateTaskBudget,
    startTaskTimer,
    stopTaskTimer,
    pauseTask,
    resumeTask,
    incrementRetry,
    acknowledgeAlert,
    clearAcknowledgedAlerts,

    // Data
    projectBudget,
    alerts,
    activeAlerts,
    tasksNeedingAttention,
  };
};

/**
 * Generate alert message based on budget status
 */
function getBudgetAlertMessage(task: Task, budget: TaskBudget): string {
  if (budget.isPaused) {
    return `Task "${task.title}" has been paused: ${budget.pauseReason}`;
  }

  if (budget.status === 'exceeded') {
    const reasons: string[] = [];
    if (budget.maxCost && budget.actualCost >= budget.maxCost) {
      reasons.push('cost limit exceeded');
    }
    if (budget.maxTokens && budget.actualTokens >= budget.maxTokens) {
      reasons.push('token limit exceeded');
    }
    if (budget.maxTime && budget.actualTime >= budget.maxTime) {
      reasons.push('time limit exceeded');
    }
    return `Task "${task.title}" has exceeded budget: ${reasons.join(', ')}`;
  }

  if (budget.status === 'warning') {
    return `Task "${task.title}" is approaching budget limits (>80% used)`;
  }

  return `Task "${task.title}" budget status changed`;
}
