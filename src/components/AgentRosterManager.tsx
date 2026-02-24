'use client';

import { useState } from 'react';
import { CodingAgent } from '@/types/agent';
import { Users, Plus, Edit2, Trash2, TrendingUp, Clock, CheckCircle2, X } from 'lucide-react';
import { useAgentSkills } from '@/hooks/useAgentSkills';

interface AgentRosterManagerProps {
  agents: CodingAgent[];
  onAddSkill: (agentId: string, skillName: string, proficiencyLevel: 1 | 2 | 3 | 4 | 5) => Promise<void>;
  onUpdateSkill: (skillId: string, proficiencyLevel: 1 | 2 | 3 | 4 | 5) => Promise<void>;
  onRemoveSkill: (skillId: string) => Promise<void>;
}

export const AgentRosterManager = ({
  agents,
  onAddSkill,
  onUpdateSkill,
  onRemoveSkill
}: AgentRosterManagerProps) => {
  const [selectedAgent, setSelectedAgent] = useState<CodingAgent | null>(null);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<1 | 2 | 3 | 4 | 5>(3);
  const { skills: allSkills } = useAgentSkills();

  const handleAddSkill = async () => {
    if (!selectedAgent || !newSkillName.trim()) return;

    await onAddSkill(selectedAgent.id, newSkillName.trim(), newSkillLevel);
    setNewSkillName('');
    setNewSkillLevel(3);
    setIsAddingSkill(false);
  };

  const getProficiencyLabel = (level: number) => {
    switch (level) {
      case 1: return 'Beginner';
      case 2: return 'Intermediate';
      case 3: return 'Proficient';
      case 4: return 'Advanced';
      case 5: return 'Expert';
      default: return 'Unknown';
    }
  };

  const getProficiencyColor = (level: number) => {
    if (level >= 5) return 'bg-purple-500';
    if (level >= 4) return 'bg-blue-500';
    if (level >= 3) return 'bg-green-500';
    if (level >= 2) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const commonSkills = [
    'React', 'TypeScript', 'Node.js', 'Python', 'Go',
    'Database', 'API Design', 'Testing', 'DevOps', 'CSS',
    'GraphQL', 'Docker', 'AWS', 'Git', 'Agile'
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-2 rounded-lg">
            <Users className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Agent Roster
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage agent skills and view performance metrics
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {agents.map((agent) => {
            const agentSkills = allSkills.filter(s => s.agentId === agent.id);
            const perf = agent.performance;

            return (
              <div
                key={agent.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedAgent(agent)}
              >
                {/* Agent Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${agent.avatarColor || 'bg-gray-500'}`}
                  >
                    {agent.avatar || agent.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {agent.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                      {agent.description}
                    </p>
                  </div>
                </div>

                {/* Performance Metrics */}
                {perf && (
                  <div className="grid grid-cols-3 gap-2 mb-3 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
                      <div className="font-semibold text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
                        <CheckCircle2 size={14} />
                        {perf.tasksCompleted}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400">In Progress</div>
                      <div className="font-semibold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1">
                        <Clock size={14} />
                        {perf.tasksInProgress}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Success</div>
                      <div className="font-semibold text-purple-600 dark:text-purple-400 flex items-center justify-center gap-1">
                        <TrendingUp size={14} />
                        {perf.successRate ? `${perf.successRate.toFixed(0)}%` : '-'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Skills */}
                <div>
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Skills ({agentSkills.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {agentSkills.slice(0, 4).map((skill) => (
                      <div
                        key={skill.id}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded flex items-center gap-1"
                      >
                        <span>{skill.skillName}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${getProficiencyColor(skill.proficiencyLevel)}`} />
                      </div>
                    ))}
                    {agentSkills.length > 4 && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded">
                        +{agentSkills.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => {
            setSelectedAgent(null);
            setIsAddingSkill(false);
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${selectedAgent.avatarColor || 'bg-gray-500'}`}
                >
                  {selectedAgent.avatar || selectedAgent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedAgent.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedAgent.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedAgent(null);
                  setIsAddingSkill(false);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            {/* Performance Stats */}
            {selectedAgent.performance && (
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Performance Metrics
                </h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {selectedAgent.performance.tasksCompleted}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Completed</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {selectedAgent.performance.tasksInProgress}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">In Progress</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {selectedAgent.performance.successRate?.toFixed(0) || '-'}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Success Rate</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {selectedAgent.performance.averageCompletionTime?.toFixed(1) || '-'}h
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Avg Time</div>
                  </div>
                </div>
              </div>
            )}

            {/* Skills Management */}
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Skills & Proficiency
                </h4>
                <button
                  onClick={() => setIsAddingSkill(true)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Plus size={16} />
                  Add Skill
                </button>
              </div>

              {/* Add Skill Form */}
              {isAddingSkill && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      placeholder="Skill name"
                      className="flex-1 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm"
                      list="common-skills"
                    />
                    <datalist id="common-skills">
                      {commonSkills.map(skill => (
                        <option key={skill} value={skill} />
                      ))}
                    </datalist>
                    <select
                      value={newSkillLevel}
                      onChange={(e) => setNewSkillLevel(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                      className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded text-sm"
                    >
                      {[1, 2, 3, 4, 5].map(level => (
                        <option key={level} value={level}>
                          {getProficiencyLabel(level)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddSkill}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingSkill(false);
                        setNewSkillName('');
                        setNewSkillLevel(3);
                      }}
                      className="px-3 py-1 text-gray-600 dark:text-gray-400 text-sm hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Skills List */}
              <div className="space-y-2">
                {allSkills
                  .filter(s => s.agentId === selectedAgent.id)
                  .map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {skill.skillName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {getProficiencyLabel(skill.proficiencyLevel)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Proficiency dots */}
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <button
                              key={level}
                              onClick={() => onUpdateSkill(skill.id, level as 1 | 2 | 3 | 4 | 5)}
                              className={`w-3 h-3 rounded-full transition-all ${
                                level <= skill.proficiencyLevel
                                  ? getProficiencyColor(level)
                                  : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <button
                          onClick={() => onRemoveSkill(skill.id)}
                          className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                {allSkills.filter(s => s.agentId === selectedAgent.id).length === 0 && (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                    No skills added yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
