'use client';

import { useState } from 'react';
import { X, Plus, Edit2, Trash2, TrendingUp, Award, Clock, CheckCircle2 } from 'lucide-react';
import { CodingAgent, AgentSkill, SkillLevel } from '@/types/agent';
import { recommendAgentAssignment, autoAssignTasks } from '@/lib/ai/agentAssignment';
import { Task } from '@/types/task';

interface AgentManagementProps {
  isOpen: boolean;
  onClose: () => void;
  agents: CodingAgent[];
  tasks: Task[];
  onUpdateAgent: (agent: CodingAgent) => void;
  onDeleteAgent: (agentId: string) => void;
  onAutoAssign: (assignments: Map<string, string>) => void;
}

export const AgentManagement = ({
  isOpen,
  onClose,
  agents,
  tasks,
  onUpdateAgent,
  onDeleteAgent,
  onAutoAssign,
}: AgentManagementProps) => {
  const [selectedAgent, setSelectedAgent] = useState<CodingAgent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Partial<CodingAgent>>({});
  const [newSkill, setNewSkill] = useState({ name: '', level: 'intermediate' as SkillLevel });

  if (!isOpen) return null;

  const handleEdit = (agent: CodingAgent) => {
    setEditingAgent({ ...agent });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editingAgent.id) {
      onUpdateAgent(editingAgent as CodingAgent);
      setIsEditing(false);
      setEditingAgent({});
      setSelectedAgent(null);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.name.trim() && editingAgent.id) {
      const skills = editingAgent.skills || [];
      const skill: AgentSkill = {
        id: Date.now().toString(),
        name: newSkill.name.trim(),
        level: newSkill.level,
      };
      setEditingAgent({
        ...editingAgent,
        skills: [...skills, skill],
      });
      setNewSkill({ name: '', level: 'intermediate' });
    }
  };

  const handleRemoveSkill = (skillId: string) => {
    if (editingAgent.skills) {
      setEditingAgent({
        ...editingAgent,
        skills: editingAgent.skills.filter(s => s.id !== skillId),
      });
    }
  };

  const handleAutoAssignClick = () => {
    const assignments = autoAssignTasks(tasks, agents, 70);
    onAutoAssign(assignments);
    alert(`Auto-assigned ${assignments.size} tasks to agents based on skills and availability`);
  };

  const getAgentStats = (agent: CodingAgent) => {
    const assignedTasks = tasks.filter(t => t.assignedAgentId === agent.id);
    const inProgress = assignedTasks.filter(t => t.status === 'in-progress').length;
    const completed = assignedTasks.filter(t => t.status === 'done').length;
    const total = assignedTasks.length;

    return { inProgress, completed, total };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Agent Management</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage agent skills, performance, and auto-assign tasks
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Agent List */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-4 space-y-2">
              {agents.map(agent => {
                const stats = getAgentStats(agent);
                const isSelected = selectedAgent?.id === agent.id;

                return (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                            agent.avatarColor || 'bg-gray-500'
                          }`}
                        >
                          {agent.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">{agent.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {stats.total} tasks assigned
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          agent.availability === 'available'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : agent.availability === 'busy'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                        }`}
                      >
                        {agent.availability || 'available'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/30 rounded">
                        <div className="font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</div>
                        <div className="text-blue-700 dark:text-blue-300">In Progress</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 dark:bg-green-900/30 rounded">
                        <div className="font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
                        <div className="text-green-700 dark:text-green-300">Completed</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <div className="font-bold text-gray-600 dark:text-gray-400">{stats.total}</div>
                        <div className="text-gray-700 dark:text-gray-300">Total</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Agent Details */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selectedAgent ? (
              <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                Select an agent to view details
              </div>
            ) : isEditing ? (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Agent</h3>

                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editingAgent.name || ''}
                      onChange={e => setEditingAgent({ ...editingAgent, name: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editingAgent.description || ''}
                      onChange={e => setEditingAgent({ ...editingAgent, description: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg h-20 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Availability
                      </label>
                      <select
                        value={editingAgent.availability || 'available'}
                        onChange={e => setEditingAgent({ ...editingAgent, availability: e.target.value as any })}
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                      >
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="offline">Offline</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Concurrent Tasks
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={editingAgent.maxConcurrentTasks || 3}
                        onChange={e => setEditingAgent({ ...editingAgent, maxConcurrentTasks: parseInt(e.target.value) })}
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Skills</h4>
                  <div className="space-y-2 mb-3">
                    {(editingAgent.skills || []).map(skill => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{skill.name}</span>
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            ({skill.level})
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveSkill(skill.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Skill name (e.g., React)"
                      value={newSkill.name}
                      onChange={e => setNewSkill({ ...newSkill, name: e.target.value })}
                      className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                    />
                    <select
                      value={newSkill.level}
                      onChange={e => setNewSkill({ ...newSkill, level: e.target.value as SkillLevel })}
                      className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                    <button
                      onClick={handleAddSkill}
                      className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditingAgent({});
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Agent Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl ${
                        selectedAgent.avatarColor || 'bg-gray-500'
                      }`}
                    >
                      {selectedAgent.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedAgent.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {selectedAgent.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit(selectedAgent)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    <Edit2 size={20} />
                  </button>
                </div>

                {/* Performance Metrics */}
                {selectedAgent.performance && (
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <TrendingUp className="text-blue-600 dark:text-blue-400 mb-2" size={20} />
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedAgent.performance.tasksCompleted}
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">Tasks Completed</div>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                      <Award className="text-green-600 dark:text-green-400 mb-2" size={20} />
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {selectedAgent.performance.qualityScore}%
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300">Quality Score</div>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
                      <Clock className="text-orange-600 dark:text-orange-400 mb-2" size={20} />
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {selectedAgent.performance.averageCompletionTime}h
                      </div>
                      <div className="text-xs text-orange-700 dark:text-orange-300">Avg. Completion</div>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
                      <CheckCircle2 className="text-purple-600 dark:text-purple-400 mb-2" size={20} />
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {selectedAgent.performance.onTimeDeliveryRate}%
                      </div>
                      <div className="text-xs text-purple-700 dark:text-purple-300">On-Time Rate</div>
                    </div>
                  </div>
                )}

                {/* Skills */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Skills</h4>
                  {selectedAgent.skills && selectedAgent.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedAgent.skills.map(skill => (
                        <div
                          key={skill.id}
                          className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          <span className="font-medium text-gray-900 dark:text-white">{skill.name}</span>
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            {skill.level}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">No skills defined</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {agents.length} agents • {tasks.filter(t => !t.assignedAgentId).length} unassigned tasks
          </div>
          <button
            onClick={handleAutoAssignClick}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
          >
            Auto-Assign Tasks
          </button>
        </div>
      </div>
    </div>
  );
};
