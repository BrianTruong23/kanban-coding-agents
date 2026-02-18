'use client';

/**
 * OrchestrationDemo - Example integration of all task orchestration features
 *
 * This component demonstrates how to use:
 * - TaskBreakdownWizard for AI-powered task generation
 * - DependencyGraph for visualizing task relationships
 * - AgentRoster for managing agent skills and performance
 * - Auto-assignment based on skills and availability
 *
 * Usage: Import this component and integrate it with your Supabase backend
 */

import { useState, useEffect } from 'react';
import { Task, TaskDependency } from '@/types/task';
import { Epic } from '@/types/epic';
import { AgentWithSkills, AgentSkill } from '@/types/agent';
import { TaskBreakdownWizard } from './TaskBreakdownWizard';
import { DependencyGraph } from './DependencyGraph';
import { AgentRoster } from './AgentRoster';
import { recommendAgent, autoAssignTasks } from '@/lib/agentAssignment';
import { Wand2, GitBranch, Users, Zap } from 'lucide-react';

export const OrchestrationDemo = () => {
  const [showBreakdownWizard, setShowBreakdownWizard] = useState(false);
  const [activeView, setActiveView] = useState<'breakdown' | 'dependencies' | 'roster'>('breakdown');

  // Mock data - replace with real Supabase queries
  const [tasks, setTasks] = useState<Task[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [agents, setAgents] = useState<AgentWithSkills[]>([]);

  const handleBreakdownComplete = async (result: {
    epic: Epic;
    tasks: Task[];
    dependencies: TaskDependency[];
  }) => {
    // TODO: Save to Supabase
    // Example:
    /*
    const { data: epicData, error: epicError } = await supabase
      .from('epics')
      .insert({
        epic_id: result.epic.epicId,
        title: result.epic.title,
        description: result.epic.description,
        status: result.epic.status,
        priority: result.epic.priority,
        user_id: userId,
      })
      .select()
      .single();

    if (epicError) throw epicError;

    // Insert tasks with epic_id
    const tasksToInsert = result.tasks.map(task => ({
      task_id: task.taskId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      tags: task.tags,
      epic_id: epicData.id,
      definition_of_done: task.definitionOfDone,
      test_notes: task.testNotes,
      risk_level: task.riskLevel,
      risk_flags: task.riskFlags,
      estimated_hours: task.estimatedHours,
      user_id: userId,
    }));

    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select();

    if (taskError) throw taskError;

    // Insert dependencies
    const depMap = new Map(taskData.map(t => [t.task_id, t.id]));
    const depsToInsert = result.dependencies.map(dep => ({
      task_id: depMap.get(dep.taskId),
      depends_on_task_id: depMap.get(dep.dependsOnTaskId),
      dependency_type: dep.dependencyType,
      user_id: userId,
    }));

    await supabase.from('task_dependencies').insert(depsToInsert);
    */

    // For demo purposes, just update local state
    setEpics([...epics, result.epic]);
    setTasks([...tasks, ...result.tasks]);
    setDependencies([...dependencies, ...result.dependencies]);
    setShowBreakdownWizard(false);

    // Auto-assign tasks to agents
    handleAutoAssign(result.tasks);
  };

  const handleAutoAssign = (tasksToAssign: Task[]) => {
    const assignments = autoAssignTasks(tasksToAssign, agents, tasks);

    // TODO: Save assignments to Supabase
    /*
    const updates = Array.from(assignments.entries()).map(([taskId, agentId]) => ({
      id: taskId,
      assigned_agent_id: agentId,
    }));

    await Promise.all(
      updates.map(update =>
        supabase.from('tasks').update(update).eq('id', update.id)
      )
    );
    */

    // Update local state
    setTasks(tasks.map(task => {
      const agentId = assignments.get(task.id);
      return agentId ? { ...task, assignedAgentId: agentId } : task;
    }));
  };

  const handleAddSkill = async (agentId: string, skill: AgentSkill) => {
    // TODO: Save to Supabase
    /*
    await supabase.from('agent_skills').insert({
      agent_id: agentId,
      skill_name: skill.skillName,
      skill_level: skill.skillLevel,
      user_id: userId,
    });
    */

    // Update local state
    setAgents(agents.map(agent =>
      agent.id === agentId
        ? { ...agent, skills: [...agent.skills, skill] }
        : agent
    ));
  };

  const handleRemoveSkill = async (agentId: string, skillId: string) => {
    // TODO: Delete from Supabase
    /*
    await supabase.from('agent_skills').delete().eq('id', skillId);
    */

    // Update local state
    setAgents(agents.map(agent =>
      agent.id === agentId
        ? { ...agent, skills: agent.skills.filter(s => s.id !== skillId) }
        : agent
    ));
  };

  const handleUpdateSkill = async (agentId: string, skillId: string, level: number) => {
    // TODO: Update in Supabase
    /*
    await supabase
      .from('agent_skills')
      .update({ skill_level: level })
      .eq('id', skillId);
    */

    // Update local state
    setAgents(agents.map(agent =>
      agent.id === agentId
        ? {
            ...agent,
            skills: agent.skills.map(s =>
              s.id === skillId ? { ...s, skillLevel: level as 1 | 2 | 3 | 4 | 5 } : s
            ),
          }
        : agent
    ));
  };

  const handleTaskClick = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Show recommendations for this task
    const recommendations = recommendAgent(task, agents, tasks);
    console.log('Recommendations for', task.title, ':', recommendations);

    // You can display these in a modal or sidebar
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Task Orchestration System
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBreakdownWizard(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
            >
              <Wand2 size={18} />
              AI Breakdown
            </button>
            <button
              onClick={() => handleAutoAssign(tasks.filter(t => !t.assignedAgentId))}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2"
            >
              <Zap size={18} />
              Auto-Assign
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveView('breakdown')}
            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
              activeView === 'breakdown'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Wand2 size={16} />
            Task Breakdown
          </button>
          <button
            onClick={() => setActiveView('dependencies')}
            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
              activeView === 'dependencies'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <GitBranch size={16} />
            Dependencies
          </button>
          <button
            onClick={() => setActiveView('roster')}
            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
              activeView === 'roster'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Users size={16} />
            Agent Roster
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'breakdown' && (
          <div className="h-full p-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 h-full flex items-center justify-center">
              <div className="text-center">
                <Wand2 size={64} className="mx-auto mb-4 text-blue-500 opacity-50" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  AI-Powered Task Breakdown
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                  Paste your GitHub issue, PRD, or screenshot description and let AI
                  automatically break it down into epics, tasks, and subtasks with DoD,
                  test notes, and risk assessment.
                </p>
                <button
                  onClick={() => setShowBreakdownWizard(true)}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2 mx-auto"
                >
                  <Wand2 size={20} />
                  Start Breakdown
                </button>
              </div>
            </div>
          </div>
        )}

        {activeView === 'dependencies' && (
          <div className="h-full p-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-full">
              <DependencyGraph
                tasks={tasks}
                dependencies={dependencies}
                onTaskClick={handleTaskClick}
              />
            </div>
          </div>
        )}

        {activeView === 'roster' && (
          <div className="h-full p-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-full">
              <AgentRoster
                agents={agents}
                tasks={tasks}
                onAddSkill={handleAddSkill}
                onRemoveSkill={handleRemoveSkill}
                onUpdateSkill={handleUpdateSkill}
              />
            </div>
          </div>
        )}
      </div>

      {/* Task Breakdown Wizard */}
      {showBreakdownWizard && (
        <TaskBreakdownWizard
          onBreakdownComplete={handleBreakdownComplete}
          onCancel={() => setShowBreakdownWizard(false)}
          epicCounter={epics.length + 1}
          taskCounter={tasks.length + 1}
        />
      )}
    </div>
  );
};
