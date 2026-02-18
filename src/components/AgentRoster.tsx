'use client';

import { useState } from 'react';
import { AgentWithSkills, AgentSkill } from '@/types/agent';
import { Task } from '@/types/task';
import { recommendAgent, detectSkillGaps } from '@/lib/agentAssignment';
import { Users, Star, TrendingUp, Award, Plus, Edit2, X, AlertTriangle } from 'lucide-react';

interface AgentRosterProps {
  agents: AgentWithSkills[];
  tasks: Task[];
  onAddSkill: (agentId: string, skill: AgentSkill) => void;
  onRemoveSkill: (agentId: string, skillId: string) => void;
  onUpdateSkill: (agentId: string, skillId: string, level: number) => void;
}

export const AgentRoster = ({
  agents,
  tasks,
  onAddSkill,
  onRemoveSkill,
  onUpdateSkill,
}: AgentRosterProps) => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showSkillGaps, setShowSkillGaps] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<1 | 2 | 3 | 4 | 5>(3);

  const skillGaps = detectSkillGaps(tasks, agents);
  const selectedAgentData = agents.find(a => a.id === selectedAgent);

  const getWorkloadStats = (agentId: string) => {
    const activeTasks = tasks.filter(
      t => t.assignedAgentId === agentId && (t.status === 'in-progress' || t.status === 'review')
    );
    const completedTasks = tasks.filter(
      t => t.assignedAgentId === agentId && t.status === 'done'
    );
    return {
      active: activeTasks.length,
      completed: completedTasks.length,
      total: activeTasks.length + completedTasks.length,
    };
  };

  const handleAddSkill = (agentId: string) => {
    if (!newSkillName.trim()) return;

    const skill: AgentSkill = {
      id: `skill-${Date.now()}`,
      agentId,
      skillName: newSkillName.trim(),
      skillLevel: newSkillLevel,
      createdAt: Date.now(),
    };

    onAddSkill(agentId, skill);
    setNewSkillName('');
    setNewSkillLevel(3);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6 px-4 pt-4">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Agent Roster</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({agents.length} agents)
          </span>
        </div>
        <button
          onClick={() => setShowSkillGaps(!showSkillGaps)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            showSkillGaps
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <AlertTriangle size={16} />
          Skill Gaps ({skillGaps.length})
        </button>
      </div>

      {showSkillGaps && skillGaps.length > 0 && (
        <div className="mx-4 mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} />
            Skill Gaps Detected
          </h4>
          <div className="space-y-2">
            {skillGaps.map((gap, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-medium text-amber-800 dark:text-amber-400">
                  {gap.skill}
                </span>
                <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-500">
                  <span>Demand: {gap.demand}</span>
                  <span>•</span>
                  <span>Supply: {gap.supply.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 space-y-3">
        {agents.map(agent => {
          const workload = getWorkloadStats(agent.id);
          const isSelected = selectedAgent === agent.id;

          return (
            <div
              key={agent.id}
              className={`border rounded-lg transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedAgent(isSelected ? null : agent.id)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full ${agent.avatarColor || 'bg-gray-400'} flex items-center justify-center text-white font-bold`}
                    >
                      {agent.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">
                        {agent.name}
                      </h4>
                      {agent.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          {agent.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {agent.performanceMetrics && agent.performanceMetrics.tasksCompleted > 0 && (
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-bold">
                        {agent.performanceMetrics.averageQualityScore?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Active</div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {workload.active}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Completed</div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {workload.completed}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {workload.total}
                    </div>
                  </div>
                </div>

                {agent.performanceMetrics && (
                  <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mb-3">
                    {agent.performanceMetrics.averageQualityScore && (
                      <div className="flex items-center gap-1">
                        <Award size={12} />
                        <span>Quality: {agent.performanceMetrics.averageQualityScore.toFixed(1)}/5</span>
                      </div>
                    )}
                    {agent.performanceMetrics.averageCompletionTime && (
                      <div className="flex items-center gap-1">
                        <TrendingUp size={12} />
                        <span>Avg: {agent.performanceMetrics.averageCompletionTime.toFixed(1)}h</span>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Skills ({agent.skills.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.skills.map(skill => (
                      <div
                        key={skill.id}
                        className="group relative px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium flex items-center gap-1"
                      >
                        <span>{skill.skillName}</span>
                        <span className="text-blue-500 dark:text-blue-500">L{skill.skillLevel}</span>
                        {isSelected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveSkill(agent.id, skill.id);
                            }}
                            className="ml-1 text-blue-600 hover:text-red-600 dark:text-blue-400 dark:hover:text-red-400"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Add New Skill
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Skill name (e.g., React)"
                        value={newSkillName}
                        onChange={e => setNewSkillName(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={newSkillLevel}
                        onChange={e => setNewSkillLevel(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                        onClick={e => e.stopPropagation()}
                        className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={1}>L1</option>
                        <option value={2}>L2</option>
                        <option value={3}>L3</option>
                        <option value={4}>L4</option>
                        <option value={5}>L5</option>
                      </select>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddSkill(agent.id);
                        }}
                        disabled={!newSkillName.trim()}
                        className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
                      >
                        <Plus size={14} />
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {agents.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <Users size={48} className="mx-auto mb-3 opacity-50" />
            <p>No agents available</p>
          </div>
        </div>
      )}
    </div>
  );
};
