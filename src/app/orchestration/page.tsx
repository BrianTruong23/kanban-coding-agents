'use client';

import { useAgents } from '@/hooks/useAgents';
import { useAuth } from '@/contexts/AuthContext';
import { OrchestrationDashboard } from '@/components/OrchestrationDashboard';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function OrchestrationPage() {
  const { agents, isLoaded } = useAgents();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400 dark:text-gray-500">
        Loading...
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400 dark:text-gray-500">
        Loading agents...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Back button */}
      <div className="flex-none bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          <ArrowLeft size={16} />
          Back to Kanban Board
        </button>
      </div>

      {/* Dashboard */}
      <div className="flex-1 overflow-hidden">
        <OrchestrationDashboard agents={agents} />
      </div>
    </div>
  );
}
