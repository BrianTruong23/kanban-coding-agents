'use client';

/**
 * Example component demonstrating how to integrate budget tracking
 * with agent task operations.
 *
 * This shows best practices for:
 * - Checking budgets before execution
 * - Recording usage after operations
 * - Handling budget exceeded scenarios
 * - Retry logic with budget tracking
 */

import { useState } from 'react';
import { useBudgets } from '@/hooks/useBudgets';
import { Budget } from '@/types/budget';
import { canExecuteTask, canAffordUsage } from '@/lib/budgetEnforcement';

interface TaskOperation {
  taskId: string;
  operation: string;
  estimatedCost?: number;
  estimatedTokens?: number;
  estimatedTime?: number;
}

export const BudgetTrackingExample = () => {
  const { budgets, addUsage } = useBudgets();
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<string>('');

  /**
   * Example: Execute an agent task with budget tracking
   */
  const executeTaskWithBudgetTracking = async (operation: TaskOperation) => {
    setExecuting(true);
    setResult('');

    try {
      // Step 1: Find the budget for this task
      const budget = budgets.find((b) => b.taskId === operation.taskId);

      if (!budget) {
        setResult('⚠️ No budget found for this task. Creating tasks without budgets allows unlimited resource usage.');
        setExecuting(false);
        return;
      }

      // Step 2: Check if task can execute (not paused or exceeded)
      const executionCheck = canExecuteTask(budget);
      if (!executionCheck.allowed) {
        setResult(`❌ Cannot execute task: ${executionCheck.reason}`);
        setExecuting(false);
        return;
      }

      // Step 3: Check if proposed usage fits within budget
      if (operation.estimatedCost || operation.estimatedTokens || operation.estimatedTime) {
        const affordability = canAffordUsage(budget, {
          cost: operation.estimatedCost,
          tokens: operation.estimatedTokens,
          time: operation.estimatedTime,
        });

        if (!affordability.canAfford) {
          setResult(`❌ Insufficient budget: ${affordability.reason}`);
          setExecuting(false);
          return;
        }
      }

      // Step 4: Execute the actual operation
      setResult('⏳ Executing task...');
      const startTime = Date.now();

      // Simulate agent operation (replace with actual agent API call)
      const operationResult = await simulateAgentOperation(operation);

      const endTime = Date.now();
      const elapsedMinutes = Math.ceil((endTime - startTime) / 1000 / 60);

      // Step 5: Record actual usage
      await addUsage({
        budgetId: budget.id,
        taskId: operation.taskId,
        cost: operationResult.actualCost,
        tokens: operationResult.actualTokens,
        time: elapsedMinutes,
        operation: operation.operation,
        agentId: operationResult.agentId,
        metadata: {
          model: operationResult.model,
          success: operationResult.success,
          retryCount: operationResult.retryCount || 0,
        },
      });

      setResult(`✅ Task completed successfully!
Cost: $${operationResult.actualCost.toFixed(2)}
Tokens: ${operationResult.actualTokens.toLocaleString()}
Time: ${elapsedMinutes} min`);

    } catch (error) {
      setResult(`❌ Error executing task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExecuting(false);
    }
  };

  /**
   * Example: Execute task with retry logic and budget tracking
   */
  const executeWithRetries = async (operation: TaskOperation, maxRetries = 3) => {
    const budget = budgets.find((b) => b.taskId === operation.taskId);
    if (!budget) {
      setResult('❌ No budget found for this task');
      return;
    }

    let retryCount = 0;

    while (retryCount <= maxRetries) {
      // Check if we've exceeded retry budget
      if (budget.maxRetries && budget.currentRetries >= budget.maxRetries) {
        setResult(`❌ Maximum retries (${budget.maxRetries}) reached`);
        break;
      }

      try {
        // Check budget before each retry
        const executionCheck = canExecuteTask(budget);
        if (!executionCheck.allowed) {
          setResult(`❌ Cannot retry: ${executionCheck.reason}`);
          break;
        }

        setResult(`⏳ Attempt ${retryCount + 1} of ${maxRetries + 1}...`);

        // Execute operation
        const result = await simulateAgentOperation(operation);

        if (result.success) {
          // Record successful usage
          await addUsage({
            budgetId: budget.id,
            taskId: operation.taskId,
            cost: result.actualCost,
            tokens: result.actualTokens,
            time: 1,
            operation: `${operation.operation} (attempt ${retryCount + 1})`,
            metadata: { retryCount, success: true },
          });

          setResult(`✅ Succeeded on attempt ${retryCount + 1}`);
          break;
        } else {
          // Record failed usage (still consumes resources)
          await addUsage({
            budgetId: budget.id,
            taskId: operation.taskId,
            cost: result.actualCost,
            tokens: result.actualTokens,
            time: 1,
            operation: `${operation.operation} (failed attempt ${retryCount + 1})`,
            metadata: { retryCount, success: false },
          });

          retryCount++;

          if (retryCount > maxRetries) {
            setResult(`❌ Failed after ${retryCount} attempts`);
          }
        }
      } catch (error) {
        setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        break;
      }
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        Budget Tracking Example
      </h3>

      <div className="space-y-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>This component demonstrates how to:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Check budgets before executing tasks</li>
            <li>Record usage after operations complete</li>
            <li>Handle budget exceeded scenarios</li>
            <li>Implement retry logic with budget tracking</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => executeTaskWithBudgetTracking({
              taskId: 'example-task-id',
              operation: 'Generate authentication module',
              estimatedCost: 2.50,
              estimatedTokens: 5000,
              estimatedTime: 10,
            })}
            disabled={executing}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Execute Task
          </button>

          <button
            onClick={() => executeWithRetries({
              taskId: 'example-task-id',
              operation: 'Deploy to production',
              estimatedCost: 1.00,
              estimatedTokens: 2000,
              estimatedTime: 5,
            })}
            disabled={executing}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Execute with Retries
          </button>
        </div>

        {result && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
            <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Simulates an agent operation
 * Replace this with actual agent API calls
 */
async function simulateAgentOperation(operation: TaskOperation) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Simulate random success/failure
  const success = Math.random() > 0.3;

  return {
    success,
    actualCost: (operation.estimatedCost || 2.50) + (Math.random() - 0.5),
    actualTokens: Math.floor((operation.estimatedTokens || 5000) + (Math.random() - 0.5) * 1000),
    agentId: 'example-agent-id',
    model: 'gpt-4',
    retryCount: 0,
  };
}
