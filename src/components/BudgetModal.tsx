'use client';

import { useState } from 'react';
import { X, DollarSign, Zap, Clock, AlertCircle } from 'lucide-react';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (limits: BudgetLimits) => Promise<void>;
  taskTitle: string;
  existingBudget?: BudgetLimits;
}

export interface BudgetLimits {
  maxTokens?: number;
  maxCost?: number;
  maxTimeMinutes?: number;
  maxRetries?: number;
}

export const BudgetModal = ({ isOpen, onClose, onSave, taskTitle, existingBudget }: BudgetModalProps) => {
  const [maxTokens, setMaxTokens] = useState<string>(existingBudget?.maxTokens?.toString() || '');
  const [maxCost, setMaxCost] = useState<string>(existingBudget?.maxCost?.toString() || '');
  const [maxTimeMinutes, setMaxTimeMinutes] = useState<string>(existingBudget?.maxTimeMinutes?.toString() || '');
  const [maxRetries, setMaxRetries] = useState<string>(existingBudget?.maxRetries?.toString() || '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate at least one limit is set
    if (!maxTokens && !maxCost && !maxTimeMinutes && !maxRetries) {
      setError('Please set at least one budget limit');
      return;
    }

    const limits: BudgetLimits = {};

    if (maxTokens) {
      const tokens = parseInt(maxTokens);
      if (isNaN(tokens) || tokens <= 0) {
        setError('Tokens must be a positive number');
        return;
      }
      limits.maxTokens = tokens;
    }

    if (maxCost) {
      const cost = parseFloat(maxCost);
      if (isNaN(cost) || cost <= 0) {
        setError('Cost must be a positive number');
        return;
      }
      limits.maxCost = cost;
    }

    if (maxTimeMinutes) {
      const time = parseInt(maxTimeMinutes);
      if (isNaN(time) || time <= 0) {
        setError('Time must be a positive number');
        return;
      }
      limits.maxTimeMinutes = time;
    }

    if (maxRetries) {
      const retries = parseInt(maxRetries);
      if (isNaN(retries) || retries <= 0) {
        setError('Retries must be a positive number');
        return;
      }
      limits.maxRetries = retries;
    }

    setIsSaving(true);
    try {
      await onSave(limits);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save budget');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Set Budget Limits
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
              Task: {taskTitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Token Limit */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Zap size={16} className="text-yellow-500" />
                Max Tokens (optional)
              </label>
              <input
                type="number"
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                placeholder="e.g., 100000"
                value={maxTokens}
                onChange={(e) => setMaxTokens(e.target.value)}
                min="1"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Maximum number of tokens the agent can use
              </p>
            </div>

            {/* Cost Limit */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <DollarSign size={16} className="text-green-500" />
                Max Cost in USD (optional)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                placeholder="e.g., 5.00"
                value={maxCost}
                onChange={(e) => setMaxCost(e.target.value)}
                min="0.01"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Maximum cost in USD for this task
              </p>
            </div>

            {/* Time Limit */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Clock size={16} className="text-blue-500" />
                Max Time in Minutes (optional)
              </label>
              <input
                type="number"
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                placeholder="e.g., 60"
                value={maxTimeMinutes}
                onChange={(e) => setMaxTimeMinutes(e.target.value)}
                min="1"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Maximum execution time in minutes
              </p>
            </div>

            {/* Retries Limit */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <AlertCircle size={16} className="text-orange-500" />
                Max Retries (optional)
              </label>
              <input
                type="number"
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                placeholder="e.g., 3"
                value={maxRetries}
                onChange={(e) => setMaxRetries(e.target.value)}
                min="1"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Maximum number of retry attempts
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Info */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Note:</strong> Set at least one limit. Tasks will be automatically paused when any limit is exceeded.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : existingBudget ? 'Update Budget' : 'Create Budget'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
