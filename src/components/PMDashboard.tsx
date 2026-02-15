'use client';

import { useState, useMemo } from 'react';
import { Task } from '@/types/task';
import { TaskBudget } from '@/types/budget';
import { CodingAgent } from '@/types/agent';
import {
  calculateBudgetMetrics,
  formatCost,
  formatTokens,
  formatTime,
  getBudgetStatusColor,
  getRemainingBudget,
} from '@/lib/budgetUtils';
import {
  DollarSign,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle,
  Pause,
  Play,
  TrendingUp,
  BarChart3,
  Filter,
} from 'lucide-react';

interface PMDashboardProps {
  tasks: Task[];
  budgets: TaskBudget[];
  agents: CodingAgent[];
  onPauseBudget: (budgetId: string, reason: string) => void;
  onResumeBudget: (budgetId: string) => void;
}

export const PMDashboard = ({
  tasks,
  budgets,
  agents,
  onPauseBudget,
  onResumeBudget,
}: PMDashboardProps) => {
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'paused' | 'exceeded'>('all');
  const [sortBy, setSortBy] = useState<'usage' | 'remaining' | 'status'>('usage');

  // Calculate aggregate statistics
  const stats = useMemo(() => {
    const totalTokensUsed = budgets.reduce((sum, b) => sum + b.tokensUsed, 0);
    const totalCostUsed = budgets.reduce((sum, b) => sum + b.costUsed, 0);
    const totalTimeUsed = budgets.reduce((sum, b) => sum + b.timeUsedMinutes, 0);

    const activeBudgets = budgets.filter(b => b.status === 'active').length;
    const pausedBudgets = budgets.filter(b => b.status === 'paused').length;
    const exceededBudgets = budgets.filter(b => b.status === 'exceeded').length;

    const budgetsNearLimit = budgets.filter(b => {
      const metrics = calculateBudgetMetrics(b);
      return metrics.isNearLimit && !metrics.isExceeded;
    }).length;

    const completedTasks = tasks.filter(t => t.status === 'done').length;

    return {
      totalTokensUsed,
      totalCostUsed,
      totalTimeUsed,
      activeBudgets,
      pausedBudgets,
      exceededBudgets,
      budgetsNearLimit,
      completedTasks,
      totalTasks: tasks.length,
    };
  }, [budgets, tasks]);

  // Filter and sort budgets
  const filteredBudgets = useMemo(() => {
    let filtered = budgets;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(b => b.status === selectedStatus);
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'usage') {
        const aMetrics = calculateBudgetMetrics(a);
        const bMetrics = calculateBudgetMetrics(b);
        return bMetrics.overallPercent - aMetrics.overallPercent;
      } else if (sortBy === 'remaining') {
        const aMetrics = calculateBudgetMetrics(a);
        const bMetrics = calculateBudgetMetrics(b);
        return aMetrics.overallPercent - bMetrics.overallPercent;
      } else {
        // Sort by status priority: exceeded > paused > active > completed
        const statusPriority = { exceeded: 0, paused: 1, active: 2, completed: 3 };
        return statusPriority[a.status] - statusPriority[b.status];
      }
    });
  }, [budgets, selectedStatus, sortBy]);

  const getTaskForBudget = (budget: TaskBudget) => {
    return tasks.find(t => t.id === budget.taskId);
  };

  const getAgentForTask = (task: Task | undefined) => {
    if (!task?.assignedAgentId) return null;
    return agents.find(a => a.id === task.assignedAgentId);
  };

  const getStatusColor = (status: TaskBudget['status']) => {
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

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PM Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Budget tracking and resource management
            </p>
          </div>
          <div className="flex items-center gap-3">
            <BarChart3 className="text-gray-400" size={24} />
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Total Cost</span>
              <DollarSign size={20} className="text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">{formatCost(stats.totalCostUsed)}</div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">{formatTokens(stats.totalTokensUsed)} tokens</div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">Total Time</span>
              <Clock size={20} className="text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">{formatTime(stats.totalTimeUsed)}</div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">Across all tasks</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">Tasks Completed</span>
              <CheckCircle size={20} className="text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-300">
              {stats.completedTasks}/{stats.totalTasks}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
              {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}% completion rate
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase">Budget Status</span>
              <AlertCircle size={20} className="text-orange-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-300">{stats.activeBudgets}</div>
              <span className="text-xs text-orange-600 dark:text-orange-400">active</span>
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              {stats.pausedBudgets} paused, {stats.exceededBudgets} exceeded, {stats.budgetsNearLimit} near limit
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filter:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)}
            className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
          >
            <option value="all">All Budgets</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="exceeded">Exceeded</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
          >
            <option value="usage">Highest Usage</option>
            <option value="remaining">Most Remaining</option>
            <option value="status">Status Priority</option>
          </select>
        </div>
      </div>

      {/* Budget List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredBudgets.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No budgets found</p>
            <p className="text-sm">Create budgets for tasks to track resource usage</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBudgets.map((budget) => {
              const task = getTaskForBudget(budget);
              const agent = getAgentForTask(task);
              const metrics = calculateBudgetMetrics(budget);
              const remaining = getRemainingBudget(budget);

              return (
                <div
                  key={budget.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {task?.taskId || 'Unknown Task'}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(budget.status)}`}>
                          {budget.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{task?.title || 'Task not found'}</p>
                      {agent && (
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className={`w-6 h-6 rounded-full ${agent.avatarColor} flex items-center justify-center text-white text-xs font-bold`}
                          >
                            {agent.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{agent.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {budget.status === 'paused' ? (
                        <button
                          onClick={() => onResumeBudget(budget.id)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                          title="Resume budget"
                        >
                          <Play size={16} />
                        </button>
                      ) : budget.status === 'active' && (
                        <button
                          onClick={() => onPauseBudget(budget.id, 'Manually paused by PM')}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded transition-colors"
                          title="Pause budget"
                        >
                          <Pause size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Paused Reason */}
                  {budget.status === 'paused' && budget.pausedReason && (
                    <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-700 dark:text-yellow-400">
                      <AlertCircle size={12} className="inline mr-1" />
                      {budget.pausedReason}
                    </div>
                  )}

                  {/* Resource Usage */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    {budget.maxTokens && (
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Zap size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">Tokens</span>
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatTokens(budget.tokensUsed)} / {formatTokens(budget.maxTokens)}
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full transition-all ${getProgressBarColor(metrics.tokensPercent)}`}
                            style={{ width: `${Math.min(metrics.tokensPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {budget.maxCost && (
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <DollarSign size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">Cost</span>
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCost(budget.costUsed)} / {formatCost(budget.maxCost)}
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full transition-all ${getProgressBarColor(metrics.costPercent)}`}
                            style={{ width: `${Math.min(metrics.costPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {budget.maxTimeMinutes && (
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Clock size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">Time</span>
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatTime(budget.timeUsedMinutes)} / {formatTime(budget.maxTimeMinutes)}
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full transition-all ${getProgressBarColor(metrics.timePercent)}`}
                            style={{ width: `${Math.min(metrics.timePercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {budget.maxRetries && (
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <AlertCircle size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">Retries</span>
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {budget.retriesUsed} / {budget.maxRetries}
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full transition-all ${getProgressBarColor(metrics.retriesPercent)}`}
                            style={{ width: `${Math.min(metrics.retriesPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Overall Progress */}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500 dark:text-gray-400">Overall Usage</span>
                      <span className={`font-semibold ${
                        metrics.isExceeded
                          ? 'text-red-600 dark:text-red-400'
                          : metrics.isNearLimit
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {metrics.overallPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getProgressBarColor(metrics.overallPercent)}`}
                        style={{ width: `${Math.min(metrics.overallPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
