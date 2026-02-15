'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { Budget, BudgetSummary } from '@/types/budget';
import { CodingAgent } from '@/types/agent';
import {
  DollarSign,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  PauseCircle,
  XCircle,
  Plus,
  X,
  Play,
  Pause,
} from 'lucide-react';

interface PMDashboardProps {
  tasks: Task[];
  agents: CodingAgent[];
  budgets: Budget[];
  summary: BudgetSummary;
  onCreateBudget: (taskId: string, budget: Partial<Budget>) => Promise<void>;
  onPauseTask: (budgetId: string, reason: string) => Promise<void>;
  onResumeTask: (budgetId: string) => Promise<void>;
  onAcknowledgeAlert: (alertId: string) => Promise<void>;
}

export const PMDashboard = ({
  tasks,
  agents,
  budgets,
  summary,
  onCreateBudget,
  onPauseTask,
  onResumeTask,
  onAcknowledgeAlert,
}: PMDashboardProps) => {
  const [showCreateBudget, setShowCreateBudget] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [maxCost, setMaxCost] = useState<string>('');
  const [maxTokens, setMaxTokens] = useState<string>('');
  const [maxTime, setMaxTime] = useState<string>('');
  const [maxRetries, setMaxRetries] = useState<string>('3');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getPercentage = (used: number, total: number) => {
    if (total === 0) return 0;
    return Math.min((used / total) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId) return;

    await onCreateBudget(selectedTaskId, {
      taskId: selectedTaskId,
      maxCost: maxCost ? parseFloat(maxCost) : undefined,
      maxTokens: maxTokens ? parseInt(maxTokens, 10) : undefined,
      maxTime: maxTime ? parseInt(maxTime, 10) : undefined,
      maxRetries: maxRetries ? parseInt(maxRetries, 10) : 3,
      currentCost: 0,
      currentTokens: 0,
      currentTime: 0,
      currentRetries: 0,
      status: 'active',
    });

    setShowCreateBudget(false);
    setSelectedTaskId('');
    setMaxCost('');
    setMaxTokens('');
    setMaxTime('');
    setMaxRetries('3');
  };

  const tasksWithoutBudget = tasks.filter(
    (task) => !budgets.some((budget) => budget.taskId === task.id)
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900 p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            PM Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track budgets, resource usage, and progress for all agent tasks
          </p>
        </div>
        <button
          onClick={() => setShowCreateBudget(true)}
          className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          <Plus size={16} /> Create Budget
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Total Tasks
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {summary.totalTasks}
              </p>
            </div>
            <CheckCircle className="text-blue-500" size={24} />
          </div>
          <div className="mt-3 flex gap-2 text-xs">
            <span className="text-green-600 dark:text-green-400">
              {summary.activeBudgets} active
            </span>
            <span className="text-orange-600 dark:text-orange-400">
              {summary.pausedBudgets} paused
            </span>
            <span className="text-red-600 dark:text-red-400">
              {summary.exceededBudgets} exceeded
            </span>
          </div>
        </div>

        {/* Cost Usage */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Cost Usage
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(summary.totalCostUsed)}
              </p>
            </div>
            <DollarSign className="text-green-500" size={24} />
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">
                of {formatCurrency(summary.totalCostBudget)}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {getPercentage(summary.totalCostUsed, summary.totalCostBudget).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getProgressColor(
                  getPercentage(summary.totalCostUsed, summary.totalCostBudget)
                )}`}
                style={{
                  width: `${getPercentage(summary.totalCostUsed, summary.totalCostBudget)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Token Usage */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Token Usage
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatNumber(summary.totalTokensUsed)}
              </p>
            </div>
            <Zap className="text-purple-500" size={24} />
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">
                of {formatNumber(summary.totalTokensBudget)}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {getPercentage(summary.totalTokensUsed, summary.totalTokensBudget).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getProgressColor(
                  getPercentage(summary.totalTokensUsed, summary.totalTokensBudget)
                )}`}
                style={{
                  width: `${getPercentage(summary.totalTokensUsed, summary.totalTokensBudget)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Time Usage */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Time Usage
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {summary.totalTimeUsed} min
              </p>
            </div>
            <Clock className="text-orange-500" size={24} />
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">
                of {summary.totalTimeBudget} min
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {getPercentage(summary.totalTimeUsed, summary.totalTimeBudget).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getProgressColor(
                  getPercentage(summary.totalTimeUsed, summary.totalTimeBudget)
                )}`}
                style={{
                  width: `${getPercentage(summary.totalTimeUsed, summary.totalTimeBudget)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {summary.alerts.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={20} />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Active Alerts ({summary.alerts.length})
            </h2>
          </div>
          <div className="space-y-2">
            {summary.alerts.map((alert) => {
              const task = tasks.find((t) => t.id === alert.taskId);
              return (
                <div
                  key={alert.id}
                  className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          alert.type === 'exceeded'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : alert.type === 'critical'
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        }`}
                      >
                        {alert.type.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {task?.taskId || 'Unknown Task'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {alert.message}
                    </p>
                  </div>
                  <button
                    onClick={() => onAcknowledgeAlert(alert.id)}
                    className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Budget List */}
      <div className="flex-1 overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Task Budgets
        </h2>
        <div className="space-y-3">
          {budgets.map((budget) => {
            const task = tasks.find((t) => t.id === budget.taskId);
            const agent = task?.assignedAgentId
              ? agents.find((a) => a.id === task.assignedAgentId)
              : null;

            const costPercent = budget.maxCost
              ? getPercentage(budget.currentCost, budget.maxCost)
              : 0;
            const tokensPercent = budget.maxTokens
              ? getPercentage(budget.currentTokens, budget.maxTokens)
              : 0;
            const timePercent = budget.maxTime
              ? getPercentage(budget.currentTime, budget.maxTime)
              : 0;

            return (
              <div
                key={budget.id}
                className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {task?.taskId || 'Unknown'}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          budget.status === 'active'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : budget.status === 'paused'
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                            : budget.status === 'exceeded'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {budget.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {task?.title || 'No title'}
                    </p>
                    {agent && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Assigned to: {agent.name}
                      </p>
                    )}
                    {budget.pausedReason && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        Paused: {budget.pausedReason}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {budget.status === 'paused' ? (
                      <button
                        onClick={() => onResumeTask(budget.id)}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                        title="Resume task"
                      >
                        <Play size={16} />
                      </button>
                    ) : budget.status === 'active' ? (
                      <button
                        onClick={() => onPauseTask(budget.id, 'Manually paused by PM')}
                        className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded"
                        title="Pause task"
                      >
                        <Pause size={16} />
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Cost */}
                  {budget.maxCost !== undefined && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500 dark:text-gray-400">Cost</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {formatCurrency(budget.currentCost)} / {formatCurrency(budget.maxCost)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getProgressColor(
                            costPercent
                          )}`}
                          style={{ width: `${costPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Tokens */}
                  {budget.maxTokens !== undefined && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500 dark:text-gray-400">Tokens</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {formatNumber(budget.currentTokens)} / {formatNumber(budget.maxTokens)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getProgressColor(
                            tokensPercent
                          )}`}
                          style={{ width: `${tokensPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Time */}
                  {budget.maxTime !== undefined && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500 dark:text-gray-400">Time</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {budget.currentTime} / {budget.maxTime} min
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getProgressColor(
                            timePercent
                          )}`}
                          style={{ width: `${timePercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Retries */}
                {budget.maxRetries !== undefined && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Retries: {budget.currentRetries} / {budget.maxRetries}
                  </div>
                )}
              </div>
            );
          })}

          {budgets.length === 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <p>No budgets created yet</p>
              <p className="text-xs mt-1">Click &quot;Create Budget&quot; to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Budget Modal */}
      {showCreateBudget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowCreateBudget(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Create Budget
              </h3>
              <button
                onClick={() => setShowCreateBudget(false)}
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
                  <option value="">Choose a task...</option>
                  {tasksWithoutBudget.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.taskId} - {task.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Cost (USD, optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  placeholder="e.g., 50.00"
                  value={maxCost}
                  onChange={(e) => setMaxCost(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Tokens (optional)
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
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Time in Minutes (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  placeholder="e.g., 120"
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
                  placeholder="e.g., 3"
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateBudget(false);
                    setSelectedTaskId('');
                    setMaxCost('');
                    setMaxTokens('');
                    setMaxTime('');
                    setMaxRetries('3');
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
    </div>
  );
};
