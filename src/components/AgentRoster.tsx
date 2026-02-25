'use client';

import { useState } from 'react';
import { CodingAgent } from '@/types/agent';
import { Task } from '@/types/task';
import { AgentSkill, SkillLevel } from '@/types/breakdown';
import { X, Plus, Award, TrendingUp, Clock, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import { filterAgents, getAgentLeaderboard, getAgentAvailability } from '@/lib/agentOrchestration';

interface AgentRosterProps {
  agents: CodingAgent[];
  tasks: Task[];
  onClose: () => void;
  onUpdateAgent?: (agent: CodingAgent) => void;
  onDeleteAgent?: (agentId: string) => void;
}

export const AgentRoster = ({
  agents,
  tasks,
  onClose,
  onUpdateAgent,
  onDeleteAgent,
}: AgentRosterProps) => {
  const [selectedAgent, setSelectedAgent] = useState<CodingAgent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSkills, setEditedSkills] = useState<AgentSkill[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('intermediate');
  const [viewMode, setViewMode] = useState<'roster' | 'leaderboard'>('roster');

  const leaderboard = getAgentLeaderboard(agents);

  const handleEditSkills = (agent: CodingAgent) => {
    setSelectedAgent(agent);
    setEditedSkills(agent.skills || []);
    setIsEditing(true);
  };

  const handleAddSkill = () => {
    if (!newSkillName.trim() || !selectedAgent) return;

    const newSkill: AgentSkill = {
      id: `skill-${Date.now()}`,
      agentId: selectedAgent.id,
      skillName: newSkillName.trim(),
      level: newSkillLevel,
    };

    setEditedSkills([...editedSkills, newSkill]);
    setNewSkillName('');
    setNewSkillLevel('intermediate');
  };

  const handleRemoveSkill = (skillId: string) => {
    setEditedSkills(editedSkills.filter((s) => s.id !== skillId));
  };

  const handleSaveSkills = () => {
    if (!selectedAgent) return;

    const updatedAgent: CodingAgent = {
      ...selectedAgent,
      skills: editedSkills,
    };

    onUpdateAgent?.(updatedAgent);
    setIsEditing(false);
    setSelectedAgent(null);
  };

  const handleDeleteAgent = (agentId: string) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      onDeleteAgent?.(agentId);
      if (selectedAgent?.id === agentId) {
        setSelectedAgent(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Agent Roster</h2>
          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('roster')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'roster'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Roster
              </button>
              <button
                onClick={() => setViewMode('leaderboard')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'leaderboard'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Leaderboard
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'roster' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => {
                const availability = getAgentAvailability(agent, tasks);
                const activeTasks = tasks.filter(
                  (t) => t.assignedAgentId === agent.id && t.status !== 'done'
                );

                return (
                  <div
                    key={agent.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-5 hover:shadow-lg transition-shadow"
                  >
                    {/* Agent Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-full ${
                            agent.avatarColor || 'bg-blue-500'
                          } flex items-center justify-center text-white font-bold text-lg`}
                        >
                          {agent.avatar || agent.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            {agent.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {availability.status === 'available' ? (
                              <span className="text-green-500">● Available</span>
                            ) : (
                              <span className="text-orange-500">● Busy</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditSkills(agent)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                          title="Edit skills"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteAgent(agent.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete agent"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    {agent.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {agent.description}
                      </p>
                    )}

                    {/* Skills */}
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                        Skills
                      </h4>
                      {agent.skills && agent.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {agent.skills.map((skill) => (
                            <span
                              key={skill.id}
                              className={`px-2 py-1 text-xs rounded ${
                                skill.level === 'expert'
                                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                  : skill.level === 'advanced'
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                  : skill.level === 'intermediate'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                              title={skill.level}
                            >
                              {skill.skillName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">No skills defined</p>
                      )}
                    </div>

                    {/* Performance Stats */}
                    {agent.performance && (
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                          Performance
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <CheckCircle size={14} className="text-green-500" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {agent.performance.tasksCompleted} tasks
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Award size={14} className="text-yellow-500" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {agent.performance.qualityScore}% quality
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} className="text-blue-500" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {agent.performance.averageCompletionTime.toFixed(1)}h avg
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp size={14} className="text-purple-500" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {agent.performance.tasksCompleted > 0
                                ? Math.round(
                                    (agent.performance.tasksOnTime /
                                      agent.performance.tasksCompleted) *
                                      100
                                  )
                                : 0}
                              % on-time
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Active Tasks */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                        Active Tasks
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {activeTasks.length} task{activeTasks.length !== 1 ? 's' : ''} in progress
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Leaderboard View */
            <div className="space-y-3">
              {leaderboard.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No performance data available yet
                </p>
              ) : (
                leaderboard.map((entry) => (
                  <div
                    key={entry.agent.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 flex items-center gap-4"
                  >
                    {/* Rank */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        entry.rank === 1
                          ? 'bg-yellow-500 text-white'
                          : entry.rank === 2
                          ? 'bg-gray-400 text-white'
                          : entry.rank === 3
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {entry.rank}
                    </div>

                    {/* Agent Info */}
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {entry.agent.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Overall Score: {entry.score}/100
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {entry.stats.tasksCompleted}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Tasks</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {entry.stats.qualityScore}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Quality</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {entry.stats.onTimeRate}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">On-Time</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Skills Modal */}
      {isEditing && selectedAgent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl shadow-2xl">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Edit Skills: {selectedAgent.name}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Current Skills */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Current Skills
                </h4>
                <div className="space-y-2">
                  {editedSkills.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                    >
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {skill.skillName}
                        </span>
                        <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                          {skill.level}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveSkill(skill.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {editedSkills.length === 0 && (
                    <p className="text-sm text-gray-400">No skills yet</p>
                  )}
                </div>
              </div>

              {/* Add New Skill */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Add New Skill
                </h4>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Skill name (e.g., React)"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    className="flex-1 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  />
                  <select
                    value={newSkillLevel}
                    onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
                    className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                  <button
                    onClick={handleAddSkill}
                    className="px-4 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedAgent(null);
                }}
                className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSkills}
                className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
              >
                Save Skills
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
