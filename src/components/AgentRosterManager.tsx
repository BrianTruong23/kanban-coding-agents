'use client';

import { useState } from 'react';
import { CodingAgent } from '@/types/agent';
import { X, Plus, User, Award, TrendingUp, Tag } from 'lucide-react';

interface AgentRosterManagerProps {
  isOpen: boolean;
  onClose: () => void;
  agents: CodingAgent[];
  onUpdateAgent: (agent: CodingAgent) => void;
}

const SKILL_SUGGESTIONS = [
  'React', 'Next.js', 'TypeScript', 'JavaScript', 'Python', 'Node.js',
  'API', 'Database', 'SQL', 'PostgreSQL', 'MongoDB',
  'CSS', 'Tailwind', 'HTML', 'UI', 'UX',
  'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Cloud',
  'Testing', 'Jest', 'Cypress',
  'iOS', 'Android', 'React Native', 'Flutter',
  'Go', 'Rust', 'Java',
];

export const AgentRosterManager = ({ isOpen, onClose, agents, onUpdateAgent }: AgentRosterManagerProps) => {
  const [selectedAgent, setSelectedAgent] = useState<CodingAgent | null>(null);
  const [editingAgent, setEditingAgent] = useState<CodingAgent | null>(null);
  const [newSkill, setNewSkill] = useState('');

  if (!isOpen) return null;

  const handleEditAgent = (agent: CodingAgent) => {
    setEditingAgent({ ...agent });
  };

  const handleSaveAgent = () => {
    if (editingAgent) {
      onUpdateAgent(editingAgent);
      setEditingAgent(null);
    }
  };

  const handleAddSkill = (skill: string) => {
    if (!editingAgent) return;

    const skills = editingAgent.skills || [];
    if (!skills.includes(skill)) {
      setEditingAgent({
        ...editingAgent,
        skills: [...skills, skill],
      });
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skill: string) => {
    if (!editingAgent) return;

    setEditingAgent({
      ...editingAgent,
      skills: (editingAgent.skills || []).filter(s => s !== skill),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-5xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Agent Roster Management</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage agent skills, performance, and availability
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex">
          {/* Agent List */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4">
            <div className="space-y-2">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedAgent?.id === agent.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                      : 'bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full ${agent.avatarColor || 'bg-gray-400'} flex items-center justify-center text-white font-semibold flex-shrink-0`}>
                      {agent.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-white">{agent.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{agent.description}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 text-xs">
                          <Award size={12} className="text-yellow-500" />
                          <span className="text-gray-600 dark:text-gray-400">{agent.performanceScore || 100}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs ${getAvailabilityStyles(agent.availability || 'available')}`}>
                          {agent.availability || 'available'}
                        </span>
                      </div>
                      {agent.skills && agent.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {agent.skills.slice(0, 3).map((skill) => (
                            <span key={skill} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                          {agent.skills.length > 3 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              +{agent.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agent Details */}
          <div className="flex-1 overflow-y-auto p-6">
            {editingAgent ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">Edit Agent</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingAgent(null)}
                      className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveAgent}
                      className="px-3 py-1.5 text-sm bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

                {/* Performance Score */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Performance Score (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingAgent.performanceScore || 100}
                    onChange={(e) => setEditingAgent({ ...editingAgent, performanceScore: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  />
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Availability
                  </label>
                  <select
                    value={editingAgent.availability || 'available'}
                    onChange={(e) => setEditingAgent({ ...editingAgent, availability: e.target.value as any })}
                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Skills
                  </label>

                  {/* Current Skills */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(editingAgent.skills || []).map((skill) => (
                      <div key={skill} className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg">
                        <span className="text-sm">{skill}</span>
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-blue-900 dark:hover:text-blue-100"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add New Skill */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newSkill.trim()) {
                          handleAddSkill(newSkill.trim());
                        }
                      }}
                      placeholder="Add a skill..."
                      className="flex-1 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                    />
                    <button
                      onClick={() => newSkill.trim() && handleAddSkill(newSkill.trim())}
                      disabled={!newSkill.trim()}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Skill Suggestions */}
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick add:</div>
                    <div className="flex flex-wrap gap-2">
                      {SKILL_SUGGESTIONS.filter(s => !(editingAgent.skills || []).includes(s)).slice(0, 12).map((skill) => (
                        <button
                          key={skill}
                          onClick={() => handleAddSkill(skill)}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          + {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedAgent ? (
              <div className="space-y-6">
                {/* Agent Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full ${selectedAgent.avatarColor || 'bg-gray-400'} flex items-center justify-center text-white text-2xl font-semibold`}>
                      {selectedAgent.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedAgent.name}</h4>
                      <p className="text-gray-600 dark:text-gray-400">{selectedAgent.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEditAgent(selectedAgent)}
                    className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 text-sm font-medium"
                  >
                    Edit Agent
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                      <Award size={16} />
                      <span className="text-xs font-medium">Performance</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedAgent.performanceScore || 100}
                      <span className="text-sm text-gray-500 dark:text-gray-400">/100</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                      <TrendingUp size={16} />
                      <span className="text-xs font-medium">Tasks Completed</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedAgent.tasksCompleted || 0}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                      <User size={16} />
                      <span className="text-xs font-medium">Status</span>
                    </div>
                    <div className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold ${getAvailabilityStyles(selectedAgent.availability || 'available')}`}>
                      {(selectedAgent.availability || 'available').toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Tag size={16} />
                    Skills & Expertise
                  </h5>
                  {selectedAgent.skills && selectedAgent.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedAgent.skills.map((skill) => (
                        <span key={skill} className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">No skills added yet</p>
                  )}
                </div>

                {/* Current Workload */}
                <div>
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Current Workload</h5>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedAgent.tasksInProgress || 0} task(s) in progress
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                <div className="text-center">
                  <User size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select an agent to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function getAvailabilityStyles(availability: string) {
  switch (availability) {
    case 'available':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    case 'busy':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    case 'offline':
      return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
  }
}
