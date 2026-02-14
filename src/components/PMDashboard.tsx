'use client';

import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import {
  calculateTotalBudget,
  checkBudgetStatus,
  formatCost,
  formatTokens,
  formatTime,
} from '@/lib/budget';
import {
  DollarSign,
  Clock,
  Coins,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';

interface PMDashboardProps {
  tasks: Task[];
  agents: CodingAgent[];
}

export const PMDashboard = ({ tasks, agents }: PMDashboardProps) => {
  const totals = calculateTotalBudget(tasks);

  const tasksWithBudget = tasks.filter((t) => t.budget);
  const pausedTasks = tasks.filter((t) => t.budget?.isPaused);
  const activeTasks = tasks.filter((t) => t.status === 'in-progress' && !t.budget?.isPaused);

  // Group tasks by agent
  const tasksByAgent = agents.map((agent) => {
    const agentTasks = tasks.filter((t) => t.assignedAgentId === agent.id && t.budget);
    const agentTotals = calculateTotalBudget(agentTasks);
    return {
      agent,
      tasks: agentTasks,
      totals: agentTotals,
    };
  });

  const unassignedTasks = tasks.filter((t) => !t.assignedAgentId && t.budget);
  const unassignedTotals = calculateTotalBudget(unassignedTasks);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          PM Dashboard - Budget & Resource Management
        </h1>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Cost</span>
            <DollarSign size={20} className="text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCost(totals.totalUsedCost)}
          </div>
          {totals.totalMaxCost > 0 && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              of {formatCost(totals.totalMaxCost)} budget
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tokens</span>
            <Coins size={20} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatTokens(totals.totalUsedTokens)}
          </div>
          {totals.totalMaxTokens > 0 && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              of {formatTokens(totals.totalMaxTokens)} budget
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Time</span>
            <Clock size={20} className="text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatTime(totals.totalUsedTime)}
          </div>
          {totals.totalMaxTime > 0 && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              of {formatTime(totals.totalMaxTime)} budget
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Task Status</span>
            <TrendingUp size={20} className="text-purple-500" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-gray-900 dark:text-white font-semibold">{activeTasks.length}</span>
              <span className="text-gray-500 dark:text-gray-400">active</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Pause size={16} className="text-yellow-500" />
              <span className="text-gray-900 dark:text-white font-semibold">{pausedTasks.length}</span>
              <span className="text-gray-500 dark:text-gray-400">paused</span>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Alerts */}
      {(totals.overBudgetTasks > 0 || totals.nearLimitTasks > 0) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">Budget Alerts</h3>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                {totals.overBudgetTasks > 0 && (
                  <p>{totals.overBudgetTasks} task(s) have exceeded their budget limits</p>
                )}
                {totals.nearLimitTasks > 0 && (
                  <p>{totals.nearLimitTasks} task(s) are approaching their budget limits (80%+)</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Budget Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Budget by Agent</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {tasksByAgent.map(({ agent, tasks: agentTasks, totals: agentTotals }) => {
            if (agentTasks.length === 0) return null;

            return (
              <div key={agent.id} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 ${agent.avatarColor} rounded-full flex items-center justify-center text-white font-semibold text-sm`}
                  >
                    {agent.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">{agent.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {agentTasks.length} task(s) with budgets
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 ml-13">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cost</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatCost(agentTotals.totalUsedCost)}
                    </div>
                    {agentTotals.totalMaxCost > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        / {formatCost(agentTotals.totalMaxCost)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tokens</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatTokens(agentTotals.totalUsedTokens)}
                    </div>
                    {agentTotals.totalMaxTokens > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        / {formatTokens(agentTotals.totalMaxTokens)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Time</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatTime(agentTotals.totalUsedTime)}
                    </div>
                    {agentTotals.totalMaxTime > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        / {formatTime(agentTotals.totalMaxTime)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {unassignedTasks.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  ?
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">Unassigned</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {unassignedTasks.length} task(s) with budgets
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 ml-13">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cost</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatCost(unassignedTotals.totalUsedCost)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tokens</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatTokens(unassignedTotals.totalUsedTokens)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Time</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatTime(unassignedTotals.totalUsedTime)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tasks List with Budget Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Task Budget Details</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tokens
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Retries
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Budget Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {tasksWithBudget.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No tasks with budgets yet. Add budgets to tasks to track resources.
                  </td>
                </tr>
              ) : (
                tasksWithBudget.map((task) => {
                  const budgetStatus = checkBudgetStatus(task.budget);
                  const budget = task.budget!;

                  return (
                    <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                            {task.taskId}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {task.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {budget.isPaused ? (
                            <>
                              <Pause size={14} className="text-yellow-500" />
                              <span className="text-xs text-yellow-600 dark:text-yellow-500">Paused</span>
                            </>
                          ) : task.status === 'in-progress' ? (
                            <>
                              <Play size={14} className="text-green-500" />
                              <span className="text-xs text-green-600 dark:text-green-500">Active</span>
                            </>
                          ) : (
                            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {task.status}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatCost(budget.usedCost)}
                        </div>
                        {budget.maxCost && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            / {formatCost(budget.maxCost)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatTokens(budget.usedTokens)}
                        </div>
                        {budget.maxTokens && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            / {formatTokens(budget.maxTokens)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatTime(budget.usedTimeMinutes)}
                        </div>
                        {budget.maxTimeMinutes && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            / {formatTime(budget.maxTimeMinutes)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                          <RotateCcw size={14} className="text-gray-400" />
                          {budget.currentRetries}
                          {budget.maxRetries && (
                            <span className="text-gray-500 dark:text-gray-400">/ {budget.maxRetries}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {budgetStatus.isOverBudget ? (
                          <div className="flex items-center gap-1 text-red-600 dark:text-red-500">
                            <AlertTriangle size={14} />
                            <span className="text-xs font-medium">Over Budget</span>
                          </div>
                        ) : budgetStatus.isNearLimit ? (
                          <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500">
                            <AlertTriangle size={14} />
                            <span className="text-xs font-medium">Near Limit</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-500">
                            <CheckCircle size={14} />
                            <span className="text-xs font-medium">On Track</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
