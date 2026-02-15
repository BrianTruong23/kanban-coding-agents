'use client';

import { useTasks } from '@/hooks/useTasks';
import { useAgents } from '@/hooks/useAgents';
import { useAuth } from '@/contexts/AuthContext';
import { useBudget } from '@/hooks/useBudget';
import { PMDashboard } from '@/components/PMDashboard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogOut, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PMDashboardPage() {
  const { tasks, updateTask, isLoaded: tasksLoaded } = useTasks();
  const { agents, isLoaded: agentsLoaded } = useAgents();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const {
    projectBudget,
    alerts,
    acknowledgeAlert,
    pauseTask,
    resumeTask,
  } = useBudget(tasks, updateTask);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleBackToKanban = () => {
    router.push('/');
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
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden transition-colors">
      {/* Header with user info and controls */}
      <header className="flex-none p-4 flex justify-between items-center z-10 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToKanban}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to Kanban</span>
          </button>
        </div>
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

      <main className="flex-1 overflow-y-auto">
        <PMDashboard
          tasks={tasks}
          agents={agents}
          projectBudget={projectBudget}
          alerts={alerts}
          onAcknowledgeAlert={acknowledgeAlert}
          onPauseTask={pauseTask}
          onResumeTask={resumeTask}
        />
      </main>
    </div>
  );
}
