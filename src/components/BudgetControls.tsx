'use client';

import { useState } from 'react';
import { Task, TaskBudget } from '@/types/task';
import {
  checkBudgetStatus,
  shouldPauseTask,
  updateBudgetUsage,
  incrementRetries,
  pauseTask,
  resumeTask,
  formatCost,
  formatTokens,
  formatTime,
  createDefaultBudget,
} from '@/lib/budget';
import {
  Settings,
  Play,
  Pause,
  RotateCcw,
  DollarSign,
  Coins,
  Clock,
  AlertTriangle,
  CheckCircle,
  Save,
} from 'lucide-react';

interface BudgetControlsProps {
  task: Task;
  onUpdate: (task: Task) => void;
}

export const BudgetControls = ({ task, onUpdate }: BudgetControlsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showUsageForm, setShowUsageForm] = useState(false);

  // Budget limits
  const [maxTokens, setMaxTokens] = useState(task.budget?.maxTokens?.toString() || '');
  const [maxCost, setMaxCost] = useState(task.budget?.maxCost?.toString() || '');
  const [maxTimeMinutes, setMaxTimeMinutes] = useState(task.budget?.maxTimeMinutes?.toString() || '');
  const [maxRetries, setMaxRetries] = useState(task.budget?.maxRetries?.toString() || '');

  // Usage tracking
  const [usageTokens, setUsageTokens] = useState('');
  const [usageCost, setUsageCost] = useState('');
  const [usageTime, setUsageTime] = useState('');

  const budget = task.budget;
  const budgetStatus = budget ? checkBudgetStatus(budget) : null;
  const pauseCheck = budget ? shouldPauseTask(budget) : { shouldPause: false };

  const handleSaveBudget = () => {
    const newBudget: TaskBudget = task.budget || createDefaultBudget();

    const updatedBudget: TaskBudget = {
      ...newBudget,
      maxTokens: maxTokens ? parseInt(maxTokens, 10) : undefined,
      maxCost: maxCost ? parseFloat(maxCost) : undefined,
      maxTimeMinutes: maxTimeMinutes ? parseInt(maxTimeMinutes, 10) : undefined,
      maxRetries: maxRetries ? parseInt(maxRetries, 10) : undefined,
    };

    onUpdate({
      ...task,
      budget: updatedBudget,
    });

    setIsEditing(false);
  };

  const handleAddUsage = () => {
    if (!budget) return;

    const usage = {
      tokens: usageTokens ? parseInt(usageTokens, 10) : 0,
      cost: usageCost ? parseFloat(usageCost) : 0,
      timeMinutes: usageTime ? parseInt(usageTime, 10) : 0,
    };

    const updatedBudget = updateBudgetUsage(budget, usage);
    const pauseCheck = shouldPauseTask(updatedBudget);

    let finalBudget = updatedBudget;
    let finalStatus = task.status;

    if (pauseCheck.shouldPause) {
      finalBudget = pauseTask(updatedBudget, pauseCheck.reason || 'Budget exceeded');
      finalStatus = 'paused';
    }

    onUpdate({
      ...task,
      budget: finalBudget,
      status: finalStatus,
    });

    setUsageTokens('');
    setUsageCost('');
    setUsageTime('');
    setShowUsageForm(false);
  };

  const handleRetry = () => {
    if (!budget) return;

    const updatedBudget = incrementRetries(budget);
    const pauseCheck = shouldPauseTask(updatedBudget);

    if (pauseCheck.shouldPause) {
      onUpdate({
        ...task,
        budget: pauseTask(updatedBudget, pauseCheck.reason || 'Max retries exceeded'),
        status: 'paused',
      });
    } else {
      onUpdate({
        ...task,
        budget: updatedBudget,
      });
    }
  };

  const handlePause = () => {
    if (!budget) return;

    onUpdate({
      ...task,
      budget: pauseTask(budget, 'Manually paused by user'),
      status: 'paused',
    });
  };

  const handleResume = () => {
    if (!budget) return;

    onUpdate({
      ...task,
      budget: resumeTask(budget),
      status: 'in-progress',
    });
  };

  if (!budget && !isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
      >
        <Settings size={12} />
        Add Budget
      </button>
    );
  }

  return (
    <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
      {/* Budget Status Indicator */}
      {budget && budgetStatus && (
        <div className="flex items-center gap-2 text-xs">
          {budgetStatus.isOverBudget ? (
            <>
              <AlertTriangle size={12} className="text-red-500" />
              <span className="text-red-600 dark:text-red-500 font-medium">Over Budget</span>
            </>
          ) : budgetStatus.isNearLimit ? (
            <>
              <AlertTriangle size={12} className="text-yellow-500" />
              <span className="text-yellow-600 dark:text-yellow-500 font-medium">Near Limit</span>
            </>
          ) : (
            <>
              <CheckCircle size={12} className="text-green-500" />
              <span className="text-green-600 dark:text-green-500">On Track</span>
            </>
          )}
        </div>
      )}

      {/* Current Budget Display */}
      {budget && !isEditing && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <Coins size={12} />
              <span>Tokens:</span>
            </div>
            <span className="text-gray-900 dark:text-white font-mono">
              {formatTokens(budget.usedTokens)}
              {budget.maxTokens && ` / ${formatTokens(budget.maxTokens)}`}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <DollarSign size={12} />
              <span>Cost:</span>
            </div>
            <span className="text-gray-900 dark:text-white font-mono">
              {formatCost(budget.usedCost)}
              {budget.maxCost && ` / ${formatCost(budget.maxCost)}`}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <Clock size={12} />
              <span>Time:</span>
            </div>
            <span className="text-gray-900 dark:text-white font-mono">
              {formatTime(budget.usedTimeMinutes)}
              {budget.maxTimeMinutes && ` / ${formatTime(budget.maxTimeMinutes)}`}
            </span>
          </div>

          {budget.maxRetries && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <RotateCcw size={12} />
                <span>Retries:</span>
              </div>
              <span className="text-gray-900 dark:text-white font-mono">
                {budget.currentRetries} / {budget.maxRetries}
              </span>
            </div>
          )}

          {budget.isPaused && budget.pauseReason && (
            <div className="text-xs text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
              <div className="flex items-center gap-1 font-medium mb-1">
                <Pause size={12} />
                Paused
              </div>
              <div className="text-gray-700 dark:text-gray-300">{budget.pauseReason}</div>
            </div>
          )}
        </div>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <div className="space-y-2 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Set Budget Limits</div>

          <input
            type="number"
            placeholder="Max Tokens"
            value={maxTokens}
            onChange={(e) => setMaxTokens(e.target.value)}
            className="w-full text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 rounded"
          />

          <input
            type="number"
            step="0.01"
            placeholder="Max Cost ($)"
            value={maxCost}
            onChange={(e) => setMaxCost(e.target.value)}
            className="w-full text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 rounded"
          />

          <input
            type="number"
            placeholder="Max Time (minutes)"
            value={maxTimeMinutes}
            onChange={(e) => setMaxTimeMinutes(e.target.value)}
            className="w-full text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 rounded"
          />

          <input
            type="number"
            placeholder="Max Retries"
            value={maxRetries}
            onChange={(e) => setMaxRetries(e.target.value)}
            className="w-full text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 rounded"
          />

          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSaveBudget}
              className="flex-1 text-xs bg-black dark:bg-white text-white dark:text-black px-2 py-1 rounded hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
            >
              <Save size={12} />
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      {budget && !isEditing && (
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setShowUsageForm(!showUsageForm)}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
          >
            <Settings size={12} />
            Add Usage
          </button>

          {!budget.isPaused && (
            <>
              <button
                onClick={handleRetry}
                className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors flex items-center gap-1"
                disabled={pauseCheck.shouldPause}
              >
                <RotateCcw size={12} />
                Retry
              </button>
              <button
                onClick={handlePause}
                className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition-colors flex items-center gap-1"
              >
                <Pause size={12} />
                Pause
              </button>
            </>
          )}

          {budget.isPaused && (
            <button
              onClick={handleResume}
              className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors flex items-center gap-1"
            >
              <Play size={12} />
              Resume
            </button>
          )}

          <button
            onClick={() => setIsEditing(true)}
            className="text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
          >
            <Settings size={12} />
            Edit
          </button>
        </div>
      )}

      {/* Usage Form */}
      {showUsageForm && budget && (
        <div className="space-y-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-2">Record Usage</div>

          <input
            type="number"
            placeholder="Tokens used"
            value={usageTokens}
            onChange={(e) => setUsageTokens(e.target.value)}
            className="w-full text-xs border border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 rounded"
          />

          <input
            type="number"
            step="0.01"
            placeholder="Cost ($)"
            value={usageCost}
            onChange={(e) => setUsageCost(e.target.value)}
            className="w-full text-xs border border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 rounded"
          />

          <input
            type="number"
            placeholder="Time (minutes)"
            value={usageTime}
            onChange={(e) => setUsageTime(e.target.value)}
            className="w-full text-xs border border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 rounded"
          />

          <div className="flex gap-2 mt-2">
            <button
              onClick={handleAddUsage}
              className="flex-1 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
            >
              Add Usage
            </button>
            <button
              onClick={() => {
                setShowUsageForm(false);
                setUsageTokens('');
                setUsageCost('');
                setUsageTime('');
              }}
              className="flex-1 text-xs border border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
