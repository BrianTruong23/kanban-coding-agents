'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAgents } from '@/hooks/useAgents';
import { OrchestrationDashboard } from '@/components/OrchestrationDashboard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogOut, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OrchestrationPage() {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { agents, isLoaded: agentsLoaded } = useAgents();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleTasksCreated = (tickets: any[]) => {
    // In a real implementation, this would sync with the main kanban board
    console.log('Tasks created:', tickets);
  };

  if (authLoading || !agentsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400 dark:text-gray-500">
        Loading orchestration dashboard...
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Back to Kanban Board"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Agent Orchestration
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
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
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <OrchestrationDashboard
          agents={agents}
          userId={user.id}
          onTasksCreated={handleTasksCreated}
        />
      </main>
    </div>
  );
}
