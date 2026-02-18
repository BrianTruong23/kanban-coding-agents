'use client';

import { useState } from 'react';
import { X, Plus, Edit2, Trash2, Save, UserPlus } from 'lucide-react';
import { CodingAgent } from '@/types/agent';

interface AgentRosterModalProps {
  agents: CodingAgent[];
  onClose: () => void;
  onUpdateAgent: (agent: CodingAgent) => void;
  onDeleteAgent: (id: string) => void;
  onAddAgent: (agent: Omit<CodingAgent, 'id' | 'createdAt'>) => void;
}

export const AgentRosterModal = ({
  agents,
  onClose,
  onUpdateAgent,
  onDeleteAgent,
  onAddAgent,
}: AgentRosterModalProps) => {
  const [editingAgent, setEditingAgent] = useState<CodingAgent | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: '',
    description: '',
    skills: [] as string[],
    specialization: '',
    avatarColor: 'bg-blue-500',
    performanceScore: 80,
    tasksCompleted: 0,
    tasksInProgress: 0,
    availabilityStatus: 'available' as const,
  });
  const [skillInput, setSkillInput] = useState('');

  const avatarColors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-cyan-500',
  ];

  const handleSaveEdit = () => {
    if (editingAgent) {
      onUpdateAgent(editingAgent);
      setEditingAgent(null);
    }
  };

  const handleAddAgent = () => {
    if (!newAgent.name.trim()) {
      alert('Agent name is required');
      return;
    }

    onAddAgent(newAgent);
    setIsAddingNew(false);
    setNewAgent({
      name: '',
      description: '',
      skills: [],
      specialization: '',
      avatarColor: 'bg-blue-500',
      performanceScore: 80,
      tasksCompleted: 0,
      tasksInProgress: 0,
      availabilityStatus: 'available',
    });
    setSkillInput('');
  };

  const addSkill = (skills: string[], setSkills: (skills: string[]) => void) => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string, skills: string[], setSkills: (skills: string[]) => void) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const renderAgentCard = (agent: CodingAgent) => {
    const isEditing = editingAgent?.id === agent.id;

    return (
      <div
        key={agent.id}
        className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <div
                className={`w-12 h-12 rounded-full ${editingAgent.avatarColor} flex items-center justify-center text-white text-xl font-bold`}
              >
                {editingAgent.name.charAt(0) || '?'}
              </div>
              <select
                value={editingAgent.avatarColor}
                onChange={(e) => setEditingAgent({ ...editingAgent, avatarColor: e.target.value })}
                className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded"
              >
                {avatarColors.map(color => (
                  <option key={color} value={color}>
                    {color.replace('bg-', '').replace('-500', '')}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div
              className={`w-12 h-12 rounded-full ${agent.avatarColor} flex items-center justify-center text-white text-xl font-bold flex-shrink-0`}
            >
              {agent.name.charAt(0)}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  value={editingAgent.name}
                  onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                  className="w-full px-2 py-1 text-sm font-semibold border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded"
                  placeholder="Agent name"
                />
                <textarea
                  value={editingAgent.description || ''}
                  onChange={(e) => setEditingAgent({ ...editingAgent, description: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded resize-none"
                  placeholder="Description"
                  rows={2}
                />
                <input
                  value={editingAgent.specialization || ''}
                  onChange={(e) => setEditingAgent({ ...editingAgent, specialization: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded"
                  placeholder="Specialization"
                />
                <div>
                  <div className="flex gap-2 mb-2">
                    <input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill(editingAgent.skills, (skills) =>
                            setEditingAgent({ ...editingAgent, skills })
                          );
                        }
                      }}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded"
                      placeholder="Add skill (press Enter)"
                    />
                    <button
                      onClick={() =>
                        addSkill(editingAgent.skills, (skills) =>
                          setEditingAgent({ ...editingAgent, skills })
                        )
                      }
                      className="px-2 py-1 bg-black dark:bg-white text-white dark:text-black rounded text-xs"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {editingAgent.skills.map(skill => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs flex items-center gap-1"
                      >
                        {skill}
                        <button
                          onClick={() =>
                            removeSkill(skill, editingAgent.skills, (skills) =>
                              setEditingAgent({ ...editingAgent, skills })
                            )
                          }
                          className="hover:text-blue-900 dark:hover:text-blue-100"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">Performance</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editingAgent.performanceScore}
                      onChange={(e) =>
                        setEditingAgent({
                          ...editingAgent,
                          performanceScore: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">Status</label>
                    <select
                      value={editingAgent.availabilityStatus}
                      onChange={(e) =>
                        setEditingAgent({
                          ...editingAgent,
                          availabilityStatus: e.target.value as any,
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded"
                    >
                      <option value="available">Available</option>
                      <option value="busy">Busy</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {agent.name}
                    </h3>
                    {agent.specialization && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {agent.specialization}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        agent.availabilityStatus === 'available'
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                          : agent.availabilityStatus === 'busy'
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                          : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {agent.availabilityStatus}
                    </span>
                  </div>
                </div>

                {agent.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {agent.description}
                  </p>
                )}

                {agent.skills && agent.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {agent.skills.map(skill => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Performance</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {agent.performanceScore}/100
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Completed</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {agent.tasksCompleted}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">In Progress</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {agent.tasksInProgress}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                  title="Save"
                >
                  <Save size={16} />
                </button>
                <button
                  onClick={() => setEditingAgent(null)}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                  title="Cancel"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditingAgent(agent)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete agent ${agent.name}?`)) {
                      onDeleteAgent(agent.id);
                    }
                  }}
                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Agent Roster Management
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your coding agents, skills, and performance metrics
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Add New Agent Form */}
          {isAddingNew && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UserPlus size={18} />
                New Agent
              </h3>
              <input
                value={newAgent.name}
                onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg"
                placeholder="Agent name *"
              />
              <textarea
                value={newAgent.description}
                onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg resize-none"
                placeholder="Description"
                rows={2}
              />
              <input
                value={newAgent.specialization}
                onChange={(e) => setNewAgent({ ...newAgent, specialization: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg"
                placeholder="Specialization (e.g., Frontend Development)"
              />
              <div>
                <div className="flex gap-2 mb-2">
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill(newAgent.skills, (skills) =>
                          setNewAgent({ ...newAgent, skills })
                        );
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg"
                    placeholder="Add skill (press Enter)"
                  />
                  <button
                    onClick={() =>
                      addSkill(newAgent.skills, (skills) => setNewAgent({ ...newAgent, skills }))
                    }
                    className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {newAgent.skills.map(skill => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-sm flex items-center gap-1"
                    >
                      {skill}
                      <button
                        onClick={() =>
                          removeSkill(skill, newAgent.skills, (skills) =>
                            setNewAgent({ ...newAgent, skills })
                          )
                        }
                        className="hover:text-blue-900 dark:hover:text-blue-100"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Avatar Color
                  </label>
                  <select
                    value={newAgent.avatarColor}
                    onChange={(e) => setNewAgent({ ...newAgent, avatarColor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg"
                  >
                    {avatarColors.map(color => (
                      <option key={color} value={color}>
                        {color.replace('bg-', '').replace('-500', '')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Initial Performance
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newAgent.performanceScore}
                    onChange={(e) =>
                      setNewAgent({ ...newAgent, performanceScore: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewAgent({
                      name: '',
                      description: '',
                      skills: [],
                      specialization: '',
                      avatarColor: 'bg-blue-500',
                      performanceScore: 80,
                      tasksCompleted: 0,
                      tasksInProgress: 0,
                      availabilityStatus: 'available',
                    });
                    setSkillInput('');
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAgent}
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200"
                >
                  Create Agent
                </button>
              </div>
            </div>
          )}

          {/* Agent List */}
          {agents.map(agent => renderAgentCard(agent))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {agents.length} agent{agents.length !== 1 ? 's' : ''} total
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Close
            </button>
            {!isAddingNew && (
              <button
                onClick={() => setIsAddingNew(true)}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 flex items-center gap-2"
              >
                <Plus size={16} />
                Add Agent
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
