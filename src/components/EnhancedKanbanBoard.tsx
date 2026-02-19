'use client';

import { useState, useMemo } from 'react';
import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { TaskDependency, BreakdownInput, TaskBreakdown } from '@/types/breakdown';
import { KanbanBoard } from './KanbanBoard';
import { TaskBreakdownWizard } from './TaskBreakdownWizard';
import { DependencyGraph } from './DependencyGraph';
import { AgentRosterManager } from './AgentRosterManager';
import { taskBreakdownService } from '@/lib/taskBreakdown';
import { agentOrchestrationService } from '@/lib/agentOrchestration';
import { Sparkles, GitBranch, Users, Zap } from 'lucide-react';

interface EnhancedKanbanBoardProps {
  tasks: Task[];
  agents: CodingAgent[];
  onAddTask: (task: Task) => Promise<void>;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onUpdateAgent: (agent: CodingAgent) => void;
  onDeleteAgent: (id: string) => void;
  onAddAgent: (agent: Omit<CodingAgent, 'id' | 'createdAt'>) => void;
  userId: string;
}

export const EnhancedKanbanBoard = ({
  tasks,
  agents,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onUpdateAgent,
  onDeleteAgent,
  onAddAgent,
  userId,
}: EnhancedKanbanBoardProps) => {
  const [showBreakdownWizard, setShowBreakdownWizard] = useState(false);
  const [showDependencyGraph, setShowDependencyGraph] = useState(false);
  const [showAgentRoster, setShowAgentRoster] = useState(false);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [breakdowns, setBreakdowns] = useState<Map<string, TaskBreakdown>>(new Map());

  // Handle task breakdown
  const handleBreakdown = async (input: BreakdownInput) => {
    try {
      const result = await taskBreakdownService.breakdownTask(input, userId, tasks);

      // Create all tasks from the breakdown
      const allBreakdowns = [...result.epics, ...result.tickets, ...result.subtasks];

      for (const breakdown of allBreakdowns) {
        // Find the task by taskId (which is the id in breakdown)
        const taskData: Task = {
          id: breakdown.taskId,
          taskId: `TASK-${tasks.length + allBreakdowns.indexOf(breakdown) + 1}`,
          title: `[${breakdown.level.toUpperCase()}] Generated Task`,
          description: `Auto-generated from breakdown`,
          status: 'backlog',
          priority: 3,
          tags: [breakdown.level],
          commentsCount: 0,
          attachmentsCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        await onAddTask(taskData);

        // Store breakdown metadata
        setBreakdowns(prev => new Map(prev).set(breakdown.taskId, breakdown));
      }

      // Add dependencies
      setDependencies(prev => [...prev, ...result.dependencies]);

      // Auto-assign agents
      const assignments = agentOrchestrationService.assignTasksToAgents(
        tasks,
        breakdowns,
        agents
      );

      assignments.forEach((agentId, taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          onUpdateTask({ ...task, assignedAgentId: agentId });
        }
      });

      alert(`Successfully created ${allBreakdowns.length} tasks with ${result.dependencies.length} dependencies!`);
    } catch (error) {
      console.error('Breakdown failed:', error);
      alert('Failed to break down tasks. Please try again.');
    }
  };

  // Auto-assign tasks to agents
  const handleAutoAssign = () => {
    const unassignedTasks = tasks.filter(t => !t.assignedAgentId && t.status !== 'done');

    const assignments = agentOrchestrationService.assignTasksToAgents(
      unassignedTasks,
      breakdowns,
      agents
    );

    let assignedCount = 0;
    assignments.forEach((agentId, taskId) => {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        onUpdateTask({ ...task, assignedAgentId: agentId });
        assignedCount++;
      }
    });

    alert(`Auto-assigned ${assignedCount} tasks to agents!`);
  };

  // Rebalance workload
  const handleRebalance = () => {
    const reassignments = agentOrchestrationService.rebalanceWorkload(tasks, agents);

    let rebalancedCount = 0;
    reassignments.forEach((agentId, taskId) => {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        onUpdateTask({ ...task, assignedAgentId: agentId });
        rebalancedCount++;
      }
    });

    if (rebalancedCount > 0) {
      alert(`Rebalanced ${rebalancedCount} tasks across agents!`);
    } else {
      alert('Workload is already balanced!');
    }
  };

  // Calculate agent workload stats
  const agentWorkloadStats = useMemo(() => {
    return agents.map(agent => {
      const agentTasks = tasks.filter(t => t.assignedAgentId === agent.id && t.status !== 'done');
      const utilization = (agentTasks.length / agent.maxConcurrentTasks) * 100;

      return {
        agentId: agent.id,
        name: agent.name,
        taskCount: agentTasks.length,
        maxTasks: agent.maxConcurrentTasks,
        utilization: Math.min(100, utilization),
        isOverloaded: agentTasks.length > agent.maxConcurrentTasks,
        isUnderutilized: agentTasks.length < agent.maxConcurrentTasks * 0.5,
      };
    });
  }, [tasks, agents]);

  return (
    <div className="flex flex-col h-full">
      {/* Enhanced toolbar */}
      <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowBreakdownWizard(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              <Sparkles size={16} />
              Task Breakdown
            </button>

            <button
              onClick={() => setShowDependencyGraph(true)}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
              disabled={dependencies.length === 0}
            >
              <GitBranch size={16} />
              Dependencies ({dependencies.length})
            </button>

            <button
              onClick={() => setShowAgentRoster(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
            >
              <Users size={16} />
              Manage Agents
            </button>

            <button
              onClick={handleAutoAssign}
              className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:from-green-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
            >
              <Zap size={16} />
              Auto-Assign
            </button>

            <button
              onClick={handleRebalance}
              className="bg-gray-700 dark:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-500 transition-all"
            >
              Rebalance
            </button>
          </div>

          {/* Agent workload indicators */}
          {agentWorkloadStats.some(stat => stat.isOverloaded || stat.isUnderutilized) && (
            <div className="flex items-center gap-2 text-xs">
              {agentWorkloadStats.filter(stat => stat.isOverloaded).length > 0 && (
                <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-3 py-1 rounded-full">
                  ⚠️ {agentWorkloadStats.filter(stat => stat.isOverloaded).length} overloaded
                </div>
              )}
              {agentWorkloadStats.filter(stat => stat.isUnderutilized).length > 0 && (
                <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-3 py-1 rounded-full">
                  ℹ️ {agentWorkloadStats.filter(stat => stat.isUnderutilized).length} underutilized
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div>
            <span className="font-semibold">Total Tasks:</span> {tasks.length}
          </div>
          <div>
            <span className="font-semibold">Unassigned:</span>{' '}
            {tasks.filter(t => !t.assignedAgentId).length}
          </div>
          <div>
            <span className="font-semibold">In Progress:</span>{' '}
            {tasks.filter(t => t.status === 'in-progress').length}
          </div>
          <div>
            <span className="font-semibold">Done:</span>{' '}
            {tasks.filter(t => t.status === 'done').length}
          </div>
          <div>
            <span className="font-semibold">Active Agents:</span> {agents.length}
          </div>
        </div>
      </div>

      {/* Main Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          tasks={tasks}
          agents={agents}
          onAddTask={onAddTask}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
        />
      </div>

      {/* Modals */}
      {showBreakdownWizard && (
        <TaskBreakdownWizard
          onBreakdown={handleBreakdown}
          onClose={() => setShowBreakdownWizard(false)}
        />
      )}

      {showDependencyGraph && (
        <DependencyGraph
          tasks={tasks}
          dependencies={dependencies}
          onClose={() => setShowDependencyGraph(false)}
        />
      )}

      {showAgentRoster && (
        <AgentRosterManager
          agents={agents}
          onUpdateAgent={onUpdateAgent}
          onDeleteAgent={onDeleteAgent}
          onAddAgent={onAddAgent}
          onClose={() => setShowAgentRoster(false)}
        />
      )}
    </div>
  );
};
