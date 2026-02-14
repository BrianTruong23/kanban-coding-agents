'use client';

import { useAgents } from '@/hooks/useAgents';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { TaskBreakdownOrchestrator } from '@/components/TaskBreakdownOrchestrator';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogOut, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TaskBreakdown } from '@/types/breakdown';
import { CodingAgent } from '@/types/agent';
import { Task } from '@/types/task';
import { generateId } from '@/lib/utils';

export default function OrchestratorPage() {
  const { agents, addAgent, updateAgent, deleteAgent, isLoaded: agentsLoaded } = useAgents();
  const { addTask, isLoaded: tasksLoaded } = useTasks();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleCreateTasks = async (tasks: TaskBreakdown[], assignments: Map<string, string>) => {
    // Convert TaskBreakdown to Task and create them
    for (const taskBreakdown of tasks) {
      const task: Task = {
        id: generateId(),
        taskId: taskBreakdown.taskId,
        title: taskBreakdown.title,
        description: taskBreakdown.description,
        status: 'backlog',
        priority: taskBreakdown.priority,
        tags: taskBreakdown.tags,
        assignedAgentId: assignments.get(taskBreakdown.taskId),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await addTask(task);
    }

    // Navigate back to main board
    router.push('/');
  };

  const handleAddAgent = async (agentData: Partial<CodingAgent>) => {
    const newAgent: CodingAgent = {
      id: generateId(),
      name: agentData.name || 'New Agent',
      description: agentData.description,
      avatar: agentData.avatar,
      avatarColor: agentData.avatarColor,
      createdAt: Date.now(),
    };

    await addAgent(newAgent);
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
        Loading orchestrator...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="flex-none p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Back to Kanban Board"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Task Orchestrator
          </h1>
        </div>

        <div className="flex items-center gap-3">
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

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 max-w-[1400px] mx-auto w-full">
        <TaskBreakdownOrchestrator
          agents={agents}
          onCreateTasks={handleCreateTasks}
          onAddAgent={handleAddAgent}
          onUpdateAgent={updateAgent}
          onDeleteAgent={deleteAgent}
        />
      </main>
    </div>
  );
}
