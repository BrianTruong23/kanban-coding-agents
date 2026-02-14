'use client';

import { useState, useMemo } from 'react';
import { useBudgets } from '@/hooks/useBudgets';
import { useTasks } from '@/hooks/useTasks';
import { useAgents } from '@/hooks/useAgents';
import { BudgetMonitor } from '@/components/BudgetMonitor';
import { TaskBudget, BudgetFilter } from '@/types/budget';
import { calculateBudgetMetrics, formatCost, formatTokens, formatDuration } from '@/lib/budget-tracker';
import {
  DollarSign,
  Zap,
  Clock,
  TrendingUp,
  AlertTriangle,
  Filter,
  RefreshCw,
  Plus,
  BarChart3,
  Activity,
} from 'lucide-react';

export default function BudgetPMDashboard() {
  const { tasks } = useTasks();
  const { agents } = useAgents();
  const [filter, setFilter] = useState<BudgetFilter>({});
  const {
    budgets,
    isLoading,
    pauseBudget,
    resumeBudget,
    deleteBudget,
    refetch,
  } = useBudgets(filter);

  const [showFilters, setShowFilters] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<TaskBudget | null>(null);

  // Calculate overall metrics
  const metrics = useMemo(() => calculateBudgetMetrics(budgets), [budgets]);

  // Summary statistics
  const stats = useMemo(() => {
    const totalBudgets = budgets.length;
    const activeBudgets = budgets.filter((b) => b.status === 'active').length;
    const pausedBudgets = budgets.filter((b) => b.status === 'paused').length;
    const exceededBudgets = budgets.filter((b) => b.status === 'exceeded').length;
    const completedBudgets = budgets.filter((b) => b.status === 'completed').length;
    const totalAlerts = budgets.reduce((sum, b) => sum + b.alerts.length, 0);

    return {
      totalBudgets,
      activeBudgets,
      pausedBudgets,
      exceededBudgets,
      completedBudgets,
      totalAlerts,
    };
  }, [budgets]);

  const getTaskTitle = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    return task ? task.title : 'Unknown Task';
  };

  const getAgentName = (agentId?: string) => {
    if (!agentId) return 'Unassigned';
    const agent = agents.find((a) => a.id === agentId);
    return agent ? agent.name : 'Unknown Agent';
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    subtitle,
    trend,
    color = 'blue',
  }: {
    title: string;
    value: string | number;
    icon: typeof DollarSign;
    subtitle?: string;
    trend?: string;
    color?: string;
  }) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
      red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    }[color];

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {title}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</div>
            {subtitle && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</div>
            )}
            {trend && (
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-1">
                <TrendingUp size={12} />
                {trend}
              </div>
            )}
          </div>
          <div className={`p-2.5 rounded-lg ${colorClasses}`}>
            <Icon size={20} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">PM Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Budget and resource management for agent tasks
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
                showFilters
                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Filter size={16} />
              Filters
            </button>
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  value={filter.status || ''}
                  onChange={(e) =>
                    setFilter({ ...filter, status: e.target.value || undefined })
                  }
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="exceeded">Exceeded</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Task
                </label>
                <select
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  value={filter.taskId || ''}
                  onChange={(e) =>
                    setFilter({ ...filter, taskId: e.target.value || undefined })
                  }
                >
                  <option value="">All Tasks</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.taskId} - {task.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Agent
                </label>
                <select
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  value={filter.agentId || ''}
                  onChange={(e) =>
                    setFilter({ ...filter, agentId: e.target.value || undefined })
                  }
                >
                  <option value="">All Agents</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => setFilter({})}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Spent"
            value={formatCost(metrics.totalUsed.cost)}
            icon={DollarSign}
            subtitle={`of ${formatCost(metrics.totalBudgeted.cost || 0)} budgeted`}
            color="blue"
          />
          <StatCard
            title="Tokens Used"
            value={formatTokens(metrics.totalUsed.tokens)}
            icon={Zap}
            subtitle={`of ${formatTokens(metrics.totalBudgeted.tokens || 0)} budgeted`}
            color="purple"
          />
          <StatCard
            title="Total Time"
            value={formatDuration(metrics.totalUsed.time)}
            icon={Clock}
            subtitle={`of ${formatDuration(metrics.totalBudgeted.time || 0)} budgeted`}
            color="green"
          />
          <StatCard
            title="Active Alerts"
            value={stats.totalAlerts}
            icon={AlertTriangle}
            subtitle={`${stats.exceededBudgets} budgets exceeded`}
            color={stats.totalAlerts > 0 ? 'red' : 'green'}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalBudgets}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Budgets</div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.activeBudgets}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active</div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.pausedBudgets}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Paused</div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.exceededBudgets}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Exceeded</div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.completedBudgets}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Completed</div>
          </div>
        </div>

        {/* Efficiency Metrics */}
        {stats.completedBudgets > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={20} className="text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Efficiency Metrics
              </h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                (Based on {stats.completedBudgets} completed tasks)
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">Cost per Task</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCost(metrics.efficiency.costPerTask)}
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">Tokens per Task</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatTokens(metrics.efficiency.tokensPerTask)}
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">Time per Task</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatDuration(metrics.efficiency.timePerTask)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Budget List */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={20} className="text-gray-600 dark:text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Budget Details
                </h2>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Loading budgets...
            </div>
          ) : budgets.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 dark:text-gray-500 mb-2">
                <BarChart3 size={48} className="mx-auto" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">No budgets found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Create a budget to start tracking task resources
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {budgets.map((budget) => (
                <div
                  key={budget.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {getTaskTitle(budget.taskId)}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>Agent: {getAgentName(budget.agentId)}</span>
                        <span>•</span>
                        <span>
                          Created: {new Date(budget.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setSelectedBudget(
                          selectedBudget?.id === budget.id ? null : budget
                        )
                      }
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {selectedBudget?.id === budget.id ? 'Hide' : 'Details'}
                    </button>
                  </div>

                  {selectedBudget?.id === budget.id ? (
                    <BudgetMonitor
                      budget={budget}
                      onPause={pauseBudget}
                      onResume={resumeBudget}
                      onCancel={(id) => {
                        if (confirm('Are you sure you want to cancel this budget?')) {
                          deleteBudget(id);
                        }
                      }}
                    />
                  ) : (
                    <BudgetMonitor
                      budget={budget}
                      onPause={pauseBudget}
                      onResume={resumeBudget}
                      compact
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
