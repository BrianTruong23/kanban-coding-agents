'use client';

import { useState } from 'react';
import { Task } from '@/types/task';
import { TaskBudget, ProjectBudget, BudgetAlert, BudgetUtilization } from '@/types/budget';
import {
  DollarSign,
  Clock,
  Hash,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  X
} from 'lucide-react';

interface PMDashboardProps {
  tasks: Task[];
  taskBudgets: TaskBudget[];
  projectBudget: ProjectBudget | null;
  budgetAlerts: BudgetAlert[];
  onAcknowledgeAlert: (alertId: string) => void;
  calculateUtilization: (budget: TaskBudget) => BudgetUtilization[];
  onClose: () => void;
}

export const PMDashboard = ({
  tasks,
  taskBudgets,
  projectBudget,
  budgetAlerts,
  onAcknowledgeAlert,
  calculateUtilization,
  onClose,
}: PMDashboardProps) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'tasks' | 'alerts'>('overview');

  // Calculate overall statistics
  const totalBudgetedTasks = taskBudgets.length;
  const activeBudgets = taskBudgets.filter(b => b.status === 'active').length;
  const pausedBudgets = taskBudgets.filter(b => b.status === 'paused').length;
  const exceededBudgets = taskBudgets.filter(b => b.status === 'exceeded').length;

  const totalCost = taskBudgets.reduce((sum, b) => sum + b.currentCost, 0);
  const totalTokens = taskBudgets.reduce((sum, b) => sum + b.currentTokens, 0);
  const totalTime = taskBudgets.reduce((sum, b) => sum + b.currentTime, 0);

  const formatCost = (cost: number) => `$${cost.toFixed(2)}`;
  const formatTokens = (tokens: number) => tokens.toLocaleString();
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
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

  const getUtilizationColor = (status: BudgetUtilization['status']) => {
    switch (status) {
      case 'safe':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-orange-500';
      case 'exceeded':
        return 'bg-red-500';
    }
  };

  const getAlertIcon = (type: BudgetAlert['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'critical':
        return <AlertTriangle size={16} className="text-orange-500" />;
      case 'exceeded':
        return <XCircle size={16} className="text-red-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">PM Dashboard</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Budget and Resource Management
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              selectedTab === 'overview'
                ? 'border-b-2 border-black dark:border-white text-black dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedTab('tasks')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              selectedTab === 'tasks'
                ? 'border-b-2 border-black dark:border-white text-black dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Task Budgets ({totalBudgetedTasks})
          </button>
          <button
            onClick={() => setSelectedTab('alerts')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              selectedTab === 'alerts'
                ? 'border-b-2 border-black dark:border-white text-black dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Alerts
            {budgetAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {budgetAlerts.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* Project Budget Summary */}
              {projectBudget && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    {projectBudget.name}
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
                        <DollarSign size={16} />
                        Total Cost
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCost(projectBudget.totalCurrentCost)}
                      </div>
                      {projectBudget.totalMaxCost && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          of {formatCost(projectBudget.totalMaxCost)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
                        <Hash size={16} />
                        Total Tokens
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatTokens(projectBudget.totalCurrentTokens)}
                      </div>
                      {projectBudget.totalMaxTokens && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          of {formatTokens(projectBudget.totalMaxTokens)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
                        <Clock size={16} />
                        Total Time
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatTime(projectBudget.totalCurrentTime)}
                      </div>
                      {projectBudget.totalMaxTime && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          of {formatTime(projectBudget.totalMaxTime)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={16} className="text-blue-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Active</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{activeBudgets}</div>
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <PauseCircle size={16} className="text-yellow-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Paused</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{pausedBudgets}</div>
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle size={16} className="text-red-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Exceeded</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{exceededBudgets}</div>
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={16} className="text-green-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Total</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalBudgetedTasks}</div>
                </div>
              </div>

              {/* Current Spend */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Spend</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cost</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCost(totalCost)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tokens</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{formatTokens(totalTokens)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Time</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{formatTime(totalTime)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'tasks' && (
            <div className="space-y-4">
              {taskBudgets.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <p className="mb-2">No task budgets configured</p>
                  <p className="text-sm">Create budgets to track resource usage per task</p>
                </div>
              ) : (
                taskBudgets.map((budget) => {
                  const task = tasks.find(t => t.id === budget.taskId);
                  const utilizations = calculateUtilization(budget);

                  return (
                    <div
                      key={budget.id}
                      className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {task?.taskId || 'Unknown Task'}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(budget.status)}`}>
                              {budget.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{task?.title || 'Task not found'}</p>
                        </div>
                      </div>

                      {/* Budget Utilization Bars */}
                      <div className="space-y-3">
                        {utilizations.map((util) => (
                          <div key={util.type}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-600 dark:text-gray-400 capitalize flex items-center gap-1">
                                {util.type === 'cost' && <DollarSign size={12} />}
                                {util.type === 'token' && <Hash size={12} />}
                                {util.type === 'time' && <Clock size={12} />}
                                {util.type}
                              </span>
                              <span className="text-gray-900 dark:text-white font-medium">
                                {util.type === 'cost' && formatCost(util.current)}
                                {util.type === 'token' && formatTokens(util.current)}
                                {util.type === 'time' && formatTime(util.current)}
                                {' / '}
                                {util.type === 'cost' && formatCost(util.max)}
                                {util.type === 'token' && formatTokens(util.max)}
                                {util.type === 'time' && formatTime(util.max)}
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getUtilizationColor(util.status)} transition-all`}
                                style={{ width: `${Math.min(util.percentage, 100)}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {util.percentage.toFixed(1)}% used
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Retry Info */}
                      {budget.maxRetries && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Retries: {budget.currentRetries} / {budget.maxRetries}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {selectedTab === 'alerts' && (
            <div className="space-y-4">
              {budgetAlerts.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <CheckCircle2 size={48} className="mx-auto mb-3 text-green-500" />
                  <p className="mb-2">No active alerts</p>
                  <p className="text-sm">All budgets are within acceptable limits</p>
                </div>
              ) : (
                budgetAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-white dark:bg-gray-700 rounded-lg p-4 border-l-4 border-gray-200 dark:border-gray-600"
                    style={{
                      borderLeftColor:
                        alert.type === 'exceeded'
                          ? 'rgb(239, 68, 68)'
                          : alert.type === 'critical'
                          ? 'rgb(249, 115, 22)'
                          : 'rgb(234, 179, 8)',
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} Alert
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {alert.budgetType} • {alert.threshold}% threshold
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{alert.message}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(alert.triggeredAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onAcknowledgeAlert(alert.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
