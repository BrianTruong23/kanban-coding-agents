'use client';

import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { calculateBudgetSummary, calculateBudgetStatus, formatCurrency, formatTime, formatTokens } from '@/lib/budgetUtils';
import { AlertCircle, DollarSign, Clock, Zap, Pause, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';

interface PMDashboardProps {
  tasks: Task[];
  agents: CodingAgent[];
}

export const PMDashboard = ({ tasks, agents }: PMDashboardProps) => {
  const summary = calculateBudgetSummary(tasks);

  const tasksWithBudget = tasks.filter(task => task.budget);
  const overBudgetTasks = tasksWithBudget.filter(task => {
    if (!task.budget) return false;
    const status = calculateBudgetStatus(task.budget);
    return status.isOverBudget;
  });

  const pausedTasks = tasksWithBudget.filter(task => task.budget?.isPaused);

  const costUtilization = summary.totalBudgetUsd > 0
    ? (summary.totalSpentUsd / summary.totalBudgetUsd) * 100
    : 0;

  const tokenUtilization = summary.totalBudgetTokens > 0
    ? (summary.totalSpentTokens / summary.totalBudgetTokens) * 100
    : 0;

  const timeUtilization = summary.totalBudgetTime > 0
    ? (summary.totalSpentTime / summary.totalBudgetTime) * 100
    : 0;

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600 dark:text-red-400';
    if (percentage >= 80) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getUtilizationBgColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Project Manager Dashboard</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track resource usage and budget across all agent tasks
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{summary.totalTasks}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-gray-600 dark:text-gray-400">In Progress: {summary.tasksByStatus['in-progress']}</span>
          </div>
        </div>

        {/* Budget Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Budget Spent</p>
              <p className={`text-2xl font-bold mt-1 ${getUtilizationColor(costUtilization)}`}>
                {formatCurrency(summary.totalSpentUsd)}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              of {formatCurrency(summary.totalBudgetUsd)} ({costUtilization.toFixed(0)}%)
            </span>
          </div>
        </div>

        {/* Over Budget */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Over Budget</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {summary.overBudgetTasks}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-gray-600 dark:text-gray-400">Tasks need attention</span>
          </div>
        </div>

        {/* Paused Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Paused</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {summary.pausedTasks}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Pause className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-gray-600 dark:text-gray-400">Due to budget limits</span>
          </div>
        </div>
      </div>

      {/* Resource Utilization */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resource Utilization</h3>
        <div className="space-y-4">
          {/* Cost */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cost Budget</span>
              </div>
              <span className={`text-sm font-semibold ${getUtilizationColor(costUtilization)}`}>
                {formatCurrency(summary.totalSpentUsd)} / {formatCurrency(summary.totalBudgetUsd)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getUtilizationBgColor(costUtilization)}`}
                style={{ width: `${Math.min(costUtilization, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{costUtilization.toFixed(1)}% utilized</p>
          </div>

          {/* Tokens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Token Budget</span>
              </div>
              <span className={`text-sm font-semibold ${getUtilizationColor(tokenUtilization)}`}>
                {formatTokens(summary.totalSpentTokens)} / {formatTokens(summary.totalBudgetTokens)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getUtilizationBgColor(tokenUtilization)}`}
                style={{ width: `${Math.min(tokenUtilization, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{tokenUtilization.toFixed(1)}% utilized</p>
          </div>

          {/* Time */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Budget</span>
              </div>
              <span className={`text-sm font-semibold ${getUtilizationColor(timeUtilization)}`}>
                {formatTime(summary.totalSpentTime)} / {formatTime(summary.totalBudgetTime)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getUtilizationBgColor(timeUtilization)}`}
                style={{ width: `${Math.min(timeUtilization, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{timeUtilization.toFixed(1)}% utilized</p>
          </div>
        </div>
      </div>

      {/* Tasks by Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tasks by Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.tasksByStatus.backlog}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mt-1">Backlog</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.tasksByStatus['in-progress']}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mt-1">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.tasksByStatus.review}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mt-1">In Review</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.tasksByStatus.done}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mt-1">Done</p>
          </div>
        </div>
      </div>

      {/* Over Budget Tasks */}
      {overBudgetTasks.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-300">
              Tasks Over Budget ({overBudgetTasks.length})
            </h3>
          </div>
          <div className="space-y-2">
            {overBudgetTasks.map(task => {
              const status = task.budget ? calculateBudgetStatus(task.budget) : null;
              return (
                <div key={task.id} className="bg-white dark:bg-gray-800 rounded p-3 border border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{task.taskId}: {task.title}</p>
                      {status && status.warnings.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {status.warnings.map((warning, idx) => (
                            <p key={idx} className="text-xs text-red-600 dark:text-red-400">
                              {warning.message}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    {task.budget?.isPaused && (
                      <span className="ml-2 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-medium rounded">
                        Paused
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Paused Tasks */}
      {pausedTasks.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 mb-4">
            <Pause className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-300">
              Paused Tasks ({pausedTasks.length})
            </h3>
          </div>
          <div className="space-y-2">
            {pausedTasks.map(task => (
              <div key={task.id} className="bg-white dark:bg-gray-800 rounded p-3 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{task.taskId}: {task.title}</p>
                    {task.budget?.pausedReason && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        Reason: {task.budget.pausedReason}
                      </p>
                    )}
                  </div>
                  {task.budget?.pausedAt && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(task.budget.pausedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Message */}
      {tasksWithBudget.length === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8 border border-blue-200 dark:border-blue-800 text-center">
          <CheckCircle2 className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">No Budget Tracking Yet</h3>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            Start adding budgets to tasks to track resource usage and costs
          </p>
        </div>
      )}
    </div>
  );
};
