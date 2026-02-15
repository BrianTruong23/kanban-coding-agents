'use client';

import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { useBudget } from '@/hooks/useBudget';
import {
  DollarSign,
  Coins,
  Clock,
  Pause,
  Play,
  AlertTriangle,
  TrendingUp,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

interface BudgetDashboardProps {
  tasks: Task[];
  agents: CodingAgent[];
  onUpdateTask: (task: Task) => void;
}

export const BudgetDashboard = ({ tasks, agents, onUpdateTask }: BudgetDashboardProps) => {
  const {
    getBudgetStatus,
    getBudgetPercentage,
    toggleTaskPause,
    getAgentBudgetStats,
    getProjectBudgetStats,
    alerts,
    resolveAlert,
    clearResolvedAlerts,
  } = useBudget(tasks);

  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [showAlerts, setShowAlerts] = useState(true);

  const projectStats = getProjectBudgetStats;
  const unresolvedAlerts = alerts.filter(a => !a.resolved);

  const toggleAgentExpanded = (agentId: string) => {
    setExpandedAgents(prev => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  };

  const handleTogglePause = (task: Task) => {
    const updated = toggleTaskPause(task, !task.budget?.isPaused);
    onUpdateTask(updated);
  };

  const formatCost = (cost: number) => `$${cost.toFixed(2)}`;
  const formatTokens = (tokens: number) => `${tokens.toLocaleString()} tokens`;
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'paused':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-green-600 dark:text-green-400';
    }
  };

  const getBudgetBarColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Budget Dashboard</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Track resource usage and manage budgets across all agent tasks
              </p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Alerts Section */}
          {unresolvedAlerts.length > 0 && showAlerts && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
                  <h3 className="font-semibold text-red-900 dark:text-red-200">
                    Active Alerts ({unresolvedAlerts.length})
                  </h3>
                </div>
                <button
                  onClick={() => setShowAlerts(false)}
                  className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {unresolvedAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="flex items-start justify-between bg-white dark:bg-gray-800 p-3 rounded border border-red-200 dark:border-red-700"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">{alert.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              {alerts.some(a => a.resolved) && (
                <button
                  onClick={clearResolvedAlerts}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline mt-2"
                >
                  Clear resolved alerts
                </button>
              )}
            </div>
          )}

          {/* Project Overview */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp size={20} />
              Project Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cost */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={16} className="text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Cost</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCost(projectStats.totalCost)}
                </div>
                {projectStats.totalCostBudget > 0 && (
                  <>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      of {formatCost(projectStats.totalCostBudget)} budget
                    </div>
                    <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={clsx('h-full transition-all', getBudgetBarColor(projectStats.costPercentage))}
                        style={{ width: `${Math.min(projectStats.costPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {projectStats.costPercentage.toFixed(1)}%
                    </div>
                  </>
                )}
              </div>

              {/* Tokens */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <Coins size={16} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tokens</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {projectStats.totalTokens.toLocaleString()}
                </div>
                {projectStats.totalTokenBudget > 0 && (
                  <>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      of {formatTokens(projectStats.totalTokenBudget)}
                    </div>
                    <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={clsx('h-full transition-all', getBudgetBarColor(projectStats.tokenPercentage))}
                        style={{ width: `${Math.min(projectStats.tokenPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {projectStats.tokenPercentage.toFixed(1)}%
                    </div>
                  </>
                )}
              </div>

              {/* Time */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Time</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatTime(projectStats.totalTime)}
                </div>
                {projectStats.totalTimeBudget > 0 && (
                  <>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      of {formatTime(projectStats.totalTimeBudget)} budget
                    </div>
                    <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={clsx('h-full transition-all', getBudgetBarColor(projectStats.timePercentage))}
                        style={{ width: `${Math.min(projectStats.timePercentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {projectStats.timePercentage.toFixed(1)}%
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Stats Summary */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {projectStats.tasksWithBudget}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Tasks Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {projectStats.tasksWithBudget - projectStats.warningTasks - projectStats.exceededTasks}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">On Track</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {projectStats.warningTasks}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Warning</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {projectStats.exceededTasks}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Exceeded</div>
              </div>
            </div>
          </div>

          {/* Agent Breakdown */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Agent Breakdown</h3>
            <div className="space-y-2">
              {agents.map(agent => {
                const stats = getAgentBudgetStats(agent.id);
                const agentTasks = tasks.filter(t => t.assignedAgentId === agent.id && t.budget);
                const isExpanded = expandedAgents.has(agent.id);

                if (stats.tasksCount === 0) return null;

                return (
                  <div key={agent.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <button
                      onClick={() => toggleAgentExpanded(agent.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold',
                            agent.avatarColor || 'bg-gray-400'
                          )}
                        >
                          {agent.avatar}
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white">{agent.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {stats.tasksCount} {stats.tasksCount === 1 ? 'task' : 'tasks'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {formatCost(stats.totalCost)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTokens(stats.totalTokens)}
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                        {agentTasks.map(task => {
                          const status = getBudgetStatus(task);
                          const costPct = getBudgetPercentage(task, 'cost');
                          const tokenPct = getBudgetPercentage(task, 'token');
                          const timePct = getBudgetPercentage(task, 'time');

                          return (
                            <div
                              key={task.id}
                              className="bg-gray-50 dark:bg-gray-700 rounded p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                    {task.taskId}
                                  </span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {task.title}
                                  </span>
                                  <span className={clsx('text-xs font-semibold uppercase', getStatusColor(status))}>
                                    {status}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleTogglePause(task)}
                                  className={clsx(
                                    'p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600',
                                    task.budget?.isPaused
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-gray-600 dark:text-gray-400'
                                  )}
                                  title={task.budget?.isPaused ? 'Resume task' : 'Pause task'}
                                >
                                  {task.budget?.isPaused ? <Play size={16} /> : <Pause size={16} />}
                                </button>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <div className="text-gray-500 dark:text-gray-400">Cost</div>
                                  <div className="font-semibold text-gray-900 dark:text-white">
                                    {formatCost(task.budget?.costSpent || 0)}
                                    {task.budgetConfig?.costBudget && (
                                      <span className="text-gray-500 dark:text-gray-400">
                                        {' '}/ {formatCost(task.budgetConfig.costBudget)}
                                      </span>
                                    )}
                                  </div>
                                  {task.budgetConfig?.costBudget && (
                                    <div className="mt-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                                      <div
                                        className={clsx('h-full rounded-full', getBudgetBarColor(costPct))}
                                        style={{ width: `${Math.min(costPct, 100)}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="text-gray-500 dark:text-gray-400">Tokens</div>
                                  <div className="font-semibold text-gray-900 dark:text-white">
                                    {(task.budget?.tokensUsed || 0).toLocaleString()}
                                    {task.budgetConfig?.tokenBudget && (
                                      <span className="text-gray-500 dark:text-gray-400">
                                        {' '}/ {task.budgetConfig.tokenBudget.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                  {task.budgetConfig?.tokenBudget && (
                                    <div className="mt-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                                      <div
                                        className={clsx('h-full rounded-full', getBudgetBarColor(tokenPct))}
                                        style={{ width: `${Math.min(tokenPct, 100)}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="text-gray-500 dark:text-gray-400">Time</div>
                                  <div className="font-semibold text-gray-900 dark:text-white">
                                    {formatTime(task.budget?.timeSpent || 0)}
                                    {task.budgetConfig?.timeBudget && (
                                      <span className="text-gray-500 dark:text-gray-400">
                                        {' '}/ {formatTime(task.budgetConfig.timeBudget)}
                                      </span>
                                    )}
                                  </div>
                                  {task.budgetConfig?.timeBudget && (
                                    <div className="mt-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                                      <div
                                        className={clsx('h-full rounded-full', getBudgetBarColor(timePct))}
                                        style={{ width: `${Math.min(timePct, 100)}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {task.budgetConfig?.maxRetries && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Retries: {task.budget?.retriesUsed || 0} / {task.budgetConfig.maxRetries}
                                </div>
                              )}

                              {task.budget?.isPaused && task.budget.pauseReason && (
                                <div className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
                                  Paused: {task.budget.pauseReason.replace('_', ' ')}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
