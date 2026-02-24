'use client';

import { useState } from 'react';
import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { Sparkles, GitBranch, Users, LayoutGrid } from 'lucide-react';
import { KanbanBoard } from './KanbanBoard';
import { TaskBreakdownWizard } from './TaskBreakdownWizard';
import { TaskDependencyGraph } from './TaskDependencyGraph';
import { AgentRoster } from './AgentRoster';
import { TaskBreakdownResult, EnhancedTask, TaskDependency, EnhancedAgent } from '@/types/breakdown';

interface EnhancedKanbanViewProps {
  tasks: Task[];
  agents: CodingAgent[];
  onAddTask: (task: Task) => Promise<void>;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

type ViewMode = 'board' | 'dependencies' | 'agents';

export const EnhancedKanbanView = ({
  tasks,
  agents,
  onAddTask,
  onUpdateTask,
  onDeleteTask
}: EnhancedKanbanViewProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [showBreakdownWizard, setShowBreakdownWizard] = useState(false);

  // Mock data for dependencies - in a real app, this would come from the database
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);

  // Convert tasks to enhanced tasks for visualization
  const enhancedTasks: EnhancedTask[] = tasks.map(task => ({
    ...task,
    type: 'task',
    definitionOfDone: [],
    testNotes: [],
    riskFlags: []
  }));

  // Convert agents to enhanced agents
  const enhancedAgents: EnhancedAgent[] = agents.map(agent => ({
    ...agent,
    skills: [],
    performance: {
      id: crypto.randomUUID(),
      agentId: agent.id,
      tasksCompleted: 0,
      tasksOnTime: 0,
      tasksLate: 0,
      averageCompletionTime: 0,
      qualityScore: 100,
      lastUpdated: Date.now()
    },
    availability: 'available' as const,
    currentWorkload: tasks.filter(t => t.assignedAgentId === agent.id).length
  }));

  const handleBreakdownComplete = async (result: TaskBreakdownResult) => {
    try {
      // Create the epic if it exists
      if (result.epic.title) {
        const epicTask: Task = {
          id: result.epic.id!,
          taskId: result.epic.taskId!,
          title: result.epic.title,
          description: result.epic.description || '',
          status: 'backlog',
          priority: result.epic.priority || 3,
          tags: result.epic.tags || [],
          sprint: result.epic.sprint,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        await onAddTask(epicTask);
      }

      // Create all tasks
      for (const task of result.tasks) {
        const newTask: Task = {
          id: task.id!,
          taskId: task.taskId!,
          title: task.title!,
          description: task.description || '',
          status: 'backlog',
          priority: task.priority || 3,
          tags: task.tags || [],
          sprint: task.sprint,
          assignedAgentId: task.assignedAgentId,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        await onAddTask(newTask);
      }

      // Create all subtasks
      for (const subtask of result.subtasks) {
        const newSubtask: Task = {
          id: subtask.id!,
          taskId: subtask.taskId!,
          title: subtask.title!,
          description: subtask.description || '',
          status: 'backlog',
          priority: subtask.priority || 3,
          tags: subtask.tags || [],
          sprint: subtask.sprint,
          assignedAgentId: subtask.assignedAgentId,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        await onAddTask(newSubtask);
      }

      // Store dependencies (would be saved to database in real app)
      const newDependencies: TaskDependency[] = result.dependencies.map(dep => ({
        id: crypto.randomUUID(),
        dependentTaskId: dep.dependentTaskId,
        dependsOnTaskId: dep.dependsOnTaskId,
        type: dep.type,
        createdAt: Date.now()
      }));
      setDependencies([...dependencies, ...newDependencies]);

      setShowBreakdownWizard(false);
    } catch (error) {
      console.error('Error creating tasks from breakdown:', error);
      alert('Failed to create tasks. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-3">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('board')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              viewMode === 'board'
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid size={16} />
            Board
          </button>
          <button
            onClick={() => setViewMode('dependencies')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              viewMode === 'dependencies'
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <GitBranch size={16} />
            Dependencies
          </button>
          <button
            onClick={() => setViewMode('agents')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              viewMode === 'agents'
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Users size={16} />
            Agents
          </button>
        </div>

        {/* AI Breakdown Button */}
        <button
          onClick={() => setShowBreakdownWizard(true)}
          className="ml-auto px-4 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
        >
          <Sparkles size={16} />
          AI Task Breakdown
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'board' && (
          <KanbanBoard
            tasks={tasks}
            agents={agents}
            onAddTask={onAddTask}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
          />
        )}

        {viewMode === 'dependencies' && (
          <TaskDependencyGraph
            tasks={enhancedTasks}
            dependencies={dependencies}
            onTaskClick={(task) => {
              // Switch to board view and highlight task
              setViewMode('board');
            }}
          />
        )}

        {viewMode === 'agents' && (
          <AgentRoster
            agents={enhancedAgents}
            onUpdateAgent={(agent) => {
              // Handle agent update
              console.log('Update agent:', agent);
            }}
            onAddSkill={(agentId, skill) => {
              // Handle add skill
              console.log('Add skill:', agentId, skill);
            }}
            onRemoveSkill={(agentId, skillId) => {
              // Handle remove skill
              console.log('Remove skill:', agentId, skillId);
            }}
          />
        )}
      </div>

      {/* Task Breakdown Wizard */}
      {showBreakdownWizard && (
        <TaskBreakdownWizard
          existingTaskCount={tasks.length}
          onBreakdownComplete={handleBreakdownComplete}
          onCancel={() => setShowBreakdownWizard(false)}
        />
      )}
    </div>
  );
};
