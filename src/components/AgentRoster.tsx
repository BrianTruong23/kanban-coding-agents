'use client';

import { CodingAgent, AgentSkill } from '@/types/agent';
import { Task } from '@/types/task';
import { useState } from 'react';
import { Users, TrendingUp, Award, Clock, Plus, X, Edit2 } from 'lucide-react';
import { getAgentUtilization } from '@/lib/autoAssignment';

interface AgentRosterProps {
  agents: CodingAgent[];
  tasks: Task[];
  onAddSkill?: (agentId: string, skillName: string, skillLevel: number) => void;
  onUpdateAgent?: (agent: CodingAgent) => void;
}

export const AgentRoster = ({ agents, tasks, onAddSkill, onUpdateAgent }: AgentRosterProps) => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<1 | 2 | 3 | 4 | 5>(3);

  const utilization = getAgentUtilization(agents, tasks);

  const getUtilizationColor = (util: number) => {
    if (util < 30) return 'text-green-600 dark:text-green-400';
    if (util < 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getSkillLevelLabel = (level: number) => {
    switch (level) {
      case 1:
        return 'Beginner';
      case 2:
        return 'Intermediate';
      case 3:
        return 'Proficient';
      case 4:
        return 'Advanced';
      case 5:
        return 'Expert';
      default:
        return 'Unknown';
    }
  };

  const handleAddSkill = () => {
    if (selectedAgent && newSkillName.trim() && onAddSkill) {
      onAddSkill(selectedAgent, newSkillName.trim(), newSkillLevel);
      setNewSkillName('');
      setNewSkillLevel(3);
      setIsAddingSkill(false);
    }
  };

  return (
    <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="text-gray-600 dark:text-gray-400" size={20} />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Agent Roster</h3>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {agents.length} agent{agents.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 overflow-y-auto max-h-[600px]">
        {agents.map(agent => {
          const stats = utilization.get(agent.id);
          const isSelected = selectedAgent === agent.id;

          return (
            <div
              key={agent.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50 dark:bg-blue-900/10'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
              onClick={() => setSelectedAgent(isSelected ? null : agent.id)}
            >
              {/* Agent Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full ${
                      agent.avatarColor || 'bg-gray-400'
                    } flex items-center justify-center text-white font-bold text-lg`}
                  >
                    {agent.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{agent.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {agent.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tasks</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {stats?.tasksCount || 0}
                  </div>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Workload</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {stats?.workload || 0}
                  </div>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Utilization
                  </div>
                  <div className={`text-lg font-bold ${getUtilizationColor(stats?.utilization || 0)}`}>
                    {Math.round(stats?.utilization || 0)}%
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              {agent.performance && (
                <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={14} className="text-gray-600 dark:text-gray-400" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Performance
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Completed</div>
                      <div className="font-bold text-gray-900 dark:text-white">
                        {agent.performance.tasksCompleted}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Quality</div>
                      <div className="font-bold text-gray-900 dark:text-white">
                        {agent.performance.averageQualityScore.toFixed(1)}/5
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">On Time</div>
                      <div className="font-bold text-gray-900 dark:text-white">
                        {Math.round(agent.performance.onTimePercentage)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Skills */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Award size={14} className="text-gray-600 dark:text-gray-400" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Skills
                    </span>
                  </div>
                  {isSelected && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setIsAddingSkill(true);
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {agent.skills && agent.skills.length > 0 ? (
                    agent.skills.map(skill => (
                      <div
                        key={skill.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
                      >
                        <span>{skill.skillName}</span>
                        <span className="text-blue-500 dark:text-blue-400 font-bold">
                          {skill.skillLevel}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      No skills defined
                    </span>
                  )}
                </div>
              </div>

              {/* Add Skill Form */}
              {isSelected && isAddingSkill && (
                <div
                  className="mt-3 p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Add Skill
                    </span>
                    <button
                      onClick={() => setIsAddingSkill(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Skill name (e.g., React)"
                    value={newSkillName}
                    onChange={e => setNewSkillName(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded mb-2"
                  />
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-xs text-gray-600 dark:text-gray-400">Level:</label>
                    <select
                      value={newSkillLevel}
                      onChange={e => setNewSkillLevel(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded"
                    >
                      {[1, 2, 3, 4, 5].map(level => (
                        <option key={level} value={level}>
                          {level} - {getSkillLevelLabel(level)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleAddSkill}
                    className="w-full px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Add Skill
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
