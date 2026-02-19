'use client';

import { useState } from 'react';
import { CodingAgent, AgentSkill } from '@/types/agent';
import { X, Users, TrendingUp, Clock, Award, Edit2, Trash2, Plus } from 'lucide-react';

interface AgentRosterManagerProps {
  agents: CodingAgent[];
  onUpdateAgent: (agent: CodingAgent) => void;
  onDeleteAgent: (id: string) => void;
  onAddAgent: (agent: Omit<CodingAgent, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

const AVAILABLE_SKILLS: AgentSkill[] = [
  'react',
  'nextjs',
  'typescript',
  'nodejs',
  'database',
  'api',
  'ui-ux',
  'testing',
  'devops',
  'mobile',
  'backend',
  'frontend',
  'fullstack',
];

const SKILL_COLORS: Record<AgentSkill, string> = {
  'react': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  'nextjs': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  'typescript': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'nodejs': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'database': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'api': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'ui-ux': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'testing': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'devops': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  'mobile': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  'backend': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  'frontend': 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
  'fullstack': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
};

export const AgentRosterManager = ({
  agents,
  onUpdateAgent,
  onDeleteAgent,
  onAddAgent,
  onClose,
}: AgentRosterManagerProps) => {
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users size={28} />
              <div>
                <h2 className="text-2xl font-bold">Agent Roster</h2>
                <p className="text-white/90 text-sm">
                  Manage your coding agents, skills, and performance
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add New Agent Button */}
          <button
            onClick={() => setIsAddingNew(true)}
            className="w-full mb-6 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
          >
            <Plus size={20} />
            <span className="font-medium">Add New Agent</span>
          </button>

          {/* Agent List */}
          <div className="space-y-4">
            {agents.map(agent => (
              <div
                key={agent.id}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className={`w-12 h-12 ${agent.avatarColor || 'bg-gray-400'} rounded-full flex items-center justify-center text-white font-bold text-lg`}
                    >
                      {agent.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {agent.name}
                      </h3>
                      {agent.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {agent.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingAgent(agent.id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Edit agent"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${agent.name}?`)) {
                          onDeleteAgent(agent.id);
                        }
                      }}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete agent"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-3">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
                    <Award size={14} />
                    Skills
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {agent.skills.map(skill => (
                      <div
                        key={skill}
                        className={`px-2 py-1 rounded text-xs font-medium ${SKILL_COLORS[skill]}`}
                      >
                        {skill}
                        <span className="ml-1 opacity-75">
                          L{agent.skillLevels[skill] || 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white dark:bg-gray-800 rounded-lg p-3">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <TrendingUp size={12} />
                      Success Rate
                    </div>
                    <div className={`text-lg font-bold ${getPerformanceColor(agent.performance.successRate)}`}>
                      {Math.round(agent.performance.successRate)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Completed
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {agent.performance.tasksCompleted}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      In Progress
                    </div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {agent.performance.tasksInProgress}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <Clock size={12} />
                      Avg Time
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {agent.performance.averageCompletionTime.toFixed(1)}h
                    </div>
                  </div>
                </div>

                {/* Availability */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500 dark:text-gray-400">Availability</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {agent.performance.availability}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                      style={{ width: `${agent.performance.availability}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {agent.performance.tasksInProgress} / {agent.maxConcurrentTasks} concurrent tasks
                  </div>
                </div>
              </div>
            ))}
          </div>

          {agents.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No agents yet</p>
              <p className="text-sm mt-1">Add your first coding agent to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit/Add Agent Modal */}
      {(editingAgent || isAddingNew) && (
        <AgentEditor
          agent={editingAgent ? agents.find(a => a.id === editingAgent) : undefined}
          onSave={(agentData) => {
            if (editingAgent) {
              const agent = agents.find(a => a.id === editingAgent);
              if (agent) {
                onUpdateAgent({ ...agent, ...agentData });
              }
            } else {
              onAddAgent(agentData);
            }
            setEditingAgent(null);
            setIsAddingNew(false);
          }}
          onCancel={() => {
            setEditingAgent(null);
            setIsAddingNew(false);
          }}
        />
      )}
    </div>
  );
};

// Agent Editor Sub-component
interface AgentEditorProps {
  agent?: CodingAgent;
  onSave: (agent: Omit<CodingAgent, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const AgentEditor = ({ agent, onSave, onCancel }: AgentEditorProps) => {
  const [name, setName] = useState(agent?.name || '');
  const [description, setDescription] = useState(agent?.description || '');
  const [skills, setSkills] = useState<AgentSkill[]>(agent?.skills || []);
  const [skillLevels, setSkillLevels] = useState<Record<AgentSkill, number>>(
    agent?.skillLevels || {} as Record<AgentSkill, number>
  );
  const [maxConcurrentTasks, setMaxConcurrentTasks] = useState(agent?.maxConcurrentTasks || 3);
  const [availability, setAvailability] = useState(agent?.performance.availability || 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSave({
      name,
      description,
      skills,
      skillLevels,
      avatarColor: agent?.avatarColor || 'bg-blue-500',
      maxConcurrentTasks,
      performance: agent?.performance || {
        tasksCompleted: 0,
        tasksInProgress: 0,
        averageCompletionTime: 0,
        successRate: 100,
        lastActive: Date.now(),
        totalHoursLogged: 0,
        availability,
      },
      availability,
    });
  };

  const toggleSkill = (skill: AgentSkill) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter(s => s !== skill));
      const newLevels = { ...skillLevels };
      delete newLevels[skill];
      setSkillLevels(newLevels);
    } else {
      setSkills([...skills, skill]);
      setSkillLevels({ ...skillLevels, [skill]: 3 });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white rounded-t-xl">
          <h3 className="text-xl font-bold">
            {agent ? 'Edit Agent' : 'Add New Agent'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Skills
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {AVAILABLE_SKILLS.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    skills.includes(skill)
                      ? SKILL_COLORS[skill]
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>

            {skills.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Proficiency Levels
                </div>
                {skills.map(skill => (
                  <div key={skill} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 dark:text-gray-300 w-24">
                      {skill}
                    </span>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={skillLevels[skill] || 3}
                      onChange={(e) =>
                        setSkillLevels({ ...skillLevels, [skill]: parseInt(e.target.value) })
                      }
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8">
                      {skillLevels[skill] || 3}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Max Concurrent Tasks
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxConcurrentTasks}
                onChange={(e) => setMaxConcurrentTasks(parseInt(e.target.value))}
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Availability (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={availability}
                onChange={(e) => setAvailability(parseInt(e.target.value))}
                className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {agent ? 'Save Changes' : 'Add Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
