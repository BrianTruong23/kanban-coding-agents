'use client';

import { useState } from 'react';
import { AgentRoster, Skill, SkillCategory } from '@/types/agentSkills';
import { CodingAgent } from '@/types/agent';
import { AgentRosterService, DEFAULT_SKILLS } from '@/lib/agentRoster';
import { Users, Plus, X, TrendingUp, CheckCircle, Clock, Award } from 'lucide-react';
import { getInitials, getAvatarColor } from '@/lib/utils';

interface AgentRosterManagerProps {
  agents: CodingAgent[];
  rosters: AgentRoster[];
  onUpdateRoster: (roster: AgentRoster) => void;
}

const SKILL_CATEGORIES: SkillCategory[] = [
  'frontend',
  'backend',
  'database',
  'devops',
  'testing',
  'mobile',
  'ai-ml',
  'security',
  'design',
  'documentation',
];

export const AgentRosterManager = ({ agents, rosters, onUpdateRoster }: AgentRosterManagerProps) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillCategory, setNewSkillCategory] = useState<SkillCategory>('frontend');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState<1 | 2 | 3 | 4 | 5>(3);

  const selectedRoster = selectedAgentId
    ? rosters.find((r) => r.agentId === selectedAgentId)
    : null;

  const handleAddSkill = () => {
    if (!selectedRoster || !newSkillName.trim()) return;

    const updatedRoster = AgentRosterService.addSkill(
      selectedRoster,
      newSkillCategory,
      newSkillName,
      newSkillProficiency
    );

    onUpdateRoster(updatedRoster);
    setNewSkillName('');
    setNewSkillProficiency(3);
    setIsAddingSkill(false);
  };

  const handleRemoveSkill = (skillId: string) => {
    if (!selectedRoster) return;

    const updatedRoster = {
      ...selectedRoster,
      skills: selectedRoster.skills.filter((s) => s.id !== skillId),
      updatedAt: Date.now(),
    };

    onUpdateRoster(updatedRoster);
  };

  const handleUpdateProficiency = (skillId: string, proficiency: 1 | 2 | 3 | 4 | 5) => {
    if (!selectedRoster) return;

    const updatedRoster = AgentRosterService.updateSkillProficiency(
      selectedRoster,
      skillId,
      proficiency
    );

    onUpdateRoster(updatedRoster);
  };

  const handleAddDefaultSkills = (type: keyof typeof DEFAULT_SKILLS) => {
    if (!selectedRoster) return;

    let updatedRoster = selectedRoster;
    for (const skill of DEFAULT_SKILLS[type]) {
      updatedRoster = AgentRosterService.addSkill(
        updatedRoster,
        skill.category,
        skill.name,
        skill.proficiencyLevel
      );
    }

    onUpdateRoster(updatedRoster);
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300';
      case 'busy':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300';
      case 'unavailable':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getProficiencyLabel = (level: number) => {
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Users size={24} />
        Agent Roster Management
      </h2>

      <div className="grid grid-cols-12 gap-6">
        {/* Agent List */}
        <div className="col-span-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Agents</h3>
          {rosters.map((roster) => {
            const agent = agents.find((a) => a.id === roster.agentId);
            if (!agent) return null;

            return (
              <button
                key={roster.agentId}
                onClick={() => setSelectedAgentId(roster.agentId)}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  selectedAgentId === roster.agentId
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: agent.avatarColor }}
                  >
                    {agent.avatar || getInitials(agent.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white truncate">
                      {agent.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getAvailabilityColor(
                          roster.availability
                        )}`}
                      >
                        {roster.availability}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {roster.currentWorkload} tasks
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>{roster.skills.length} skills</span>
                  {roster.averageQualityScore && (
                    <span className="flex items-center gap-1">
                      <Award size={12} />
                      {roster.averageQualityScore}/5
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Agent Details */}
        <div className="col-span-8">
          {selectedRoster ? (
            <div className="space-y-6">
              {/* Performance Metrics */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Performance Metrics
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={20} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {selectedRoster.totalTasksCompleted}
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Award size={20} className="text-green-600 dark:text-green-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Quality</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {selectedRoster.averageQualityScore?.toFixed(1) || 'N/A'}
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={20} className="text-purple-600 dark:text-purple-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">On-Time</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {selectedRoster.completionRate || 0}%
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={20} className="text-orange-600 dark:text-orange-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Workload</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {selectedRoster.currentWorkload}
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Skills</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsAddingSkill(true)}
                      className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      <Plus size={16} />
                      Add Skill
                    </button>
                  </div>
                </div>

                {selectedRoster.skills.length === 0 && !isAddingSkill && (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                    <p className="mb-4">No skills added yet</p>
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleAddDefaultSkills('frontend')}
                        className="text-sm px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        Add Frontend Skills
                      </button>
                      <button
                        onClick={() => handleAddDefaultSkills('backend')}
                        className="text-sm px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        Add Backend Skills
                      </button>
                      <button
                        onClick={() => handleAddDefaultSkills('fullstack')}
                        className="text-sm px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        Add Fullstack Skills
                      </button>
                    </div>
                  </div>
                )}

                {isAddingSkill && (
                  <div className="mb-4 p-4 border-2 border-blue-500 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                    <div className="grid grid-cols-12 gap-3 mb-3">
                      <div className="col-span-4">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Category
                        </label>
                        <select
                          value={newSkillCategory}
                          onChange={(e) => setNewSkillCategory(e.target.value as SkillCategory)}
                          className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg text-sm"
                        >
                          {SKILL_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-5">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Skill Name
                        </label>
                        <input
                          type="text"
                          value={newSkillName}
                          onChange={(e) => setNewSkillName(e.target.value)}
                          placeholder="e.g., React, Python, AWS"
                          className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg text-sm"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Proficiency
                        </label>
                        <select
                          value={newSkillProficiency}
                          onChange={(e) => setNewSkillProficiency(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                          className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-lg text-sm"
                        >
                          {[1, 2, 3, 4, 5].map((level) => (
                            <option key={level} value={level}>
                              {level} - {getProficiencyLabel(level)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddSkill}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingSkill(false);
                          setNewSkillName('');
                        }}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {selectedRoster.skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded uppercase font-medium">
                          {skill.category}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {skill.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={skill.proficiencyLevel}
                          onChange={(e) =>
                            handleUpdateProficiency(skill.id, Number(e.target.value) as 1 | 2 | 3 | 4 | 5)
                          }
                          className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 rounded text-sm"
                        >
                          {[1, 2, 3, 4, 5].map((level) => (
                            <option key={level} value={level}>
                              {level} - {getProficiencyLabel(level)}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRemoveSkill(skill.id)}
                          className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
              <div className="text-center">
                <Users size={48} className="mx-auto mb-2" />
                <p>Select an agent to view and manage their roster</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
