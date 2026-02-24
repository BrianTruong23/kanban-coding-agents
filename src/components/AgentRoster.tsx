'use client';

import { useState } from 'react';
import { EnhancedAgent, AgentSkill } from '@/types/breakdown';
import { Users, TrendingUp, Award, AlertCircle, Plus, X } from 'lucide-react';

interface AgentRosterProps {
  agents: EnhancedAgent[];
  onUpdateAgent?: (agent: EnhancedAgent) => void;
  onAddSkill?: (agentId: string, skill: AgentSkill) => void;
  onRemoveSkill?: (agentId: string, skillId: string) => void;
}

export const AgentRoster = ({
  agents,
  onUpdateAgent,
  onAddSkill,
  onRemoveSkill
}: AgentRosterProps) => {
  const [selectedAgent, setSelectedAgent] = useState<EnhancedAgent | null>(null);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<1 | 2 | 3 | 4 | 5>(3);

  const handleAddSkill = () => {
    if (!selectedAgent || !newSkillName.trim()) return;

    const skill: AgentSkill = {
      id: crypto.randomUUID(),
      agentId: selectedAgent.id,
      skillName: newSkillName.trim(),
      proficiencyLevel: newSkillLevel,
      createdAt: Date.now()
    };

    if (onAddSkill) {
      onAddSkill(selectedAgent.id, skill);
    }

    setNewSkillName('');
    setNewSkillLevel(3);
    setIsAddingSkill(false);
  };

  const getProficiencyLabel = (level: number): string => {
    switch (level) {
      case 1: return 'Novice';
      case 2: return 'Beginner';
      case 3: return 'Intermediate';
      case 4: return 'Advanced';
      case 5: return 'Expert';
      default: return 'Unknown';
    }
  };

  const getAvailabilityColor = (availability: string): string => {
    switch (availability) {
      case 'available': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'busy': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'offline': return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
    }
  };

  const getPerformanceRating = (performance: any): string => {
    if (!performance || performance.tasksCompleted === 0) return 'New';

    const onTimeRate = performance.tasksOnTime / performance.tasksCompleted;
    const qualityScore = performance.qualityScore;

    const score = (onTimeRate * 0.6 + qualityScore / 100 * 0.4);

    if (score >= 0.9) return 'Excellent';
    if (score >= 0.7) return 'Good';
    if (score >= 0.5) return 'Average';
    return 'Needs Improvement';
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Users className="text-gray-600 dark:text-gray-400" size={20} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Agent Roster
          </h3>
          <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
            {agents.length} agents
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Agent List */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          {agents.map(agent => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={`w-full p-4 text-left border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                selectedAgent?.id === agent.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    agent.avatarColor || 'bg-gray-500'
                  }`}
                >
                  {agent.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {agent.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {agent.description || 'No description'}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getAvailabilityColor(agent.availability)}`}>
                      {agent.availability}
                    </span>
                    {agent.currentWorkload > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {agent.currentWorkload} task{agent.currentWorkload > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Agent Details */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedAgent ? (
            <div className="space-y-6">
              {/* Agent Info */}
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                      selectedAgent.avatarColor || 'bg-gray-500'
                    }`}
                  >
                    {selectedAgent.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedAgent.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedAgent.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${getAvailabilityColor(selectedAgent.availability)}`}>
                        {selectedAgent.availability}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Current workload: {selectedAgent.currentWorkload} tasks
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={18} className="text-blue-600 dark:text-blue-400" />
                  <h5 className="font-semibold text-gray-900 dark:text-white">Performance</h5>
                  <span className="ml-auto text-sm font-medium text-blue-600 dark:text-blue-400">
                    {getPerformanceRating(selectedAgent.performance)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Tasks Completed</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedAgent.performance?.tasksCompleted || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">On-Time Rate</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedAgent.performance?.tasksCompleted > 0
                        ? Math.round((selectedAgent.performance.tasksOnTime / selectedAgent.performance.tasksCompleted) * 100)
                        : 0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Quality Score</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Math.round(selectedAgent.performance?.qualityScore || 100)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Avg. Completion</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedAgent.performance?.averageCompletionTime?.toFixed(1) || 0}h
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-purple-600 dark:text-purple-400" />
                    <h5 className="font-semibold text-gray-900 dark:text-white">Skills</h5>
                  </div>
                  <button
                    onClick={() => setIsAddingSkill(true)}
                    className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center gap-1"
                  >
                    <Plus size={12} />
                    Add Skill
                  </button>
                </div>

                {isAddingSkill && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Skill Name
                        </label>
                        <input
                          type="text"
                          value={newSkillName}
                          onChange={(e) => setNewSkillName(e.target.value)}
                          placeholder="e.g., React, Python, DevOps"
                          className="w-full text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Proficiency Level
                        </label>
                        <select
                          value={newSkillLevel}
                          onChange={(e) => setNewSkillLevel(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                          className="w-full text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value={1}>1 - Novice</option>
                          <option value={2}>2 - Beginner</option>
                          <option value={3}>3 - Intermediate</option>
                          <option value={4}>4 - Advanced</option>
                          <option value={5}>5 - Expert</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setIsAddingSkill(false);
                            setNewSkillName('');
                            setNewSkillLevel(3);
                          }}
                          className="text-xs px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddSkill}
                          disabled={!newSkillName.trim()}
                          className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {selectedAgent.skills && selectedAgent.skills.length > 0 ? (
                    selectedAgent.skills.map(skill => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {skill.skillName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {getProficiencyLabel(skill.proficiencyLevel)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(level => (
                              <div
                                key={level}
                                className={`w-2 h-4 rounded-sm ${
                                  level <= skill.proficiencyLevel
                                    ? 'bg-purple-600'
                                    : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                          {onRemoveSkill && (
                            <button
                              onClick={() => onRemoveSkill(selectedAgent.id, skill.id)}
                              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
                      <AlertCircle size={24} className="mx-auto mb-2" />
                      <p>No skills defined yet</p>
                      <p className="text-xs mt-1">Add skills to improve auto-assignment accuracy</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Users size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Select an agent to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
