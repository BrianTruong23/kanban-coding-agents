'use client';

import { useState } from 'react';
import { X, Users, Plus, Trash2, TrendingUp, Award } from 'lucide-react';
import type { AgentWithSkills, AgentSkill } from '@/types/agent';

interface AgentManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  agents: AgentWithSkills[];
  onAddSkill: (agentId: string, skill: Omit<AgentSkill, 'id' | 'agentId' | 'createdAt'>) => void;
  onRemoveSkill: (agentId: string, skillId: string) => void;
}

const COMMON_SKILLS = [
  'React',
  'TypeScript',
  'JavaScript',
  'Node.js',
  'Python',
  'SQL',
  'Database Design',
  'API Development',
  'UI/UX',
  'CSS',
  'Testing',
  'QA',
  'DevOps',
  'Docker',
  'CI/CD',
  'Security',
  'Backend',
  'Frontend',
  'Mobile',
  'AWS',
  'System Design'
];

export function AgentManagementPanel({
  isOpen,
  onClose,
  agents,
  onAddSkill,
  onRemoveSkill
}: AgentManagementPanelProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<1 | 2 | 3 | 4 | 5>(3);

  if (!isOpen) return null;

  const handleAddSkill = () => {
    if (!selectedAgent || !newSkillName.trim()) return;

    onAddSkill(selectedAgent, {
      skillName: newSkillName.trim(),
      proficiencyLevel: newSkillLevel
    });

    setNewSkillName('');
    setNewSkillLevel(3);
  };

  const selectedAgentData = selectedAgent
    ? agents.find(a => a.id === selectedAgent)
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Agent Management
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Agent List */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Agents ({agents.length})
              </h3>
              <div className="space-y-2">
                {agents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent.id)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      selectedAgent === agent.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
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
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {agent.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {agent.skills.length} skills
                        </div>
                      </div>
                    </div>

                    {agent.performanceMetrics && agent.performanceMetrics.tasksCompleted > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400">Quality</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {agent.performanceMetrics.averageQuality.toFixed(1)}/5.0
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-gray-600 dark:text-gray-400">On-time</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {agent.performanceMetrics.onTimePercentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Agent Details */}
            <div className="lg:col-span-2">
              {selectedAgentData ? (
                <div>
                  <div className="mb-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                          selectedAgentData.avatarColor || 'bg-gray-500'
                        }`}
                      >
                        {selectedAgentData.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {selectedAgentData.name}
                        </h3>
                        {selectedAgentData.description && (
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {selectedAgentData.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  {selectedAgentData.performanceMetrics &&
                    selectedAgentData.performanceMetrics.tasksCompleted > 0 && (
                      <div className="mb-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            Performance Metrics
                          </h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Average Quality
                            </div>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {selectedAgentData.performanceMetrics.averageQuality.toFixed(1)}
                              <span className="text-sm text-gray-600 dark:text-gray-400">/5.0</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              On-Time Delivery
                            </div>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {selectedAgentData.performanceMetrics.onTimePercentage.toFixed(0)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Avg Completion Time
                            </div>
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {selectedAgentData.performanceMetrics.averageCompletionTime.toFixed(1)}h
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Tasks Completed
                            </div>
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                              {selectedAgentData.performanceMetrics.tasksCompleted}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Skills */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-500" />
                      Skills ({selectedAgentData.skills.length})
                    </h4>

                    {selectedAgentData.skills.length > 0 ? (
                      <div className="space-y-2 mb-4">
                        {selectedAgentData.skills.map(skill => (
                          <div
                            key={skill.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {skill.skillName}
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map(level => (
                                  <div
                                    key={level}
                                    className={`w-6 h-2 rounded ${
                                      level <= skill.proficiencyLevel
                                        ? 'bg-blue-500'
                                        : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                                  />
                                ))}
                                <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                                  Level {skill.proficiencyLevel}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => onRemoveSkill(selectedAgentData.id, skill.id)}
                              className="ml-3 text-red-500 hover:text-red-700 dark:hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        No skills added yet
                      </div>
                    )}

                    {/* Add Skill Form */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        Add New Skill
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Skill Name
                          </label>
                          <input
                            type="text"
                            value={newSkillName}
                            onChange={(e) => setNewSkillName(e.target.value)}
                            list="common-skills"
                            placeholder="e.g., React, TypeScript, SQL"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                          />
                          <datalist id="common-skills">
                            {COMMON_SKILLS.map(skill => (
                              <option key={skill} value={skill} />
                            ))}
                          </datalist>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Proficiency Level
                          </label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(level => (
                              <button
                                key={level}
                                onClick={() => setNewSkillLevel(level as 1 | 2 | 3 | 4 | 5)}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  newSkillLevel === level
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            1 = Beginner, 5 = Expert
                          </div>
                        </div>
                        <button
                          onClick={handleAddSkill}
                          disabled={!newSkillName.trim()}
                          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Skill
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  Select an agent to view details
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
