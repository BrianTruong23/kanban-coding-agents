'use client';

import { useState } from 'react';
import { CodingAgent } from '@/types/agent';
import { AgentSkill, AgentPerformance, SkillCategory } from '@/types/agentSkills';
import { Users, X, TrendingUp, Award, Clock, CheckCircle, Plus, Edit2, Trash2 } from 'lucide-react';

interface AgentWithDetails extends CodingAgent {
  skills?: AgentSkill[];
  performance?: AgentPerformance;
}

interface AgentRosterManagerProps {
  agents: AgentWithDetails[];
  onClose?: () => void;
  onAddSkill?: (agentId: string, skillId: string, proficiency: number) => void;
  onRemoveSkill?: (agentId: string, skillId: string) => void;
  onUpdatePerformance?: (agentId: string, performance: Partial<AgentPerformance>) => void;
}

const SKILL_CATEGORIES: SkillCategory[] = [
  'frontend',
  'backend',
  'database',
  'devops',
  'mobile',
  'testing',
  'design',
  'api',
];

export const AgentRosterManager = ({
  agents,
  onClose,
  onAddSkill,
  onRemoveSkill,
  onUpdatePerformance,
}: AgentRosterManagerProps) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentWithDetails | null>(
    agents.length > 0 ? agents[0] : null
  );
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillCategory, setNewSkillCategory] = useState<SkillCategory>('frontend');
  const [newSkillProficiency, setNewSkillProficiency] = useState<1 | 2 | 3 | 4 | 5>(3);

  const handleAddSkill = () => {
    if (selectedAgent && onAddSkill) {
      // In a real implementation, this would lookup the skill ID from the category
      onAddSkill(selectedAgent.id, newSkillCategory, newSkillProficiency);
      setIsAddingSkill(false);
    }
  };

  const getPerformanceColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProficiencyLabel = (level: number): string => {
    const labels = ['', 'Beginner', 'Intermediate', 'Proficient', 'Advanced', 'Expert'];
    return labels[level] || 'Unknown';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Users size={24} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Agent Roster Management
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage agent skills, track performance, and optimize assignments
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Agent List Sidebar */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-4 space-y-2">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedAgent?.id === agent.id
                      ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        agent.avatarColor || 'bg-gray-500'
                      }`}
                    >
                      {agent.avatar || agent.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-white truncate">
                        {agent.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {agent.skills?.length || 0} skills
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Agent Details */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedAgent ? (
              <div className="space-y-6">
                {/* Agent Info */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold ${
                      selectedAgent.avatarColor || 'bg-gray-500'
                    }`}
                  >
                    {selectedAgent.avatar || selectedAgent.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedAgent.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedAgent.description || 'No description available'}
                    </p>
                  </div>
                </div>

                {/* Performance Metrics */}
                {selectedAgent.performance && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle size={16} className="text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                          Completed
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedAgent.performance.tasksCompleted}
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-green-600 dark:text-green-400" />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                          On Time
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedAgent.performance.tasksCompleted > 0
                          ? Math.round((selectedAgent.performance.tasksOnTime / selectedAgent.performance.tasksCompleted) * 100)
                          : 0}
                        %
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                          Avg Time
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedAgent.performance.averageCompletionTime.toFixed(1)}h
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Award size={16} className="text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                          Quality
                        </span>
                      </div>
                      <div className={`text-2xl font-bold ${getPerformanceColor(selectedAgent.performance.qualityScore)}`}>
                        {selectedAgent.performance.qualityScore.toFixed(0)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Skills Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">Skills</h4>
                    {onAddSkill && (
                      <button
                        onClick={() => setIsAddingSkill(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                      >
                        <Plus size={16} />
                        Add Skill
                      </button>
                    )}
                  </div>

                  {isAddingSkill && (
                    <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Skill Category
                          </label>
                          <select
                            value={newSkillCategory}
                            onChange={(e) => setNewSkillCategory(e.target.value as SkillCategory)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                          >
                            {SKILL_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Proficiency Level
                          </label>
                          <select
                            value={newSkillProficiency}
                            onChange={(e) => setNewSkillProficiency(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                          >
                            {[1, 2, 3, 4, 5].map((level) => (
                              <option key={level} value={level}>
                                {level} - {getProficiencyLabel(level)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setIsAddingSkill(false)}
                          className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddSkill}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {selectedAgent.skills && selectedAgent.skills.length > 0 ? (
                      selectedAgent.skills.map((skill, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {skill.skillId}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {getProficiencyLabel(skill.proficiencyLevel)}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <div
                                  key={level}
                                  className={`w-2 h-6 rounded ${
                                    level <= skill.proficiencyLevel
                                      ? 'bg-green-500'
                                      : 'bg-gray-300 dark:bg-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                            {onRemoveSkill && (
                              <button
                                onClick={() => onRemoveSkill(selectedAgent.id, skill.skillId)}
                                className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                        <p className="mb-2">No skills added yet</p>
                        <p className="text-xs">Add skills to enable smart task assignment</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skill Development Suggestions */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                    💡 Skill Development Suggestions
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Consider adding backend skills for better task distribution</li>
                    <li>• Improve testing proficiency to handle QA tasks</li>
                    <li>• Database skills would enable full-stack assignments</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                <div className="text-center">
                  <Users size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Select an agent to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
