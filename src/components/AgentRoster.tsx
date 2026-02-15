'use client';

import { useState } from 'react';
import { CodingAgent, AgentSkill } from '@/types/agent';
import { User, Plus, X, TrendingUp, CheckCircle2, Clock } from 'lucide-react';

interface AgentRosterProps {
  agents: CodingAgent[];
  onAddSkill?: (agentId: string, skill: AgentSkill) => void;
  onRemoveSkill?: (agentId: string, skillId: string) => void;
  onUpdateAgent?: (agent: CodingAgent) => void;
}

export const AgentRoster = ({
  agents,
  onAddSkill,
  onRemoveSkill,
  onUpdateAgent,
}: AgentRosterProps) => {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState<1 | 2 | 3 | 4 | 5>(3);

  const handleAddSkill = (agentId: string) => {
    if (!newSkillName.trim() || !onAddSkill) return;

    const skill: AgentSkill = {
      id: crypto.randomUUID(),
      agentId,
      skillName: newSkillName,
      proficiency: newSkillProficiency,
      createdAt: Date.now(),
    };

    onAddSkill(agentId, skill);
    setNewSkillName('');
    setNewSkillProficiency(3);
    setEditingSkill(null);
  };

  const getProficiencyLabel = (level: number) => {
    const labels = ['', 'Beginner', 'Intermediate', 'Proficient', 'Advanced', 'Expert'];
    return labels[level] || 'Unknown';
  };

  const getProficiencyColor = (level: number) => {
    if (level >= 5) return 'bg-purple-500';
    if (level >= 4) return 'bg-blue-500';
    if (level >= 3) return 'bg-green-500';
    if (level >= 2) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Agent Roster</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {agents.length} {agents.length === 1 ? 'agent' : 'agents'}
        </span>
      </div>

      <div className="grid gap-4">
        {agents.map((agent) => {
          const isExpanded = expandedAgent === agent.id;
          const performance = agent.performance;
          const skills = agent.skills || [];

          return (
            <div
              key={agent.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Agent Header */}
              <button
                onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {/* Avatar */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                    agent.avatarColor || 'bg-gray-500'
                  }`}
                >
                  {agent.avatar || <User size={24} />}
                </div>

                {/* Info */}
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {agent.name}
                  </div>
                  {agent.description && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {agent.description}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <TrendingUp size={14} />
                      {skills.length} skills
                    </span>
                    {performance && (
                      <>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={14} />
                          {performance.tasksCompleted} completed
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {performance.successRate.toFixed(0)}% success
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Expand Icon */}
                <div
                  className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                >
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
                  {/* Performance Stats */}
                  {performance && (
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {performance.tasksCompleted}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Completed
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {performance.tasksAssigned}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Assigned
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {performance.successRate.toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Success Rate
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {performance.averageCompletionTimeHours.toFixed(1)}h
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Avg Time
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Skills
                      </h3>
                      {onAddSkill && (
                        <button
                          onClick={() =>
                            setEditingSkill(editingSkill === agent.id ? null : agent.id)
                          }
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <Plus size={16} />
                          Add Skill
                        </button>
                      )}
                    </div>

                    {/* Add Skill Form */}
                    {editingSkill === agent.id && onAddSkill && (
                      <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                        <input
                          type="text"
                          value={newSkillName}
                          onChange={(e) => setNewSkillName(e.target.value)}
                          placeholder="Skill name (e.g., React, Python)"
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-600 dark:text-gray-400">
                            Proficiency:
                          </label>
                          <select
                            value={newSkillProficiency}
                            onChange={(e) =>
                              setNewSkillProficiency(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)
                            }
                            className="flex-1 px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                          >
                            <option value={1}>1 - Beginner</option>
                            <option value={2}>2 - Intermediate</option>
                            <option value={3}>3 - Proficient</option>
                            <option value={4}>4 - Advanced</option>
                            <option value={5}>5 - Expert</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddSkill(agent.id)}
                            className="flex-1 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-sm rounded hover:bg-gray-800 dark:hover:bg-gray-200"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              setEditingSkill(null);
                              setNewSkillName('');
                              setNewSkillProficiency(3);
                            }}
                            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Skills List */}
                    {skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <div
                            key={skill.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${getProficiencyColor(
                                skill.proficiency
                              )}`}
                              title={getProficiencyLabel(skill.proficiency)}
                            />
                            <span className="text-gray-900 dark:text-white">
                              {skill.skillName}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {skill.proficiency}/5
                            </span>
                            {onRemoveSkill && (
                              <button
                                onClick={() => onRemoveSkill(agent.id, skill.id)}
                                className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        No skills defined yet
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
