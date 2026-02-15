'use client';

import { useState } from 'react';
import { CodingAgent, Skill, SkillCategory, AgentPerformance, AgentAvailability } from '@/types/agent';
import { generateId } from '@/lib/utils';
import { User, Plus, X, Edit2, Trash2, Award, TrendingUp, Clock } from 'lucide-react';

interface AgentRosterManagerProps {
  agents: CodingAgent[];
  onAddAgent: (agent: CodingAgent) => void;
  onUpdateAgent: (agent: CodingAgent) => void;
  onDeleteAgent: (agentId: string) => void;
}

const SKILL_CATEGORIES: SkillCategory[] = [
  'frontend',
  'backend',
  'database',
  'devops',
  'mobile',
  'testing',
  'design',
  'architecture',
];

export const AgentRosterManager = ({
  agents,
  onAddAgent,
  onUpdateAgent,
  onDeleteAgent,
}: AgentRosterManagerProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingAgent, setEditingAgent] = useState<CodingAgent | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<CodingAgent | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [capacity, setCapacity] = useState('5');
  const [hoursPerWeek, setHoursPerWeek] = useState('40');

  const resetForm = () => {
    setName('');
    setDescription('');
    setSkills([]);
    setCapacity('5');
    setHoursPerWeek('40');
    setIsAdding(false);
    setEditingAgent(null);
  };

  const handleEdit = (agent: CodingAgent) => {
    setEditingAgent(agent);
    setName(agent.name);
    setDescription(agent.description || '');
    setSkills(agent.skills || []);
    setCapacity(agent.availability?.capacity.toString() || '5');
    setHoursPerWeek(agent.availability?.hoursPerWeek?.toString() || '40');
    setIsAdding(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const agentData: CodingAgent = {
      id: editingAgent?.id || generateId(),
      name: name.trim(),
      description: description.trim() || undefined,
      skills: skills.length > 0 ? skills : undefined,
      availability: {
        status: 'available',
        currentWorkload: editingAgent?.availability?.currentWorkload || 0,
        capacity: parseInt(capacity, 10),
        hoursPerWeek: parseInt(hoursPerWeek, 10),
      },
      performance: editingAgent?.performance || {
        tasksCompleted: 0,
        tasksOnTime: 0,
        qualityScore: 85,
      },
      createdAt: editingAgent?.createdAt || Date.now(),
    };

    if (editingAgent) {
      onUpdateAgent(agentData);
    } else {
      onAddAgent(agentData);
    }

    resetForm();
  };

  const addSkill = (category: SkillCategory) => {
    const skill: Skill = {
      id: generateId(),
      category,
      name: category.charAt(0).toUpperCase() + category.slice(1),
      proficiency: 3,
    };
    setSkills([...skills, skill]);
  };

  const updateSkillProficiency = (skillId: string, proficiency: number) => {
    setSkills(skills.map(s => s.id === skillId ? { ...s, proficiency: proficiency as 1 | 2 | 3 | 4 | 5 } : s));
  };

  const removeSkill = (skillId: string) => {
    setSkills(skills.filter(s => s.id !== skillId));
  };

  const getSkillColor = (category: SkillCategory): string => {
    const colors: Record<SkillCategory, string> = {
      frontend: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      backend: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      database: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      devops: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
      mobile: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300',
      testing: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      design: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      architecture: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
    };
    return colors[category];
  };

  const getAvailabilityColor = (status: string): string => {
    switch (status) {
      case 'available':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'busy':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'offline':
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Agent Roster Management
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your team of coding agents with skills, performance, and availability tracking
            </p>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
          >
            <Plus size={16} />
            Add Agent
          </button>
        </div>

        {/* Agent Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Total Agents</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{agents.length}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Available</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-300">
              {agents.filter(a => a.availability?.status === 'available').length}
            </p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium mb-1">Busy</p>
            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
              {agents.filter(a => a.availability?.status === 'busy').length}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">Total Capacity</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
              {agents.reduce((sum, a) => sum + (a.availability?.capacity || 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Agent Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={resetForm}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingAgent ? 'Edit Agent' : 'Add New Agent'}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Agent Name *
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  placeholder="e.g., Frontend Specialist"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none"
                  rows={2}
                  placeholder="Brief description of the agent's role..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Capacity (concurrent tasks)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hours per Week
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(e.target.value)}
                  />
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skills
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {SKILL_CATEGORIES.filter(cat => !skills.find(s => s.category === cat)).map(category => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => addSkill(category)}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      + {category}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {skills.map(skill => (
                    <div key={skill.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getSkillColor(skill.category)}`}>
                        {skill.category}
                      </span>
                      <div className="flex-1 flex items-center gap-2">
                        <label className="text-xs text-gray-600 dark:text-gray-400">Proficiency:</label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={skill.proficiency}
                          onChange={(e) => updateSkillProficiency(skill.id, parseInt(e.target.value, 10))}
                          className="flex-1"
                        />
                        <span className="text-xs font-medium text-gray-900 dark:text-white w-8">
                          {skill.proficiency}/5
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSkill(skill.id)}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
                >
                  {editingAgent ? 'Update Agent' : 'Add Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(agent => (
            <div
              key={agent.id}
              className={`p-4 bg-white dark:bg-gray-800 rounded-lg border-2 transition-all cursor-pointer ${
                selectedAgent?.id === agent.id
                  ? 'border-blue-500 dark:border-blue-500'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedAgent(agent)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <User size={20} className="text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{agent.name}</h4>
                    {agent.availability && (
                      <span className={`text-xs px-2 py-0.5 rounded ${getAvailabilityColor(agent.availability.status)}`}>
                        {agent.availability.status}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(agent);
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete ${agent.name}?`)) {
                        onDeleteAgent(agent.id);
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {agent.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{agent.description}</p>
              )}

              {/* Skills */}
              {agent.skills && agent.skills.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {agent.skills.slice(0, 3).map(skill => (
                      <span key={skill.id} className={`px-2 py-0.5 text-xs font-medium rounded ${getSkillColor(skill.category)}`}>
                        {skill.category} ({skill.proficiency})
                      </span>
                    ))}
                    {agent.skills.length > 3 && (
                      <span className="px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                        +{agent.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Availability */}
              {agent.availability && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Clock size={12} className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {agent.availability.currentWorkload}/{agent.availability.capacity} tasks
                    </span>
                  </div>
                  {agent.availability.hoursPerWeek && (
                    <div className="text-gray-600 dark:text-gray-400">
                      {agent.availability.hoursPerWeek}h/week
                    </div>
                  )}
                </div>
              )}

              {/* Performance */}
              {agent.performance && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">Completed</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {agent.performance.tasksCompleted}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">On Time</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {agent.performance.tasksCompleted > 0
                          ? Math.round((agent.performance.tasksOnTime / agent.performance.tasksCompleted) * 100)
                          : 0}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">Quality</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {agent.performance.qualityScore}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {agents.length === 0 && (
            <div className="col-span-full text-center py-12">
              <User size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">No agents yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Add your first agent to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
