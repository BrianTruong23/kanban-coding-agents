'use client';

import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { ProjectBudget, BudgetAlert, TaskBudget } from '@/types/budget';
import {
  formatCost,
  formatTokens,
  formatTime,
  calculateAgentMetrics,
  getBudgetStatusColor,
  getBudgetPercentage,
} from '@/lib/budget';
import { AlertCircle, CheckCircle, Clock, DollarSign, Zap, Pause, Play, XCircle } from 'lucide-react';

interface PMDashboardProps {
  tasks: Task[];
  agents: CodingAgent[];
  projectBudget: ProjectBudget;
  alerts: BudgetAlert[];
  onAcknowledgeAlert: (alertId: string) => void;
  onPauseTask: (taskId: string, reason: string) => void;
  onResumeTask: (taskId: string) => void;
}

export const PMDashboard = ({
  tasks,
  agents,
  projectBudget,
  alerts,
  onAcknowledgeAlert,
  onPauseTask,
  onResumeTask,
}: PMDashboardProps) => {
  const agentMetrics = calculateAgentMetrics(tasks, agents);
  const activeAlerts = alerts.filter((a) => !a.acknowledged);
  const tasksWithBudget = tasks.filter((t) => t.budget);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Project Manager Dashboard
        </h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {tasksWithBudget.length} / {tasks.length} tasks tracked
        </div>
      </div>

      {/* Alert Banner */}
      {activeAlerts.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 dark:text-yellow-400 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
                {activeAlerts.length} Active Alert{activeAlerts.length !== 1 ? 's' : ''}
              </h3>
              <div className="space-y-2">
                {activeAlerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between bg-white dark:bg-gray-800 rounded p-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {alert.type === 'exceeded' && <XCircle size={14} className="text-red-500" />}
                      {alert.type === 'warning' && <AlertCircle size={14} className="text-yellow-500" />}
                      {alert.type === 'paused' && <Pause size={14} className="text-gray-500" />}
                      <span className="text-gray-700 dark:text-gray-300">{alert.message}</span>
                    </div>
                    <button
                      onClick={() => onAcknowledgeAlert(alert.id)}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Acknowledge
                    </button>
                  </div>
                ))}
              </div>
              {activeAlerts.length > 3 && (
                <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                  +{activeAlerts.length - 3} more alerts
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Project Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={20} className="text-green-600 dark:text-green-400" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Cost</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCost(projectBudget.totalActualCost)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Est: {formatCost(projectBudget.totalEstimatedCost)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={20} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Tokens</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatTokens(projectBudget.totalActualTokens)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Est: {formatTokens(projectBudget.totalEstimatedTokens)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={20} className="text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Time</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatTime(projectBudget.totalActualTime)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Est: {formatTime(projectBudget.totalEstimatedTime)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Task Status</h3>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-green-600 dark:text-green-400">Within Budget:</span>
              <span className="font-semibold">{projectBudget.tasksWithinBudget}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-600 dark:text-yellow-400">Warning:</span>
              <span className="font-semibold">{projectBudget.tasksAtWarning}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600 dark:text-red-400">Exceeded:</span>
              <span className="font-semibold">{projectBudget.tasksExceeded}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Paused:</span>
              <span className="font-semibold">{projectBudget.tasksPaused}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Agent Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Agent
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Tasks
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Avg Cost
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Avg Tokens
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Avg Time
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Success Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {agentMetrics.map((metric) => (
                <tr key={metric.agentId} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                    {metric.agentName}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                    {metric.totalTasksCompleted}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                    {metric.totalTasksCompleted > 0 ? formatCost(metric.averageCost) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                    {metric.totalTasksCompleted > 0 ? formatTokens(metric.averageTokens) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                    {metric.totalTasksCompleted > 0 ? formatTime(metric.averageTime) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {metric.totalTasksCompleted > 0 ? (
                      <span
                        className={
                          metric.successRate >= 80
                            ? 'text-green-600 dark:text-green-400'
                            : metric.successRate >= 60
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400'
                        }
                      >
                        {metric.successRate.toFixed(1)}%
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tasks Needing Attention */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tasks Needing Attention
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {tasksWithBudget
            .filter((t) => t.budget && t.budget.status !== 'within-budget')
            .map((task) => (
              <div key={task.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {task.taskId}
                      </span>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {task.title}
                      </h3>
                      {task.budget && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getBudgetStatusColor(
                            task.budget.status
                          )}`}
                        >
                          {task.budget.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                    {task.budget && (
                      <div className="grid grid-cols-3 gap-4 text-xs text-gray-600 dark:text-gray-400 mb-2">
                        <div>
                          <span className="font-semibold">Cost:</span>{' '}
                          {formatCost(task.budget.actualCost)}
                          {task.budget.maxCost && ` / ${formatCost(task.budget.maxCost)}`}
                        </div>
                        <div>
                          <span className="font-semibold">Tokens:</span>{' '}
                          {formatTokens(task.budget.actualTokens)}
                          {task.budget.maxTokens && ` / ${formatTokens(task.budget.maxTokens)}`}
                        </div>
                        <div>
                          <span className="font-semibold">Retries:</span> {task.budget.retryCount} /{' '}
                          {task.budget.maxRetries}
                        </div>
                      </div>
                    )}
                    {task.budget?.isPaused && task.budget.pauseReason && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 italic">
                        Paused: {task.budget.pauseReason}
                      </div>
                    )}
                    {task.budget && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Budget Usage</span>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {getBudgetPercentage(task.budget).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              task.budget.status === 'exceeded'
                                ? 'bg-red-500'
                                : task.budget.status === 'warning'
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{
                              width: `${Math.min(getBudgetPercentage(task.budget), 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    {task.budget?.isPaused ? (
                      <button
                        onClick={() => onResumeTask(task.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
                      >
                        <Play size={14} />
                        Resume
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          onPauseTask(task.id, 'Manually paused by project manager')
                        }
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors"
                      >
                        <Pause size={14} />
                        Pause
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          {tasksWithBudget.filter((t) => t.budget && t.budget.status !== 'within-budget')
            .length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <CheckCircle size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">All tasks are within budget!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
