'use client';

import { useState } from 'react';
import { Task } from '@/types/task';
import { TaskBudget } from '@/types/budget';
import { X, DollarSign, Zap, Clock, RotateCcw } from 'lucide-react';

interface BudgetModalProps {
  task: Task;
  existingBudget?: TaskBudget;
  onSave: (budget: Partial<TaskBudget>) => void;
  onClose: () => void;
}

export const BudgetModal = ({ task, existingBudget, onSave, onClose }: BudgetModalProps) => {
  const [maxCost, setMaxCost] = useState(existingBudget?.maxCost?.toString() || '');
  const [maxTokens, setMaxTokens] = useState(existingBudget?.maxTokens?.toString() || '');
  const [maxTime, setMaxTime] = useState(existingBudget?.maxTime ? (existingBudget.maxTime / 60).toString() : '');
  const [maxRetries, setMaxRetries] = useState(existingBudget?.maxRetries?.toString() || '3');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const budget: Partial<TaskBudget> = {
      maxCost: maxCost ? parseFloat(maxCost) : undefined,
      maxTokens: maxTokens ? parseInt(maxTokens, 10) : undefined,
      maxTime: maxTime ? parseInt(maxTime, 10) * 60 : undefined, // Convert minutes to seconds
      maxRetries: maxRetries ? parseInt(maxRetries, 10) : 3,
    };

    onSave(budget);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {existingBudget ? 'Edit Budget' : 'Set Budget'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {task.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{task.taskId}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Max Cost */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DollarSign size={16} />
              Maximum Cost (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={maxCost}
              onChange={(e) => setMaxCost(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
              placeholder="e.g., 10.00"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Leave empty for no cost limit
            </p>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Zap size={16} />
              Maximum Tokens
            </label>
            <input
              type="number"
              min="0"
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
              placeholder="e.g., 100000"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Leave empty for no token limit
            </p>
          </div>

          {/* Max Time */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Clock size={16} />
              Maximum Time (minutes)
            </label>
            <input
              type="number"
              min="0"
              value={maxTime}
              onChange={(e) => setMaxTime(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
              placeholder="e.g., 30"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Leave empty for no time limit
            </p>
          </div>

          {/* Max Retries */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <RotateCcw size={16} />
              Maximum Retries
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={maxRetries}
              onChange={(e) => setMaxRetries(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
              placeholder="3"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Number of times to retry on failure (default: 3)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
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
              {existingBudget ? 'Update Budget' : 'Create Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
