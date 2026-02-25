'use client';

import { useState } from 'react';
import { AgentWithSkills, AgentSkill } from '@/types/agent';
import { Users, Plus, X, Star, TrendingUp, Award } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface AgentRosterProps {
  agents: AgentWithSkills[];
  onAddSkill: (agentId: string, skillName: string, skillLevel: number) => void;
  onUpdateSkill: (skillId: string, skillLevel: number) => void;
  onRemoveSkill: (skillId: string) => void;
  onClose: () => void;
}

export const AgentRoster = ({ agents, onAddSkill, onUpdateSkill, onRemoveSkill, onClose }: AgentRosterProps) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentWithSkills | null>(agents[0] || null);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<1 | 2 | 3 | 4 | 5>(3);

  const handleAddSkill = () => {
    if (!selectedAgent || !newSkillName.trim()) return;

    onAddSkill(selectedAgent.id, newSkillName.trim(), newSkillLevel);
    setNewSkillName('');
    setNewSkillLevel(3);
    setIsAddingSkill(false);
  };

  const skillLevelLabels = {
    1: 'Beginner',
    2: 'Intermediate',
    3: 'Proficient',
    4: 'Advanced',
    5: 'Expert',
  };

  const commonSkills = [
    'React', 'Next.js', 'TypeScript', 'Node.js', 'Python',
    'Database Design', 'API Development', 'UI/UX',
    'Testing', 'DevOps', 'Docker', 'AWS',
    'GraphQL', 'REST API', 'Git', 'CI/CD',
  ];

  const renderSkillLevel = (level: number) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={12}
            className={i < level ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-gray-600'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                <Users className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Agent Roster</h2>
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Agent List */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Agents ({agents.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {agents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedAgent?.id === agent.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${agent.avatarColor || 'bg-gray-500'} flex items-center justify-center text-white font-bold text-sm`}>
                      {getInitials(agent.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {agent.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {agent.skills.length} skills
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Agent Details */}
          {selectedAgent && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {/* Agent Header */}
                <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className={`w-16 h-16 rounded-full ${selectedAgent.avatarColor || 'bg-gray-500'} flex items-center justify-center text-white font-bold text-2xl`}>
                    {getInitials(selectedAgent.name)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {selectedAgent.name}
                    </h3>
                    {selectedAgent.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedAgent.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Performance Metrics */}
                {selectedAgent.performanceMetrics && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <TrendingUp size={16} />
                      Performance Metrics
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {selectedAgent.performanceMetrics.tasksCompleted}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Tasks Completed</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {selectedAgent.performanceMetrics.averageQualityScore.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Avg Quality Score</div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {selectedAgent.performanceMetrics.averageCompletionTime.toFixed(1)}h
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Avg Completion Time</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Skills */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Award size={16} />
                      Skills ({selectedAgent.skills.length})
                    </h4>
                    <button
                      onClick={() => setIsAddingSkill(true)}
                      className="text-sm px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Add Skill
                    </button>
                  </div>

                  {/* Add Skill Form */}
                  {isAddingSkill && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4 border-2 border-green-200 dark:border-green-800">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Skill Name
                          </label>
                          <input
                            type="text"
                            list="common-skills"
                            className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            placeholder="e.g., React, Python, DevOps"
                            value={newSkillName}
                            onChange={(e) => setNewSkillName(e.target.value)}
                            autoFocus
                          />
                          <datalist id="common-skills">
                            {commonSkills.map(skill => (
                              <option key={skill} value={skill} />
                            ))}
                          </datalist>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Skill Level
                          </label>
                          <select
                            className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            value={newSkillLevel}
                            onChange={(e) => setNewSkillLevel(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                          >
                            {([1, 2, 3, 4, 5] as const).map(level => (
                              <option key={level} value={level}>
                                {level} - {skillLevelLabels[level]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleAddSkill}
                            disabled={!newSkillName.trim()}
                            className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              setIsAddingSkill(false);
                              setNewSkillName('');
                              setNewSkillLevel(3);
                            }}
                            className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Skills List */}
                  {selectedAgent.skills.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                      No skills added yet. Click &quot;Add Skill&quot; to get started.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedAgent.skills.map(skill => (
                        <div
                          key={skill.id}
                          className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg flex items-center justify-between group hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                              {skill.skillName}
                            </div>
                            <div className="flex items-center gap-2">
                              {renderSkillLevel(skill.skillLevel)}
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {skillLevelLabels[skill.skillLevel]}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={skill.skillLevel}
                              onChange={(e) => onUpdateSkill(skill.id, Number(e.target.value))}
                            >
                              {([1, 2, 3, 4, 5] as const).map(level => (
                                <option key={level} value={level}>
                                  {level}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => onRemoveSkill(skill.id)}
                              className="text-red-500 hover:text-red-700 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove skill"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!selectedAgent && (
            <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
              <div className="text-center">
                <Users size={48} className="mx-auto mb-2 opacity-50" />
                <p>Select an agent to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
