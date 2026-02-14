'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { budgetManager, formatCost, formatTime, formatTokens } from '@/lib/budgetManagement';
import { PMDashboardStats, BudgetSummary, BudgetAlert } from '@/types/budget';
import {
  DollarSign,
  Clock,
  Cpu,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Pause,
  Play,
  TrendingUp,
  TrendingDown,
  Activity,
  X,
} from 'lucide-react';

export const BudgetDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PMDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<BudgetSummary | null>(null);

  const loadStats = async () => {
    if (!user) return;
    setLoading(true);
    const data = await budgetManager.getPMDashboardStats(user.id);
    setStats(data);
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, [user]);

  const handlePauseResume = async (budgetId: string, isPaused: boolean) => {
    if (isPaused) {
      await budgetManager.resumeTask(budgetId);
    } else {
      await budgetManager.pauseTask(budgetId);
    }
    await loadStats();
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    await budgetManager.acknowledgeAlert(alertId);
    await loadStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 dark:text-gray-400">Loading budget data...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 dark:text-gray-400">No budget data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Budget Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track resource usage and manage budgets for agent tasks
          </p>
        </div>
        <button
          onClick={loadStats}
          className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tasks"
          value={stats.totalTasks}
          icon={<Activity className="text-blue-500" size={24} />}
          subtitle={`${stats.activeTasksCount} active`}
        />
        <StatCard
          title="Total Cost"
          value={formatCost(stats.totalCostUsed)}
          icon={<DollarSign className="text-green-500" size={24} />}
          subtitle={
            stats.totalCostLimit > 0
              ? `of ${formatCost(stats.totalCostLimit)}`
              : 'No limit'
          }
          progress={
            stats.totalCostLimit > 0
              ? (stats.totalCostUsed / stats.totalCostLimit) * 100
              : 0
          }
        />
        <StatCard
          title="Total Tokens"
          value={formatTokens(stats.totalTokensUsed)}
          icon={<Cpu className="text-purple-500" size={24} />}
          subtitle={
            stats.totalTokenLimit > 0
              ? `of ${formatTokens(stats.totalTokenLimit)}`
              : 'No limit'
          }
          progress={
            stats.totalTokenLimit > 0
              ? (stats.totalTokensUsed / stats.totalTokenLimit) * 100
              : 0
          }
        />
        <StatCard
          title="Total Time"
          value={formatTime(stats.totalTimeUsed)}
          icon={<Clock className="text-orange-500" size={24} />}
          subtitle={
            stats.totalTimeLimit > 0
              ? `of ${formatTime(stats.totalTimeLimit)}`
              : 'No limit'
          }
          progress={
            stats.totalTimeLimit > 0
              ? (stats.totalTimeUsed / stats.totalTimeLimit) * 100
              : 0
          }
        />
      </div>

      {/* Alerts Section */}
      {stats.unacknowledgedAlerts > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-yellow-500" size={24} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Active Alerts ({stats.unacknowledgedAlerts})
            </h2>
          </div>
          <div className="space-y-2">
            {stats.taskSummaries
              .flatMap((task) => task.activeAlerts)
              .slice(0, 5)
              .map((alert) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={() => handleAcknowledgeAlert(alert.id)}
                />
              ))}
          </div>
        </div>
      )}

      {/* Task Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard
          title="Active Tasks"
          count={stats.activeTasksCount}
          color="green"
          icon={<CheckCircle size={20} />}
        />
        <StatusCard
          title="Paused Tasks"
          count={stats.pausedTasksCount}
          color="yellow"
          icon={<Pause size={20} />}
        />
        <StatusCard
          title="Exceeded Budget"
          count={stats.exceededTasksCount}
          color="red"
          icon={<AlertCircle size={20} />}
        />
      </div>

      {/* Task Summaries */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Task Budget Details
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tokens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Retries
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {stats.taskSummaries.map((task) => (
                <TaskRow
                  key={task.taskId}
                  task={task}
                  onPauseResume={() =>
                    handlePauseResume(task.budget.id, task.budget.isPaused)
                  }
                  onViewDetails={() => setSelectedTask(task)}
                />
              ))}
              {stats.taskSummaries.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No tasks with budgets yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
};

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
  subtitle,
  progress,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  progress?: number;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</div>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
      {subtitle && (
        <div className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>
      )}
      {progress !== undefined && progress > 0 && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                progress >= 100
                  ? 'bg-red-500'
                  : progress >= 90
                  ? 'bg-orange-500'
                  : progress >= 75
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Status Card Component
function StatusCard({
  title,
  count,
  color,
  icon,
}: {
  title: string;
  count: number;
  color: 'green' | 'yellow' | 'red';
  icon: React.ReactNode;
}) {
  const colorClasses = {
    green: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    yellow:
      'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
    red: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
  };

  const textColorClasses = {
    green: 'text-green-700 dark:text-green-400',
    yellow: 'text-yellow-700 dark:text-yellow-400',
    red: 'text-red-700 dark:text-red-400',
  };

  return (
    <div
      className={`rounded-lg shadow border p-6 ${colorClasses[color]}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {title}
          </div>
          <div className={`text-3xl font-bold mt-1 ${textColorClasses[color]}`}>
            {count}
          </div>
        </div>
        <div className={textColorClasses[color]}>{icon}</div>
      </div>
    </div>
  );
}

// Alert Item Component
function AlertItem({
  alert,
  onAcknowledge,
}: {
  alert: BudgetAlert;
  onAcknowledge: () => void;
}) {
  const getAlertIcon = () => {
    switch (alert.type) {
      case 'exceeded':
        return <AlertCircle className="text-red-500" size={20} />;
      case 'critical':
        return <AlertTriangle className="text-orange-500" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-yellow-500" size={20} />;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="flex items-center gap-3">
        {getAlertIcon()}
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {alert.message}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(alert.createdAt).toLocaleString()}
          </div>
        </div>
      </div>
      <button
        onClick={onAcknowledge}
        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
        title="Acknowledge"
      >
        <X size={16} className="text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  );
}

// Task Row Component
function TaskRow({
  task,
  onPauseResume,
  onViewDetails,
}: {
  task: BudgetSummary;
  onPauseResume: () => void;
  onViewDetails: () => void;
}) {
  const { budget } = task;

  const getStatusBadge = () => {
    switch (budget.status) {
      case 'active':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            Active
          </span>
        );
      case 'paused':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
            Paused
          </span>
        );
      case 'exceeded':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
            Exceeded
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
            Completed
          </span>
        );
    }
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {task.taskTitle}
        </div>
        {task.activeAlerts.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <AlertTriangle size={12} className="text-yellow-500" />
            <span className="text-xs text-yellow-600 dark:text-yellow-500">
              {task.activeAlerts.length} alert{task.activeAlerts.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <BudgetCell
          used={budget.tokensUsed}
          limit={budget.tokenLimit}
          formatter={formatTokens}
          percent={task.tokenUsagePercent}
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <BudgetCell
          used={budget.costUsed}
          limit={budget.costLimit}
          formatter={formatCost}
          percent={task.costUsagePercent}
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <BudgetCell
          used={budget.timeUsed}
          limit={budget.timeLimit}
          formatter={formatTime}
          percent={task.timeUsagePercent}
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 dark:text-white">
          {budget.retriesUsed} / {budget.maxRetries}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge()}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <button
            onClick={onPauseResume}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title={budget.isPaused ? 'Resume' : 'Pause'}
          >
            {budget.isPaused ? (
              <Play size={16} className="text-green-600 dark:text-green-400" />
            ) : (
              <Pause size={16} className="text-yellow-600 dark:text-yellow-400" />
            )}
          </button>
          <button
            onClick={onViewDetails}
            className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Details
          </button>
        </div>
      </td>
    </tr>
  );
}

// Budget Cell Component
function BudgetCell({
  used,
  limit,
  formatter,
  percent,
}: {
  used: number;
  limit?: number;
  formatter: (n: number) => string;
  percent: number;
}) {
  return (
    <div>
      <div className="text-sm text-gray-900 dark:text-white">
        {formatter(used)}
        {limit && ` / ${formatter(limit)}`}
      </div>
      {limit && (
        <div className="flex items-center gap-2 mt-1">
          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${
                percent >= 100
                  ? 'bg-red-500'
                  : percent >= 90
                  ? 'bg-orange-500'
                  : percent >= 75
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {Math.round(percent)}%
          </span>
        </div>
      )}
    </div>
  );
}

// Task Details Modal
function TaskDetailsModal({
  task,
  onClose,
}: {
  task: BudgetSummary;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {task.taskTitle}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X size={24} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Budget Summary */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Budget Summary
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Tokens
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatTokens(task.budget.tokensUsed)}
                </div>
                {task.budget.tokenLimit && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    of {formatTokens(task.budget.tokenLimit)}
                  </div>
                )}
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cost</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCost(task.budget.costUsed)}
                </div>
                {task.budget.costLimit && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    of {formatCost(task.budget.costLimit)}
                  </div>
                )}
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Time</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatTime(task.budget.timeUsed)}
                </div>
                {task.budget.timeLimit && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    of {formatTime(task.budget.timeLimit)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Recent Activity
            </h3>
            <div className="space-y-2">
              {task.recentUsages.map((usage) => (
                <div
                  key={usage.id}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {usage.success ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <AlertCircle size={16} className="text-red-500" />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {usage.operation}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(usage.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Tokens: </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {formatTokens(usage.tokens)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Cost: </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {formatCost(usage.cost)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Time: </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {formatTime(usage.timeSpent)}
                      </span>
                    </div>
                  </div>
                  {usage.errorMessage && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                      Error: {usage.errorMessage}
                    </div>
                  )}
                </div>
              ))}
              {task.recentUsages.length === 0 && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                  No activity yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
