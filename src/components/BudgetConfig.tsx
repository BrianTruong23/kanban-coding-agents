'use client';

import { useState } from 'react';
import { Task } from '@/types/task';
import { TaskBudget, BudgetType } from '@/types/budget';
import { DollarSign, Clock, Hash, X, AlertCircle } from 'lucide-react';

interface BudgetConfigProps {
  task: Task;
  existingBudget?: TaskBudget;
  onCreateBudget: (budget: Omit<TaskBudget, 'id' | 'createdAt' | 'lastUpdated' | 'currentCost' | 'currentTokens' | 'currentTime' | 'currentRetries' | 'status'>) => Promise<void>;
  onClose: () => void;
}

export const BudgetConfig = ({ task, existingBudget, onCreateBudget, onClose }: BudgetConfigProps) => {
  const [budgetType, setBudgetType] = useState<BudgetType>('cost');
  const [maxCost, setMaxCost] = useState<string>(existingBudget?.maxCost?.toString() || '');
  const [maxTokens, setMaxTokens] = useState<string>(existingBudget?.maxTokens?.toString() || '');
  const [maxTime, setMaxTime] = useState<string>(existingBudget?.maxTime?.toString() || '');
  const [maxRetries, setMaxRetries] = useState<string>(existingBudget?.maxRetries?.toString() || '3');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (budgetType === 'cost' && !maxCost) {
      setError('Please enter a maximum cost');
      return;
    }
    if (budgetType === 'token' && !maxTokens) {
      setError('Please enter a maximum token count');
      return;
    }
    if (budgetType === 'time' && !maxTime) {
      setError('Please enter a maximum time in minutes');
      return;
    }

    try {
      setIsSubmitting(true);

      await onCreateBudget({
        taskId: task.id,
        type: budgetType,
        maxCost: maxCost ? parseFloat(maxCost) : undefined,
        maxTokens: maxTokens ? parseInt(maxTokens) : undefined,
        maxTime: maxTime ? parseInt(maxTime) : undefined,
        maxRetries: maxRetries ? parseInt(maxRetries) : undefined,
      });

      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create budget';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Configure Budget</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {task.taskId}: {task.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Budget Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Budget Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setBudgetType('cost')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  budgetType === 'cost'
                    ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <DollarSign size={24} className={`mx-auto mb-2 ${budgetType === 'cost' ? 'text-black dark:text-white' : 'text-gray-400'}`} />
                <div className={`text-sm font-medium ${budgetType === 'cost' ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                  Cost
                </div>
              </button>
              <button
                type="button"
                onClick={() => setBudgetType('token')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  budgetType === 'token'
                    ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <Hash size={24} className={`mx-auto mb-2 ${budgetType === 'token' ? 'text-black dark:text-white' : 'text-gray-400'}`} />
                <div className={`text-sm font-medium ${budgetType === 'token' ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                  Tokens
                </div>
              </button>
              <button
                type="button"
                onClick={() => setBudgetType('time')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  budgetType === 'time'
                    ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <Clock size={24} className={`mx-auto mb-2 ${budgetType === 'time' ? 'text-black dark:text-white' : 'text-gray-400'}`} />
                <div className={`text-sm font-medium ${budgetType === 'time' ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                  Time
                </div>
              </button>
            </div>
          </div>

          {/* Budget Limits */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={maxCost}
                onChange={(e) => setMaxCost(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                placeholder="e.g., 10.00"
                disabled={budgetType !== 'cost'}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Maximum cost allowed for this task (in dollars)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Tokens
              </label>
              <input
                type="number"
                min="0"
                value={maxTokens}
                onChange={(e) => setMaxTokens(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                placeholder="e.g., 100000"
                disabled={budgetType !== 'token'}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Maximum token count allowed for this task
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Time (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={maxTime}
                onChange={(e) => setMaxTime(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                placeholder="e.g., 60"
                disabled={budgetType !== 'time'}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Maximum execution time allowed for this task
              </p>
            </div>
          </div>

          {/* Retry Configuration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maximum Retries
            </label>
            <input
              type="number"
              min="0"
              value={maxRetries}
              onChange={(e) => setMaxRetries(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
              placeholder="e.g., 3"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Number of times to retry if task fails
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-medium mb-1">Budget Enforcement</p>
                <p>
                  When a budget limit is reached, the task will be automatically paused.
                  You can manually resume the task or adjust the budget limits.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : existingBudget ? 'Update Budget' : 'Create Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
