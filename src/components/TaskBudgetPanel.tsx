'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { Budget } from '@/types/budget';
import { budgetManager, formatCost, formatTime, formatTokens } from '@/lib/budgetManagement';
import { DollarSign, Clock, Cpu, Save, X, AlertCircle, CheckCircle, Pause, Play } from 'lucide-react';

interface TaskBudgetPanelProps {
  task: Task;
  userId: string;
  onClose: () => void;
}

export const TaskBudgetPanel = ({ task, userId, onClose }: TaskBudgetPanelProps) => {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [tokenLimit, setTokenLimit] = useState<string>('');
  const [costLimit, setCostLimit] = useState<string>('');
  const [timeLimit, setTimeLimit] = useState<string>('');
  const [maxRetries, setMaxRetries] = useState<string>('3');

  useEffect(() => {
    loadBudget();
  }, [task.id]);

  const loadBudget = async () => {
    setLoading(true);
    const existingBudget = await budgetManager.getBudgetByTaskId(task.id);
    setBudget(existingBudget);

    if (existingBudget) {
      setTokenLimit(existingBudget.tokenLimit?.toString() || '');
      setCostLimit(existingBudget.costLimit ? (existingBudget.costLimit / 100).toFixed(2) : '');
      setTimeLimit(existingBudget.timeLimit?.toString() || '');
      setMaxRetries(existingBudget.maxRetries.toString());
    }

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);

    const tokenLimitNum = tokenLimit ? parseInt(tokenLimit) : undefined;
    const costLimitNum = costLimit ? Math.round(parseFloat(costLimit) * 100) : undefined;
    const timeLimitNum = timeLimit ? parseInt(timeLimit) : undefined;
    const maxRetriesNum = parseInt(maxRetries) || 3;

    if (budget) {
      // Update existing budget
      await budgetManager.updateBudget(budget.id, {
        tokenLimit: tokenLimitNum,
        costLimit: costLimitNum,
        timeLimit: timeLimitNum,
        maxRetries: maxRetriesNum,
      });
    } else {
      // Create new budget
      await budgetManager.createBudget(task.id, userId, {
        tokenLimit: tokenLimitNum,
        costLimit: costLimitNum,
        timeLimit: timeLimitNum,
        maxRetries: maxRetriesNum,
      });
    }

    await loadBudget();
    setSaving(false);
  };

  const handlePauseResume = async () => {
    if (!budget) return;

    if (budget.isPaused) {
      await budgetManager.resumeTask(budget.id);
    } else {
      await budgetManager.pauseTask(budget.id);
    }

    await loadBudget();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl">
          <div className="text-gray-500 dark:text-gray-400">Loading budget...</div>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    if (!budget) return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    switch (budget.status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'paused':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'exceeded':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'completed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Budget Configuration
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{task.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X size={24} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Status */}
          {budget && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Current Status
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                  {budget.status.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tokens Used</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatTokens(budget.tokensUsed)}
                  </div>
                  {budget.tokenLimit && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      of {formatTokens(budget.tokenLimit)} (
                      {Math.round((budget.tokensUsed / budget.tokenLimit) * 100)}%)
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cost Used</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCost(budget.costUsed)}
                  </div>
                  {budget.costLimit && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      of {formatCost(budget.costLimit)} (
                      {Math.round((budget.costUsed / budget.costLimit) * 100)}%)
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Time Used</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatTime(budget.timeUsed)}
                  </div>
                  {budget.timeLimit && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      of {formatTime(budget.timeLimit)} (
                      {Math.round((budget.timeUsed / budget.timeLimit) * 100)}%)
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Retries: <span className="font-medium">{budget.retriesUsed} / {budget.maxRetries}</span>
                </div>
                <button
                  onClick={handlePauseResume}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    budget.isPaused
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  }`}
                >
                  {budget.isPaused ? (
                    <>
                      <Play size={16} />
                      Resume Task
                    </>
                  ) : (
                    <>
                      <Pause size={16} />
                      Pause Task
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Budget Limits Configuration */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Budget Limits
            </h3>
            <div className="space-y-4">
              {/* Token Limit */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Cpu size={16} className="text-purple-500" />
                  Token Limit
                </label>
                <input
                  type="number"
                  placeholder="No limit"
                  value={tokenLimit}
                  onChange={(e) => setTokenLimit(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Maximum number of tokens that can be used for this task
                </p>
              </div>

              {/* Cost Limit */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <DollarSign size={16} className="text-green-500" />
                  Cost Limit (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="No limit"
                  value={costLimit}
                  onChange={(e) => setCostLimit(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Maximum cost in USD for this task
                </p>
              </div>

              {/* Time Limit */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock size={16} className="text-orange-500" />
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  placeholder="No limit"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Maximum time in minutes for this task
                </p>
              </div>

              {/* Max Retries */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <AlertCircle size={16} className="text-blue-500" />
                  Max Retries
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Number of times the task can be retried on failure
                </p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-medium mb-1">Budget Enforcement</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Tasks will automatically pause when any budget limit is exceeded</li>
                  <li>Warnings appear at 75% and critical alerts at 90%</li>
                  <li>Retries count towards the total budget usage</li>
                  <li>Leave fields empty for unlimited budgets</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : budget ? 'Update Budget' : 'Create Budget'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
