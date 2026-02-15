'use client';

import { Budget } from '@/types/budget';
import { DollarSign, Zap, Clock, AlertTriangle } from 'lucide-react';

interface TaskBudgetIndicatorProps {
  budget?: Budget;
  compact?: boolean;
}

export const TaskBudgetIndicator = ({ budget, compact = false }: TaskBudgetIndicatorProps) => {
  if (!budget) return null;

  const getStatusColor = (status: Budget['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'paused':
        return 'text-yellow-500';
      case 'exceeded':
        return 'text-red-500';
      case 'completed':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getPercentage = (current: number, max: number | undefined) => {
    if (!max || max === 0) return 0;
    return Math.min((current / max) * 100, 100);
  };

  const hasWarnings = () => {
    if (budget.maxCost && getPercentage(budget.currentCost, budget.maxCost) >= 80) return true;
    if (budget.maxTokens && getPercentage(budget.currentTokens, budget.maxTokens) >= 80) return true;
    if (budget.maxTime && getPercentage(budget.currentTime, budget.maxTime) >= 80) return true;
    return false;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {hasWarnings() && <AlertTriangle size={12} className="text-yellow-500" />}
        <span className={`text-xs ${getStatusColor(budget.status)}`}>
          Budget: {budget.status}
        </span>
      </div>
    );
  }

  return (
    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Budget</span>
        <span className={`text-xs font-medium ${getStatusColor(budget.status)}`}>
          {budget.status}
        </span>
      </div>

      <div className="space-y-1.5">
        {budget.maxCost && (
          <div className="flex items-center gap-2">
            <DollarSign size={12} className="text-gray-500" />
            <div className="flex-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Cost</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  ${budget.currentCost.toFixed(2)} / ${budget.maxCost.toFixed(2)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-0.5">
                <div
                  className={`h-1 rounded-full ${
                    getPercentage(budget.currentCost, budget.maxCost) >= 95
                      ? 'bg-red-500'
                      : getPercentage(budget.currentCost, budget.maxCost) >= 80
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${getPercentage(budget.currentCost, budget.maxCost)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {budget.maxTokens && (
          <div className="flex items-center gap-2">
            <Zap size={12} className="text-gray-500" />
            <div className="flex-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Tokens</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {budget.currentTokens.toLocaleString()} / {budget.maxTokens.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-0.5">
                <div
                  className={`h-1 rounded-full ${
                    getPercentage(budget.currentTokens, budget.maxTokens) >= 95
                      ? 'bg-red-500'
                      : getPercentage(budget.currentTokens, budget.maxTokens) >= 80
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${getPercentage(budget.currentTokens, budget.maxTokens)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {budget.maxTime && (
          <div className="flex items-center gap-2">
            <Clock size={12} className="text-gray-500" />
            <div className="flex-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Time</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {budget.currentTime}m / {budget.maxTime}m
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-0.5">
                <div
                  className={`h-1 rounded-full ${
                    getPercentage(budget.currentTime, budget.maxTime) >= 95
                      ? 'bg-red-500'
                      : getPercentage(budget.currentTime, budget.maxTime) >= 80
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${getPercentage(budget.currentTime, budget.maxTime)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
