'use client';

import { useState } from 'react';
import { Users, Plus, Edit2, Trash2, X, Star } from 'lucide-react';
import { AgentWithSkills, AgentSkill } from '@/types/agentSkill';
import { CodingAgent } from '@/types/agent';

interface AgentRosterManagerProps {
  agents: CodingAgent[];
  agentSkills: Map<string, AgentSkill[]>; // Map of agentId to skills
  onUpdateAgent: (agent: CodingAgent) => void;
  onUpdateSkills: (agentId: string, skills: AgentSkill[]) => void;
  onClose: () => void;
}

export const AgentRosterManager = ({
  agents,
  agentSkills,
  onUpdateAgent,
  onUpdateSkills,
  onClose,
}: AgentRosterManagerProps) => {
  const [selectedAgent, setSelectedAgent] = useState<CodingAgent | null>(null);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState<1 | 2 | 3 | 4 | 5>(3);

  const currentSkills = selectedAgent ? agentSkills.get(selectedAgent.id) || [] : [];

  const handleAddSkill = () => {
    if (!selectedAgent || !newSkillName.trim()) return;

    const newSkill: AgentSkill = {
      id: `skill-${Date.now()}`,
      agentId: selectedAgent.id,
      skillName: newSkillName.trim(),
      proficiency: newSkillProficiency,
      performanceScore: 0,
      tasksCompleted: 0,
      createdAt: Date.now(),
    };

    onUpdateSkills(selectedAgent.id, [...currentSkills, newSkill]);
    setNewSkillName('');
    setNewSkillProficiency(3);
  };

  const handleRemoveSkill = (skillId: string) => {
    if (!selectedAgent) return;
    onUpdateSkills(
      selectedAgent.id,
      currentSkills.filter((s) => s.id !== skillId)
    );
  };

  const handleUpdateSkillProficiency = (skillId: string, proficiency: 1 | 2 | 3 | 4 | 5) => {
    if (!selectedAgent) return;
    onUpdateSkills(
      selectedAgent.id,
      currentSkills.map((s) => (s.id === skillId ? { ...s, proficiency } : s))
    );
  };

  const getProficiencyLabel = (level: number): string => {
    switch (level) {
      case 1:
        return 'Beginner';
      case 2:
        return 'Novice';
      case 3:
        return 'Intermediate';
      case 4:
        return 'Advanced';
      case 5:
        return 'Expert';
      default:
        return 'Unknown';
    }
  };

  const getAgentStats = (agent: CodingAgent) => {
    const skills = agentSkills.get(agent.id) || [];
    const totalTasks = skills.reduce((sum, s) => sum + s.tasksCompleted, 0);
    const avgProficiency =
      skills.length > 0 ? skills.reduce((sum, s) => sum + s.proficiency, 0) / skills.length : 0;

    return { skillCount: skills.length, totalTasks, avgProficiency: avgProficiency.toFixed(1) };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Agent Roster</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Manage agent skills and performance
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Agent List */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-4 space-y-2">
              {agents.map((agent) => {
                const stats = getAgentStats(agent);
                const isSelected = selectedAgent?.id === agent.id;

                return (
                  <button
                    key={agent.id}
                    onClick={() => {
                      setSelectedAgent(agent);
                      setIsEditingSkills(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                        : 'border-2 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                          agent.avatarColor || 'bg-gray-500'
                        }`}
                      >
                        {agent.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{agent.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {stats.skillCount} skills • {stats.totalTasks} tasks
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agent Details */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedAgent ? (
              <div className="space-y-6">
                {/* Agent Info */}
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold ${
                          selectedAgent.avatarColor || 'bg-gray-500'
                        }`}
                      >
                        {selectedAgent.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {selectedAgent.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {selectedAgent.description || 'No description'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {currentSkills.length}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Skills</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {currentSkills.reduce((sum, s) => sum + s.tasksCompleted, 0)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tasks Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {getAgentStats(selectedAgent).avgProficiency}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg Proficiency</div>
                    </div>
                  </div>
                </div>

                {/* Skills Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Skills</h4>
                    <button
                      onClick={() => setIsEditingSkills(!isEditingSkills)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Edit2 size={14} />
                      {isEditingSkills ? 'Done' : 'Edit'}
                    </button>
                  </div>

                  {/* Add Skill Form */}
                  {isEditingSkills && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newSkillName}
                          onChange={(e) => setNewSkillName(e.target.value)}
                          placeholder="Skill name (e.g., React, Python)"
                          className="flex-1 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                        />
                        <select
                          value={newSkillProficiency}
                          onChange={(e) => setNewSkillProficiency(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                          className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={1}>1 - Beginner</option>
                          <option value={2}>2 - Novice</option>
                          <option value={3}>3 - Intermediate</option>
                          <option value={4}>4 - Advanced</option>
                          <option value={5}>5 - Expert</option>
                        </select>
                        <button
                          onClick={handleAddSkill}
                          disabled={!newSkillName.trim()}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium flex items-center gap-1"
                        >
                          <Plus size={16} />
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Skills List */}
                  {currentSkills.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                      No skills added yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {currentSkills.map((skill) => (
                        <div
                          key={skill.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">{skill.skillName}</div>
                            <div className="flex items-center gap-3 mt-1">
                              {isEditingSkills ? (
                                <select
                                  value={skill.proficiency}
                                  onChange={(e) =>
                                    handleUpdateSkillProficiency(
                                      skill.id,
                                      Number(e.target.value) as 1 | 2 | 3 | 4 | 5
                                    )
                                  }
                                  className="text-xs border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 rounded"
                                >
                                  <option value={1}>1 - Beginner</option>
                                  <option value={2}>2 - Novice</option>
                                  <option value={3}>3 - Intermediate</option>
                                  <option value={4}>4 - Advanced</option>
                                  <option value={5}>5 - Expert</option>
                                </select>
                              ) : (
                                <div className="flex items-center gap-1">
                                  {[...Array(skill.proficiency)].map((_, i) => (
                                    <Star
                                      key={i}
                                      size={12}
                                      className="fill-yellow-400 text-yellow-400"
                                    />
                                  ))}
                                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                    {getProficiencyLabel(skill.proficiency)}
                                  </span>
                                </div>
                              )}
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {skill.tasksCompleted} tasks • Score: {skill.performanceScore}
                              </span>
                            </div>
                          </div>
                          {isEditingSkills && (
                            <button
                              onClick={() => handleRemoveSkill(skill.id)}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                Select an agent to view details
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
