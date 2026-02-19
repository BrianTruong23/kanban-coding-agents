'use client';

import { useState } from 'react';
import { Users, TrendingUp, AlertCircle, Plus, Edit2, Trash2, Award, Zap } from 'lucide-react';
import { CodingAgent, AgentAvailability } from '@/types/agent';
import { calculateTeamCapacity } from '@/lib/ai/agentAssignment';
import { Task } from '@/types/task';

interface AgentRosterManagerProps {
  agents: CodingAgent[];
  tasks: Task[];
  onAddAgent: (agent: Omit<CodingAgent, 'id' | 'createdAt'>) => void;
  onUpdateAgent: (agent: CodingAgent) => void;
  onDeleteAgent: (agentId: string) => void;
}

export default function AgentRosterManager({
  agents,
  tasks,
  onAddAgent,
  onUpdateAgent,
  onDeleteAgent
}: AgentRosterManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<CodingAgent | null>(null);

  const teamCapacity = calculateTeamCapacity(agents, tasks);

  const getAvailabilityColor = (availability?: AgentAvailability) => {
    const colors = {
      available: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      busy: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      overloaded: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      offline: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[availability || 'available'];
  };

  const getPerformanceRating = (score?: number) => {
    if (!score || score === 0) return 'New';
    if (score >= 4) return 'Excellent';
    if (score >= 3) return 'Good';
    if (score >= 2) return 'Average';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6" />
            Agent Roster
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your team of coding agents and their skills
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Agent
        </button>
      </div>

      {/* Team Capacity Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Agents</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {teamCapacity.totalAgents}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {teamCapacity.availableAgents}
              </p>
            </div>
            <Zap className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Utilization</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {teamCapacity.utilizationRate.toFixed(0)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Overloaded</p>
              <p className={`text-2xl font-bold ${teamCapacity.overloadedAgents > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                {teamCapacity.overloadedAgents}
              </p>
            </div>
            <AlertCircle className={`w-8 h-8 ${teamCapacity.overloadedAgents > 0 ? 'text-red-500' : 'text-gray-400'}`} />
          </div>
        </div>
      </div>

      {/* Agent List */}
      <div className="grid gap-4">
        {agents.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onEdit={() => setEditingAgent(agent)}
            onDelete={() => onDeleteAgent(agent.id)}
            getAvailabilityColor={getAvailabilityColor}
            getPerformanceRating={getPerformanceRating}
          />
        ))}

        {agents.length === 0 && (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No agents yet</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
            >
              Add your first agent
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Agent Modal */}
      {(showAddForm || editingAgent) && (
        <AgentFormModal
          agent={editingAgent}
          onSave={(agent) => {
            if (editingAgent) {
              onUpdateAgent({ ...editingAgent, ...agent });
            } else {
              onAddAgent(agent);
            }
            setShowAddForm(false);
            setEditingAgent(null);
          }}
          onCancel={() => {
            setShowAddForm(false);
            setEditingAgent(null);
          }}
        />
      )}
    </div>
  );
}

function AgentCard({
  agent,
  onEdit,
  onDelete,
  getAvailabilityColor,
  getPerformanceRating
}: {
  agent: CodingAgent;
  onEdit: () => void;
  onDelete: () => void;
  getAvailabilityColor: (availability?: AgentAvailability) => string;
  getPerformanceRating: (score?: number) => string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          {/* Avatar */}
          <div
            className={`w-12 h-12 rounded-full ${agent.avatarColor || 'bg-gray-500'} flex items-center justify-center text-white font-bold text-lg`}
          >
            {agent.avatar}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {agent.name}
              </h3>
              <span className={`text-xs px-2 py-1 rounded ${getAvailabilityColor(agent.availability)}`}>
                {agent.availability || 'available'}
              </span>
            </div>

            {agent.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {agent.description}
              </p>
            )}

            {/* Skills */}
            {agent.skills && agent.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {agent.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {/* Performance Metrics */}
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-1">
                <Award className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {getPerformanceRating(agent.performanceScore)}
                </span>
                {agent.performanceScore !== undefined && (
                  <span className="text-gray-500 dark:text-gray-500">
                    ({agent.performanceScore.toFixed(1)}/5)
                  </span>
                )}
              </div>

              <div className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">{agent.tasksCompleted || 0}</span> completed
              </div>

              <div className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">{agent.tasksInProgress || 0}</span> active
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AgentFormModal({
  agent,
  onSave,
  onCancel
}: {
  agent: CodingAgent | null;
  onSave: (agent: Omit<CodingAgent, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(agent?.name || '');
  const [description, setDescription] = useState(agent?.description || '');
  const [skills, setSkills] = useState<string[]>(agent?.skills || []);
  const [newSkill, setNewSkill] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description,
      skills,
      avatar: name.split(' ').map(n => n[0]).join('').toUpperCase(),
      avatarColor: agent?.avatarColor || `bg-${['blue', 'green', 'purple', 'orange', 'pink'][Math.floor(Math.random() * 5)]}-500`,
      performanceScore: agent?.performanceScore || 0,
      tasksCompleted: agent?.tasksCompleted || 0,
      tasksInProgress: agent?.tasksInProgress || 0,
      availability: agent?.availability || 'available'
    });
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {agent ? 'Edit Agent' : 'Add New Agent'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Skills
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="Add a skill..."
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
            >
              {agent ? 'Save Changes' : 'Add Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
