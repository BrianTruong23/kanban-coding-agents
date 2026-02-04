'use client';

import { useTasks } from '@/hooks/useTasks';
import { useAgents } from '@/hooks/useAgents';
import { useAuth } from '@/contexts/AuthContext';
import { KanbanBoard } from '@/components/KanbanBoard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogOut } from 'lucide-react';

export default function Home() {
  const { tasks, addTask, updateTask, deleteTask, isLoaded: tasksLoaded } = useTasks();
  const { agents, isLoaded: agentsLoaded } = useAgents();
  const { user, signOut, isLoading: authLoading } = useAuth();

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
        Loading kanban board...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 transition-colors">
      {/* Header with user info and controls */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-300 max-w-[150px] truncate">
              {user.email}
            </span>
            <button
              onClick={signOut}
              className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
        <ThemeToggle />
      </div>
      <main className="max-w-[1800px] mx-auto h-[calc(100vh-2rem)]">
        <KanbanBoard
          tasks={tasks}
          agents={agents}
          onAddTask={addTask}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
        />
      </main>
    </div>
  );
}
