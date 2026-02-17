'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgents } from '@/hooks/useAgents';
import { useAgentSkills } from '@/hooks/useAgentSkills';
import { useAgentPerformance } from '@/hooks/useAgentPerformance';
import { AgentSkillsManager } from '@/components/AgentSkillsManager';
import { AgentPerformanceStatsComponent } from '@/components/AgentPerformanceStats';
import { Users, TrendingUp, Award } from 'lucide-react';

export default function AgentsPage() {
  const { user } = useAuth();
  const { agents, loading: agentsLoading } = useAgents(user?.id);
  const { skills, addSkill, updateSkill, deleteSkill, getSkillsByAgent, loading: skillsLoading } = useAgentSkills(user?.id);
  const { getAgentStats, loading: performanceLoading } = useAgentPerformance(user?.id);

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  const loading = agentsLoading || skillsLoading || performanceLoading;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Agent Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your coding agents, their skills, and track their performance
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400 dark:text-gray-500">Loading agents...</div>
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            No agents found. Agents will be created automatically when you sign up.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Agent List */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users size={20} />
                  Agents ({agents.length})
                </h2>
                <div className="space-y-2">
                  {agents.map(agent => {
                    const agentSkills = getSkillsByAgent(agent.id);
                    const stats = getAgentStats(agent.id);
                    const isSelected = selectedAgentId === agent.id;

                    return (
                      <button
                        key={agent.id}
                        onClick={() => setSelectedAgentId(agent.id)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-full ${agent.avatarColor || 'bg-gray-400'} flex items-center justify-center text-white font-bold text-lg`}
                          >
                            {agent.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 dark:text-white truncate">
                              {agent.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {agent.description}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {agentSkills.length} skills
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {stats.totalTasksCompleted} tasks
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Overall Stats */}
              <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp size={20} />
                  Overall Stats
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Skills</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{skills.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {agents.reduce((sum, agent) => sum + getAgentStats(agent.id).totalTasksCompleted, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Avg Quality</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {(
                        agents.reduce((sum, agent) => {
                          const stats = getAgentStats(agent.id);
                          return sum + (stats.totalTasksCompleted > 0 ? stats.averageQualityScore : 0);
                        }, 0) / agents.filter(a => getAgentStats(a.id).totalTasksCompleted > 0).length || 0
                      ).toFixed(1)}
                      /5
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Details */}
            <div className="lg:col-span-2">
              {selectedAgent ? (
                <div className="space-y-6">
                  {/* Agent Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-20 h-20 rounded-full ${selectedAgent.avatarColor || 'bg-gray-400'} flex items-center justify-center font-bold text-3xl border-4 border-white`}
                      >
                        {selectedAgent.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold mb-1">{selectedAgent.name}</h2>
                        <p className="text-blue-100">{selectedAgent.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Performance Stats */}
                  <AgentPerformanceStatsComponent
                    agent={selectedAgent}
                    stats={getAgentStats(selectedAgent.id)}
                  />

                  {/* Skills Manager */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <AgentSkillsManager
                      agent={selectedAgent}
                      skills={getSkillsByAgent(selectedAgent.id)}
                      onAddSkill={addSkill}
                      onUpdateSkill={updateSkill}
                      onDeleteSkill={deleteSkill}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
                  <Award size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Select an Agent
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose an agent from the list to view their details, skills, and performance
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
