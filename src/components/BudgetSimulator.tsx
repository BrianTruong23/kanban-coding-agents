'use client';

import { useState } from 'react';
import { Budget } from '@/types/budget';
import { Task } from '@/types/task';
import { Play, RefreshCw } from 'lucide-react';

interface BudgetSimulatorProps {
  budget: Budget;
  task: Task;
  onAddUsage: (entry: {
    budgetId: string;
    taskId: string;
    costIncurred: number;
    tokensUsed: number;
    timeSpent: number;
    agentId?: string;
    operation: string;
    success: boolean;
    errorMessage?: string;
  }) => Promise<void>;
}

export const BudgetSimulator = ({ budget, task, onAddUsage }: BudgetSimulatorProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [costInput, setCostInput] = useState('0.05');
  const [tokensInput, setTokensInput] = useState('500');
  const [timeInput, setTimeInput] = useState('1');
  const [operation, setOperation] = useState('Simulate agent execution');
  const [success, setSuccess] = useState(true);

  const handleSimulate = async () => {
    if (isRunning) return;

    setIsRunning(true);
    try {
      await onAddUsage({
        budgetId: budget.id,
        taskId: task.id,
        costIncurred: parseFloat(costInput),
        tokensUsed: parseInt(tokensInput, 10),
        timeSpent: parseInt(timeInput, 10),
        agentId: task.assignedAgentId,
        operation,
        success,
      });

      // Reset to default values after successful submission
      setTimeout(() => {
        setIsRunning(false);
      }, 500);
    } catch (error) {
      console.error('Error simulating usage:', error);
      setIsRunning(false);
    }
  };

  return (
    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1">
          <Play size={14} />
          Simulate Agent Execution
        </h4>
        <span className="text-xs text-gray-500 dark:text-gray-400">Testing Tool</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2">
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Cost ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={costInput}
            onChange={(e) => setCostInput(e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Tokens</label>
          <input
            type="number"
            min="0"
            value={tokensInput}
            onChange={(e) => setTokensInput(e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Time (m)</label>
          <input
            type="number"
            min="0"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mb-2">
        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Operation</label>
        <input
          type="text"
          value={operation}
          onChange={(e) => setOperation(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="What operation was performed?"
        />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={success}
            onChange={(e) => setSuccess(e.target.checked)}
            className="rounded"
          />
          Success
        </label>
      </div>

      <button
        onClick={handleSimulate}
        disabled={isRunning}
        className="w-full px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800 text-white rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors"
      >
        {isRunning ? (
          <>
            <RefreshCw size={12} className="animate-spin" />
            Simulating...
          </>
        ) : (
          <>
            <Play size={12} />
            Run Simulation
          </>
        )}
      </button>

      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
        This simulates agent task execution and updates the budget accordingly.
      </p>
    </div>
  );
};
