'use client';

import { useState } from 'react';
import { CodingAgent, AgentSkill, SkillLevel } from '@/types/agent';
import { Task } from '@/types/task';
import { Users, Plus, X, TrendingUp, CheckCircle, Clock, Award } from 'lucide-react';

interface AgentRosterManagerProps {
  agents: CodingAgent[];
  tasks: Task[];
  onUpdateAgent: (agent: CodingAgent) => void;
  onAddAgent?: (agent: CodingAgent) => void;
}

export const AgentRosterManager = ({
  agents,
  tasks,
  onUpdateAgent,
  onAddAgent,
}: AgentRosterManagerProps) => {
  const [selectedAgent, setSelectedAgent] = useState<CodingAgent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSkills, setEditingSkills] = useState<AgentSkill[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('intermediate');

  const getAgentTasks = (agentId: string) => {
    return tasks.filter((t) => t.assignedAgentId === agentId);
  };

  const getAgentStats = (agent: CodingAgent) => {
    const agentTasks = getAgentTasks(agent.id);
    const completedTasks = agentTasks.filter((t) => t.status === 'done').length;
    const inProgressTasks = agentTasks.filter((t) => t.status === 'in-progress').length;
    const totalTasks = agentTasks.length;

    return {
      total: totalTasks,
      completed: completedTasks,
      inProgress: inProgressTasks,
      pending: totalTasks - completedTasks - inProgressTasks,
    };
  };

  const startEditing = (agent: CodingAgent) => {
    setSelectedAgent(agent);
    setEditingSkills(agent.skills || []);
    setIsEditing(true);
  };

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;

    const newSkill: AgentSkill = {
      name: newSkillName.trim(),
      level: newSkillLevel,
    };

    setEditingSkills([...editingSkills, newSkill]);
    setNewSkillName('');
    setNewSkillLevel('intermediate');
  };

  const handleRemoveSkill = (index: number) => {
    setEditingSkills(editingSkills.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!selectedAgent) return;

    const updatedAgent: CodingAgent = {
      ...selectedAgent,
      skills: editingSkills,
    };

    onUpdateAgent(updatedAgent);
    setIsEditing(false);
    setSelectedAgent(updatedAgent);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingSkills(selectedAgent?.skills || []);
  };

  const getSkillLevelColor = (level: SkillLevel) => {
    switch (level) {
      case 'expert':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'advanced':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'intermediate':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'beginner':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Agent List */}
      <div className="w-80 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="text-gray-600 dark:text-gray-400" size={20} />
          <h3 className="font-bold text-gray-900 dark:text-white">Agent Roster</h3>
          <span className="ml-auto bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-sm font-semibold">
            {agents.length}
          </span>
        </div>

        <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
          {agents.map((agent) => {
            const stats = getAgentStats(agent);
            const isSelected = selectedAgent?.id === agent.id;

            return (
              <div
                key={agent.id}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                    : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
                onClick={() => {
                  setSelectedAgent(agent);
                  setIsEditing(false);
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-8 h-8 rounded-full ${
                      agent.avatarColor || 'bg-gray-400'
                    } flex items-center justify-center text-white text-sm font-semibold`}
                  >
                    {agent.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">
                      {agent.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {stats.inProgress} active • {stats.completed} done
                    </div>
                  </div>
                  {agent.availability && (
                    <div
                      className={`w-2 h-2 rounded-full ${
                        agent.availability === 'available'
                          ? 'bg-green-500'
                          : agent.availability === 'busy'
                          ? 'bg-yellow-500'
                          : 'bg-gray-400'
                      }`}
                    />
                  )}
                </div>

                {agent.skills && agent.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {agent.skills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded"
                      >
                        {skill.name}
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
            );
          })}
        </div>
      </div>

      {/* Agent Details */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {selectedAgent ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-full ${
                    selectedAgent.avatarColor || 'bg-gray-400'
                  } flex items-center justify-center text-white text-2xl font-bold`}
                >
                  {selectedAgent.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedAgent.name}
                  </h2>
                  {selectedAgent.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedAgent.description}
                    </p>
                  )}
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={() => startEditing(selectedAgent)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Edit Skills
                </button>
              )}
            </div>

            {/* Performance Metrics */}
            {selectedAgent.performance && (
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="text-blue-600 dark:text-blue-400" size={20} />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Success Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(selectedAgent.performance.successRate || 0)}%
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="text-green-600 dark:text-green-400" size={20} />
                    <span className="text-xs text-gray-600 dark:text-gray-400">On-Time</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {Math.round(selectedAgent.performance.onTimeDeliveryRate || 0)}%
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="text-purple-600 dark:text-purple-400" size={20} />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Quality</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.round(selectedAgent.performance.qualityScore || 0)}%
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="text-orange-600 dark:text-orange-400" size={20} />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Completed</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {selectedAgent.performance.tasksCompleted}
                  </div>
                </div>
              </div>
            )}

            {/* Skills Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Skills</h3>
                {isEditing && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  {/* Add New Skill */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Skill name (e.g., React, Python)"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      className="flex-1 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                    />
                    <select
                      value={newSkillLevel}
                      onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
                      className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                    <button
                      onClick={handleAddSkill}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  </div>

                  {/* Skills List (Editable) */}
                  <div className="space-y-2">
                    {editingSkills.map((skill, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {skill.name}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded font-semibold ${getSkillLevelColor(
                              skill.level
                            )}`}
                          >
                            {skill.level}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveSkill(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {selectedAgent.skills && selectedAgent.skills.length > 0 ? (
                    selectedAgent.skills.map((skill, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          {skill.name}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded font-semibold ${getSkillLevelColor(
                            skill.level
                          )}`}
                        >
                          {skill.level}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>No skills added yet</p>
                      <button
                        onClick={() => startEditing(selectedAgent)}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm mt-2"
                      >
                        Add skills
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Current Tasks */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Current Tasks
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {getAgentTasks(selectedAgent.id).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        {task.taskId}
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white">{task.title}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded capitalize ${
                        task.status === 'done'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : task.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {task.status.replace('-', ' ')}
                    </span>
                  </div>
                ))}
                {getAgentTasks(selectedAgent.id).length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No tasks assigned
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select an agent to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
