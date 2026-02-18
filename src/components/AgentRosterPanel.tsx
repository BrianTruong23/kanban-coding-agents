'use client';

import { useState } from 'react';
import { CodingAgent } from '@/types/agent';
import { AgentSkill, TaskBreakdown } from '@/types/breakdown';
import { analyzeAgentRoster } from '@/lib/agentOrchestration';
import { User, Plus, Trash2, Star, TrendingUp, AlertCircle, Users } from 'lucide-react';

interface AgentRosterPanelProps {
  agents: CodingAgent[];
  tasks: TaskBreakdown[];
  currentAssignments: Map<string, number>;
  onAddAgent?: () => void;
  onUpdateAgent?: (agent: CodingAgent) => void;
  onDeleteAgent?: (agentId: string) => void;
}

export const AgentRosterPanel = ({
  agents,
  tasks,
  currentAssignments,
  onAddAgent,
  onUpdateAgent,
  onDeleteAgent
}: AgentRosterPanelProps) => {
  const [selectedAgent, setSelectedAgent] = useState<CodingAgent | null>(null);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newProficiency, setNewProficiency] = useState<1 | 2 | 3 | 4 | 5>(3);

  // Analyze roster
  const analysis = analyzeAgentRoster(agents, tasks, currentAssignments);

  const handleAddSkill = () => {
    if (!selectedAgent || !newSkill.trim()) return;

    const updatedAgent: CodingAgent = {
      ...selectedAgent,
      skills: [
        ...(selectedAgent.skills || []),
        {
          id: Date.now().toString(),
          agentId: selectedAgent.id,
          skill: newSkill.trim(),
          proficiency: newProficiency
        }
      ]
    };

    onUpdateAgent?.(updatedAgent);
    setSelectedAgent(updatedAgent);
    setNewSkill('');
    setNewProficiency(3);
    setIsAddingSkill(false);
  };

  const handleRemoveSkill = (skillId: string) => {
    if (!selectedAgent) return;

    const updatedAgent: CodingAgent = {
      ...selectedAgent,
      skills: selectedAgent.skills?.filter(s => s.id !== skillId)
    };

    onUpdateAgent?.(updatedAgent);
    setSelectedAgent(updatedAgent);
  };

  const getProficiencyLabel = (level: number) => {
    const labels = ['Beginner', 'Intermediate', 'Proficient', 'Advanced', 'Expert'];
    return labels[level - 1] || 'Unknown';
  };

  const getProficiencyColor = (level: number) => {
    if (level >= 4) return 'text-green-600 dark:text-green-400';
    if (level >= 3) return 'text-blue-600 dark:text-blue-400';
    if (level >= 2) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="flex h-full gap-4">
      {/* Agent List */}
      <div className="w-80 flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Agent Roster</h3>
            {onAddAgent && (
              <button
                onClick={onAddAgent}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                title="Add agent"
              >
                <Plus size={18} />
              </button>
            )}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {agents.length} agents • {analysis.averageLoad.toFixed(1)} avg load
          </div>
        </div>

        {/* Roster Analysis */}
        <div className="p-4 space-y-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Total Capacity</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {analysis.averageCapacity.toFixed(1)}
            </span>
          </div>

          {analysis.skillGaps.length > 0 && (
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
              <div className="flex items-center gap-1 font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                <AlertCircle size={12} />
                Skill Gaps
              </div>
              <div className="text-yellow-700 dark:text-yellow-400">
                {analysis.skillGaps.join(', ')}
              </div>
            </div>
          )}

          {analysis.recommendations.length > 0 && (
            <div className="space-y-1">
              {analysis.recommendations.slice(0, 2).map((rec, idx) => (
                <div
                  key={idx}
                  className="text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  {rec}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agent List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {agents.map((agent) => {
            const load = currentAssignments.get(agent.id) || 0;
            const capacity = agent.capacity || 5;
            const loadPercentage = (load / capacity) * 100;
            const isOverloaded = load >= capacity;

            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedAgent?.id === agent.id
                    ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: agent.avatarColor || '#6b7280' }}
                  >
                    {agent.avatar || agent.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                      {agent.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {agent.skills?.length || 0} skills
                    </div>
                  </div>
                </div>

                {/* Load bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Load</span>
                    <span
                      className={`font-semibold ${
                        isOverloaded
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {load}/{capacity}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        loadPercentage >= 100
                          ? 'bg-red-500'
                          : loadPercentage >= 80
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(loadPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {agents.length === 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No agents yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Agent Details */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {selectedAgent ? (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                    style={{ backgroundColor: selectedAgent.avatarColor || '#6b7280' }}
                  >
                    {selectedAgent.avatar || selectedAgent.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedAgent.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {selectedAgent.description || 'No description'}
                    </p>
                  </div>
                </div>
                {onDeleteAgent && (
                  <button
                    onClick={() => {
                      onDeleteAgent(selectedAgent.id);
                      setSelectedAgent(null);
                    }}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Delete agent"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Performance Stats */}
            {selectedAgent.performance && (
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <TrendingUp size={16} />
                  Performance
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedAgent.performance.tasksCompleted}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {selectedAgent.performance.tasksCompleted > 0
                        ? Math.round(
                            (selectedAgent.performance.tasksOnTime /
                              selectedAgent.performance.tasksCompleted) *
                              100
                          )
                        : 0}
                      %
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">On Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {selectedAgent.performance.qualityScore}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Quality</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {selectedAgent.performance.averageCompletionTime.toFixed(1)}h
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Avg Time</div>
                  </div>
                </div>
              </div>
            )}

            {/* Skills */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Star size={16} />
                  Skills
                </h3>
                <button
                  onClick={() => setIsAddingSkill(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  + Add Skill
                </button>
              </div>

              {isAddingSkill && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Skill name (e.g., React, Python, Docker)"
                      className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                      autoFocus
                    />
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-gray-600 dark:text-gray-400">
                        Proficiency:
                      </label>
                      <select
                        value={newProficiency}
                        onChange={(e) =>
                          setNewProficiency(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)
                        }
                        className="flex-1 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                      >
                        {[1, 2, 3, 4, 5].map((level) => (
                          <option key={level} value={level}>
                            {level} - {getProficiencyLabel(level)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setIsAddingSkill(false);
                          setNewSkill('');
                          setNewProficiency(3);
                        }}
                        className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddSkill}
                        disabled={!newSkill.trim()}
                        className="px-3 py-1 text-sm bg-black dark:bg-white text-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50"
                      >
                        Add
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
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                          {skill.skill}
                        </div>
                        <div className={`text-xs ${getProficiencyColor(skill.proficiency)}`}>
                          {getProficiencyLabel(skill.proficiency)}
                          {skill.yearsExperience && ` • ${skill.yearsExperience}y exp`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`w-2 h-4 rounded-sm ${
                                level <= skill.proficiency
                                  ? 'bg-blue-500'
                                  : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <button
                          onClick={() => handleRemoveSkill(skill.id)}
                          className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                    <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No skills added yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
            <div className="text-center">
              <User className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p>Select an agent to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
