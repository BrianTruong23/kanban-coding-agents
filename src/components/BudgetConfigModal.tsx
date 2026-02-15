'use client';

import { Task } from '@/types/task';
import { TaskBudgetConfig } from '@/types/budget';
import { useState } from 'react';
import { X, DollarSign, Coins, Clock, RefreshCw } from 'lucide-react';

interface BudgetConfigModalProps {
  task: Task;
  onSave: (task: Task) => void;
  onClose: () => void;
}

export const BudgetConfigModal = ({ task, onSave, onClose }: BudgetConfigModalProps) => {
  const [config, setConfig] = useState<TaskBudgetConfig>(
    task.budgetConfig || {
      autoPauseOnExceed: true,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedTask: Task = {
      ...task,
      budgetConfig: config,
      budget: task.budget || {
        costSpent: 0,
        tokensUsed: 0,
        timeSpent: 0,
        retriesUsed: 0,
        isPaused: false,
      },
    };

    onSave(updatedTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Configure Budget</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Task</div>
          <div className="font-medium text-gray-900 dark:text-white">{task.taskId}: {task.title}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cost Budget */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <DollarSign size={14} />
              Cost Budget (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
              placeholder="e.g., 10.00 (optional)"
              value={config.costBudget || ''}
              onChange={(e) =>
                setConfig({
                  ...config,
                  costBudget: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Leave empty for unlimited
            </p>
          </div>

          {/* Token Budget */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <Coins size={14} />
              Token Budget
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
              placeholder="e.g., 100000 (optional)"
              value={config.tokenBudget || ''}
              onChange={(e) =>
                setConfig({
                  ...config,
                  tokenBudget: e.target.value ? parseInt(e.target.value, 10) : undefined,
                })
              }
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Leave empty for unlimited
            </p>
          </div>

          {/* Time Budget */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <Clock size={14} />
              Time Budget (minutes)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
              placeholder="e.g., 60 (optional)"
              value={config.timeBudget ? config.timeBudget / 60000 : ''}
              onChange={(e) =>
                setConfig({
                  ...config,
                  timeBudget: e.target.value ? parseInt(e.target.value, 10) * 60000 : undefined,
                })
              }
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Leave empty for unlimited
            </p>
          </div>

          {/* Max Retries */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <RefreshCw size={14} />
              Max Retries
            </label>
            <input
              type="number"
              min="0"
              step="1"
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
              placeholder="e.g., 3 (optional)"
              value={config.maxRetries || ''}
              onChange={(e) =>
                setConfig({
                  ...config,
                  maxRetries: e.target.value ? parseInt(e.target.value, 10) : undefined,
                })
              }
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Maximum retry attempts before pausing
            </p>
          </div>

          {/* Auto Pause */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoPause"
              className="rounded border-gray-300 dark:border-gray-600"
              checked={config.autoPauseOnExceed || false}
              onChange={(e) =>
                setConfig({
                  ...config,
                  autoPauseOnExceed: e.target.checked,
                })
              }
            />
            <label htmlFor="autoPause" className="text-sm text-gray-700 dark:text-gray-300">
              Auto-pause task when budget exceeded
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
            >
              Save Budget Config
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
