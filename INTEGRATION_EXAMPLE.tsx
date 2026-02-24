/**
 * INTEGRATION EXAMPLE - Task Breakdown and Agent Orchestration
 *
 * This file demonstrates how to integrate the new task breakdown and
 * agent orchestration features into the existing KanbanBoard component.
 *
 * DO NOT USE THIS FILE DIRECTLY - it's a reference implementation.
 * Copy and adapt the relevant parts into your KanbanBoard.tsx
 */

import { useState } from 'react';
import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { TaskBreakdownResult, TaskDependency } from '@/types/epic';
import { TaskBreakdownModal } from '@/components/TaskBreakdownModal';
import { AgentRoster } from '@/components/AgentRoster';
import { DependencyGraph } from '@/components/DependencyGraph';
import { useTasks } from '@/hooks/useTasks';
import { useAgents } from '@/hooks/useAgents';
import { useEpics } from '@/hooks/useEpics';
import { useDependencies } from '@/hooks/useDependencies';
import { agentOrchestrationService } from '@/lib/agentOrchestration';
import { Sparkles, Users, GitBranch } from 'lucide-react';

export function IntegratedKanbanBoard() {
  // Existing hooks
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const { agents, updateAgent } = useAgents();

  // New hooks for task breakdown features
  const { epics, addEpic } = useEpics();
  const { dependencies, addDependency } = useDependencies();

  // UI state
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [showAgentRoster, setShowAgentRoster] = useState(false);
  const [showDependencyGraph, setShowDependencyGraph] = useState(false);

  /**
   * Handle task breakdown result
   * Creates epic, tasks, subtasks, and dependencies
   */
  const handleApplyBreakdown = async (result: TaskBreakdownResult) => {
    try {
      let epicId: string | undefined;

      // Create epic if provided
      if (result.epic) {
        const epic = {
          ...result.epic,
          id: crypto.randomUUID(),
          epicId: `EPIC-${Date.now()}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          taskIds: [],
        };
        await addEpic(epic);
        epicId = epic.id;
      }

      // Create tasks
      const createdTasks: Task[] = [];
      for (const taskData of result.tasks) {
        const task: Task = {
          id: crypto.randomUUID(),
          taskId: `TASK-${Date.now()}-${createdTasks.length}`,
          title: taskData.title,
          description: taskData.description,
          status: 'backlog',
          priority: taskData.priority,
          tags: taskData.tags,
          sprint: taskData.sprint,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        await addTask(task);
        createdTasks.push(task);

        // Note: Subtasks would be created here in a full implementation
        // They would need their own database table and hook (useSubtasks)
        // Example:
        // for (const subtaskData of taskData.subtasks) {
        //   await addSubtask({
        //     ...subtaskData,
        //     id: crypto.randomUUID(),
        //     parentTaskId: task.id,
        //     createdAt: Date.now(),
        //     updatedAt: Date.now(),
        //   });
        // }
      }

      // Create dependencies
      for (let i = 0; i < result.tasks.length; i++) {
        const taskData = result.tasks[i];
        if (taskData.dependencies) {
          for (const dep of taskData.dependencies) {
            const sourceTask = createdTasks[i];
            const targetTask = createdTasks[dep.targetTaskIndex];

            if (sourceTask && targetTask) {
              await addDependency({
                sourceTaskId: sourceTask.id,
                targetTaskId: targetTask.id,
                dependencyType: dep.dependencyType,
                description: dep.description,
              });
            }
          }
        }
      }

      // Auto-assign tasks if suggestions provided
      if (result.suggestedAgentAssignments) {
        for (const suggestion of result.suggestedAgentAssignments) {
          const task = createdTasks[suggestion.taskIndex];
          if (task && suggestion.agentId) {
            await updateTask({
              ...task,
              assignedAgentId: suggestion.agentId,
            });
          }
        }
      }

      alert(`Successfully created ${createdTasks.length} tasks!`);
    } catch (error) {
      console.error('Error applying breakdown:', error);
      alert('Failed to create tasks. Please try again.');
    }
  };

  /**
   * Auto-assign all unassigned tasks to agents
   */
  const handleAutoAssign = () => {
    const assignments = agentOrchestrationService.autoAssignTasks(tasks, agents);

    let assignedCount = 0;
    assignments.forEach((agentId, taskId) => {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        updateTask({ ...task, assignedAgentId: agentId });
        assignedCount++;
      }
    });

    alert(`Auto-assigned ${assignedCount} tasks to agents!`);
  };

  /**
   * Show agent assignment suggestions for a specific task
   */
  const showAssignmentSuggestions = (task: Task) => {
    const scores = agentOrchestrationService.calculateAgentScores(task, agents, tasks);

    console.log('Top agent suggestions for task:', task.title);
    scores.slice(0, 3).forEach((score, index) => {
      const agent = agents.find(a => a.id === score.agentId);
      console.log(`${index + 1}. ${agent?.name} (score: ${score.score.toFixed(2)})`);
      console.log('   Reasons:', score.reasons.join(', '));
    });
  };

  return (
    <div className="p-6">
      {/* Toolbar with new features */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kanban Board</h1>

        <div className="flex items-center gap-3">
          {/* Task Breakdown Button */}
          <button
            onClick={() => setShowBreakdownModal(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Break Down Task
          </button>

          {/* Agent Roster Button */}
          <button
            onClick={() => setShowAgentRoster(!showAgentRoster)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Users className="w-4 h-4" />
            Agent Roster
          </button>

          {/* Dependency Graph Button */}
          <button
            onClick={() => setShowDependencyGraph(!showDependencyGraph)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <GitBranch className="w-4 h-4" />
            Dependencies
          </button>
        </div>
      </div>

      {/* Agent Roster View */}
      {showAgentRoster && (
        <div className="mb-6">
          <AgentRoster
            agents={agents}
            tasks={tasks}
            onUpdateAgent={updateAgent}
            onAutoAssign={handleAutoAssign}
          />
        </div>
      )}

      {/* Dependency Graph View */}
      {showDependencyGraph && (
        <div className="mb-6">
          <DependencyGraph
            tasks={tasks}
            dependencies={dependencies}
            onTaskClick={(taskId) => {
              const task = tasks.find(t => t.id === taskId);
              if (task) {
                console.log('Clicked task:', task);
                // You could open a task detail modal here
              }
            }}
          />
        </div>
      )}

      {/* Existing Kanban columns would go here */}
      <div className="grid grid-cols-4 gap-4">
        {/* Your existing column components */}
      </div>

      {/* Task Breakdown Modal */}
      <TaskBreakdownModal
        isOpen={showBreakdownModal}
        onClose={() => setShowBreakdownModal(false)}
        onApply={handleApplyBreakdown}
      />
    </div>
  );
}

/**
 * Example: Adding task breakdown to task creation flow
 */
export function ExampleTaskCreationWithBreakdown() {
  const [description, setDescription] = useState('');
  const [useAI, setUseAI] = useState(false);

  const handleCreate = async () => {
    if (useAI) {
      // Use task breakdown service
      const { taskBreakdownService } = await import('@/lib/taskBreakdown');
      const breakdown = await taskBreakdownService.breakdownTask({
        type: 'issue',
        content: description,
      });

      console.log('AI Breakdown:', breakdown);
      // Show breakdown preview and let user confirm
    } else {
      // Create single task normally
      console.log('Creating normal task');
    }
  };

  return (
    <div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the task..."
        className="w-full h-32 p-2 border rounded"
      />

      <label className="flex items-center gap-2 mt-2">
        <input
          type="checkbox"
          checked={useAI}
          onChange={(e) => setUseAI(e.target.checked)}
        />
        <span>Use AI to break down into subtasks</span>
      </label>

      <button
        onClick={handleCreate}
        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Create Task
      </button>
    </div>
  );
}

/**
 * Example: Update agent performance after task completion
 */
export function ExamplePerformanceUpdate() {
  const { agents, updateAgent } = useAgents();

  const handleTaskComplete = async (task: Task, agent: CodingAgent) => {
    // Calculate completion time
    const completionTime = (Date.now() - task.createdAt) / (1000 * 60 * 60); // hours
    const success = true; // You might determine this based on review status

    // Update performance
    const updatedPerformance = agentOrchestrationService.updateAgentPerformance(
      agent,
      task,
      completionTime,
      success
    );

    // Save to database
    await updateAgent({
      ...agent,
      performance: updatedPerformance,
    });

    console.log('Updated agent performance:', updatedPerformance);
  };

  return null; // This would be integrated into your task completion flow
}

/**
 * Example: Show dependency warnings when moving tasks
 */
export function ExampleDependencyValidation() {
  const { dependencies } = useDependencies();

  const canMoveTask = (task: Task, newStatus: Task['status']) => {
    // Check if task has blocking dependencies
    const blockingDeps = dependencies.filter(
      dep => dep.sourceTaskId === task.id && dep.dependencyType === 'blocks'
    );

    if (blockingDeps.length > 0 && newStatus === 'done') {
      // Check if all blocking tasks are done
      const allBlockingTasksDone = blockingDeps.every(dep => {
        // You would need to look up the actual task status
        return true; // Placeholder
      });

      if (!allBlockingTasksDone) {
        alert('Cannot complete this task - it has incomplete blocking dependencies');
        return false;
      }
    }

    return true;
  };

  return null; // This would be integrated into your drag-and-drop logic
}
