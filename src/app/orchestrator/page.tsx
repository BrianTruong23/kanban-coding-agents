'use client';

import { useState } from 'react';
import { TaskBreakdownPanel } from '@/components/TaskBreakdownPanel';
import { AgentRosterManager } from '@/components/AgentRosterManager';
import { DependencyGraphView } from '@/components/DependencyGraphView';
import { useAgentRoster } from '@/hooks/useAgentRoster';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogOut, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OrchestratorPage() {
  const [activeTab, setActiveTab] = useState<'breakdown' | 'roster' | 'dependencies'>('breakdown');
  const { agents, isLoaded: agentsLoaded, updateAgentRoster } = useAgentRoster();
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

  if (!agentsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400 dark:text-gray-500">
        Loading orchestrator...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden transition-colors">
      {/* Header */}
      <header className="flex-none p-4 flex justify-between items-center z-10 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            title="Back to Kanban Board"
          >
            <Home size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Task Orchestrator
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Automated task breakdown and agent management
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user && (
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
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex-none p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'breakdown'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Task Breakdown
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'roster'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Agent Roster
          </button>
          <button
            onClick={() => setActiveTab('dependencies')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'dependencies'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Dependency Graph
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-4">
        <div className="h-full max-w-[1800px] mx-auto">
          {activeTab === 'breakdown' && <TaskBreakdownPanel />}
          {activeTab === 'roster' && (
            <AgentRosterManager agents={agents} onUpdateAgent={updateAgentRoster} />
          )}
          {activeTab === 'dependencies' && (
            <DependencyGraphView tickets={[]} subtasks={[]} />
          )}
        </div>
      </main>

      {/* Footer with info */}
      <footer className="flex-none p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-[1800px] mx-auto">
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            {activeTab === 'breakdown' && (
              <>
                Paste an issue, PRD, or description to automatically break it down into epics,
                tickets, and subtasks with DoD, test notes, and risk flags
              </>
            )}
            {activeTab === 'roster' && (
              <>
                Manage coding agents with skills, performance metrics, and auto-assignment
                capabilities
              </>
            )}
            {activeTab === 'dependencies' && (
              <>
                Visualize task dependencies, identify critical paths, and find blocked tasks
              </>
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}
