'use client';

import { useEffect, useRef } from 'react';
import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';

interface AutoTestRunnerProps {
  tasks: Task[];
  agents: CodingAgent[];
  onRunTests: (agentId?: string) => void;
  enabled?: boolean;
}

/**
 * Component that automatically runs tests when tasks change or agents are assigned
 */
export const AutoTestRunner = ({ tasks, agents, onRunTests, enabled = true }: AutoTestRunnerProps) => {
  const previousTasksRef = useRef<Task[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;

    const previousTasks = previousTasksRef.current;

    // Check if tasks have changed
    if (previousTasks.length === 0 && tasks.length > 0) {
      // Initial load - don't run tests
      previousTasksRef.current = tasks;
      return;
    }

    if (previousTasks.length === tasks.length) {
      // Check if any task status changed
      const statusChanged = tasks.some((task, idx) => {
        const prevTask = previousTasks[idx];
        return prevTask && prevTask.status !== task.status;
      });

      // Check if any agent assignment changed
      const agentChanged = tasks.some((task, idx) => {
        const prevTask = previousTasks[idx];
        return prevTask && prevTask.assignedAgentId !== task.assignedAgentId;
      });

      if (statusChanged || agentChanged) {
        // Debounce test runs to avoid running too frequently
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          // Find the agent that was just assigned
          const changedTask = tasks.find((task, idx) => {
            const prevTask = previousTasks[idx];
            return prevTask && prevTask.assignedAgentId !== task.assignedAgentId;
          });

          const agentId = changedTask?.assignedAgentId;

          console.log('[AutoTestRunner] Running tests due to task/agent change', { agentId });
          onRunTests(agentId);
        }, 2000); // Wait 2 seconds before running tests
      }
    }

    previousTasksRef.current = tasks;

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [tasks, onRunTests, enabled]);

  // This component doesn't render anything
  return null;
};
