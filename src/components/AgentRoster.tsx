'use client';

import { useState } from 'react';
import { CodingAgent } from '@/types/agent';
import { Task } from '@/types/task';
import { Users, Award, Clock, TrendingUp, Plus, Edit2, X } from 'lucide-react';
import { balanceWorkload } from '@/lib/agentAssignment';

interface AgentRosterProps {
  agents: CodingAgent[];
  tasks: Task[];
  onUpdateAgent: (agent: CodingAgent) => void;
  onAddAgent?: (agent: Omit<CodingAgent, 'id' | 'createdAt'>) => void;
}

export const AgentRoster = ({ agents, tasks, onUpdateAgent, onAddAgent }: AgentRosterProps) => {
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [formData, setFormData] = useState<Partial<CodingAgent>>({});

  const workload = balanceWorkload(tasks, agents);

  const handleEdit = (agent: CodingAgent) => {
    setEditingAgent(agent.id);
    setFormData(agent);
  };

  const handleSave = () => {
    if (editingAgent && formData) {
      onUpdateAgent(formData as CodingAgent);
      setEditingAgent(null);
      setFormData({});
    }
  };

  const handleAddNew = () => {
    if (onAddAgent && formData.name) {
      onAddAgent({
        name: formData.name,
        description: formData.description,
        avatarColor: formData.avatarColor || 'bg-blue-500',
      });
      setIsAddingAgent(false);
      setFormData({});
    }
  };

  const handleCancel = () => {
    setEditingAgent(null);
    setIsAddingAgent(false);
    setFormData({});
  };

  const renderAgentCard = (agent: CodingAgent) => {
    const isEditing = editingAgent === agent.id;
    const agentWorkload = workload[agent.id] || 0;
    const completedTasks = tasks.filter(
      t => t.assignedAgentId === agent.id && t.status === 'done'
    ).length;

    return (
      <div
        key={agent.id}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        {isEditing ? (
          <div className="space-y-3">
            <input
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Agent name"
            />
            <textarea
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm h-16 resize-none"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description"
            />
            <input
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm"
              value={formData.skills?.join(', ') || ''}
              onChange={(e) =>
                setFormData({ ...formData, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })
              }
              placeholder="Skills (comma-separated)"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Agent Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 ${agent.avatarColor || 'bg-blue-500'} rounded-full flex items-center justify-center text-white font-bold text-lg`}
                >
                  {agent.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {agent.name}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {agent.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleEdit(agent)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Edit2 size={16} />
              </button>
            </div>

            {/* Skills */}
            {agent.skills && agent.skills.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {agent.skills.map(skill => (
                    <span
                      key={skill}
                      className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
                  <Award size={14} />
                  <span className="text-xs">Performance</span>
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {agent.performanceScore || 75}/100
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
                  <TrendingUp size={14} />
                  <span className="text-xs">Completed</span>
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {completedTasks} tasks
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
                  <Clock size={14} />
                  <span className="text-xs">Avg Time</span>
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {agent.averageCompletionTime || 24}h
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
                  <Users size={14} />
                  <span className="text-xs">Workload</span>
                </div>
                <div className={`font-semibold ${
                  agentWorkload > 80 ? 'text-red-600 dark:text-red-400' :
                  agentWorkload > 40 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  {Math.round(agentWorkload)}h
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Users size={20} />
          Agent Roster ({agents.length})
        </h2>
        {onAddAgent && (
          <button
            onClick={() => setIsAddingAgent(true)}
            className="bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            <Plus size={16} />
            Add Agent
          </button>
        )}
      </div>

      {/* Add Agent Form */}
      {isAddingAgent && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
            Add New Agent
            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </h3>
          <div className="space-y-3">
            <input
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Agent name"
            />
            <textarea
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm h-16 resize-none"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description (e.g., Specializes in React and TypeScript)"
            />
            <input
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm"
              value={formData.skills?.join(', ') || ''}
              onChange={(e) =>
                setFormData({ ...formData, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })
              }
              placeholder="Skills (comma-separated, e.g., React, TypeScript, Node.js)"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddNew}
                disabled={!formData.name}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-3 py-2 rounded text-sm font-medium"
              >
                Create Agent
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(agent => renderAgentCard(agent))}
        </div>
      </div>
    </div>
  );
};
