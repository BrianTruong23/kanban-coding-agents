'use client';

import { useState } from 'react';
import { Task, TaskBreakdown, TaskDependency } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { KanbanBoard } from './KanbanBoard';
import { TaskBreakdownModal } from './TaskBreakdownModal';
import { DependencyGraph } from './DependencyGraph';
import { Sparkles, Network, ChevronDown } from 'lucide-react';

interface EnhancedKanbanBoardProps {
  tasks: Task[];
  agents: CodingAgent[];
  dependencies: TaskDependency[];
  onAddTask: (task: Task) => Promise<void>;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onAddDependency?: (dep: TaskDependency) => void;
}

type ViewMode = 'board' | 'dependencies';

export const EnhancedKanbanBoard = ({
  tasks,
  agents,
  dependencies,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddDependency
}: EnhancedKanbanBoardProps) => {
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('board');

  const handleApplyBreakdown = async (breakdown: TaskBreakdown) => {
    // Add all tasks from the breakdown
    const allTasks = [
      ...(breakdown.epic ? [breakdown.epic] : []),
      ...breakdown.stories,
      ...breakdown.tasks,
      ...breakdown.subtasks
    ];

    try {
      // Add tasks sequentially to maintain order
      for (const task of allTasks) {
        await onAddTask(task);
      }

      // Add dependencies if handler provided
      if (onAddDependency) {
        breakdown.dependencies.forEach(dep => {
          onAddDependency(dep);
        });
      }

      // Show success message (could be a toast notification)
      console.log(`✓ Successfully added ${allTasks.length} tasks and ${breakdown.dependencies.length} dependencies`);
    } catch (error) {
      console.error('Failed to apply breakdown:', error);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Enhanced Toolbar */}
      <div className="mb-4 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Coding Agents Kanban
          </h2>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                viewMode === 'board'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setViewMode('dependencies')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'dependencies'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Network size={14} />
              Dependencies
              {dependencies.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white rounded-full text-xs">
                  {dependencies.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* AI Task Breakdown Button */}
        <button
          onClick={() => setIsBreakdownModalOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
        >
          <Sparkles size={16} />
          AI Task Breakdown
        </button>
      </div>

      {/* Task Statistics */}
      {tasks.length > 0 && (
        <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Total Tasks"
            value={tasks.length}
            subtext={`${tasks.filter(t => t.status === 'done').length} completed`}
          />
          <StatCard
            label="Epics & Stories"
            value={tasks.filter(t => t.taskType === 'epic' || t.taskType === 'story').length}
            subtext={`${tasks.filter(t => t.taskType === 'subtask').length} subtasks`}
          />
          <StatCard
            label="High Priority"
            value={tasks.filter(t => t.priority >= 4).length}
            subtext={`${tasks.filter(t => t.riskLevel === 'high' || t.riskLevel === 'critical').length} high risk`}
            alert={tasks.filter(t => t.riskLevel === 'critical').length > 0}
          />
          <StatCard
            label="Est. Hours"
            value={tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)}
            subtext={`${tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0)} actual`}
            suffix="h"
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'board' ? (
          <KanbanBoard
            tasks={tasks}
            agents={agents}
            onAddTask={onAddTask}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
          />
        ) : (
          <DependencyGraph
            tasks={tasks}
            dependencies={dependencies}
            onTaskClick={(taskId) => {
              // Could implement task detail modal here
              console.log('Task clicked:', taskId);
            }}
          />
        )}
      </div>

      {/* Task Breakdown Modal */}
      <TaskBreakdownModal
        isOpen={isBreakdownModalOpen}
        onClose={() => setIsBreakdownModalOpen(false)}
        onApplyBreakdown={handleApplyBreakdown}
        existingTaskCount={tasks.length}
      />
    </div>
  );
};

const StatCard = ({
  label,
  value,
  subtext,
  suffix = '',
  alert = false
}: {
  label: string;
  value: number;
  subtext?: string;
  suffix?: string;
  alert?: boolean;
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-3 border ${
      alert
        ? 'border-red-300 dark:border-red-800'
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${
        alert
          ? 'text-red-600 dark:text-red-400'
          : 'text-gray-900 dark:text-white'
      }`}>
        {value}{suffix}
      </div>
      {subtext && (
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtext}</div>
      )}
    </div>
  );
};
