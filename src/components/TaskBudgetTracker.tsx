'use client';

import { useState } from 'react';
import { Task } from '@/types/task';
import { DollarSign, Clock, Cpu, AlertTriangle, Pause, Play, RotateCcw, X, Edit2 } from 'lucide-react';

interface TaskBudgetTrackerProps {
  task: Task;
  onUpdate: (task: Task) => void;
}

export const TaskBudgetTracker = ({ task, onUpdate }: TaskBudgetTrackerProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tokenBudget, setTokenBudget] = useState(task.tokenBudget?.toString() || '');
  const [costBudget, setCostBudget] = useState(task.costBudget ? (task.costBudget / 100).toString() : '');
  const [timeBudget, setTimeBudget] = useState(task.timeBudget?.toString() || '');
  const [maxRetries, setMaxRetries] = useState(task.maxRetries?.toString() || '3');

  const hasBudgets = task.tokenBudget || task.costBudget || task.timeBudget;

  const calculatePercentage = (spent: number, budget: number) => {
    if (!budget) return 0;
    return (spent / budget) * 100;
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600 dark:text-red-400';
    if (percentage >= 80) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getBgColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleSave = () => {
    const updatedTask = {
      ...task,
      tokenBudget: tokenBudget ? parseInt(tokenBudget, 10) : undefined,
      costBudget: costBudget ? Math.round(parseFloat(costBudget) * 100) : undefined,
      timeBudget: timeBudget ? parseInt(timeBudget, 10) : undefined,
      maxRetries: maxRetries ? parseInt(maxRetries, 10) : 3,
    };
    onUpdate(updatedTask);
    setIsEditing(false);
  };

  const handlePauseToggle = () => {
    onUpdate({
      ...task,
      isPaused: !task.isPaused,
      pauseReason: !task.isPaused ? 'manual' : undefined,
    });
  };

  const handleSimulateUsage = () => {
    // Simulate some resource usage for testing
    const randomTokens = Math.floor(Math.random() * 1000) + 100;
    const randomCost = Math.floor(Math.random() * 50) + 10;
    const randomTime = Math.floor(Math.random() * 30) + 5;

    onUpdate({
      ...task,
      tokenSpent: (task.tokenSpent || 0) + randomTokens,
      costSpent: (task.costSpent || 0) + randomCost,
      timeSpent: (task.timeSpent || 0) + randomTime,
    });
  };

  const handleRetry = () => {
    const newRetryCount = (task.retryCount || 0) + 1;
    const shouldPause = newRetryCount >= (task.maxRetries || 3);

    onUpdate({
      ...task,
      retryCount: newRetryCount,
      isPaused: shouldPause,
      pauseReason: shouldPause ? 'max_retries_reached' : task.pauseReason,
    });
  };

  const formatCost = (cents: number) => `$${(cents / 100).toFixed(2)}`;
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

  if (!hasBudgets && !isEditing) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
        <button
          onClick={() => setIsEditing(true)}
          className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-center gap-2 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <DollarSign size={14} />
          Set Budget Limits
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
      {isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Budget Settings</h4>
            <button
              onClick={() => setIsEditing(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={14} />
            </button>
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Token Budget</label>
            <input
              type="number"
              value={tokenBudget}
              onChange={(e) => setTokenBudget(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., 10000"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Cost Budget ($)</label>
            <input
              type="number"
              step="0.01"
              value={costBudget}
              onChange={(e) => setCostBudget(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., 5.00"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Time Budget (minutes)</label>
            <input
              type="number"
              value={timeBudget}
              onChange={(e) => setTimeBudget(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., 120"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Max Retries</label>
            <input
              type="number"
              value={maxRetries}
              onChange={(e) => setMaxRetries(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., 3"
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full px-3 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            Save Budget
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Budget Status</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Edit budget"
              >
                <Edit2 size={12} />
              </button>
              <button
                onClick={handlePauseToggle}
                className={`${
                  task.isPaused
                    ? 'text-green-500 hover:text-green-600'
                    : 'text-orange-500 hover:text-orange-600'
                }`}
                title={task.isPaused ? 'Resume task' : 'Pause task'}
              >
                {task.isPaused ? <Play size={12} /> : <Pause size={12} />}
              </button>
            </div>
          </div>

          {task.isPaused && (
            <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded p-2 flex items-start gap-2">
              <AlertTriangle size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-orange-700 dark:text-orange-400">
                <p className="font-semibold">Task Paused</p>
                <p>{task.pauseReason || 'Manual pause'}</p>
              </div>
            </div>
          )}

          {task.tokenBudget && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <Cpu size={12} className="text-purple-500" />
                  <span className="text-gray-600 dark:text-gray-400">Tokens</span>
                </div>
                <span className={getStatusColor(calculatePercentage(task.tokenSpent || 0, task.tokenBudget))}>
                  {formatTokens(task.tokenSpent || 0)} / {formatTokens(task.tokenBudget)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${getBgColor(
                    calculatePercentage(task.tokenSpent || 0, task.tokenBudget)
                  )}`}
                  style={{
                    width: `${Math.min(calculatePercentage(task.tokenSpent || 0, task.tokenBudget), 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {task.costBudget && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <DollarSign size={12} className="text-green-500" />
                  <span className="text-gray-600 dark:text-gray-400">Cost</span>
                </div>
                <span className={getStatusColor(calculatePercentage(task.costSpent || 0, task.costBudget))}>
                  {formatCost(task.costSpent || 0)} / {formatCost(task.costBudget)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${getBgColor(
                    calculatePercentage(task.costSpent || 0, task.costBudget)
                  )}`}
                  style={{
                    width: `${Math.min(calculatePercentage(task.costSpent || 0, task.costBudget), 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {task.timeBudget && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <Clock size={12} className="text-blue-500" />
                  <span className="text-gray-600 dark:text-gray-400">Time</span>
                </div>
                <span className={getStatusColor(calculatePercentage(task.timeSpent || 0, task.timeBudget))}>
                  {formatTime(task.timeSpent || 0)} / {formatTime(task.timeBudget)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${getBgColor(
                    calculatePercentage(task.timeSpent || 0, task.timeBudget)
                  )}`}
                  style={{
                    width: `${Math.min(calculatePercentage(task.timeSpent || 0, task.timeBudget), 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-1">
              <RotateCcw size={12} className="text-orange-500" />
              <span className="text-gray-600 dark:text-gray-400">Retries</span>
            </div>
            <span className={task.retryCount === task.maxRetries ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}>
              {task.retryCount || 0} / {task.maxRetries || 3}
            </span>
          </div>

          {/* Testing controls - Remove in production */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSimulateUsage}
              className="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Simulate resource usage (for testing)"
            >
              Add Usage
            </button>
            <button
              onClick={handleRetry}
              className="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Increment retry count"
            >
              Retry +1
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
