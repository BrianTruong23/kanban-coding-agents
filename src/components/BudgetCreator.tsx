'use client';

import { useState } from 'react';
import { Task } from '@/types/task';
import { BudgetLimit } from '@/types/budget';
import { createDefaultBudget } from '@/lib/budget-tracker';
import { Plus, X, DollarSign, Zap, Clock, RotateCcw } from 'lucide-react';

interface BudgetCreatorProps {
  task: Task;
  onCreateBudget: (taskId: string, agentId?: string, limits?: BudgetLimit) => Promise<void>;
}

export const BudgetCreator = ({ task, onCreateBudget }: BudgetCreatorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Budget limits state
  const defaultBudget = createDefaultBudget(task.id, task.assignedAgentId);
  const [tokens, setTokens] = useState<string>(
    defaultBudget.limits.tokens?.toString() || ''
  );
  const [cost, setCost] = useState<string>(defaultBudget.limits.cost?.toString() || '');
  const [time, setTime] = useState<string>(
    defaultBudget.limits.time ? (defaultBudget.limits.time / 60000).toString() : ''
  ); // Convert ms to minutes for input
  const [retries, setRetries] = useState<string>(
    defaultBudget.limits.retries?.toString() || ''
  );

  const [warningTokens, setWarningTokens] = useState<string>(
    defaultBudget.warningThresholds.tokens?.toString() || '80'
  );
  const [warningCost, setWarningCost] = useState<string>(
    defaultBudget.warningThresholds.cost?.toString() || '80'
  );
  const [warningTime, setWarningTime] = useState<string>(
    defaultBudget.warningThresholds.time?.toString() || '80'
  );

  const [autoPause, setAutoPause] = useState(defaultBudget.autoPauseOnExceed);

  const handleCreate = async () => {
    setError(null);

    // Validate at least one limit is set
    if (!tokens && !cost && !time && !retries) {
      setError('Please set at least one budget limit');
      return;
    }

    setIsCreating(true);

    try {
      const limits: BudgetLimit = {};
      if (tokens) limits.tokens = parseInt(tokens, 10);
      if (cost) limits.cost = parseFloat(cost);
      if (time) limits.time = parseInt(time, 10) * 60000; // Convert minutes to ms
      if (retries) limits.retries = parseInt(retries, 10);

      await onCreateBudget(task.id, task.assignedAgentId, limits);

      // Reset and close
      setIsOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create budget');
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    const defaultBudget = createDefaultBudget(task.id, task.assignedAgentId);
    setTokens(defaultBudget.limits.tokens?.toString() || '');
    setCost(defaultBudget.limits.cost?.toString() || '');
    setTime(defaultBudget.limits.time ? (defaultBudget.limits.time / 60000).toString() : '');
    setRetries(defaultBudget.limits.retries?.toString() || '');
    setWarningTokens('80');
    setWarningCost('80');
    setWarningTime('80');
    setAutoPause(true);
    setError(null);
  };

  const loadDefaults = () => {
    resetForm();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
      >
        <Plus size={14} />
        Create Budget
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Create Task Budget
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Set resource limits for {task.taskId}
              </p>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                resetForm();
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Budget Limits */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Budget Limits
              </h4>
              <button
                onClick={loadDefaults}
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <RotateCcw size={12} />
                Load Defaults
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <DollarSign size={14} />
                  Cost Limit (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  placeholder="e.g., 5.00"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Maximum cost allowed for this task
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Zap size={14} />
                  Token Limit
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  placeholder="e.g., 100000"
                  value={tokens}
                  onChange={(e) => setTokens(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Maximum tokens allowed for this task
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Clock size={14} />
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  placeholder="e.g., 60"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Maximum time allowed for this task
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <RotateCcw size={14} />
                  Retry Limit
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  placeholder="e.g., 3"
                  value={retries}
                  onChange={(e) => setRetries(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Maximum retry attempts allowed
                </p>
              </div>
            </div>
          </div>

          {/* Warning Thresholds */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Warning Thresholds
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Get alerted when resource usage reaches these percentages
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Cost Warning (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  value={warningCost}
                  onChange={(e) => setWarningCost(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Token Warning (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  value={warningTokens}
                  onChange={(e) => setWarningTokens(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Time Warning (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  value={warningTime}
                  onChange={(e) => setWarningTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Auto Actions */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Automatic Actions
            </h4>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoPause}
                onChange={(e) => setAutoPause(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-black dark:text-white focus:ring-black/10 dark:focus:ring-white/20"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Automatically pause task when budget is exceeded
              </span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
              The task will be paused automatically to prevent further resource usage
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end gap-2">
          <button
            onClick={() => {
              setIsOpen(false);
              resetForm();
            }}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create Budget'}
          </button>
        </div>
      </div>
    </div>
  );
};
