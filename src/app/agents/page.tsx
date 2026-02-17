'use client';

import { useRouter } from 'next/navigation';
import { useAgents } from '@/hooks/useAgents';
import { AgentRosterManager } from '@/components/AgentRosterManager';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft } from 'lucide-react';

export default function AgentsPage() {
  const router = useRouter();
  const { agents, isLoaded } = useAgents();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400 dark:text-gray-500">
        Loading agents...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Board
            </button>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <AgentRosterManager
          agents={agents}
          onAgentUpdate={(agent) => {
            console.log('Update agent:', agent);
            // In real implementation, update in Supabase
          }}
          onAgentAdd={(agent) => {
            console.log('Add agent:', agent);
            // In real implementation, save to Supabase
          }}
          onAgentRemove={(agentId) => {
            console.log('Remove agent:', agentId);
            // In real implementation, delete from Supabase
          }}
        />
      </main>
    </div>
  );
}
