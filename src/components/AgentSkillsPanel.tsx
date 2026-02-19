'use client';

import { useState } from 'react';
import { CodingAgent } from '@/types/agent';
import { AgentSkill } from '@/types/agentSkill';
import { AgentPerformance } from '@/types/agentPerformance';
import { Plus, X, TrendingUp, Award, Clock } from 'lucide-react';
import { AgentOrchestrationService } from '@/services/agentOrchestration';

interface AgentSkillsPanelProps {
  agents: CodingAgent[];
  skills: AgentSkill[];
  performances: AgentPerformance[];
  onAddSkill: (skill: Omit<AgentSkill, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onRemoveSkill: (skillId: string) => void;
  onUpdateSkill: (skill: AgentSkill) => void;
}

export const AgentSkillsPanel = ({
  agents,
  skills,
  performances,
  onAddSkill,
  onRemoveSkill,
  onUpdateSkill
}: AgentSkillsPanelProps) => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<1 | 2 | 3 | 4 | 5>(3);

  const selectedAgentData = agents.find(a => a.id === selectedAgent);
  const agentSkills = skills.filter(s => s.agentId === selectedAgent);
  const agentStats = selectedAgent
    ? AgentOrchestrationService.getAgentStats(selectedAgent, performances)
    : null;

  const commonSkills = [
    'React', 'Next.js', 'TypeScript', 'JavaScript',
    'Node.js', 'API Development', 'Database', 'PostgreSQL',
    'DevOps', 'Docker', 'CI/CD', 'Testing',
    'Mobile', 'React Native', 'UI/UX', 'Tailwind CSS'
  ];

  const handleAddSkill = () => {
    if (!selectedAgent || !newSkillName.trim()) return;

    onAddSkill({
      agentId: selectedAgent,
      skillName: newSkillName.trim(),
      proficiencyLevel: newSkillLevel
    });

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
    switch (level) {
      case 1: return 'bg-gray-500';
      case 2: return 'bg-blue-500';
      case 3: return 'bg-green-500';
      case 4: return 'bg-orange-500';
      case 5: return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Agent Skills & Performance</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage agent skills and view performance metrics</p>
      </div>

      <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700">
        {/* Agent List */}
        <div className="overflow-y-auto max-h-96">
          <div className="p-2">
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                  selectedAgent === agent.id
                    ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${agent.avatarColor || 'bg-gray-500'}`}>
                    {agent.avatar || agent.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">{agent.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {skills.filter(s => s.agentId === agent.id).length} skills
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Skills List */}
        <div className="overflow-y-auto max-h-96">
          {selectedAgentData ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Skills</h4>
                <button
                  onClick={() => setIsAddingSkill(true)}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm flex items-center gap-1"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>

              {isAddingSkill && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <input
                    type="text"
                    placeholder="Skill name"
                    value={newSkillName}
                    onChange={e => setNewSkillName(e.target.value)}
                    list="common-skills"
                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2 rounded text-sm mb-2"
                    autoFocus
                  />
                  <datalist id="common-skills">
                    {commonSkills.map(skill => (
                      <option key={skill} value={skill} />
                    ))}
                  </datalist>
                  <select
                    value={newSkillLevel}
                    onChange={e => setNewSkillLevel(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                    className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2 rounded text-sm mb-2"
                  >
                    <option value={1}>1 - Beginner</option>
                    <option value={2}>2 - Intermediate</option>
                    <option value={3}>3 - Proficient</option>
                    <option value={4}>4 - Advanced</option>
                    <option value={5}>5 - Expert</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddSkill}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-sm"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingSkill(false);
                        setNewSkillName('');
                        setNewSkillLevel(3);
                      }}
                      className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {agentSkills.map(skill => (
                  <div key={skill.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{skill.skillName}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getProficiencyColor(skill.proficiencyLevel)}`}
                            style={{ width: `${(skill.proficiencyLevel / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getProficiencyLabel(skill.proficiencyLevel)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveSkill(skill.id)}
                      className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {agentSkills.length === 0 && !isAddingSkill && (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                    No skills added yet
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
              Select an agent to view skills
            </div>
          )}
        </div>

        {/* Performance Stats */}
        <div className="overflow-y-auto max-h-96">
          {selectedAgentData && agentStats ? (
            <div className="p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Performance</h4>
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="text-blue-600 dark:text-blue-400" size={20} />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Total Tasks</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {agentStats.totalTasks}
                  </div>
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="text-green-600 dark:text-green-400" size={20} />
                    <span className="text-sm font-medium text-green-900 dark:text-green-300">Avg Quality</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {agentStats.averageQuality > 0 ? agentStats.averageQuality.toFixed(1) : 'N/A'}
                    {agentStats.averageQuality > 0 && <span className="text-sm">/5</span>}
                  </div>
                  {agentStats.averageQuality > 0 && (
                    <div className="flex gap-0.5 mt-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <div
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(agentStats.averageQuality)
                              ? 'text-green-500'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        >
                          ★
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="text-purple-600 dark:text-purple-400" size={20} />
                    <span className="text-sm font-medium text-purple-900 dark:text-purple-300">Avg Time</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {agentStats.averageCompletionTime > 0
                      ? `${agentStats.averageCompletionTime.toFixed(1)}h`
                      : 'N/A'}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <p className="mb-1">
                      <span className="font-medium">Description:</span> {selectedAgentData.description || 'No description'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
              Select an agent to view performance
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
