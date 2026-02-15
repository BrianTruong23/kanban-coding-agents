'use client';

import { useState, useMemo } from 'react';
import { CodingAgent } from '@/types/agent';
import { AgentRoster, Skill } from '@/types/agentRoster';
import { TaskBreakdown } from '@/types/breakdown';
import { AgentOrchestrator } from '@/lib/agentOrchestration';
import { TaskBreakdownPanel } from './TaskBreakdownPanel';
import { AgentRosterManager } from './AgentRosterManager';
import { DependencyGraph } from './DependencyGraph';
import { Layout, Users, GitBranch, Sparkles } from 'lucide-react';

interface OrchestrationDashboardProps {
  agents: CodingAgent[];
}

export const OrchestrationDashboard = ({ agents }: OrchestrationDashboardProps) => {
  const [activeTab, setActiveTab] = useState<'breakdown' | 'roster' | 'dependencies'>('breakdown');
  const [breakdown, setBreakdown] = useState<TaskBreakdown | null>(null);

  // Convert CodingAgent to AgentRoster
  const agentRoster: AgentRoster[] = useMemo(() => {
    return agents.map(agent => AgentOrchestrator.createAgentRoster(agent));
  }, [agents]);

  const [rosterData, setRosterData] = useState<AgentRoster[]>(agentRoster);

  const handleUpdateAgent = (updatedAgent: AgentRoster) => {
    setRosterData(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a));
  };

  const handleAddSkill = (agentId: string, skill: Skill) => {
    setRosterData(prev =>
      prev.map(agent =>
        agent.id === agentId
          ? { ...agent, skills: [...agent.skills, skill], updatedAt: Date.now() }
          : agent
      )
    );
  };

  const handleRemoveSkill = (agentId: string, skillId: string) => {
    setRosterData(prev =>
      prev.map(agent =>
        agent.id === agentId
          ? { ...agent, skills: agent.skills.filter(s => s.id !== skillId), updatedAt: Date.now() }
          : agent
      )
    );
  };

  const handleImportBreakdown = (newBreakdown: TaskBreakdown) => {
    setBreakdown(newBreakdown);
    // Here you would typically convert the breakdown into actual tasks
    // and add them to your kanban board
    alert(`Breakdown generated:\n- ${newBreakdown.epics.length} epics\n- ${newBreakdown.tickets.length} tickets\n- ${newBreakdown.subtasks.length} subtasks\n\nIn a production app, these would be imported to your kanban board.`);
  };

  const tabs = [
    { id: 'breakdown' as const, label: 'Task Breakdown', icon: Sparkles },
    { id: 'roster' as const, label: 'Agent Roster', icon: Users },
    { id: 'dependencies' as const, label: 'Dependencies', icon: GitBranch },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="flex-none bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Layout size={24} className="text-gray-700 dark:text-gray-300" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Task Orchestration Dashboard
            </h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-200 dark:border-gray-700">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-black dark:border-white text-black dark:text-white'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'breakdown' && (
          <TaskBreakdownPanel agents={rosterData} onImportBreakdown={handleImportBreakdown} />
        )}

        {activeTab === 'roster' && (
          <AgentRosterManager
            agents={rosterData}
            onUpdateAgent={handleUpdateAgent}
            onAddSkill={handleAddSkill}
            onRemoveSkill={handleRemoveSkill}
          />
        )}

        {activeTab === 'dependencies' && breakdown && (
          <div className="h-full overflow-auto p-6">
            <DependencyGraph
              epics={breakdown.epics}
              tickets={breakdown.tickets}
              subtasks={breakdown.subtasks}
              dependencies={breakdown.dependencies}
            />
          </div>
        )}

        {activeTab === 'dependencies' && !breakdown && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <GitBranch size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                No breakdown generated yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Generate a task breakdown to view dependencies
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
