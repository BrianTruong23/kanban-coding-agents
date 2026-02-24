'use client';

import { useState } from 'react';
import { CodingAgent } from '@/types/agent';
import { Users, Plus, Edit2, Trash2, Star, TrendingUp, Clock, CheckCircle, X } from 'lucide-react';

interface AgentRosterManagerProps {
  agents: CodingAgent[];
  onAddAgent: (agent: Omit<CodingAgent, 'id' | 'createdAt'>) => void;
  onUpdateAgent: (agent: CodingAgent) => void;
  onDeleteAgent: (agentId: string) => void;
  onClose: () => void;
}

export const AgentRosterManager = ({
  agents,
  onAddAgent,
  onUpdateAgent,
  onDeleteAgent,
  onClose,
}: AgentRosterManagerProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingAgent, setEditingAgent] = useState<CodingAgent | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Users className="text-purple-600 dark:text-purple-400" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Agent Roster Management
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage your coding agents and their skills
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add Agent Button */}
          <button
            onClick={() => setIsAdding(true)}
            className="w-full mb-4 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
          >
            <Plus size={20} />
            Add New Agent
          </button>

          {/* Agent List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onEdit={() => setEditingAgent(agent)}
                onDelete={() => {
                  if (confirm(`Are you sure you want to delete ${agent.name}?`)) {
                    onDeleteAgent(agent.id);
                  }
                }}
              />
            ))}
          </div>

          {agents.length === 0 && !isAdding && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>No agents yet. Add your first agent to get started!</p>
            </div>
          )}
        </div>

        {/* Agent Form Modal */}
        {(isAdding || editingAgent) && (
          <AgentForm
            agent={editingAgent}
            onSave={(agentData) => {
              if (editingAgent) {
                onUpdateAgent({ ...editingAgent, ...agentData });
              } else {
                onAddAgent(agentData);
              }
              setIsAdding(false);
              setEditingAgent(null);
            }}
            onCancel={() => {
              setIsAdding(false);
              setEditingAgent(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

const AgentCard = ({
  agent,
  onEdit,
  onDelete,
}: {
  agent: CodingAgent;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 ${agent.avatarColor || 'bg-gray-500'} rounded-full flex items-center justify-center text-white font-semibold text-lg`}
          >
            {agent.avatar || agent.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {agent.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${getPerformanceColor(agent.performanceScore)}`}>
                {agent.performanceScore.toFixed(0)}%
              </span>
              {!agent.isAvailable && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                  Unavailable
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {agent.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {agent.description}
        </p>
      )}

      {/* Skills */}
      {agent.skills.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {agent.skills.map(skill => (
              <span
                key={skill}
                className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-1">
          <CheckCircle size={12} />
          <span>{agent.tasksCompleted} done</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>{agent.tasksInProgress} active</span>
        </div>
        {agent.averageCompletionTimeHours && (
          <div className="flex items-center gap-1">
            <TrendingUp size={12} />
            <span>{agent.averageCompletionTimeHours.toFixed(1)}h avg</span>
          </div>
        )}
      </div>
    </div>
  );
};

const AgentForm = ({
  agent,
  onSave,
  onCancel,
}: {
  agent: CodingAgent | null;
  onSave: (agent: Omit<CodingAgent, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState(agent?.name || '');
  const [description, setDescription] = useState(agent?.description || '');
  const [skillsInput, setSkillsInput] = useState(agent?.skills.join(', ') || '');
  const [isAvailable, setIsAvailable] = useState(agent?.isAvailable ?? true);
  const [avatarColor, setAvatarColor] = useState(agent?.avatarColor || 'bg-blue-500');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const skills = skillsInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    onSave({
      name,
      description: description || undefined,
      avatar: name.charAt(0),
      avatarColor,
      skills,
      performanceScore: agent?.performanceScore || 50,
      tasksCompleted: agent?.tasksCompleted || 0,
      tasksInProgress: agent?.tasksInProgress || 0,
      averageCompletionTimeHours: agent?.averageCompletionTimeHours,
      isAvailable,
    });
  };

  const colorOptions = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-indigo-500',
  ];

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {agent ? 'Edit Agent' : 'Add New Agent'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg h-20 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="e.g., Specializes in frontend development"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Skills (comma-separated)
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., react, typescript, nextjs, api"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Avatar Color
            </label>
            <div className="flex gap-2">
              {colorOptions.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAvatarColor(color)}
                  className={`w-8 h-8 ${color} rounded-full ${
                    avatarColor === color ? 'ring-2 ring-offset-2 ring-purple-500' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              Available for task assignment
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
            >
              {agent ? 'Save Changes' : 'Add Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
