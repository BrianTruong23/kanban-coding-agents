'use client';

import { useCallback } from 'react';
import { Task } from '@/types/task';
import { TaskBudget, BudgetUpdate, DEFAULT_BUDGET } from '@/types/budget';
import { updateBudget, pauseTask, resumeTask, canResumeTask } from '@/lib/budgetUtils';

interface UseBudgetProps {
  task: Task;
  onUpdateTask: (task: Task) => void;
}

export const useBudget = ({ task, onUpdateTask }: UseBudgetProps) => {
  /**
   * Initialize budget for a task if it doesn't have one
   */
  const initializeBudget = useCallback(
    (config: Partial<TaskBudget> = {}) => {
      const budget: TaskBudget = {
        ...DEFAULT_BUDGET,
        ...config,
      };

      onUpdateTask({
        ...task,
        budget,
      });

      return budget;
    },
    [task, onUpdateTask]
  );

  /**
   * Update budget usage
   */
  const updateBudgetUsage = useCallback(
    (update: BudgetUpdate) => {
      if (!task.budget) {
        console.warn('Cannot update budget: task has no budget configured');
        return;
      }

      const updatedBudget = updateBudget(task.budget, update);

      onUpdateTask({
        ...task,
        budget: updatedBudget,
      });
    },
    [task, onUpdateTask]
  );

  /**
   * Pause a task
   */
  const pause = useCallback(
    (reason: string) => {
      if (!task.budget) {
        console.warn('Cannot pause task: task has no budget configured');
        return;
      }

      const pausedBudget = pauseTask(task.budget, reason);

      onUpdateTask({
        ...task,
        budget: pausedBudget,
      });
    },
    [task, onUpdateTask]
  );

  /**
   * Resume a paused task
   */
  const resume = useCallback(() => {
    if (!task.budget) {
      console.warn('Cannot resume task: task has no budget configured');
      return;
    }

    if (!canResumeTask(task.budget)) {
      console.warn('Cannot resume task: still over budget');
      return;
    }

    const resumedBudget = resumeTask(task.budget);

    onUpdateTask({
      ...task,
      budget: resumedBudget,
    });
  }, [task, onUpdateTask]);

  /**
   * Update budget limits
   */
  const updateBudgetLimits = useCallback(
    (limits: Partial<Pick<TaskBudget, 'maxCostUsd' | 'maxTokens' | 'maxTimeMinutes' | 'maxRetries'>>) => {
      const currentBudget = task.budget || DEFAULT_BUDGET;

      const updatedBudget: TaskBudget = {
        ...currentBudget,
        ...limits,
        lastUpdatedAt: Date.now(),
      };

      onUpdateTask({
        ...task,
        budget: updatedBudget,
      });
    },
    [task, onUpdateTask]
  );

  /**
   * Reset budget usage (keep limits)
   */
  const resetBudgetUsage = useCallback(() => {
    if (!task.budget) {
      console.warn('Cannot reset budget: task has no budget configured');
      return;
    }

    const resetBudget: TaskBudget = {
      ...task.budget,
      currentCostUsd: 0,
      currentTokens: 0,
      currentTimeMinutes: 0,
      currentRetries: 0,
      isPaused: false,
      pausedReason: undefined,
      pausedAt: undefined,
      lastUpdatedAt: Date.now(),
    };

    onUpdateTask({
      ...task,
      budget: resetBudget,
    });
  }, [task, onUpdateTask]);

  return {
    budget: task.budget,
    initializeBudget,
    updateBudgetUsage,
    updateBudgetLimits,
    resetBudgetUsage,
    pause,
    resume,
    canResume: task.budget ? canResumeTask(task.budget) : false,
  };
};
