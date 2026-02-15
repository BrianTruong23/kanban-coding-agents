'use client';

import { CodingAgent } from '@/types/agent';
import { AgentSkill, AgentPerformance, SkillCategory } from '@/types/breakdown';
import { useState } from 'react';
import { Plus, Edit2, Trash2, TrendingUp, Award, Clock } from 'lucide-react';

interface AgentRosterProps {
  agents: CodingAgent[];
  agentSkills: AgentSkill[];
  agentPerformance: AgentPerformance[];
  onUpdateSkills?: (agentId: string, skills: AgentSkill[]) => void;
  onAddAgent?: (agent: CodingAgent) => void;
  onEditAgent?: (agent: CodingAgent) => void;
  onDeleteAgent?: (agentId: string) => void;
}

const skillCategories: SkillCategory[] = [
  'frontend', 'backend', 'database', 'devops', 'mobile', 'testing', 'design', 'ai-ml'
];

const skillColors: Record<SkillCategory, string> = {
  'frontend': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'backend': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'database': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'devops': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  'mobile': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  'testing': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  'design': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  'ai-ml': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
};

const getProficiencyLabel = (level: number): string => {
  const labels = ['Beginner', 'Intermediate', 'Proficient', 'Advanced', 'Expert'];
  return labels[level - 1] || 'Unknown';
};

export default function AgentRoster({
  agents,
  agentSkills,
  agentPerformance,
  onUpdateSkills,
  onAddAgent,
  onEditAgent,
  onDeleteAgent,
}: AgentRosterProps) {
  const [editingSkills, setEditingSkills] = useState<string | null>(null);
  const [tempSkills, setTempSkills] = useState<Map<SkillCategory, number>>(new Map());
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const getSkillsForAgent = (agentId: string) => {
    return agentSkills.filter(s => s.agentId === agentId);
  };

  const getPerformanceForAgent = (agentId: string) => {
    return agentPerformance.find(p => p.agentId === agentId);
  };

  const handleEditSkills = (agentId: string) => {
    const skills = getSkillsForAgent(agentId);
    const skillMap = new Map<SkillCategory, number>();
    skills.forEach(skill => {
      skillMap.set(skill.skillCategory, skill.proficiencyLevel);
    });
    setTempSkills(skillMap);
    setEditingSkills(agentId);
  };

  const handleSaveSkills = (agentId: string) => {
    const skills: AgentSkill[] = Array.from(tempSkills.entries()).map(([category, level]) => ({
      id: `${agentId}-${category}`,
      agentId,
      userId: '', // Will be set in the hook
      skillCategory: category,
      proficiencyLevel: level as AgentSkill['proficiencyLevel'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    onUpdateSkills?.(agentId, skills);
    setEditingSkills(null);
  };

  const handleSkillLevelChange = (category: SkillCategory, level: number) => {
    setTempSkills(prev => {
      const next = new Map(prev);
      if (level === 0) {
        next.delete(category);
      } else {
        next.set(category, level);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agent Roster</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage your coding agents, their skills, and track performance
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {viewMode === 'grid' ? '📊 Table View' : '🎴 Grid View'}
          </button>
          {onAddAgent && (
            <button
              onClick={() => {/* Implement add agent modal */}}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Agent
            </button>
          )}
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(agent => {
            const skills = getSkillsForAgent(agent.id);
            const performance = getPerformanceForAgent(agent.id);
            const isEditing = editingSkills === agent.id;

            return (
              <div
                key={agent.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Agent Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${agent.avatarColor || 'bg-gray-500'}`}
                    >
                      {agent.avatar}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{agent.name}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{agent.description}</p>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                {performance && (
                  <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Performance</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Award className="w-3 h-3 text-yellow-500" />
                        <span>Quality: {performance.qualityScore}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-500" />
                        <span>On-time: {performance.onTimeDelivery}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span>{performance.tasksCompleted} tasks</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-purple-500" />
                        <span>Avg: {performance.averageCompletionTime.toFixed(1)}h</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Skills */}
                <div className="bg-white dark:bg-gray-800 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Skills</h4>
                    {!isEditing && onUpdateSkills && (
                      <button
                        onClick={() => handleEditSkills(agent.id)}
                        className="text-blue-600 hover:text-blue-700 text-xs"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      {skillCategories.map(category => {
                        const currentLevel = tempSkills.get(category) || 0;
                        return (
                          <div key={category} className="flex items-center justify-between text-xs">
                            <span className="capitalize">{category}</span>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map(level => (
                                <button
                                  key={level}
                                  onClick={() => handleSkillLevelChange(category, level)}
                                  className={`w-6 h-6 rounded ${
                                    level <= currentLevel
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-gray-200 dark:bg-gray-700'
                                  }`}
                                >
                                  {level}
                                </button>
                              ))}
                              <button
                                onClick={() => handleSkillLevelChange(category, 0)}
                                className="w-6 h-6 rounded bg-red-100 dark:bg-red-900/30 text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleSaveSkills(agent.id)}
                          className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingSkills(null)}
                          className="flex-1 px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {skills.length === 0 ? (
                        <span className="text-xs text-gray-500 italic">No skills defined</span>
                      ) : (
                        skills.map(skill => (
                          <div
                            key={skill.id}
                            className={`px-2 py-1 rounded text-xs ${skillColors[skill.skillCategory]}`}
                          >
                            {skill.skillCategory} ({skill.proficiencyLevel}/5)
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left">Agent</th>
                <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left">Skills</th>
                <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left">Quality</th>
                <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left">On-Time</th>
                <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left">Tasks</th>
                <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map(agent => {
                const skills = getSkillsForAgent(agent.id);
                const performance = getPerformanceForAgent(agent.id);

                return (
                  <tr key={agent.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${agent.avatarColor || 'bg-gray-500'}`}
                        >
                          {agent.avatar}
                        </div>
                        <div>
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-xs text-gray-500">{agent.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {skills.map(skill => (
                          <span
                            key={skill.id}
                            className={`px-2 py-0.5 rounded text-xs ${skillColors[skill.skillCategory]}`}
                          >
                            {skill.skillCategory} ({skill.proficiencyLevel})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                      {performance?.qualityScore || 'N/A'}%
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                      {performance?.onTimeDelivery || 'N/A'}%
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                      {performance?.tasksCompleted || 0}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSkills(agent.id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {onDeleteAgent && (
                          <button
                            onClick={() => onDeleteAgent(agent.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
