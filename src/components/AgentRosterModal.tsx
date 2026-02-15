'use client';

import { useState } from 'react';
import { X, Users, TrendingUp, Clock, CheckCircle, Edit2, Plus } from 'lucide-react';
import { CodingAgent, AgentSkill } from '@/types/agent';
import { getAgentUtilization } from '@/lib/agentOrchestration';

interface AgentRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: CodingAgent[];
  onUpdateAgent: (agent: CodingAgent) => void;
  onAddAgent: (agent: CodingAgent) => void;
}

const AVAILABLE_SKILLS: AgentSkill[] = [
  'frontend',
  'backend',
  'fullstack',
  'devops',
  'mobile',
  'testing',
  'ui-ux',
  'database',
  'api-design',
  'security',
];

export const AgentRosterModal = ({
  isOpen,
  onClose,
  agents,
  onUpdateAgent,
  onAddAgent,
}: AgentRosterModalProps) => {
  const [editingAgent, setEditingAgent] = useState<CodingAgent | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  if (!isOpen) return null;

  const stats = getAgentUtilization(agents);

  const handleSaveAgent = () => {
    if (editingAgent) {
      if (isAddingNew) {
        onAddAgent(editingAgent);
        setIsAddingNew(false);
      } else {
        onUpdateAgent(editingAgent);
      }
      setEditingAgent(null);
    }
  };

  const handleAddNew = () => {
    const newAgent: CodingAgent = {
      id: `temp-${Date.now()}`,
      name: '',
      description: '',
      avatar: '',
      avatarColor: 'bg-blue-500',
      skills: [],
      performance: {
        tasksCompleted: 0,
        averageCompletionTime: 0,
        successRate: 100,
        lastActive: Date.now(),
      },
      availability: 'available',
      createdAt: Date.now(),
    };
    setEditingAgent(newAgent);
    setIsAddingNew(true);
  };

  const toggleSkill = (skill: AgentSkill) => {
    if (!editingAgent) return;

    const skills = [...editingAgent.skills];
    const index = skills.indexOf(skill);

    if (index >= 0) {
      skills.splice(index, 1);
    } else {
      skills.push(skill);
    }

    setEditingAgent({ ...editingAgent, skills });
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30';
      case 'busy':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30';
      case 'offline':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Agent Roster Management
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage agent skills, performance, and availability
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Stats Overview */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Users size={18} className="text-blue-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Total Agents
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalAgents}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={18} className="text-green-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Available
                </span>
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.availableAgents}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={18} className="text-yellow-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Busy
                </span>
              </div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.busyAgents}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-purple-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Avg Success Rate
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(stats.averageSuccessRate)}%
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={18} className="text-orange-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Avg Time
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(stats.averageCompletionTime)}h
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {editingAgent ? (
            /* Edit/Add Agent Form */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isAddingNew ? 'Add New Agent' : 'Edit Agent'}
                </h3>
                <button
                  onClick={() => {
                    setEditingAgent(null);
                    setIsAddingNew(false);
                  }}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                    placeholder="Agent Name"
                    value={editingAgent.name}
                    onChange={(e) =>
                      setEditingAgent({ ...editingAgent, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Availability
                  </label>
                  <select
                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                    value={editingAgent.availability}
                    onChange={(e) =>
                      setEditingAgent({
                        ...editingAgent,
                        availability: e.target.value as any,
                      })
                    }
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none"
                  placeholder="Describe the agent's expertise and specialization..."
                  value={editingAgent.description}
                  onChange={(e) =>
                    setEditingAgent({ ...editingAgent, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Skills *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {AVAILABLE_SKILLS.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        editingAgent.skills.includes(skill)
                          ? 'bg-black dark:bg-white text-white dark:text-black'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setEditingAgent(null);
                    setIsAddingNew(false);
                  }}
                  className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAgent}
                  disabled={!editingAgent.name || editingAgent.skills.length === 0}
                  className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingNew ? 'Add Agent' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            /* Agents List */
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Agents ({agents.length})
                </h3>
                <button
                  onClick={handleAddNew}
                  className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  <Plus size={16} />
                  Add Agent
                </button>
              </div>

              <div className="space-y-3">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-semibold ${
                            agent.avatarColor || 'bg-gray-500'
                          }`}
                        >
                          {agent.avatar || agent.name.slice(0, 2).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {agent.name}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${getAvailabilityColor(
                                agent.availability
                              )}`}
                            >
                              {agent.availability}
                            </span>
                          </div>

                          {agent.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {agent.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2 mb-3">
                            {agent.skills.map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">
                                Tasks:
                              </span>{' '}
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {agent.performance.tasksCompleted}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">
                                Success:
                              </span>{' '}
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {Math.round(agent.performance.successRate)}%
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">
                                Avg Time:
                              </span>{' '}
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {Math.round(agent.performance.averageCompletionTime)}h
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setEditingAgent(agent)}
                        className="ml-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="Edit agent"
                      >
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
