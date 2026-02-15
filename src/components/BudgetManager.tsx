'use client';

import { useState } from 'react';
import { Task } from '@/types/task';
import { TaskBudget, BudgetLimits } from '@/types/budget';
import { createDefaultBudget, formatCost, formatTokens, formatTime, getBudgetStatusColor, getBudgetPercentage } from '@/lib/budget';
import { DollarSign, Zap, Clock, RefreshCw, X, Edit2, Check } from 'lucide-react';

interface BudgetManagerProps {
  task: Task;
  onUpdateBudget: (budget: TaskBudget) => void;
  compact?: boolean;
}

export const BudgetManager = ({ task, onUpdateBudget, compact = false }: BudgetManagerProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<BudgetLimits>>({
    maxCost: task.budget?.maxCost,
    maxTokens: task.budget?.maxTokens,
    maxTime: task.budget?.maxTime,
    maxRetries: task.budget?.maxRetries || 3,
  });

  const handleSave = () => {
    if (!task.budget) {
      // Create new budget
      const newBudget = createDefaultBudget(formData);
      onUpdateBudget(newBudget);
    } else {
      // Update existing budget limits
      const updatedBudget: TaskBudget = {
        ...task.budget,
        maxCost: formData.maxCost,
        maxTokens: formData.maxTokens,
        maxTime: formData.maxTime,
        maxRetries: formData.maxRetries || 3,
        lastUpdatedAt: Date.now(),
      };
      onUpdateBudget(updatedBudget);
    }
    setIsEditing(false);
  };

  const handleRemoveBudget = () => {
    if (window.confirm('Are you sure you want to remove budget tracking for this task?')) {
      // We can't actually remove the budget field, but we can clear the limits
      const clearedBudget: TaskBudget = {
        actualCost: 0,
        actualTokens: 0,
        actualTime: 0,
        retryCount: 0,
        maxRetries: 3,
        status: 'within-budget',
        isPaused: false,
        lastUpdatedAt: Date.now(),
      };
      onUpdateBudget(clearedBudget);
      setIsEditing(false);
    }
  };

  // Compact view - just show badge
  if (compact && !task.budget) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
      >
        <DollarSign size={12} />
        Set Budget
      </button>
    );
  }

  if (compact && task.budget && !isEditing) {
    return (
      <div className="flex items-center gap-2">
        <div
          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getBudgetStatusColor(
            task.budget.status
          )}`}
        >
          {task.budget.status === 'within-budget' ? '✓' : task.budget.status === 'warning' ? '⚠' : task.budget.status === 'exceeded' ? '!' : '⏸'}
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <Edit2 size={12} />
        </button>
      </div>
    );
  }

  // Full view or editing mode
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <DollarSign size={16} />
          Budget Management
        </h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <Edit2 size={12} />
            Edit
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(false)}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Cost ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.maxCost || ''}
              onChange={(e) =>
                setFormData({ ...formData, maxCost: e.target.value ? parseFloat(e.target.value) : undefined })
              }
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
              placeholder="No limit"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Tokens
            </label>
            <input
              type="number"
              step="1"
              min="0"
              value={formData.maxTokens || ''}
              onChange={(e) =>
                setFormData({ ...formData, maxTokens: e.target.value ? parseInt(e.target.value) : undefined })
              }
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
              placeholder="No limit"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Time (minutes)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              value={formData.maxTime ? Math.round(formData.maxTime / 60000) : ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxTime: e.target.value ? parseInt(e.target.value) * 60000 : undefined,
                })
              }
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
              placeholder="No limit"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Retries
            </label>
            <input
              type="number"
              step="1"
              min="0"
              value={formData.maxRetries || 3}
              onChange={(e) =>
                setFormData({ ...formData, maxRetries: parseInt(e.target.value) || 3 })
              }
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
            >
              <Check size={14} />
              Save
            </button>
            {task.budget && (
              <button
                onClick={handleRemoveBudget}
                className="px-3 py-1.5 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      ) : task.budget ? (
        <div className="space-y-3">
          {/* Status Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${getBudgetStatusColor(
              task.budget.status
            )}`}
          >
            {task.budget.status.toUpperCase()}
            {task.budget.isPaused && ' (PAUSED)'}
          </div>

          {/* Budget Progress */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-gray-400">Overall Budget Usage</span>
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

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {task.budget.maxCost && (
              <div className="flex items-center gap-1">
                <DollarSign size={12} className="text-green-600 dark:text-green-400" />
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Cost</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatCost(task.budget.actualCost)} / {formatCost(task.budget.maxCost)}
                  </div>
                </div>
              </div>
            )}

            {task.budget.maxTokens && (
              <div className="flex items-center gap-1">
                <Zap size={12} className="text-blue-600 dark:text-blue-400" />
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Tokens</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatTokens(task.budget.actualTokens)} / {formatTokens(task.budget.maxTokens)}
                  </div>
                </div>
              </div>
            )}

            {task.budget.maxTime && (
              <div className="flex items-center gap-1">
                <Clock size={12} className="text-purple-600 dark:text-purple-400" />
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Time</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatTime(task.budget.actualTime)} / {formatTime(task.budget.maxTime)}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1">
              <RefreshCw size={12} className="text-orange-600 dark:text-orange-400" />
              <div>
                <div className="text-gray-600 dark:text-gray-400">Retries</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {task.budget.retryCount} / {task.budget.maxRetries}
                </div>
              </div>
            </div>
          </div>

          {task.budget.pauseReason && (
            <div className="text-xs text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
              Paused: {task.budget.pauseReason}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
          No budget set for this task
        </div>
      )}
    </div>
  );
};
