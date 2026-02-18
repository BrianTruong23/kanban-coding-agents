'use client';

import { useState } from 'react';
import { CodingAgent, AgentStats } from '@/types/agent';
import { User, TrendingUp, Award, Clock, Plus, Edit2, Trash2 } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface AgentRosterPanelProps {
  agents: CodingAgent[];
  agentStats?: Map<string, AgentStats>;
  onAddAgent: (agent: Omit<CodingAgent, 'id' | 'createdAt'>) => void;
  onUpdateAgent: (agent: CodingAgent) => void;
  onDeleteAgent: (agentId: string) => void;
}

export const AgentRosterPanel = ({
  agents,
  agentStats,
  onAddAgent,
  onUpdateAgent,
  onDeleteAgent,
}: AgentRosterPanelProps) => {
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [editingAgent, setEditingAgent] = useState<CodingAgent | null>(null);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentSkills, setNewAgentSkills] = useState('');
  const [newAgentAvailability, setNewAgentAvailability] = useState(100);
  const [newAgentMaxTasks, setNewAgentMaxTasks] = useState(5);

  const handleAddAgent = () => {
    if (!newAgentName.trim()) return;

    const skills = newAgentSkills
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    onAddAgent({
      name: newAgentName,
      skills,
      availability: newAgentAvailability,
      maxConcurrentTasks: newAgentMaxTasks,
      currentTaskCount: 0,
    });

    setNewAgentName('');
    setNewAgentSkills('');
    setNewAgentAvailability(100);
    setNewAgentMaxTasks(5);
    setIsAddingAgent(false);
  };

  const handleUpdateAgent = () => {
    if (!editingAgent) return;

    const skills = newAgentSkills
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    onUpdateAgent({
      ...editingAgent,
      name: newAgentName,
      skills,
      availability: newAgentAvailability,
      maxConcurrentTasks: newAgentMaxTasks,
    });

    setEditingAgent(null);
    setNewAgentName('');
    setNewAgentSkills('');
    setNewAgentAvailability(100);
    setNewAgentMaxTasks(5);
  };

  const startEditing = (agent: CodingAgent) => {
    setEditingAgent(agent);
    setNewAgentName(agent.name);
    setNewAgentSkills(agent.skills?.join(', ') || '');
    setNewAgentAvailability(agent.availability || 100);
    setNewAgentMaxTasks(agent.maxConcurrentTasks || 5);
  };

  const cancelEditing = () => {
    setEditingAgent(null);
    setIsAddingAgent(false);
    setNewAgentName('');
    setNewAgentSkills('');
    setNewAgentAvailability(100);
    setNewAgentMaxTasks(5);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <User size={24} className="text-gray-700 dark:text-gray-300" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Agent Roster</h2>
        </div>
        {!isAddingAgent && !editingAgent && (
          <button
            onClick={() => setIsAddingAgent(true)}
            className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            <Plus size={16} />
            Add Agent
          </button>
        )}
      </div>

      {/* Add/Edit Agent Form */}
      {(isAddingAgent || editingAgent) && (
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            {editingAgent ? 'Edit Agent' : 'New Agent'}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                placeholder="e.g., Sarah Johnson"
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Skills (comma-separated)
              </label>
              <input
                type="text"
                value={newAgentSkills}
                onChange={(e) => setNewAgentSkills(e.target.value)}
                placeholder="e.g., React, TypeScript, API Design"
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Availability (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newAgentAvailability}
                  onChange={(e) => setNewAgentAvailability(parseInt(e.target.value))}
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Concurrent Tasks
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newAgentMaxTasks}
                  onChange={(e) => setNewAgentMaxTasks(parseInt(e.target.value))}
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={cancelEditing}
                className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingAgent ? handleUpdateAgent : handleAddAgent}
                disabled={!newAgentName.trim()}
                className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingAgent ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent List */}
      <div className="space-y-3">
        {agents.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
            <p>No agents yet</p>
            <p className="text-xs mt-1">Add agents to start assigning tasks</p>
          </div>
        ) : (
          agents.map((agent) => {
            const stats = agentStats?.get(agent.id);
            const workloadPercentage = agent.maxConcurrentTasks
              ? ((agent.currentTaskCount || 0) / agent.maxConcurrentTasks) * 100
              : 0;

            return (
              <div
                key={agent.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                      style={{ backgroundColor: agent.avatarColor || '#6b7280' }}
                    >
                      {getInitials(agent.name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {agent.name}
                      </h3>

                      {/* Skills */}
                      {agent.skills && agent.skills.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {agent.skills.slice(0, 5).map((skill) => (
                            <span
                              key={skill}
                              className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded"
                            >
                              {skill}
                            </span>
                          ))}
                          {agent.skills.length > 5 && (
                            <span className="text-xs px-2 py-0.5 text-gray-500 dark:text-gray-400">
                              +{agent.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                          <TrendingUp size={14} />
                          <span>
                            Availability: {agent.availability || 100}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                          <Clock size={14} />
                          <span>
                            Workload: {agent.currentTaskCount || 0}/{agent.maxConcurrentTasks || 5}
                          </span>
                        </div>
                        {stats && (
                          <>
                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                              <Award size={14} />
                              <span>
                                Quality: {stats.averageQualityScore.toFixed(1)}/5
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                              <TrendingUp size={14} />
                              <span>
                                On-time: {stats.onTimePercentage.toFixed(0)}%
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Workload bar */}
                      <div className="mt-2">
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              workloadPercentage >= 100
                                ? 'bg-red-500'
                                : workloadPercentage >= 80
                                ? 'bg-orange-500'
                                : workloadPercentage >= 50
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(workloadPercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => startEditing(agent)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Edit agent"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteAgent(agent.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete agent"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
