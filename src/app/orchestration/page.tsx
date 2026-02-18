'use client';

import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAgents } from '@/hooks/useAgents';
import { useAuth } from '@/contexts/AuthContext';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TaskBreakdownModal } from '@/components/TaskBreakdownModal';
import { DependencyGraph } from '@/components/DependencyGraph';
import { AgentRoster, AgentRosterCompact } from '@/components/AgentRoster';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogOut, Sparkles, GitBranch, Users, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TaskBreakdownResult } from '@/types/task';

type ViewMode = 'kanban' | 'dependencies' | 'agents';

export default function OrchestrationPage() {
  const { tasks, addTask, updateTask, deleteTask, isLoaded: tasksLoaded } = useTasks();
  const { agents, isLoaded: agentsLoaded } = useAgents();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleImportTasks = async (result: TaskBreakdownResult) => {
    // Import all tasks from the breakdown
    const allTasks = [
      ...(result.epic ? [result.epic] : []),
      ...result.stories,
      ...result.tasks,
      ...result.subtasks,
    ];

    for (const task of allTasks) {
      await addTask(task);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400 dark:text-gray-500">
        Loading...
      </div>
    );
  }

  if (!tasksLoaded || !agentsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400 dark:text-gray-500">
        Loading orchestration dashboard...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden transition-colors">
      {/* Header */}
      <header className="flex-none p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Agent Orchestration Dashboard
          </h1>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard size={16} />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('dependencies')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'dependencies'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <GitBranch size={16} />
              Dependencies
            </button>
            <button
              onClick={() => setViewMode('agents')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'agents'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Users size={16} />
              Agents
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBreakdownModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Sparkles size={16} />
            AI Breakdown
          </button>
          {user ? (
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-300 max-w-[150px] truncate">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : null}
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar - Agent Status */}
        <aside className="flex-none w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <AgentRosterCompact agents={agents} />
        </aside>

        {/* Main View */}
        <main className="flex-1 overflow-hidden p-4">
          {viewMode === 'kanban' && (
            <KanbanBoard
              tasks={tasks}
              agents={agents}
              onAddTask={addTask}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
            />
          )}

          {viewMode === 'dependencies' && (
            <div className="h-full overflow-auto">
              <DependencyGraph tasks={tasks} />
            </div>
          )}

          {viewMode === 'agents' && (
            <div className="h-full overflow-auto">
              <AgentRoster agents={agents} />
            </div>
          )}
        </main>
      </div>

      {/* Task Breakdown Modal */}
      <TaskBreakdownModal
        isOpen={isBreakdownModalOpen}
        onClose={() => setIsBreakdownModalOpen(false)}
        onImport={handleImportTasks}
        currentTaskCount={tasks.length}
        agents={agents}
      />
    </div>
  );
}
