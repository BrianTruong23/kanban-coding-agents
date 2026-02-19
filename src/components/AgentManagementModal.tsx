'use client';

import { useState } from 'react';
import { X, Users, Plus, Trash2, Star } from 'lucide-react';
import { AgentWithSkills, AgentSkill } from '@/types/agent';

interface AgentManagementModalProps {
  agents: AgentWithSkills[];
  onClose: () => void;
  onAddSkill: (agentId: string, skillName: string, proficiency: 1 | 2 | 3 | 4 | 5) => Promise<void>;
  onUpdateSkill: (skillId: string, proficiency: 1 | 2 | 3 | 4 | 5) => Promise<void>;
  onDeleteSkill: (skillId: string) => Promise<void>;
}

export const AgentManagementModal = ({
  agents,
  onClose,
  onAddSkill,
  onUpdateSkill,
  onDeleteSkill,
}: AgentManagementModalProps) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentWithSkills | null>(
    agents.length > 0 ? agents[0] : null
  );
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSkill = async () => {
    if (!selectedAgent || !newSkillName.trim()) return;

    try {
      await onAddSkill(selectedAgent.id, newSkillName.trim(), newSkillProficiency);
      setNewSkillName('');
      setNewSkillProficiency(3);
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to add skill:', error);
    }
  };

  const renderProficiencyStars = (level: number, skillId?: string) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => {
              if (skillId) {
                onUpdateSkill(skillId, star as 1 | 2 | 3 | 4 | 5);
              } else {
                setNewSkillProficiency(star as 1 | 2 | 3 | 4 | 5);
              }
            }}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              size={16}
              className={star <= level ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Users className="text-blue-500" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Agent Roster Management</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage agent skills and performance</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Agent List */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-4 space-y-2">
              {agents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedAgent?.id === agent.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                      : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                        agent.avatarColor || 'bg-gray-400'
                      }`}
                    >
                      {agent.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">{agent.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {agent.skills.length} skill{agent.skills.length !== 1 ? 's' : ''}
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
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                        selectedAgent.avatarColor || 'bg-gray-400'
                      }`}
                    >
                      {selectedAgent.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedAgent.name}</h3>
                      {selectedAgent.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedAgent.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  {selectedAgent.performanceMetrics && (
                    <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Tasks Completed</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {selectedAgent.performanceMetrics.totalTasksCompleted}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Avg Quality</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {selectedAgent.performanceMetrics.averageQualityScore.toFixed(1)}/5.0
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">On-Time Rate</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {selectedAgent.performanceMetrics.onTimePercentage}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Avg Time</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {selectedAgent.performanceMetrics.averageCompletionTime.toFixed(1)}h
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Skills Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Skills</h4>
                    <button
                      onClick={() => setIsAdding(!isAdding)}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      <Plus size={16} />
                      Add Skill
                    </button>
                  </div>

                  {/* Add Skill Form */}
                  {isAdding && (
                    <div className="mb-4 p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Skill name (e.g., React, Python, DevOps)"
                          value={newSkillName}
                          onChange={e => setNewSkillName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Proficiency Level
                          </label>
                          {renderProficiencyStars(newSkillProficiency)}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleAddSkill}
                            disabled={!newSkillName.trim()}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              setIsAdding(false);
                              setNewSkillName('');
                              setNewSkillProficiency(3);
                            }}
                            className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Skills List */}
                  <div className="space-y-2">
                    {selectedAgent.skills.length > 0 ? (
                      selectedAgent.skills.map(skill => (
                        <div
                          key={skill.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">{skill.skillName}</div>
                            {renderProficiencyStars(skill.proficiencyLevel, skill.id)}
                          </div>
                          <button
                            onClick={() => onDeleteSkill(skill.id)}
                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                        No skills added yet. Click &quot;Add Skill&quot; to get started.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-sm">Select an agent to view and manage their skills</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
