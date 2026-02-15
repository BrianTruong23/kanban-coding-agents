'use client';

import { useState } from 'react';
import { Task } from '@/types/task';
import { TaskBudget, BudgetMetrics } from '@/types/budget';
import { useBudgets } from '@/hooks/useBudgets';
import {
  DollarSign,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  PauseCircle,
  XCircle,
  TrendingUp,
  Activity,
  Target
} from 'lucide-react';

interface PMDashboardProps {
  tasks: Task[];
}

export const PMDashboard = ({ tasks }: PMDashboardProps) => {
  const { budgets, alerts, getBudgetMetrics, acknowledgeAlert, pauseTask, resumeTask } = useBudgets();
  const metrics = getBudgetMetrics();
  const [selectedView, setSelectedView] = useState<'overview' | 'tasks' | 'alerts'>('overview');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  const getProgressColor = (current: number, max: number | undefined) => {
    if (!max) return 'bg-gray-400';
    const percentage = (current / max) * 100;
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 90) return 'bg-orange-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusBadgeClass = (status: TaskBudget['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'paused':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'exceeded':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'completed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getAlertBadgeClass = (type: 'warning' | 'critical' | 'exceeded') => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700';
      case 'critical':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700';
      case 'exceeded':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          PM Dashboard
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Track budgets, resources, and task progress
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6">
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedView('overview')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              selectedView === 'overview'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedView('tasks')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              selectedView === 'tasks'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Task Budgets
          </button>
          <button
            onClick={() => setSelectedView('alerts')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors relative ${
              selectedView === 'alerts'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Alerts
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {alerts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedView === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spend</h3>
                  <DollarSign size={20} className="text-green-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(metrics.totalCost)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Avg: {formatCurrency(metrics.averageCostPerTask)} per task
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tokens</h3>
                  <Zap size={20} className="text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatTokens(metrics.totalTokens)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Avg: {formatTokens(Math.round(metrics.averageTokensPerTask))} per task
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Time</h3>
                  <Clock size={20} className="text-purple-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatTime(metrics.totalTime)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Avg: {formatTime(Math.round(metrics.averageTimePerTask))} per task
                </p>
              </div>
            </div>

            {/* Task Status Summary */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={20} className="text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Task Status</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Target size={16} className="text-gray-600" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalTasks}</p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <TrendingUp size={16} className="text-green-500" />
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{metrics.activeTasks}</p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Active</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <PauseCircle size={16} className="text-yellow-500" />
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{metrics.pausedTasks}</p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Paused</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <XCircle size={16} className="text-red-500" />
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{metrics.exceededTasks}</p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Exceeded</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <CheckCircle size={16} className="text-blue-500" />
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.completedTasks}</p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Completed</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'tasks' && (
          <div className="space-y-4">
            {budgets.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                <Target size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No budgets configured yet</p>
                <p className="text-sm">Create budgets for your tasks to track spending and resources</p>
              </div>
            ) : (
              budgets.map((budget) => {
                const task = tasks.find((t) => t.id === budget.taskId);
                const costPercentage = budget.maxCost ? (budget.currentCost / budget.maxCost) * 100 : 0;
                const tokenPercentage = budget.maxTokens ? (budget.currentTokens / budget.maxTokens) * 100 : 0;
                const timePercentage = budget.maxTime ? (budget.currentTime / budget.maxTime) * 100 : 0;

                return (
                  <div
                    key={budget.id}
                    className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {task?.title || 'Unknown Task'}
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeClass(budget.status)}`}>
                            {budget.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {task?.taskId} • Retries: {budget.retryCount}/{budget.maxRetries}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {budget.status === 'active' && (
                          <button
                            onClick={() => pauseTask(budget.id)}
                            className="p-2 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded transition-colors"
                            title="Pause task"
                          >
                            <PauseCircle size={18} />
                          </button>
                        )}
                        {budget.status === 'paused' && (
                          <button
                            onClick={() => resumeTask(budget.id)}
                            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                            title="Resume task"
                          >
                            <TrendingUp size={18} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Cost Progress */}
                      {budget.maxCost && (
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <DollarSign size={12} /> Cost
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatCurrency(budget.currentCost)} / {formatCurrency(budget.maxCost)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${getProgressColor(budget.currentCost, budget.maxCost)}`}
                              style={{ width: `${Math.min(costPercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Tokens Progress */}
                      {budget.maxTokens && (
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <Zap size={12} /> Tokens
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatTokens(budget.currentTokens)} / {formatTokens(budget.maxTokens)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${getProgressColor(budget.currentTokens, budget.maxTokens)}`}
                              style={{ width: `${Math.min(tokenPercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Time Progress */}
                      {budget.maxTime && (
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <Clock size={12} /> Time
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatTime(budget.currentTime)} / {formatTime(budget.maxTime)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${getProgressColor(budget.currentTime, budget.maxTime)}`}
                              style={{ width: `${Math.min(timePercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {selectedView === 'alerts' && (
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No active alerts</p>
                <p className="text-sm">All budgets are within limits</p>
              </div>
            ) : (
              alerts.map((alert) => {
                const task = tasks.find((t) => t.id === alert.taskId);
                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${getAlertBadgeClass(alert.type)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <AlertTriangle size={20} className="mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">
                            {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} Alert
                          </h4>
                          <p className="text-sm mb-2">{alert.message}</p>
                          {task && (
                            <p className="text-xs opacity-75">
                              Task: {task.taskId} - {task.title}
                            </p>
                          )}
                          <p className="text-xs opacity-60 mt-1">
                            {new Date(alert.triggeredAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="px-3 py-1 text-xs font-medium bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
