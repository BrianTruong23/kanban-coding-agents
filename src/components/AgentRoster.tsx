'use client';

import { useState } from 'react';
import { CodingAgent, AgentSkill } from '@/types/agent';
import { Users, Plus, X, TrendingUp, CheckCircle, Clock } from 'lucide-react';

interface AgentRosterProps {
  agents: CodingAgent[];
  onUpdateAgent?: (agent: CodingAgent) => void;
  onAddSkill?: (agentId: string, skill: AgentSkill) => void;
  onRemoveSkill?: (agentId: string, skillId: string) => void;
}

export const AgentRoster = ({ agents, onUpdateAgent, onAddSkill, onRemoveSkill }: AgentRosterProps) => {
  const [selectedAgent, setSelectedAgent] = useState<CodingAgent | null>(null);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState<1 | 2 | 3 | 4 | 5>(3);

  const handleAddSkill = () => {
    if (!selectedAgent || !newSkillName.trim() || !onAddSkill) return;

    const skill: AgentSkill = {
      id: `skill-${Date.now()}`,
      agentId: selectedAgent.id,
      skillName: newSkillName.trim(),
      proficiency: newSkillProficiency,
      createdAt: Date.now(),
    };

    onAddSkill(selectedAgent.id, skill);
    setNewSkillName('');
    setNewSkillProficiency(3);
    setIsAddingSkill(false);
  };

  const getProficiencyLabel = (level: number): string => {
    const labels = ['', 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];
    return labels[level] || 'Unknown';
  };

  const getProficiencyColor = (level: number): string => {
    const colors = [
      '',
      'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-300',
      'bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    ];
    return colors[level] || colors[1];
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Agent List */}
      <div className="lg:w-1/3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-gray-600 dark:text-gray-400" />
            <h3 className="font-bold text-gray-900 dark:text-white">Agent Roster</h3>
            <span className="ml-auto bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs font-semibold">
              {agents.length}
            </span>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[600px]">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50 ${
                selectedAgent?.id === agent.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                  : ''
              }`}
            >
              <div
                className={`${agent.avatarColor || 'bg-gray-400'} text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm flex-shrink-0`}
              >
                {agent.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900 dark:text-white">{agent.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {agent.description}
                </div>
                {agent.performance && (
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle size={12} />
                      <span>{agent.performance.tasksCompleted} done</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <Clock size={12} />
                      <span>{agent.performance.tasksInProgress} active</span>
                    </div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Agent Details */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {selectedAgent ? (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <div
                  className={`${selectedAgent.avatarColor || 'bg-gray-400'} text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg flex-shrink-0`}
                >
                  {selectedAgent.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    {selectedAgent.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedAgent.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            {selectedAgent.performance && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={16} className="text-gray-600 dark:text-gray-400" />
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                    Performance Metrics
                  </h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedAgent.performance.tasksCompleted}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {selectedAgent.performance.tasksInProgress}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">In Progress</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {selectedAgent.performance.successRate.toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Success Rate</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {selectedAgent.performance.avgCompletionTimeHours?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Avg Hours</div>
                  </div>
                </div>
              </div>
            )}

            {/* Skills */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Skills</h4>
                {onAddSkill && (
                  <button
                    onClick={() => setIsAddingSkill(true)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-medium flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Add Skill
                  </button>
                )}
              </div>

              {isAddingSkill && (
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Skill name (e.g., React, Python)"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm"
                      autoFocus
                    />
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Proficiency Level
                      </label>
                      <select
                        value={newSkillProficiency}
                        onChange={(e) => setNewSkillProficiency(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                        className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm"
                      >
                        <option value={1}>1 - Beginner</option>
                        <option value={2}>2 - Intermediate</option>
                        <option value={3}>3 - Advanced</option>
                        <option value={4}>4 - Expert</option>
                        <option value={5}>5 - Master</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddSkill}
                        disabled={!newSkillName.trim()}
                        className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingSkill(false);
                          setNewSkillName('');
                          setNewSkillProficiency(3);
                        }}
                        className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {selectedAgent.skills && selectedAgent.skills.length > 0 ? (
                  selectedAgent.skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                          {skill.skillName}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-1.5 w-6 rounded ${
                                level <= skill.proficiency
                                  ? 'bg-blue-500'
                                  : 'bg-gray-200 dark:bg-gray-600'
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                            {getProficiencyLabel(skill.proficiency)}
                          </span>
                        </div>
                      </div>
                      {onRemoveSkill && (
                        <button
                          onClick={() => onRemoveSkill(selectedAgent.id, skill.id)}
                          className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                    <p>No skills added yet</p>
                    {onAddSkill && (
                      <button
                        onClick={() => setIsAddingSkill(true)}
                        className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-medium"
                      >
                        Add the first skill
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <Users size={48} className="mx-auto mb-2 opacity-50" />
              <p>Select an agent to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
