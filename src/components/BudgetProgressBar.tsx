'use client';

import { Task } from '@/types/task';
import { useBudget } from '@/hooks/useBudget';
import clsx from 'clsx';
import { DollarSign, Coins, Clock, Pause } from 'lucide-react';

interface BudgetProgressBarProps {
  task: Task;
}

export const BudgetProgressBar = ({ task }: BudgetProgressBarProps) => {
  const { getBudgetStatus, getBudgetPercentage } = useBudget([task]);

  if (!task.budget || !task.budgetConfig) return null;

  const status = getBudgetStatus(task);
  const costPct = getBudgetPercentage(task, 'cost');
  const tokenPct = getBudgetPercentage(task, 'token');
  const timePct = getBudgetPercentage(task, 'time');

  const maxPct = Math.max(costPct, tokenPct, timePct);

  const getBarColor = () => {
    if (maxPct >= 100) return 'bg-red-500';
    if (maxPct >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusDot = () => {
    if (task.budget.isPaused) return 'bg-gray-500';
    if (maxPct >= 100) return 'bg-red-500';
    if (maxPct >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="mt-2 space-y-1">
      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div className={clsx('w-2 h-2 rounded-full', getStatusDot())} />
          <span className="text-[10px] font-semibold uppercase text-gray-600 dark:text-gray-400">
            {task.budget.isPaused ? 'Paused' : status}
          </span>
        </div>
        {task.budget.isPaused && (
          <Pause size={10} className="text-gray-500 dark:text-gray-400" />
        )}
      </div>

      {/* Progress bar - showing the highest percentage */}
      <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-1 overflow-hidden">
        <div
          className={clsx('h-full transition-all', getBarColor())}
          style={{ width: `${Math.min(maxPct, 100)}%` }}
        />
      </div>

      {/* Budget details - compact view */}
      <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
        {task.budgetConfig.costBudget && (
          <div className="flex items-center gap-0.5" title="Cost">
            <DollarSign size={10} />
            <span>{costPct.toFixed(0)}%</span>
          </div>
        )}
        {task.budgetConfig.tokenBudget && (
          <div className="flex items-center gap-0.5" title="Tokens">
            <Coins size={10} />
            <span>{tokenPct.toFixed(0)}%</span>
          </div>
        )}
        {task.budgetConfig.timeBudget && (
          <div className="flex items-center gap-0.5" title="Time">
            <Clock size={10} />
            <span>{timePct.toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
