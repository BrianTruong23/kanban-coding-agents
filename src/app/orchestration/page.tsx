'use client';

import { useState } from 'react';
import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { useTasks } from '@/hooks/useTasks';
import { useAgents } from '@/hooks/useAgents';
import { TaskBreakdownModal } from '@/components/TaskBreakdownModal';
import { TaskHierarchyView } from '@/components/TaskHierarchyView';
import { DependencyGraph } from '@/components/DependencyGraph';
import { AgentRosterManager } from '@/components/AgentRosterManager';
import { Wand2, Layers, Network, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type ViewMode = 'breakdown' | 'hierarchy' | 'dependencies' | 'roster';

export default function OrchestrationPage() {
  const { tasks, addTask, updateTask, deleteTask, loading: tasksLoading } = useTasks();
  const { agents, updateAgent, loading: agentsLoading } = useAgents();

  const [viewMode, setViewMode] = useState<ViewMode>('hierarchy');
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);

  const handleBreakdownComplete = async (newTasks: Task[]) => {
    // Add all tasks to the database
    for (const task of newTasks) {
      await addTask(task);
    }
  };

  if (tasksLoading || agentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading orchestration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Task Orchestration & Agent Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Automated task breakdown, dependency tracking, and intelligent agent assignment
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowBreakdownModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
            >
              <Wand2 size={20} />
              New Breakdown
            </button>
          </div>

          {/* View Mode Tabs */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setViewMode('hierarchy')}
              className={`px-4 py-3 font-medium flex items-center gap-2 transition-colors border-b-2 ${
                viewMode === 'hierarchy'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Layers size={18} />
              Hierarchy View
            </button>
            <button
              onClick={() => setViewMode('dependencies')}
              className={`px-4 py-3 font-medium flex items-center gap-2 transition-colors border-b-2 ${
                viewMode === 'dependencies'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Network size={18} />
              Dependencies
            </button>
            <button
              onClick={() => setViewMode('roster')}
              className={`px-4 py-3 font-medium flex items-center gap-2 transition-colors border-b-2 ${
                viewMode === 'roster'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Users size={18} />
              Agent Roster
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 min-h-[calc(100vh-250px)]">
          {viewMode === 'hierarchy' && (
            <TaskHierarchyView
              tasks={tasks}
              agents={agents}
              onTaskClick={(task) => console.log('Task clicked:', task)}
            />
          )}

          {viewMode === 'dependencies' && (
            <DependencyGraph
              tasks={tasks}
              onTaskClick={(task) => console.log('Task clicked:', task)}
            />
          )}

          {viewMode === 'roster' && (
            <AgentRosterManager
              agents={agents}
              tasks={tasks}
              onUpdateAgent={updateAgent}
            />
          )}
        </div>

        {/* Stats Footer */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Tasks</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{tasks.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Epics</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {tasks.filter((t) => t.type === 'epic').length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Agents</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {agents.filter((a) => a.availability !== 'offline').length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">With Dependencies</div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {tasks.filter((t) => t.dependencies && t.dependencies.length > 0).length}
            </div>
          </div>
        </div>
      </div>

      {/* Task Breakdown Modal */}
      <TaskBreakdownModal
        isOpen={showBreakdownModal}
        onClose={() => setShowBreakdownModal(false)}
        onBreakdownComplete={handleBreakdownComplete}
        existingTaskCount={tasks.length}
      />
    </div>
  );
}
