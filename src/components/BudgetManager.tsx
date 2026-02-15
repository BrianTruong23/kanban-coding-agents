'use client';

import { useState, useMemo } from 'react';
import { Budget, BudgetAlert } from '@/types/budget';
import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import {
  DollarSign,
  Clock,
  Zap,
  AlertTriangle,
  Pause,
  Play,
  Plus,
  X,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';

interface BudgetManagerProps {
  budgets: Budget[];
  alerts: BudgetAlert[];
  tasks: Task[];
  agents: CodingAgent[];
  onCreateBudget: (budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Budget | void>;
  onUpdateBudget: (budget: Budget) => void;
  onPauseBudget: (budgetId: string, reason: string) => void;
  onResumeBudget: (budgetId: string) => void;
  onAcknowledgeAlert: (alertId: string) => void;
}

export const BudgetManager = ({
  budgets,
  alerts,
  tasks,
  agents,
  onCreateBudget,
  onUpdateBudget,
  onPauseBudget,
  onResumeBudget,
  onAcknowledgeAlert,
}: BudgetManagerProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [maxCost, setMaxCost] = useState('');
  const [maxTokens, setMaxTokens] = useState('');
  const [maxTime, setMaxTime] = useState('');
  const [maxRetries, setMaxRetries] = useState('3');
  const [error, setError] = useState<string | null>(null);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalAllocatedCost = budgets.reduce((sum, b) => sum + (b.maxCost || 0), 0);
    const totalSpentCost = budgets.reduce((sum, b) => sum + b.currentCost, 0);
    const totalAllocatedTokens = budgets.reduce((sum, b) => sum + (b.maxTokens || 0), 0);
    const totalSpentTokens = budgets.reduce((sum, b) => sum + b.currentTokens, 0);
    const totalAllocatedTime = budgets.reduce((sum, b) => sum + (b.maxTime || 0), 0);
    const totalSpentTime = budgets.reduce((sum, b) => sum + b.currentTime, 0);

    return {
      totalAllocatedCost,
      totalSpentCost,
      totalAllocatedTokens,
      totalSpentTokens,
      totalAllocatedTime,
      totalSpentTime,
      activeBudgets: budgets.filter((b) => b.status === 'active').length,
      pausedBudgets: budgets.filter((b) => b.status === 'paused').length,
      exceededBudgets: budgets.filter((b) => b.status === 'exceeded').length,
      unacknowledgedAlerts: alerts.filter((a) => !a.acknowledged).length,
    };
  }, [budgets, alerts]);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId) {
      setError('Please select a task');
      return;
    }

    // Check if budget already exists for this task
    if (budgets.some((b) => b.taskId === selectedTaskId)) {
      setError('Budget already exists for this task');
      return;
    }

    setError(null);
    try {
      await onCreateBudget({
        taskId: selectedTaskId,
        maxCost: maxCost ? parseFloat(maxCost) : undefined,
        maxTokens: maxTokens ? parseInt(maxTokens, 10) : undefined,
        maxTime: maxTime ? parseInt(maxTime, 10) : undefined,
        currentCost: 0,
        currentTokens: 0,
        currentTime: 0,
        maxRetries: parseInt(maxRetries, 10),
        currentRetries: 0,
        status: 'active',
      });

      // Reset form
      setSelectedTaskId('');
      setMaxCost('');
      setMaxTokens('');
      setMaxTime('');
      setMaxRetries('3');
      setIsCreating(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create budget';
      setError(message);
      console.error(err);
    }
  };

  const getTaskById = (taskId: string) => tasks.find((t) => t.id === taskId);

  const getPercentage = (current: number, max: number | undefined) => {
    if (!max || max === 0) return 0;
    return Math.min((current / max) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 95) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const unassignedTasks = tasks.filter(
    (t) => !budgets.some((b) => b.taskId === t.id)
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with summary stats */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Budget Manager</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track and manage resource budgets for agent tasks
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            <Plus size={16} /> New Budget
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={20} className="text-green-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Cost</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${summary.totalSpentCost.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              of ${summary.totalAllocatedCost.toFixed(2)} allocated
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={20} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tokens</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {summary.totalSpentTokens.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              of {summary.totalAllocatedTokens.toLocaleString()} allocated
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={20} className="text-purple-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Time</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {summary.totalSpentTime} min
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              of {summary.totalAllocatedTime} min allocated
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} className="text-orange-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</span>
            </div>
            <div className="flex gap-2 items-baseline">
              <span className="text-xl font-bold text-green-500">{summary.activeBudgets}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">active</span>
              {summary.pausedBudgets > 0 && (
                <>
                  <span className="text-xl font-bold text-yellow-500">{summary.pausedBudgets}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">paused</span>
                </>
              )}
              {summary.exceededBudgets > 0 && (
                <>
                  <span className="text-xl font-bold text-red-500">{summary.exceededBudgets}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">exceeded</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {summary.unacknowledgedAlerts > 0 && (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Budget Alerts ({summary.unacknowledgedAlerts})
            </h3>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {alerts
              .filter((a) => !a.acknowledged)
              .slice(0, 5)
              .map((alert) => {
                const task = getTaskById(alert.taskId);
                return (
                  <div
                    key={alert.id}
                    className="flex items-start justify-between bg-white dark:bg-gray-800 p-3 rounded border border-yellow-200 dark:border-yellow-800"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {task?.taskId} - {task?.title}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {alert.message} ({alert.currentUsage.toFixed(2)} / {alert.limit.toFixed(2)})
                      </div>
                    </div>
                    <button
                      onClick={() => onAcknowledgeAlert(alert.id)}
                      className="text-green-500 hover:text-green-700 dark:hover:text-green-400 ml-2"
                      title="Acknowledge"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Create Budget Modal */}
      {isCreating && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setIsCreating(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create New Budget</h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Task *
                </label>
                <select
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  required
                >
                  <option value="">Select a task...</option>
                  {unassignedTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.taskId} - {task.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                    placeholder="e.g., 10.00"
                    value={maxCost}
                    onChange={(e) => setMaxCost(e.target.value)}
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
                    placeholder="e.g., 100000"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Time (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                    placeholder="e.g., 60"
                    value={maxTime}
                    onChange={(e) => setMaxTime(e.target.value)}
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
                    value={maxRetries}
                    onChange={(e) => setMaxRetries(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setSelectedTaskId('');
                    setMaxCost('');
                    setMaxTokens('');
                    setMaxTime('');
                    setMaxRetries('3');
                    setError(null);
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
                >
                  Create Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budgets List */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4">
          {budgets.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <p className="mb-2">No budgets created yet</p>
              <p className="text-sm">Click &quot;New Budget&quot; to get started</p>
            </div>
          ) : (
            budgets.map((budget) => {
              const task = getTaskById(budget.taskId);
              const costPercentage = getPercentage(budget.currentCost, budget.maxCost);
              const tokensPercentage = getPercentage(budget.currentTokens, budget.maxTokens);
              const timePercentage = getPercentage(budget.currentTime, budget.maxTime);

              return (
                <div
                  key={budget.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {task?.taskId} - {task?.title}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            budget.status === 'active'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : budget.status === 'paused'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                              : budget.status === 'exceeded'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {budget.status}
                        </span>
                      </div>
                      {budget.pausedReason && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Reason: {budget.pausedReason}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {budget.status === 'paused' ? (
                        <button
                          onClick={() => onResumeBudget(budget.id)}
                          className="text-green-500 hover:text-green-700 dark:hover:text-green-400"
                          title="Resume"
                        >
                          <Play size={18} />
                        </button>
                      ) : budget.status === 'active' ? (
                        <button
                          onClick={() => onPauseBudget(budget.id, 'Manually paused')}
                          className="text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-400"
                          title="Pause"
                        >
                          <Pause size={18} />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Cost Progress */}
                    {budget.maxCost && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <DollarSign size={14} />
                            <span>Cost</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-white">
                            ${budget.currentCost.toFixed(2)} / ${budget.maxCost.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${getProgressColor(
                              costPercentage
                            )}`}
                            style={{ width: `${costPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Tokens Progress */}
                    {budget.maxTokens && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <Zap size={14} />
                            <span>Tokens</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-white">
                            {budget.currentTokens.toLocaleString()} /{' '}
                            {budget.maxTokens.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${getProgressColor(
                              tokensPercentage
                            )}`}
                            style={{ width: `${tokensPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Time Progress */}
                    {budget.maxTime && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <Clock size={14} />
                            <span>Time</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-white">
                            {budget.currentTime} min / {budget.maxTime} min
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${getProgressColor(
                              timePercentage
                            )}`}
                            style={{ width: `${timePercentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Retries */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Retries</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {budget.currentRetries} / {budget.maxRetries}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
