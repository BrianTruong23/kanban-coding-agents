'use client';

import { TaskBudget } from '@/types/budget';
import {
  calculatePercentages,
  formatCost,
  formatTokens,
  formatDuration,
  getUtilizationColor,
} from '@/lib/budget-tracker';
import { AlertTriangle, Clock, DollarSign, Zap, Pause, Play, XCircle } from 'lucide-react';

interface BudgetMonitorProps {
  budget: TaskBudget;
  onPause?: (budgetId: string) => void;
  onResume?: (budgetId: string) => void;
  onCancel?: (budgetId: string) => void;
  compact?: boolean;
}

export const BudgetMonitor = ({
  budget,
  onPause,
  onResume,
  onCancel,
  compact = false,
}: BudgetMonitorProps) => {
  const percentages = calculatePercentages(budget.usage, budget.limits);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'exceeded':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getProgressBarColor = (percentage: number | undefined) => {
    const color = getUtilizationColor(percentage);
    switch (color) {
      case 'green':
        return 'bg-green-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'orange':
        return 'bg-orange-500';
      case 'red':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  const ResourceBar = ({
    label,
    icon: Icon,
    current,
    limit,
    percentage,
    formatter,
  }: {
    label: string;
    icon: typeof DollarSign;
    current: number;
    limit?: number;
    percentage?: number;
    formatter: (val: number) => string;
  }) => {
    if (limit === undefined) return null;

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <Icon size={14} />
            <span className="font-medium">{label}</span>
          </div>
          <span className="text-gray-900 dark:text-white font-mono">
            {formatter(current)} / {formatter(limit)}
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getProgressBarColor(percentage)}`}
            style={{ width: `${Math.min(percentage || 0, 100)}%` }}
          />
        </div>
        {percentage !== undefined && (
          <div className="text-right text-xs text-gray-500 dark:text-gray-400">
            {percentage.toFixed(1)}% used
          </div>
        )}
      </div>
    );
  };

  if (compact) {
    return (
      <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span
            className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(budget.status)}`}
          >
            {budget.status.toUpperCase()}
          </span>
          <div className="flex gap-1">
            {budget.status === 'active' && onPause && (
              <button
                onClick={() => onPause(budget.id)}
                className="p-1 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400"
                title="Pause"
              >
                <Pause size={14} />
              </button>
            )}
            {(budget.status === 'paused' || budget.status === 'exceeded') && onResume && (
              <button
                onClick={() => onResume(budget.id)}
                className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                title="Resume"
              >
                <Play size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {budget.limits.cost !== undefined && (
            <div className="text-xs">
              <span className="text-gray-600 dark:text-gray-400">Cost: </span>
              <span className="font-mono text-gray-900 dark:text-white">
                {formatCost(budget.usage.cost)} / {formatCost(budget.limits.cost)}
              </span>
              {percentages.cost !== undefined && (
                <span
                  className={`ml-2 ${
                    percentages.cost >= 80 ? 'text-red-600 dark:text-red-400' : 'text-gray-500'
                  }`}
                >
                  ({percentages.cost.toFixed(0)}%)
                </span>
              )}
            </div>
          )}
          {budget.limits.tokens !== undefined && (
            <div className="text-xs">
              <span className="text-gray-600 dark:text-gray-400">Tokens: </span>
              <span className="font-mono text-gray-900 dark:text-white">
                {formatTokens(budget.usage.tokens)} / {formatTokens(budget.limits.tokens)}
              </span>
            </div>
          )}
        </div>
        {budget.alerts.length > 0 && (
          <div className="mt-2 flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
            <AlertTriangle size={12} />
            <span>{budget.alerts.length} alert(s)</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Budget Monitor</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Track resource usage and limits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded ${getStatusColor(
              budget.status
            )}`}
          >
            {budget.status.toUpperCase()}
          </span>
          {budget.status === 'active' && onPause && (
            <button
              onClick={() => onPause(budget.id)}
              className="p-2 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded transition-colors"
              title="Pause budget"
            >
              <Pause size={16} />
            </button>
          )}
          {(budget.status === 'paused' || budget.status === 'exceeded') && onResume && (
            <button
              onClick={() => onResume(budget.id)}
              className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
              title="Resume budget"
            >
              <Play size={16} />
            </button>
          )}
          {onCancel && (
            <button
              onClick={() => onCancel(budget.id)}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Cancel budget"
            >
              <XCircle size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Resource Bars */}
      <div className="space-y-3">
        <ResourceBar
          label="Cost"
          icon={DollarSign}
          current={budget.usage.cost}
          limit={budget.limits.cost}
          percentage={percentages.cost}
          formatter={formatCost}
        />
        <ResourceBar
          label="Tokens"
          icon={Zap}
          current={budget.usage.tokens}
          limit={budget.limits.tokens}
          percentage={percentages.tokens}
          formatter={formatTokens}
        />
        <ResourceBar
          label="Time"
          icon={Clock}
          current={budget.usage.time}
          limit={budget.limits.time}
          percentage={percentages.time}
          formatter={formatDuration}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">API Calls</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {budget.usage.apiCalls}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">File Ops</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {budget.usage.fileOperations}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">Retries</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {budget.usage.retries}
            {budget.limits.retries && ` / ${budget.limits.retries}`}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {budget.alerts.length > 0 && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-orange-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Active Alerts ({budget.alerts.length})
            </span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {budget.alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className={`text-xs p-2 rounded ${
                  alert.type === 'exceeded'
                    ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    : 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                }`}
              >
                {alert.message}
              </div>
            ))}
            {budget.alerts.length > 3 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-1">
                +{budget.alerts.length - 3} more alert(s)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auto Actions Status */}
      {budget.autoActionsEnabled && (
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              budget.autoPauseOnExceed ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
          Auto-pause on exceed: {budget.autoPauseOnExceed ? 'Enabled' : 'Disabled'}
        </div>
      )}
    </div>
  );
};
