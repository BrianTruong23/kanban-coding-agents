'use client';

import { useTasks } from '@/hooks/useTasks';
import { useAgents } from '@/hooks/useAgents';
import { useAuth } from '@/contexts/AuthContext';
import { KanbanBoard } from '@/components/KanbanBoard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogOut } from 'lucide-react';

import { useRouter } from 'next/navigation';

export default function Home() {
  const { tasks, addTask, updateTask, deleteTask, isLoaded: tasksLoaded } = useTasks();
  const { agents, isLoaded: agentsLoaded } = useAgents();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
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
        Loading kanban board...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden transition-colors">
      {/* Header with user info and controls */}
      <header className="flex-none p-4 flex justify-between items-center z-10">
        <h1 className="text-sm font-semibold text-gray-400 dark:text-gray-500 hidden md:block">
          Kanban Board
        </h1>
        <div className="flex items-center gap-3 ml-auto">
          {user ? (
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
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
          ) : (
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <span className="text-sm text-yellow-600 dark:text-yellow-500 font-medium">
                Session Expired
              </span>
              <button
                onClick={handleSignOut}
                className="p-1.5 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1 text-xs font-bold uppercase"
                title="Sign in"
              >
                Login
                <LogOut size={14} className="rotate-180" />
              </button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden px-4 pb-4 max-w-[1800px] mx-auto w-full">
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
