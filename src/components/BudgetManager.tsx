'use client';

import { useState } from 'react';
import { Task } from '@/types/task';
import { X, DollarSign, Zap, Clock, RotateCcw, Settings, Play, Pause } from 'lucide-react';
import { useBudget } from '@/hooks/useBudget';
import { calculateBudgetStatus, formatCurrency, formatTokens, formatTime } from '@/lib/budgetUtils';
import { DEFAULT_BUDGET } from '@/types/budget';

interface BudgetManagerProps {
  task: Task;
  onUpdateTask: (task: Task) => void;
  onClose: () => void;
}

export const BudgetManager = ({ task, onUpdateTask, onClose }: BudgetManagerProps) => {
  const {
    budget,
    initializeBudget,
    updateBudgetLimits,
    updateBudgetUsage,
    resetBudgetUsage,
    pause,
    resume,
    canResume,
  } = useBudget({ task, onUpdateTask });

  const [maxCostUsd, setMaxCostUsd] = useState(budget?.maxCostUsd?.toString() || '');
  const [maxTokens, setMaxTokens] = useState(budget?.maxTokens?.toString() || '');
  const [maxTimeMinutes, setMaxTimeMinutes] = useState(budget?.maxTimeMinutes?.toString() || '');
  const [maxRetries, setMaxRetries] = useState(budget?.maxRetries?.toString() || '');

  // For adding usage
  const [addCost, setAddCost] = useState('');
  const [addTokens, setAddTokens] = useState('');
  const [addTime, setAddTime] = useState('');
  const [addRetries, setAddRetries] = useState('');

  const budgetStatus = budget ? calculateBudgetStatus(budget) : null;

  const handleInitializeBudget = () => {
    initializeBudget({
      maxCostUsd: maxCostUsd ? parseFloat(maxCostUsd) : undefined,
      maxTokens: maxTokens ? parseInt(maxTokens, 10) : undefined,
      maxTimeMinutes: maxTimeMinutes ? parseInt(maxTimeMinutes, 10) : undefined,
      maxRetries: maxRetries ? parseInt(maxRetries, 10) : undefined,
    });
  };

  const handleUpdateLimits = () => {
    updateBudgetLimits({
      maxCostUsd: maxCostUsd ? parseFloat(maxCostUsd) : undefined,
      maxTokens: maxTokens ? parseInt(maxTokens, 10) : undefined,
      maxTimeMinutes: maxTimeMinutes ? parseInt(maxTimeMinutes, 10) : undefined,
      maxRetries: maxRetries ? parseInt(maxRetries, 10) : undefined,
    });
  };

  const handleAddUsage = () => {
    updateBudgetUsage({
      costUsd: addCost ? parseFloat(addCost) : undefined,
      tokens: addTokens ? parseInt(addTokens, 10) : undefined,
      timeMinutes: addTime ? parseInt(addTime, 10) : undefined,
      retries: addRetries ? parseInt(addRetries, 10) : undefined,
    });
    setAddCost('');
    setAddTokens('');
    setAddTime('');
    setAddRetries('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Budget Manager</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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

        {!budget ? (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                This task doesn&apos;t have a budget configured yet. Set up budget limits to start tracking.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Cost (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  placeholder="10.00"
                  value={maxCostUsd}
                  onChange={(e) => setMaxCostUsd(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Tokens
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  placeholder="100000"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Time (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  placeholder="60"
                  value={maxTimeMinutes}
                  onChange={(e) => setMaxTimeMinutes(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Retries
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  placeholder="3"
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={handleInitializeBudget}
              className="w-full px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
            >
              Initialize Budget
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Status */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Current Usage</h4>
                {budget.isPaused ? (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-medium rounded">
                      Paused
                    </span>
                    {canResume && (
                      <button
                        onClick={resume}
                        className="p-1.5 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded transition-colors"
                        title="Resume task"
                      >
                        <Play size={16} />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => pause('Manual pause')}
                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Pause task"
                  >
                    <Pause size={16} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Cost</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(budget.currentCostUsd)}
                    {budget.maxCostUsd && <span className="text-gray-400"> / {formatCurrency(budget.maxCostUsd)}</span>}
                  </p>
                  {budgetStatus && budget.maxCostUsd && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {budgetStatus.costPercentage.toFixed(1)}% used
                    </p>
                  )}
                </div>

                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Tokens</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatTokens(budget.currentTokens)}
                    {budget.maxTokens && <span className="text-gray-400"> / {formatTokens(budget.maxTokens)}</span>}
                  </p>
                  {budgetStatus && budget.maxTokens && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {budgetStatus.tokenPercentage.toFixed(1)}% used
                    </p>
                  )}
                </div>

                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Time</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatTime(budget.currentTimeMinutes)}
                    {budget.maxTimeMinutes && <span className="text-gray-400"> / {formatTime(budget.maxTimeMinutes)}</span>}
                  </p>
                  {budgetStatus && budget.maxTimeMinutes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {budgetStatus.timePercentage.toFixed(1)}% used
                    </p>
                  )}
                </div>

                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <RotateCcw size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Retries</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {budget.currentRetries}
                    {budget.maxRetries && <span className="text-gray-400"> / {budget.maxRetries}</span>}
                  </p>
                  {budgetStatus && budget.maxRetries && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {budgetStatus.retriesPercentage.toFixed(1)}% used
                    </p>
                  )}
                </div>
              </div>

              {budgetStatus && budgetStatus.warnings.length > 0 && (
                <div className="mt-3 space-y-1">
                  {budgetStatus.warnings.map((warning, idx) => (
                    <p key={idx} className="text-xs text-red-600 dark:text-red-400">
                      ⚠️ {warning.message}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Update Limits */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings size={16} className="text-gray-600 dark:text-gray-400" />
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Update Budget Limits</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Max Cost (USD)"
                  className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  value={maxCostUsd}
                  onChange={(e) => setMaxCostUsd(e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Max Tokens"
                  className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Max Time (min)"
                  className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  value={maxTimeMinutes}
                  onChange={(e) => setMaxTimeMinutes(e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Max Retries"
                  className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(e.target.value)}
                />
              </div>
              <button
                onClick={handleUpdateLimits}
                className="w-full mt-3 px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                Update Limits
              </button>
            </div>

            {/* Add Usage */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Add Usage (for testing)</h4>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Add Cost (USD)"
                  className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  value={addCost}
                  onChange={(e) => setAddCost(e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Add Tokens"
                  className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  value={addTokens}
                  onChange={(e) => setAddTokens(e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Add Time (min)"
                  className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  value={addTime}
                  onChange={(e) => setAddTime(e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Add Retries"
                  className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  value={addRetries}
                  onChange={(e) => setAddRetries(e.target.value)}
                />
              </div>
              <button
                onClick={handleAddUsage}
                className="w-full mt-3 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                Add Usage
              </button>
            </div>

            {/* Reset Usage */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to reset all usage counters? This will keep the budget limits but reset current usage to zero.')) {
                    resetBudgetUsage();
                  }
                }}
                className="w-full px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors text-sm font-medium"
              >
                Reset Usage Counters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
