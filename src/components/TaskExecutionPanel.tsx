'use client';

import { useState, useCallback } from 'react';
import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { useExecutionTraces } from '@/hooks/useExecutionTraces';
import { ExecutionTrace, ToolType } from '@/types/execution-trace';
import { Play, Square, History, Terminal, FileEdit, TestTube } from 'lucide-react';

interface TaskExecutionPanelProps {
  task: Task;
  agent?: CodingAgent;
}

export const TaskExecutionPanel: React.FC<TaskExecutionPanelProps> = ({
  task,
  agent,
}) => {
  const {
    createTrace,
    updateTrace,
    getTracesForTask,
    addPromptToTrace,
    addToolCallToTrace,
    addFileDiffToTrace,
    addTestLogToTrace,
    addCheckpointToTrace,
    updateTraceStatus,
  } = useExecutionTraces();

  const [currentTrace, setCurrentTrace] = useState<ExecutionTrace | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);

  const taskTraces = getTracesForTask(task.id);

  const startExecution = useCallback(async () => {
    if (!agent) {
      alert('Please assign an agent to this task first');
      return;
    }

    try {
      setIsExecuting(true);
      setExecutionLog([]);

      // Create a new execution trace
      const trace = await createTrace(task.id, agent.id, {
        environment: 'development',
        tags: task.tags,
        notes: `Execution for task: ${task.title}`,
      });

      setCurrentTrace(trace);
      addLog('Execution started');

      // Update trace status to running
      const runningTrace = updateTraceStatus(trace, 'running');
      await updateTrace(runningTrace);
      setCurrentTrace(runningTrace);

      // Simulate agent execution (in a real implementation, this would trigger actual agent logic)
      await simulateExecution(runningTrace);
    } catch (error) {
      addLog('Error: ' + (error as Error).message);
      setIsExecuting(false);
    }
  }, [task, agent, createTrace, updateTrace]);

  const stopExecution = useCallback(async () => {
    if (currentTrace) {
      const stoppedTrace = updateTraceStatus(currentTrace, 'cancelled');
      await updateTrace(stoppedTrace);
      setCurrentTrace(stoppedTrace);
      addLog('Execution stopped');
    }
    setIsExecuting(false);
  }, [currentTrace, updateTrace]);

  const addLog = (message: string) => {
    setExecutionLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Simulated execution for demonstration
  const simulateExecution = async (trace: ExecutionTrace) => {
    try {
      // Add initial prompt
      addLog('Recording initial prompt...');
      let updatedTrace = addPromptToTrace(
        trace,
        'user',
        `Please complete the following task: ${task.title}\n\nDescription: ${task.description}`,
        150
      );
      await updateTrace(updatedTrace);

      // Simulate checkpoint
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addLog('Creating checkpoint: Initial State');
      updatedTrace = addCheckpointToTrace(updatedTrace, {
        label: 'Initial State',
        description: 'Starting state before any changes',
        state: {
          workingDirectory: '/project',
        },
      });
      await updateTrace(updatedTrace);

      // Simulate tool calls
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addLog('Executing bash command...');
      updatedTrace = addToolCallToTrace(updatedTrace, {
        type: 'bash' as ToolType,
        command: 'npm test',
        input: 'Running tests to check current state',
        output: 'All tests passed',
        duration: 2500,
        exitCode: 0,
      });
      await updateTrace(updatedTrace);

      // Simulate file changes
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addLog('Recording file changes...');
      updatedTrace = addFileDiffToTrace(updatedTrace, {
        filePath: '/src/components/Example.tsx',
        changeType: 'modify',
        newContent: '// Updated component code',
        diff: '@@ -1,3 +1,3 @@\n-const old = true;\n+const new = true;',
      });
      await updateTrace(updatedTrace);

      // Simulate test execution
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addLog('Running tests...');
      updatedTrace = addTestLogToTrace(updatedTrace, {
        testName: 'Example Component Test',
        status: 'passed',
        duration: 1200,
        output: 'Test completed successfully',
      });
      await updateTrace(updatedTrace);

      // Final checkpoint
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addLog('Creating checkpoint: Completed');
      updatedTrace = addCheckpointToTrace(updatedTrace, {
        label: 'Completed',
        description: 'All changes applied and tests passing',
        state: {
          workingDirectory: '/project',
        },
      });
      await updateTrace(updatedTrace);

      // Mark as success
      const finalTrace = updateTraceStatus(updatedTrace, 'success');
      await updateTrace(finalTrace);
      setCurrentTrace(finalTrace);
      addLog('Execution completed successfully!');
      setIsExecuting(false);
    } catch (error) {
      addLog('Execution failed: ' + (error as Error).message);
      if (currentTrace) {
        const failedTrace = updateTraceStatus(currentTrace, 'failed');
        await updateTrace(failedTrace);
        setCurrentTrace(failedTrace);
      }
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Execution Controls */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Task Execution</h3>
          <div className="flex gap-2">
            {!isExecuting ? (
              <button
                onClick={startExecution}
                disabled={!agent}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                Start Execution
              </button>
            ) : (
              <button
                onClick={stopExecution}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            )}
          </div>
        </div>

        {!agent && (
          <p className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
            Please assign an agent to this task to enable execution.
          </p>
        )}

        {/* Execution Log */}
        {executionLog.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Execution Log
            </h4>
            <div className="bg-gray-900 dark:bg-gray-950 text-green-400 p-3 rounded-lg font-mono text-xs max-h-64 overflow-y-auto">
              {executionLog.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))}
            </div>
          </div>
        )}

        {/* Current Trace Summary */}
        {currentTrace && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Current Trace</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Status</p>
                <p className="font-semibold capitalize">{currentTrace.status}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Tool Calls</p>
                <p className="font-semibold">{currentTrace.metrics.toolCallCount}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">File Changes</p>
                <p className="font-semibold">{currentTrace.metrics.fileChangesCount}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Checkpoints</p>
                <p className="font-semibold">{currentTrace.checkpoints.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Execution History */}
      {taskTraces.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <History className="w-5 h-5" />
            Execution History ({taskTraces.length})
          </h3>
          <div className="space-y-2">
            {taskTraces.slice(0, 5).map((trace) => (
              <div
                key={trace.id}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          trace.status === 'success'
                            ? 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : trace.status === 'failed'
                            ? 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {trace.status}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(trace.startTime).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <Terminal className="w-3 h-3" />
                        {trace.metrics.toolCallCount} calls
                      </span>
                      <span className="flex items-center gap-1">
                        <FileEdit className="w-3 h-3" />
                        {trace.metrics.fileChangesCount} changes
                      </span>
                      <span className="flex items-center gap-1">
                        <TestTube className="w-3 h-3" />
                        {trace.metrics.testsPassed}/{trace.metrics.testsPassed + trace.metrics.testsFailed} tests
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {taskTraces.length > 5 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 text-center">
              + {taskTraces.length - 5} more traces
            </p>
          )}
        </div>
      )}
    </div>
  );
};
