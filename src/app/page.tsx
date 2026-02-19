'use client';

import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAgents } from '@/hooks/useAgents';
import { useAgentSkills } from '@/hooks/useAgentSkills';
import { useAgentPerformance } from '@/hooks/useAgentPerformance';
import { useDependencies } from '@/hooks/useDependencies';
import { useAuth } from '@/contexts/AuthContext';
import { KanbanBoard } from '@/components/KanbanBoard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TaskBreakdownModal } from '@/components/TaskBreakdownModal';
import { DependencyGraph } from '@/components/DependencyGraph';
import { AgentSkillsPanel } from '@/components/AgentSkillsPanel';
import { LogOut, Sparkles, Network, Users } from 'lucide-react';

import { useRouter } from 'next/navigation';
import { TaskBreakdownResult } from '@/types/taskBreakdown';
import { AgentOrchestrationService } from '@/services/agentOrchestration';

export default function Home() {
  const { tasks, addTask, updateTask, deleteTask, isLoaded: tasksLoaded } = useTasks();
  const { agents, isLoaded: agentsLoaded } = useAgents();
  const { skills, addSkill, deleteSkill, updateSkill, isLoaded: skillsLoaded } = useAgentSkills();
  const { performances, addPerformance, isLoaded: performancesLoaded } = useAgentPerformance();
  const { dependencies, addDependency, deleteDependency, isLoaded: depsLoaded } = useDependencies();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [showDependencyGraph, setShowDependencyGraph] = useState(false);
  const [showAgentSkills, setShowAgentSkills] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleBreakdownComplete = async (result: TaskBreakdownResult) => {
    try {
      // Add all tasks from the breakdown
      for (const task of result.tasks) {
        await addTask(task);
      }

      // Auto-assign agents to tasks
      const assignments = AgentOrchestrationService.autoAssignAgents(
        result.tasks,
        agents,
        skills,
        performances
      );

      // Update tasks with agent assignments
      for (const [taskId, agentId] of assignments.entries()) {
        const task = result.tasks.find(t => t.id === taskId);
        if (task) {
          updateTask({ ...task, assignedAgentId: agentId });
        }
      }

      // Add dependencies
      for (const dep of result.dependencies) {
        await addDependency(dep);
      }
    } catch (error) {
      console.error('Error processing breakdown:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400 dark:text-gray-500">
        Loading...
      </div>
    );
  }

  if (!tasksLoaded || !agentsLoaded || !skillsLoaded || !performancesLoaded || !depsLoaded) {
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBreakdownModal(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Sparkles size={18} />
            <span className="hidden sm:inline">AI Breakdown</span>
          </button>
          <button
            onClick={() => setShowDependencyGraph(!showDependencyGraph)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Network size={18} />
            <span className="hidden sm:inline">Dependencies</span>
          </button>
          <button
            onClick={() => setShowAgentSkills(!showAgentSkills)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Users size={18} />
            <span className="hidden sm:inline">Agent Skills</span>
          </button>
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

      <main className="flex-1 overflow-hidden px-4 pb-4 max-w-[1800px] mx-auto w-full flex flex-col gap-4">
        {/* Agent Skills Panel */}
        {showAgentSkills && (
          <div className="flex-none">
            <AgentSkillsPanel
              agents={agents}
              skills={skills}
              performances={performances}
              onAddSkill={addSkill}
              onRemoveSkill={deleteSkill}
              onUpdateSkill={updateSkill}
            />
          </div>
        )}

        {/* Dependency Graph */}
        {showDependencyGraph && (
          <div className="flex-none">
            <DependencyGraph
              tasks={tasks}
              dependencies={dependencies}
              onClose={() => setShowDependencyGraph(false)}
            />
          </div>
        )}

        {/* Kanban Board */}
        <div className="flex-1 overflow-hidden">
          <KanbanBoard
            tasks={tasks}
            agents={agents}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />
        </div>
      </main>

      {/* Task Breakdown Modal */}
      <TaskBreakdownModal
        isOpen={showBreakdownModal}
        onClose={() => setShowBreakdownModal(false)}
        onBreakdownComplete={handleBreakdownComplete}
      />
    </div>
  );
}
