'use client';

import { useState } from 'react';
import { useAgents } from '@/hooks/useAgents';
import { useTasks } from '@/hooks/useTasks';
import { useAgentRosters } from '@/hooks/useAgentRosters';
import { useBreakdownTasks } from '@/hooks/useBreakdownTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { TaskBreakdownDashboard } from '@/components/TaskBreakdownDashboard';
import { AgentRosterManager } from '@/components/AgentRosterManager';
import { BreakdownTask } from '@/types/breakdown';
import { Task } from '@/types/task';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogOut, Home, Sparkles } from 'lucide-react';

export default function BreakdownPage() {
  const { agents, isLoaded: agentsLoaded } = useAgents();
  const { addTask } = useTasks();
  const { rosters, isLoaded: rostersLoaded, updateRoster } = useAgentRosters(agents);
  const { tasks: breakdownTasks, addTasks } = useBreakdownTasks();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'breakdown' | 'roster'>('breakdown');

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleTasksGenerated = async (tasks: BreakdownTask[]) => {
    // Add to breakdown tasks for tracking
    addTasks(tasks);

    // Convert breakdown tasks to regular tasks and add to Kanban
    for (const breakdownTask of tasks) {
      const regularTask: Task = {
        id: breakdownTask.id,
        taskId: breakdownTask.taskId,
        title: breakdownTask.title,
        description: breakdownTask.description,
        status: breakdownTask.status,
        assignedAgentId: breakdownTask.assignedAgentId,
        priority: breakdownTask.priority,
        tags: breakdownTask.tags,
        sprint: breakdownTask.sprint,
        commentsCount: 0,
        attachmentsCount: 0,
        createdAt: breakdownTask.createdAt,
        updatedAt: breakdownTask.updatedAt,
      };

      await addTask(regularTask);
    }

    alert(`Successfully added ${tasks.length} task${tasks.length !== 1 ? 's' : ''} to the Kanban board!`);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400 dark:text-gray-500">
        Loading...
      </div>
    );
  }

  if (!agentsLoaded || !rostersLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400 dark:text-gray-500">
        Loading task breakdown system...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Back to Kanban Board"
            >
              <Home size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Sparkles size={24} className="text-blue-500" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Task Breakdown & Agent Orchestration
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
            ) : (
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
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
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('breakdown')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'breakdown'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Task Breakdown
            </button>
            <button
              onClick={() => setActiveTab('roster')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'roster'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Agent Roster Management
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-6">
        {activeTab === 'breakdown' ? (
          <TaskBreakdownDashboard
            agentRosters={rosters}
            onTasksGenerated={handleTasksGenerated}
          />
        ) : (
          <AgentRosterManager
            agents={agents}
            rosters={rosters}
            onUpdateRoster={updateRoster}
          />
        )}
      </main>
    </div>
  );
}
