'use client';

import { useState } from 'react';
import { CodingAgent, AgentSkill } from '@/types/agent';
import { Users, Plus, Edit2, Trash2, X, Star, TrendingUp, CheckCircle } from 'lucide-react';

interface AgentRosterProps {
  agents: CodingAgent[];
  onUpdateAgent: (agent: CodingAgent) => void;
  onDeleteAgent: (id: string) => void;
  onAddAgent: (agent: Omit<CodingAgent, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export const AgentRoster = ({ agents, onUpdateAgent, onDeleteAgent, onAddAgent, onClose }: AgentRosterProps) => {
  const [editingAgent, setEditingAgent] = useState<CodingAgent | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-5xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="text-blue-500" />
              Agent Roster Management
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your coding agents, their skills, and performance metrics
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
          >
            <Plus size={16} />
            Add New Agent
          </button>
        </div>

        <div className="grid gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={() => setEditingAgent(agent)}
              onDelete={() => onDeleteAgent(agent.id)}
            />
          ))}
        </div>

        {(editingAgent || isAdding) && (
          <AgentEditor
            agent={editingAgent}
            onSave={(agent) => {
              if (editingAgent) {
                onUpdateAgent({ ...agent, id: editingAgent.id, createdAt: editingAgent.createdAt });
              } else {
                onAddAgent(agent);
              }
              setEditingAgent(null);
              setIsAdding(false);
            }}
            onCancel={() => {
              setEditingAgent(null);
              setIsAdding(false);
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
  const successRate = agent.performanceMetrics?.successRate || 0;
  const tasksCompleted = agent.totalTasksCompleted || 0;
  const tasksAssigned = agent.totalTasksAssigned || 0;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800/50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
              agent.avatarColor || 'bg-gray-500'
            }`}
          >
            {agent.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">{agent.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{agent.description}</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  agent.isActive
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {agent.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Skills */}
      {agent.skills && agent.skills.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase">Skills</h4>
          <div className="flex flex-wrap gap-2">
            {agent.skills.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs"
              >
                <span className="font-medium">{skill.name}</span>
                <div className="flex">
                  {Array.from({ length: skill.proficiency }).map((_, i) => (
                    <Star key={i} size={10} fill="currentColor" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className="text-green-500" />
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Success Rate</div>
            <div className="font-bold text-gray-900 dark:text-white">{successRate.toFixed(0)}%</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-blue-500" />
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
            <div className="font-bold text-gray-900 dark:text-white">
              {tasksCompleted}/{tasksAssigned}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Star size={16} className="text-yellow-500" />
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Avg Hours</div>
            <div className="font-bold text-gray-900 dark:text-white">
              {agent.avgCompletionHours?.toFixed(1) || 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AgentEditor = ({
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
  const [isActive, setIsActive] = useState(agent?.isActive ?? true);
  const [skills, setSkills] = useState<AgentSkill[]>(agent?.skills || []);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState<1 | 2 | 3 | 4 | 5>(3);

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;

    const newSkill: AgentSkill = {
      id: `skill-${Date.now()}`,
      name: newSkillName.trim(),
      category: newSkillCategory.trim() || 'general',
      proficiency: newSkillProficiency,
    };

    setSkills([...skills, newSkill]);
    setNewSkillName('');
    setNewSkillCategory('');
    setNewSkillProficiency(3);
  };

  const handleRemoveSkill = (skillId: string) => {
    setSkills(skills.filter((s) => s.id !== skillId));
  };

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim(),
      avatarColor: agent?.avatarColor || 'bg-gray-500',
      skills,
      performanceMetrics: agent?.performanceMetrics,
      totalTasksCompleted: agent?.totalTasksCompleted || 0,
      totalTasksAssigned: agent?.totalTasksAssigned || 0,
      avgCompletionHours: agent?.avgCompletionHours,
      isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {agent ? 'Edit Agent' : 'Add New Agent'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
              placeholder="e.g., Sarah Johnson"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg h-20 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none"
              placeholder="e.g., Backend specialist with expertise in API development"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
              Active (available for task assignment)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skills</label>
            <div className="space-y-2 mb-3">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900 dark:text-white">{skill.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">({skill.category})</span>
                    <div className="flex">
                      {Array.from({ length: skill.proficiency }).map((_, i) => (
                        <Star key={i} size={12} fill="currentColor" className="text-yellow-500" />
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveSkill(skill.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-12 gap-2">
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                className="col-span-5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                placeholder="Skill name"
              />
              <input
                type="text"
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value)}
                className="col-span-4 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                placeholder="Category"
              />
              <select
                value={newSkillProficiency}
                onChange={(e) => setNewSkillProficiency(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                className="col-span-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
              </select>
              <button
                onClick={handleAddSkill}
                className="col-span-1 bg-black dark:bg-white text-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {agent ? 'Update Agent' : 'Add Agent'}
          </button>
        </div>
      </div>
    </div>
  );
};
