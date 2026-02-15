'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { useBudgets } from '@/hooks/useBudgets';
import { BudgetEnforcer } from '@/lib/budgetEnforcement';
import { Play, Pause, XCircle, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';

interface TaskExecutionTrackerProps {
  task: Task;
  onStatusChange?: (status: 'running' | 'paused' | 'completed' | 'failed') => void;
}

export const TaskExecutionTracker = ({ task, onStatusChange }: TaskExecutionTrackerProps) => {
  const { getBudgetForTask, logUsage, pauseTask, resumeTask, incrementRetry, updateBudget } = useBudgets();
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'completed' | 'failed'>('idle');

  const budget = getBudgetForTask(task.id);
  const canExecute = budget ? BudgetEnforcer.canExecute(budget) : { allowed: true };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && status === 'running') {
      interval = setInterval(() => {
        setExecutionTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, status]);

  const handleStart = async () => {
    if (!canExecute.allowed) {
      alert(`Cannot start task: ${canExecute.reason}\n${canExecute.exceededLimits?.join(', ') || ''}`);
      return;
    }

    setIsRunning(true);
    setStatus('running');
    onStatusChange?.('running');
  };

  const handlePause = async () => {
    setIsRunning(false);
    setStatus('paused');
    onStatusChange?.('paused');

    if (budget) {
      await pauseTask(budget.id);
      // Log the current execution time
      await logUsage({
        taskId: task.id,
        cost: 0,
        tokens: 0,
        timeSpent: executionTime,
        operation: 'pause',
        notes: 'Task paused by user',
      });
    }
  };

  const handleResume = async () => {
    if (!canExecute.allowed) {
      alert(`Cannot resume task: ${canExecute.reason}\n${canExecute.exceededLimits?.join(', ') || ''}`);
      return;
    }

    setIsRunning(true);
    setStatus('running');
    onStatusChange?.('running');

    if (budget) {
      await resumeTask(budget.id);
    }
  };

  const handleComplete = async () => {
    setIsRunning(false);
    setStatus('completed');
    onStatusChange?.('completed');

    if (budget) {
      await updateBudget(budget.id, { status: 'completed' });
      await logUsage({
        taskId: task.id,
        cost: 0,
        tokens: 0,
        timeSpent: executionTime,
        operation: 'completion',
        notes: 'Task completed successfully',
      });
    }
  };

  const handleFail = async () => {
    setIsRunning(false);
    setStatus('failed');
    onStatusChange?.('failed');

    if (budget) {
      await incrementRetry(budget.id);
      await logUsage({
        taskId: task.id,
        cost: 0,
        tokens: 0,
        timeSpent: executionTime,
        operation: 'retry',
        notes: `Retry ${budget.retryCount + 1}/${budget.maxRetries}`,
      });
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const budgetStatus = budget ? BudgetEnforcer.getBudgetStatus(budget) : null;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">{task.title}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{task.taskId}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              status === 'running'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : status === 'paused'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                : status === 'completed'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : status === 'failed'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Execution Time */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded text-center">
        <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
          {formatTime(executionTime)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Execution Time</p>
      </div>

      {/* Budget Status */}
      {budget && budgetStatus && (
        <div className="mb-4 p-3 rounded border" style={{
          borderColor: budgetStatus.color === 'green' ? '#10b981' :
                      budgetStatus.color === 'yellow' ? '#f59e0b' :
                      budgetStatus.color === 'orange' ? '#f97316' : '#ef4444',
          backgroundColor: budgetStatus.color === 'green' ? 'rgba(16, 185, 129, 0.1)' :
                          budgetStatus.color === 'yellow' ? 'rgba(245, 158, 11, 0.1)' :
                          budgetStatus.color === 'orange' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        }}>
          <div className="flex items-center gap-2">
            {budgetStatus.status === 'healthy' ? (
              <CheckCircle size={16} style={{ color: '#10b981' }} />
            ) : budgetStatus.status === 'warning' ? (
              <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
            ) : budgetStatus.status === 'critical' ? (
              <AlertTriangle size={16} style={{ color: '#f97316' }} />
            ) : (
              <XCircle size={16} style={{ color: '#ef4444' }} />
            )}
            <span className="text-sm font-medium" style={{
              color: budgetStatus.color === 'green' ? '#10b981' :
                    budgetStatus.color === 'yellow' ? '#f59e0b' :
                    budgetStatus.color === 'orange' ? '#f97316' : '#ef4444',
            }}>
              Budget Status: {budgetStatus.status.charAt(0).toUpperCase() + budgetStatus.status.slice(1)}
            </span>
          </div>
          {budget.retryCount > 0 && (
            <p className="text-xs mt-2" style={{
              color: budgetStatus.color === 'green' ? '#10b981' :
                    budgetStatus.color === 'yellow' ? '#f59e0b' :
                    budgetStatus.color === 'orange' ? '#f97316' : '#ef4444',
            }}>
              Retries: {budget.retryCount}/{budget.maxRetries}
            </p>
          )}
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-2">
        {status === 'idle' && (
          <button
            onClick={handleStart}
            disabled={!canExecute.allowed}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            title={!canExecute.allowed ? canExecute.reason : 'Start task'}
          >
            <Play size={16} />
            Start
          </button>
        )}

        {status === 'running' && (
          <>
            <button
              onClick={handlePause}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
            >
              <Pause size={16} />
              Pause
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              <CheckCircle size={16} />
              Complete
            </button>
            <button
              onClick={handleFail}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              <XCircle size={16} />
              Fail
            </button>
          </>
        )}

        {status === 'paused' && (
          <>
            <button
              onClick={handleResume}
              disabled={!canExecute.allowed}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              title={!canExecute.allowed ? canExecute.reason : 'Resume task'}
            >
              <TrendingUp size={16} />
              Resume
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              <CheckCircle size={16} />
              Complete
            </button>
          </>
        )}

        {(status === 'completed' || status === 'failed') && (
          <button
            onClick={() => {
              setStatus('idle');
              setExecutionTime(0);
              onStatusChange?.('idle' as any);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {!canExecute.allowed && (
        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
          <p className="font-medium mb-1">{canExecute.reason}</p>
          {canExecute.exceededLimits && canExecute.exceededLimits.length > 0 && (
            <p>Exceeded: {canExecute.exceededLimits.join(', ')}</p>
          )}
        </div>
      )}
    </div>
  );
};
