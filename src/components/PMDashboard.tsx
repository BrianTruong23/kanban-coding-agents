'use client';

import { useMemo } from 'react';
import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import {
  DollarSign,
  Clock,
  Cpu,
  AlertTriangle,
  TrendingUp,
  Pause,
  CheckCircle,
  Activity
} from 'lucide-react';

interface PMDashboardProps {
  tasks: Task[];
  agents: CodingAgent[];
}

export const PMDashboard = ({ tasks, agents }: PMDashboardProps) => {
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const pausedTasks = tasks.filter(t => t.isPaused).length;
    const tasksWithBudgets = tasks.filter(t => t.tokenBudget || t.costBudget || t.timeBudget).length;

    const totalTokenBudget = tasks.reduce((sum, t) => sum + (t.tokenBudget || 0), 0);
    const totalTokenSpent = tasks.reduce((sum, t) => sum + (t.tokenSpent || 0), 0);

    const totalCostBudget = tasks.reduce((sum, t) => sum + (t.costBudget || 0), 0);
    const totalCostSpent = tasks.reduce((sum, t) => sum + (t.costSpent || 0), 0);

    const totalTimeBudget = tasks.reduce((sum, t) => sum + (t.timeBudget || 0), 0);
    const totalTimeSpent = tasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0);

    const totalRetries = tasks.reduce((sum, t) => sum + (t.retryCount || 0), 0);

    const overBudgetTasks = tasks.filter(t => {
      const tokenOver = t.tokenBudget && t.tokenSpent && t.tokenSpent > t.tokenBudget;
      const costOver = t.costBudget && t.costSpent && t.costSpent > t.costBudget;
      const timeOver = t.timeBudget && t.timeSpent && t.timeSpent > t.timeBudget;
      return tokenOver || costOver || timeOver;
    });

    const warningTasks = tasks.filter(t => {
      const tokenWarning = t.tokenBudget && t.tokenSpent && (t.tokenSpent / t.tokenBudget) >= 0.8 && (t.tokenSpent / t.tokenBudget) < 1;
      const costWarning = t.costBudget && t.costSpent && (t.costSpent / t.costBudget) >= 0.8 && (t.costSpent / t.costBudget) < 1;
      const timeWarning = t.timeBudget && t.timeSpent && (t.timeSpent / t.timeBudget) >= 0.8 && (t.timeSpent / t.timeBudget) < 1;
      return tokenWarning || costWarning || timeWarning;
    });

    return {
      totalTasks,
      pausedTasks,
      tasksWithBudgets,
      totalTokenBudget,
      totalTokenSpent,
      totalCostBudget,
      totalCostSpent,
      totalTimeBudget,
      totalTimeSpent,
      totalRetries,
      overBudgetTasks: overBudgetTasks.length,
      warningTasks: warningTasks.length,
      tokenUtilization: totalTokenBudget > 0 ? (totalTokenSpent / totalTokenBudget) * 100 : 0,
      costUtilization: totalCostBudget > 0 ? (totalCostSpent / totalCostBudget) * 100 : 0,
      timeUtilization: totalTimeBudget > 0 ? (totalTimeSpent / totalTimeBudget) * 100 : 0,
    };
  }, [tasks]);

  const formatCost = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
    return `${minutes}m`;
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600 dark:text-red-400';
    if (percentage >= 80) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getUtilizationBgColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-100 dark:bg-red-900/30';
    if (percentage >= 80) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-green-100 dark:bg-green-900/30';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">PM Dashboard - Budget & Resource Management</h2>
        <Activity className="text-gray-400" size={24} />
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalTasks}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stats.tasksWithBudgets} with budgets</p>
            </div>
            <CheckCircle className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Paused</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.pausedTasks}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Budget exceeded</p>
            </div>
            <Pause className="text-orange-500" size={32} />
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Warnings</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.warningTasks}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">≥80% budget used</p>
            </div>
            <AlertTriangle className="text-yellow-500" size={32} />
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Over Budget</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.overBudgetTasks}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Exceeded limits</p>
            </div>
            <TrendingUp className="text-red-500" size={32} />
          </div>
        </div>
      </div>

      {/* Resource Utilization */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resource Utilization</h3>

        {/* Token Utilization */}
        <div className={`rounded-lg p-4 ${getUtilizationBgColor(stats.tokenUtilization)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cpu className={getUtilizationColor(stats.tokenUtilization)} size={20} />
              <span className="font-semibold text-gray-900 dark:text-white">Tokens</span>
            </div>
            <span className={`font-bold ${getUtilizationColor(stats.tokenUtilization)}`}>
              {stats.tokenUtilization.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
            <span>Spent: {formatTokens(stats.totalTokenSpent)}</span>
            <span>Budget: {formatTokens(stats.totalTokenBudget)}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                stats.tokenUtilization >= 100 ? 'bg-red-500' :
                stats.tokenUtilization >= 80 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(stats.tokenUtilization, 100)}%` }}
            />
          </div>
        </div>

        {/* Cost Utilization */}
        <div className={`rounded-lg p-4 ${getUtilizationBgColor(stats.costUtilization)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className={getUtilizationColor(stats.costUtilization)} size={20} />
              <span className="font-semibold text-gray-900 dark:text-white">Cost</span>
            </div>
            <span className={`font-bold ${getUtilizationColor(stats.costUtilization)}`}>
              {stats.costUtilization.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
            <span>Spent: {formatCost(stats.totalCostSpent)}</span>
            <span>Budget: {formatCost(stats.totalCostBudget)}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                stats.costUtilization >= 100 ? 'bg-red-500' :
                stats.costUtilization >= 80 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(stats.costUtilization, 100)}%` }}
            />
          </div>
        </div>

        {/* Time Utilization */}
        <div className={`rounded-lg p-4 ${getUtilizationBgColor(stats.timeUtilization)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className={getUtilizationColor(stats.timeUtilization)} size={20} />
              <span className="font-semibold text-gray-900 dark:text-white">Time</span>
            </div>
            <span className={`font-bold ${getUtilizationColor(stats.timeUtilization)}`}>
              {stats.timeUtilization.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
            <span>Spent: {formatTime(stats.totalTimeSpent)}</span>
            <span>Budget: {formatTime(stats.totalTimeBudget)}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                stats.timeUtilization >= 100 ? 'bg-red-500' :
                stats.timeUtilization >= 80 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(stats.timeUtilization, 100)}%` }}
            />
          </div>
        </div>

        {/* Total Retries */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-purple-500" size={20} />
              <span className="font-semibold text-gray-900 dark:text-white">Total Retries</span>
            </div>
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalRetries}</span>
          </div>
        </div>
      </div>

      {stats.totalTasks === 0 && (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <p>No tasks with budget tracking yet.</p>
          <p className="text-sm mt-2">Create a task and set budget limits to start tracking.</p>
        </div>
      )}
    </div>
  );
};
