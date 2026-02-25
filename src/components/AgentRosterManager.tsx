'use client';

import { useState } from 'react';
import { CodingAgent, AgentSkill } from '@/types/agent';
import { X, Plus, Trash2, Edit2, Award, TrendingUp, CheckCircle2 } from 'lucide-react';

interface AgentRosterManagerProps {
  agents: CodingAgent[];
  agentSkills: Map<string, AgentSkill[]>;
  onClose: () => void;
  onUpdateSkills: (agentId: string, skills: AgentSkill[]) => Promise<void>;
}

export const AgentRosterManager = ({
  agents,
  agentSkills,
  onClose,
  onUpdateSkills
}: AgentRosterManagerProps) => {
  const [selectedAgent, setSelectedAgent] = useState<CodingAgent | null>(agents[0] || null);
  const [editingSkill, setEditingSkill] = useState<AgentSkill | null>(null);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState(5);
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  const selectedAgentSkills = selectedAgent ? (agentSkills.get(selectedAgent.id) || []) : [];

  const handleAddSkill = async () => {
    if (!selectedAgent || !newSkillName.trim()) return;

    const newSkill: AgentSkill = {
      id: `temp-${Date.now()}`,
      agentId: selectedAgent.id,
      skillName: newSkillName.trim(),
      proficiencyLevel: newSkillLevel,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updatedSkills = [...selectedAgentSkills, newSkill];
    await onUpdateSkills(selectedAgent.id, updatedSkills);

    setNewSkillName('');
    setNewSkillLevel(5);
    setIsAddingSkill(false);
  };

  const handleUpdateSkill = async (skill: AgentSkill, newLevel: number) => {
    if (!selectedAgent) return;

    const updatedSkills = selectedAgentSkills.map(s =>
      s.id === skill.id ? { ...s, proficiencyLevel: newLevel, updatedAt: Date.now() } : s
    );

    await onUpdateSkills(selectedAgent.id, updatedSkills);
    setEditingSkill(null);
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (!selectedAgent) return;

    const updatedSkills = selectedAgentSkills.filter(s => s.id !== skillId);
    await onUpdateSkills(selectedAgent.id, updatedSkills);
  };

  const getSkillColor = (level: number): string => {
    if (level >= 8) return 'text-green-600 dark:text-green-400';
    if (level >= 5) return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getPerformanceSummary = (agent: CodingAgent) => {
    if (!agent.performance) {
      return {
        totalTasks: 0,
        avgQuality: 0,
        onTimeRate: 0,
        avgTime: 0
      };
    }

    return {
      totalTasks: agent.performance.totalTasksCompleted,
      avgQuality: agent.performance.averageQualityRating,
      onTimeRate: agent.performance.onTimePercentage * 100,
      avgTime: agent.performance.averageCompletionTime
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Agent Roster Management
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage agent skills and view performance metrics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex">
          {/* Agent List Sidebar */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-4 space-y-2">
              {agents.map(agent => {
                const isSelected = selectedAgent?.id === agent.id;
                const skills = agentSkills.get(agent.id) || [];

                return (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                          agent.avatarColor || 'bg-gray-500'
                        }`}
                      >
                        {agent.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {agent.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {skills.length} skill{skills.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agent Details */}
          {selectedAgent ? (
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Agent Info */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold ${
                      selectedAgent.avatarColor || 'bg-gray-500'
                    }`}
                  >
                    {selectedAgent.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {selectedAgent.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedAgent.description || 'No description provided'}
                    </p>
                  </div>
                </div>

                {/* Performance Metrics */}
                {selectedAgent.performance && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Performance Summary
                      </h4>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Tasks Completed</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                          {getPerformanceSummary(selectedAgent).totalTasks}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Avg Quality</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                          {getPerformanceSummary(selectedAgent).avgQuality.toFixed(1)}/5
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">On-Time Rate</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                          {getPerformanceSummary(selectedAgent).onTimeRate.toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Avg Time</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                          {getPerformanceSummary(selectedAgent).avgTime.toFixed(1)}h
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Skills Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Skills & Proficiency
                    </h4>
                    <button
                      onClick={() => setIsAddingSkill(true)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                    >
                      <Plus size={16} />
                      Add Skill
                    </button>
                  </div>

                  {/* Add New Skill Form */}
                  {isAddingSkill && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4 mb-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Skill Name
                          </label>
                          <input
                            type="text"
                            value={newSkillName}
                            onChange={(e) => setNewSkillName(e.target.value)}
                            placeholder="e.g., React, Node.js, Docker"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Proficiency Level: {newSkillLevel}/10
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={newSkillLevel}
                            onChange={(e) => setNewSkillLevel(parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleAddSkill}
                            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              setIsAddingSkill(false);
                              setNewSkillName('');
                              setNewSkillLevel(5);
                            }}
                            className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Skills List */}
                  {selectedAgentSkills.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p className="text-sm">No skills added yet</p>
                      <p className="text-xs mt-1">Click "Add Skill" to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedAgentSkills.map(skill => (
                        <div
                          key={skill.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`text-sm font-medium ${getSkillColor(skill.proficiencyLevel)}`}>
                                {skill.skillName}
                              </p>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {skill.proficiencyLevel}/10
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  skill.proficiencyLevel >= 8
                                    ? 'bg-green-600'
                                    : skill.proficiencyLevel >= 5
                                    ? 'bg-blue-600'
                                    : 'bg-gray-400'
                                }`}
                                style={{ width: `${skill.proficiencyLevel * 10}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingSkill(skill)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteSkill(skill.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">Select an agent to view details</p>
            </div>
          )}
        </div>

        {/* Edit Skill Modal */}
        {editingSkill && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Edit Skill: {editingSkill.skillName}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Proficiency Level: {editingSkill.proficiencyLevel}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={editingSkill.proficiencyLevel}
                    onChange={(e) =>
                      setEditingSkill({
                        ...editingSkill,
                        proficiencyLevel: parseInt(e.target.value)
                      })
                    }
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateSkill(editingSkill, editingSkill.proficiencyLevel)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingSkill(null)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
