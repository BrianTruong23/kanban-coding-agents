'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { useAgents } from '@/hooks/useAgents';
import { TaskBreakdownPanel } from '@/components/TaskBreakdownPanel';
import { TaskDependencyGraph } from '@/components/TaskDependencyGraph';
import { AgentSkillsManager } from '@/components/AgentSkillsManager';
import { TaskBreakdownResult } from '@/types/task-breakdown';
import { TaskDependency } from '@/types/epic';
import { AgentSkill } from '@/types/agent-skills';
import { CodingAgent } from '@/types/agent';
import { Users, GitBranch, Zap, Settings } from 'lucide-react';

/**
 * Agent Orchestration Dashboard
 *
 * This page demonstrates the full task breakdown and agent orchestration system:
 * 1. AI-powered task breakdown from issues/PRDs/screenshots
 * 2. Agent skills management
 * 3. Auto-assignment based on skills and performance
 * 4. Task dependency visualization
 */
export default function OrchestrationPage() {
  const { user } = useAuth();
  const { tasks, addTask } = useTasks();
  const { agents } = useAgents();

  const [selectedAgent, setSelectedAgent] = useState<CodingAgent | null>(null);
  const [agentSkills, setAgentSkills] = useState<AgentSkill[]>([]);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [activeTab, setActiveTab] = useState<'breakdown' | 'dependencies' | 'skills'>('breakdown');

  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      setSelectedAgent(agents[0]);
    }
  }, [agents, selectedAgent]);

  useEffect(() => {
    // In production, load from database
    loadAgentSkills();
    loadDependencies();
  }, []);

  const loadAgentSkills = async () => {
    // TODO: Implement loading from Supabase
    // For now, use mock data
    const mockSkills: AgentSkill[] = [
      {
        id: '1',
        agentId: agents[0]?.id || '',
        category: 'frontend',
        name: 'React',
        proficiency: 5,
        yearsOfExperience: 7,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '2',
        agentId: agents[0]?.id || '',
        category: 'frontend',
        name: 'TypeScript',
        proficiency: 4,
        yearsOfExperience: 5,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    setAgentSkills(mockSkills);
  };

  const loadDependencies = async () => {
    // TODO: Implement loading from Supabase
    // For now, use mock data to demonstrate
    const mockDeps: TaskDependency[] = [];
    setDependencies(mockDeps);
  };

  const handleBreakdownComplete = async (result: TaskBreakdownResult) => {
    try {
      // 1. Save epic if generated
      if (result.epic) {
        console.log('Epic generated:', result.epic);
        // TODO: Save to database
      }

      // 2. Save all tasks
      for (const task of result.tasks) {
        await addTask(task);
      }

      // 3. Save subtasks, DoD, test notes, risk flags
      console.log('Subtasks:', result.subtasks.length);
      console.log('DoD criteria:', result.definitionsOfDone.length);
      console.log('Test notes:', result.testNotes.length);
      console.log('Risk flags:', result.riskFlags.length);

      // TODO: Save to database
      // await saveSubtasks(result.subtasks);
      // await saveDoD(result.definitionsOfDone);
      // await saveTestNotes(result.testNotes);
      // await saveRiskFlags(result.riskFlags);

      // 4. Save task requirements
      console.log('Task requirements:', result.requirements.length);
      // TODO: Save to database

      alert(`Successfully created ${result.tasks.length} tasks with full breakdown!`);
    } catch (error) {
      console.error('Error saving breakdown:', error);
      alert('Failed to save breakdown. Check console for details.');
    }
  };

  const handleAddSkill = (skill: Omit<AgentSkill, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSkill: AgentSkill = {
      ...skill,
      id: `skill-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setAgentSkills([...agentSkills, newSkill]);
    // TODO: Save to database
  };

  const handleRemoveSkill = (skillId: string) => {
    setAgentSkills(agentSkills.filter(s => s.id !== skillId));
    // TODO: Remove from database
  };

  const handleUpdateSkill = (skill: AgentSkill) => {
    setAgentSkills(agentSkills.map(s => s.id === skill.id ? skill : s));
    // TODO: Update in database
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to access the orchestration dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Zap className="w-8 h-8 text-purple-600" />
                Agent Orchestration Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                AI-powered task breakdown, agent skills management, and intelligent assignment
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {agents.length} Agents • {tasks.length} Tasks
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b dark:border-gray-700">
            <button
              onClick={() => setActiveTab('breakdown')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'breakdown'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Zap className="w-4 h-4 inline mr-2" />
              Task Breakdown
            </button>
            <button
              onClick={() => setActiveTab('dependencies')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'dependencies'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <GitBranch className="w-4 h-4 inline mr-2" />
              Dependencies
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'skills'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Agent Skills
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'breakdown' && (
          <div className="space-y-6">
            <TaskBreakdownPanel
              userId={user.id}
              onBreakdownComplete={handleBreakdownComplete}
            />

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">How It Works</h3>
                  <Settings className="w-5 h-5 text-gray-400" />
                </div>
                <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal list-inside">
                  <li>Paste your issue, PRD, or screenshot</li>
                  <li>AI analyzes and breaks down into tasks</li>
                  <li>Review generated tasks, DoD, and risks</li>
                  <li>Tasks are created in your backlog</li>
                </ol>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">What You Get</h3>
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li>• Structured task hierarchy</li>
                  <li>• Definition of Done criteria</li>
                  <li>• Test requirements</li>
                  <li>• Risk identification</li>
                  <li>• Skill requirements</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Best Practices</h3>
                  <GitBranch className="w-5 h-5 text-blue-600" />
                </div>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li>• Provide detailed descriptions</li>
                  <li>• Include technical context</li>
                  <li>• Specify constraints</li>
                  <li>• Review AI suggestions</li>
                  <li>• Adjust as needed</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dependencies' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700">
            <TaskDependencyGraph
              tasks={tasks}
              dependencies={dependencies}
              onTaskClick={(taskId) => {
                console.log('Task clicked:', taskId);
              }}
            />
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-6">
            {/* Agent Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
              <label className="block text-sm font-medium mb-2">Select Agent</label>
              <select
                value={selectedAgent?.id || ''}
                onChange={(e) => {
                  const agent = agents.find(a => a.id === e.target.value);
                  setSelectedAgent(agent || null);
                }}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
              >
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Skills Manager */}
            {selectedAgent && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700">
                <AgentSkillsManager
                  agent={selectedAgent}
                  skills={agentSkills.filter(s => s.agentId === selectedAgent.id)}
                  onAddSkill={handleAddSkill}
                  onRemoveSkill={handleRemoveSkill}
                  onUpdateSkill={handleUpdateSkill}
                />
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                Why Manage Agent Skills?
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                By tracking agent skills and proficiency levels, the system can intelligently
                auto-assign tasks to the most qualified agents, improving efficiency and quality.
                Skills are used to calculate match scores during auto-assignment.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            This is a beta feature. For production use, integrate with OpenAI, Anthropic Claude, or your preferred LLM.
            See <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">TASK_BREAKDOWN_FEATURE.md</code> for details.
          </p>
        </div>
      </div>
    </div>
  );
}
