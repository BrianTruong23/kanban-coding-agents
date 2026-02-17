/**
 * INTEGRATION EXAMPLE
 *
 * This file demonstrates how to integrate the task breakdown and agent orchestration
 * features into your existing application. This is NOT a working component file,
 * but rather a reference example showing the integration patterns.
 *
 * To use these features in your app:
 * 1. Import the components you need
 * 2. Add state management for the new features
 * 3. Wire up the callbacks
 * 4. Integrate with your existing kanban board
 */

'use client';

import { useState } from 'react';
import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { TaskBreakdown } from '@/types/breakdown';
import { TaskDependency } from '@/types/dependency';
import { Subtask } from '@/types/subtask';

// Import the new components
import { TaskBreakdownWizard } from '@/components/TaskBreakdownWizard';
import { AgentRoster } from '@/components/AgentRoster';
import { DependencyGraph } from '@/components/DependencyGraph';
import { TaskDetails } from '@/components/TaskDetails';

// Import existing components
import { KanbanBoard } from '@/components/KanbanBoard';

// Import hooks
import { useTasks } from '@/hooks/useTasks';
import { useAgents } from '@/hooks/useAgents';
import { useSubtasks } from '@/hooks/useSubtasks';
import { useDependencies } from '@/hooks/useDependencies';
import { useTaskMetadata } from '@/hooks/useTaskMetadata';
import { useAuth } from '@/contexts/AuthContext';

export default function IntegratedKanbanPage() {
  const { user } = useAuth();
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const { agents, updateAgent } = useAgents();
  const { dependencies, addDependency, deleteDependency } = useDependencies();

  // UI state
  const [showBreakdownWizard, setShowBreakdownWizard] = useState(false);
  const [showAgentRoster, setShowAgentRoster] = useState(false);
  const [showDependencyGraph, setShowDependencyGraph] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Get subtasks and metadata for selected task
  const { subtasks, updateSubtask } = useSubtasks(selectedTaskId || undefined);
  const { metadata } = useTaskMetadata(selectedTaskId || undefined);

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  /**
   * Handle task breakdown completion
   * This is called when the user finishes the breakdown wizard
   */
  const handleBreakdownComplete = async (breakdown: TaskBreakdown) => {
    try {
      // 1. Create all tasks
      for (const task of breakdown.tasks) {
        await addTask(task);
      }

      // 2. Create subtasks (would need to import useSubtasks without taskId)
      // For each task, create its subtasks
      const taskSubtasks = new Map<string, Subtask[]>();
      breakdown.subtasks.forEach(subtask => {
        const existing = taskSubtasks.get(subtask.parentTaskId) || [];
        taskSubtasks.set(subtask.parentTaskId, [...existing, subtask]);
      });

      // Note: In a real implementation, you'd need a way to add subtasks
      // without pre-selecting a task, or batch create them via API

      // 3. Create dependencies
      for (const dep of breakdown.dependencies) {
        await addDependency(dep);
      }

      // 4. Add metadata (DoD, test notes, risk flags)
      // Note: Similar to subtasks, you'd need batch creation
      // or call the API directly

      // 5. Close the wizard
      setShowBreakdownWizard(false);

      // 6. Optional: Auto-assign tasks
      // (You could prompt the user or do it automatically)
    } catch (error) {
      console.error('Error creating breakdown:', error);
      alert('Failed to create tasks. Please try again.');
    }
  };

  /**
   * Handle auto-assignment from Agent Roster
   */
  const handleAutoAssign = async (assignments: Map<string, string>) => {
    try {
      for (const [taskId, agentId] of assignments) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          await updateTask({
            ...task,
            assignedAgentId: agentId,
          });
        }
      }
      alert(`Successfully assigned ${assignments.size} tasks!`);
    } catch (error) {
      console.error('Error auto-assigning tasks:', error);
      alert('Failed to assign tasks. Please try again.');
    }
  };

  /**
   * Handle subtask toggle
   */
  const handleSubtaskToggle = async (subtaskId: string, completed: boolean) => {
    const subtask = subtasks.find(s => s.id === subtaskId);
    if (subtask) {
      await updateSubtask({
        ...subtask,
        completed,
      });
    }
  };

  if (!user) {
    return <div>Please log in</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      {/* Header with Action Buttons */}
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Project Management
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBreakdownWizard(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Breakdown Task
          </button>
          <button
            onClick={() => setShowAgentRoster(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Agent Roster
          </button>
          <button
            onClick={() => setShowDependencyGraph(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Dependencies
          </button>
        </div>
      </div>

      {/* Main Kanban Board */}
      <KanbanBoard
        tasks={tasks}
        agents={agents}
        onAddTask={addTask}
        onUpdateTask={updateTask}
        onDeleteTask={deleteTask}
      />

      {/* Task Breakdown Wizard Modal */}
      {showBreakdownWizard && (
        <TaskBreakdownWizard
          userId={user.id}
          onComplete={handleBreakdownComplete}
          onCancel={() => setShowBreakdownWizard(false)}
        />
      )}

      {/* Agent Roster Modal/Sidebar */}
      {showAgentRoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Agent Management
              </h2>
              <button
                onClick={() => setShowAgentRoster(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <AgentRoster
                agents={agents}
                tasks={tasks}
                onAgentUpdate={updateAgent}
                onAutoAssign={handleAutoAssign}
              />
            </div>
          </div>
        </div>
      )}

      {/* Dependency Graph Modal */}
      {showDependencyGraph && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Task Dependencies
              </h2>
              <button
                onClick={() => setShowDependencyGraph(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <DependencyGraph
                tasks={tasks}
                dependencies={dependencies}
                onTaskClick={(taskId) => {
                  setSelectedTaskId(taskId);
                  setShowDependencyGraph(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetails
          task={selectedTask}
          subtasks={subtasks}
          definitionOfDone={metadata?.definitionOfDone}
          testNotes={metadata?.testNotes}
          riskFlags={metadata?.riskFlags}
          onClose={() => setSelectedTaskId(null)}
          onSubtaskToggle={handleSubtaskToggle}
        />
      )}
    </div>
  );
}

/**
 * INTEGRATION NOTES:
 *
 * 1. The KanbanBoard component can be enhanced to show:
 *    - Risk flag indicators on task cards
 *    - Subtask progress bars
 *    - Dependency indicators (blocked/blocking badges)
 *    - Agent skill badges
 *
 * 2. You can add these features incrementally:
 *    - Start with just the breakdown wizard
 *    - Add agent roster for better assignment
 *    - Add dependency graph for complex projects
 *    - Add task details for comprehensive task view
 *
 * 3. Consider adding these to your navigation:
 *    - "Breakdown" button in the main toolbar
 *    - "Agents" tab in a sidebar
 *    - "Dependencies" view as a separate page
 *
 * 4. Performance considerations:
 *    - Lazy load subtasks only when needed
 *    - Cache dependency queries
 *    - Debounce auto-assignment calculations
 *    - Use optimistic updates for better UX
 *
 * 5. Future enhancements:
 *    - Add drag-and-drop for dependencies
 *    - Implement epic swimlanes
 *    - Add sprint planning view
 *    - Create performance dashboards
 */
