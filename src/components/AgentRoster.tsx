'use client';

import { CodingAgent } from '@/types/agent';
import { Skill, SkillCategory } from '@/types/skills';
import { useState } from 'react';
import { Users, Plus, Edit, Trash2, Award, TrendingUp, X } from 'lucide-react';
import { getInitials, getAvatarColor } from '@/lib/utils';
import clsx from 'clsx';

interface AgentRosterProps {
  agents: CodingAgent[];
  onAddAgent?: (agent: Partial<CodingAgent>) => void;
  onUpdateAgent?: (agent: CodingAgent) => void;
  onDeleteAgent?: (agentId: string) => void;
}

const SKILL_CATEGORIES: SkillCategory[] = [
  'frontend',
  'backend',
  'database',
  'devops',
  'mobile',
  'testing',
  'design',
  'security',
  'ai-ml',
  'other',
];

export const AgentRoster = ({ agents, onAddAgent, onUpdateAgent, onDeleteAgent }: AgentRosterProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingAgent, setEditingAgent] = useState<CodingAgent | null>(null);
  const [viewingAgent, setViewingAgent] = useState<CodingAgent | null>(null);

  const handleSaveAgent = (agent: Partial<CodingAgent>) => {
    if (editingAgent) {
      onUpdateAgent?.({ ...editingAgent, ...agent });
      setEditingAgent(null);
    } else {
      onAddAgent?.(agent);
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Users size={20} />
          Agent Roster ({agents.length})
        </h3>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          <Plus size={16} /> Add Agent
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onEdit={() => setEditingAgent(agent)}
            onDelete={() => onDeleteAgent?.(agent.id)}
            onView={() => setViewingAgent(agent)}
          />
        ))}
      </div>

      {agents.length === 0 && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <Users size={48} className="mx-auto mb-3" />
          <p>No agents yet</p>
          <p className="text-sm mt-1">Add agents to start assigning tasks</p>
        </div>
      )}

      {(isAdding || editingAgent) && (
        <AgentFormModal
          agent={editingAgent}
          onSave={handleSaveAgent}
          onClose={() => {
            setIsAdding(false);
            setEditingAgent(null);
          }}
        />
      )}

      {viewingAgent && (
        <AgentDetailModal
          agent={viewingAgent}
          onClose={() => setViewingAgent(null)}
          onEdit={() => {
            setEditingAgent(viewingAgent);
            setViewingAgent(null);
          }}
        />
      )}
    </div>
  );
};

const AgentCard = ({
  agent,
  onEdit,
  onDelete,
  onView,
}: {
  agent: CodingAgent;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}) => {
  const avatarColor = agent.avatarColor || getAvatarColor(agent.name);
  const initials = agent.avatar || getInitials(agent.name);

  const workloadColor =
    (agent.workload || 0) > 5
      ? 'text-red-600 dark:text-red-400'
      : (agent.workload || 0) > 2
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-green-600 dark:text-green-400';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold', avatarColor)}>
            {initials}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">{agent.name}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {agent.availability || 'available'}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onView}
            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="View details"
          >
            <Award size={16} />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {agent.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{agent.description}</p>
      )}

      <div className="space-y-2">
        {agent.specializations && agent.specializations.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {agent.specializations.slice(0, 3).map(spec => (
              <span
                key={spec}
                className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded"
              >
                {spec}
              </span>
            ))}
            {agent.specializations.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                +{agent.specializations.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">Workload:</span>
          <span className={clsx('font-semibold', workloadColor)}>{agent.workload || 0} tasks</span>
        </div>

        {agent.performanceMetrics && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Success Rate:</span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              {agent.performanceMetrics.successRate}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const AgentFormModal = ({
  agent,
  onSave,
  onClose,
}: {
  agent: CodingAgent | null;
  onSave: (agent: Partial<CodingAgent>) => void;
  onClose: () => void;
}) => {
  const [name, setName] = useState(agent?.name || '');
  const [description, setDescription] = useState(agent?.description || '');
  const [specializations, setSpecializations] = useState<SkillCategory[]>(agent?.specializations || []);
  const [availability, setAvailability] = useState<'available' | 'busy' | 'offline'>(agent?.availability || 'available');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description,
      specializations,
      availability,
      workload: agent?.workload || 0,
    });
  };

  const toggleSpecialization = (spec: SkillCategory) => {
    setSpecializations(prev =>
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {agent ? 'Edit Agent' : 'Add New Agent'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Agent Name *</label>
            <input
              type="text"
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
              placeholder="e.g., Sarah Johnson"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg h-20 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none"
              placeholder="Describe the agent's expertise..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Specializations</label>
            <div className="flex flex-wrap gap-2">
              {SKILL_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleSpecialization(cat)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    specializations.includes(cat)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Availability</label>
            <select
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
              value={availability}
              onChange={e => setAvailability(e.target.value as 'available' | 'busy' | 'offline')}
            >
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
            >
              {agent ? 'Save Changes' : 'Add Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AgentDetailModal = ({
  agent,
  onClose,
  onEdit,
}: {
  agent: CodingAgent;
  onClose: () => void;
  onEdit: () => void;
}) => {
  const avatarColor = agent.avatarColor || getAvatarColor(agent.name);
  const initials = agent.avatar || getInitials(agent.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={clsx('w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold', avatarColor)}>
              {initials}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{agent.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{agent.availability || 'available'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {agent.description && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Description</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">{agent.description}</p>
            </div>
          )}

          {agent.specializations && agent.specializations.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Specializations</h4>
              <div className="flex flex-wrap gap-2">
                {agent.specializations.map(spec => (
                  <span
                    key={spec}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-lg"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {agent.performanceMetrics && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
                <TrendingUp size={14} />
                Performance Metrics
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tasks Completed</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{agent.performanceMetrics.tasksCompleted}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Success Rate</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{agent.performanceMetrics.successRate}%</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Quality Score</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{agent.performanceMetrics.qualityScore}/5</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Velocity</p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{agent.performanceMetrics.velocity}/wk</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Current Status</h4>
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <span className="text-sm text-gray-700 dark:text-gray-300">Current Workload</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{agent.workload || 0} tasks</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
          >
            <Edit size={16} />
            Edit Agent
          </button>
        </div>
      </div>
    </div>
  );
};
