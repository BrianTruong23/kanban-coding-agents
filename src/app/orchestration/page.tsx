'use client';

import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAgents } from '@/hooks/useAgents';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TaskBreakdownWizard } from '@/components/TaskBreakdownWizard';
import { TaskHierarchy } from '@/components/TaskHierarchy';
import { DependencyGraph } from '@/components/DependencyGraph';
import { AgentRoster } from '@/components/AgentRoster';
import { convertToTasks } from '@/lib/taskBreakdown';
import { autoAssignTask, autoAssignMultipleTasks } from '@/lib/agentAssignment';
import { BreakdownResult } from '@/lib/taskBreakdown';
import { Task, TaskDependency } from '@/types/task';
import { AgentSkill } from '@/types/agent';
import {
  LogOut,
  Sparkles,
  LayoutGrid,
  Users,
  GitBranch,
  Zap,
  ArrowLeft,
} from 'lucide-react';

export default function OrchestrationPage() {
  const { tasks, addTask, updateTask, isLoaded: tasksLoaded } = useTasks();
  const { agents, isLoaded: agentsLoaded } = useAgents();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeView, setActiveView] = useState<'hierarchy' | 'dependencies' | 'agents'>('hierarchy');
  const [showBreakdownWizard, setShowBreakdownWizard] = useState(false);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleBreakdownComplete = async (breakdown: BreakdownResult) => {
    try {
      // Find the highest task number
      let maxTaskNumber = 0;
      tasks.forEach((task) => {
        if (task.taskId) {
          const match = task.taskId.match(/TASK-(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxTaskNumber) maxTaskNumber = num;
          }
        }
      });

      // Convert breakdown to actual tasks
      const taskBreakdown = convertToTasks(breakdown, maxTaskNumber, user?.id || '');

      // Add epic
      await addTask(taskBreakdown.epic);

      // Add tickets with auto-assignment
      const ticketAssignments = autoAssignMultipleTasks(taskBreakdown.tickets, agents);

      for (const ticket of taskBreakdown.tickets) {
        const assignedAgentId = ticketAssignments.get(ticket.id);
        if (assignedAgentId) {
          ticket.assignedAgentId = assignedAgentId;
        }
        await addTask(ticket);
      }

      // Add subtasks with auto-assignment
      const subtaskAssignments = autoAssignMultipleTasks(taskBreakdown.subtasks, agents);

      for (const subtask of taskBreakdown.subtasks) {
        const assignedAgentId = subtaskAssignments.get(subtask.id);
        if (assignedAgentId) {
          subtask.assignedAgentId = assignedAgentId;
        }
        await addTask(subtask);
      }

      // Store dependencies (in real app, save to database)
      setDependencies([...dependencies, ...taskBreakdown.dependencies]);

      setShowBreakdownWizard(false);
    } catch (error) {
      console.error('Failed to create breakdown:', error);
      alert('Failed to create task breakdown. Please try again.');
    }
  };

  const handleAutoAssignAll = () => {
    const unassignedTasks = tasks.filter((t) => !t.assignedAgentId && t.status === 'backlog');
    const assignments = autoAssignMultipleTasks(unassignedTasks, agents);

    assignments.forEach((agentId, taskId) => {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        updateTask({ ...task, assignedAgentId: agentId });
      }
    });

    alert(`Auto-assigned ${assignments.size} tasks to agents`);
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
        Loading orchestration...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden transition-colors">
      {/* Header */}
      <header className="flex-none p-4 flex justify-between items-center bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Back to Kanban Board"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Task Orchestration
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              AI-powered task breakdown and agent management
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

      {/* Toolbar */}
      <div className="flex-none p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          {/* View Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('hierarchy')}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                activeView === 'hierarchy'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <LayoutGrid size={16} />
              Hierarchy
            </button>
            <button
              onClick={() => setActiveView('dependencies')}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                activeView === 'dependencies'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <GitBranch size={16} />
              Dependencies
            </button>
            <button
              onClick={() => setActiveView('agents')}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                activeView === 'agents'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Users size={16} />
              Agents
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoAssignAll}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:from-orange-600 hover:to-red-600 transition-colors shadow-lg"
            >
              <Zap size={16} />
              Auto-Assign All
            </button>
            <button
              onClick={() => setShowBreakdownWizard(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:from-purple-600 hover:to-blue-600 transition-colors shadow-lg"
            >
              <Sparkles size={16} />
              AI Breakdown
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden px-4 pb-4 max-w-[1800px] mx-auto w-full">
        <div className="h-full mt-4">
          {activeView === 'hierarchy' && (
            <TaskHierarchy tasks={tasks} agents={agents} />
          )}
          {activeView === 'dependencies' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-full overflow-hidden">
              <DependencyGraph tasks={tasks} dependencies={dependencies} />
            </div>
          )}
          {activeView === 'agents' && (
            <AgentRoster
              agents={agents}
              onUpdateAgent={(agent) => {
                // In real app, update agent
                console.log('Update agent:', agent);
              }}
              onAddSkill={(agentId, skill) => {
                // In real app, add skill to database
                console.log('Add skill:', agentId, skill);
                alert(`Skill "${skill.skillName}" added! (Feature coming soon - database integration needed)`);
              }}
              onRemoveSkill={(agentId, skillId) => {
                // In real app, remove skill from database
                console.log('Remove skill:', agentId, skillId);
                alert('Skill removed! (Feature coming soon - database integration needed)');
              }}
            />
          )}
        </div>
      </main>

      {/* Task Breakdown Wizard */}
      {showBreakdownWizard && (
        <TaskBreakdownWizard
          maxTaskNumber={tasks.length}
          onComplete={handleBreakdownComplete}
          onCancel={() => setShowBreakdownWizard(false)}
        />
      )}
    </div>
  );
}
