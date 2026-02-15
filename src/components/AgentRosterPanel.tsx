'use client';

import React, { useState } from 'react';
import { CodingAgent } from '@/types/agent';
import {
  AgentSkill,
  AgentPerformanceMetrics,
  AgentAvailability,
  AgentRoster,
  SkillLevel
} from '@/types/agentOrchestration';
import {
  User,
  Plus,
  Edit2,
  Trash2,
  Award,
  TrendingUp,
  Clock,
  Calendar,
  Star,
  Target,
  Users,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface AgentRosterPanelProps {
  roster: AgentRoster[];
  onUpdateSkills: (agentId: string, skills: AgentSkill[]) => void;
  onUpdatePerformance: (agentId: string, metrics: AgentPerformanceMetrics) => void;
  onUpdateAvailability: (agentId: string, availability: AgentAvailability) => void;
}

export function AgentRosterPanel({
  roster,
  onUpdateSkills,
  onUpdatePerformance,
  onUpdateAvailability
}: AgentRosterPanelProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'skills' | 'performance' | 'availability'>('skills');
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkill, setNewSkill] = useState({
    skillName: '',
    skillCategory: 'frontend' as const,
    level: 'intermediate' as SkillLevel,
    yearsOfExperience: 0
  });

  const selectedRoster = roster.find(r => r.agentId === selectedAgent);

  const handleAddSkill = () => {
    if (!selectedAgent || !newSkill.skillName.trim()) return;

    const agent = roster.find(r => r.agentId === selectedAgent);
    if (!agent) return;

    const skill: AgentSkill = {
      id: `skill_${Date.now()}`,
      agentId: selectedAgent,
      skillName: newSkill.skillName,
      skillCategory: newSkill.skillCategory,
      level: newSkill.level,
      yearsOfExperience: newSkill.yearsOfExperience,
      certifications: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    onUpdateSkills(selectedAgent, [...agent.skills, skill]);
    setNewSkill({
      skillName: '',
      skillCategory: 'frontend',
      level: 'intermediate',
      yearsOfExperience: 0
    });
    setIsAddingSkill(false);
  };

  const handleRemoveSkill = (skillId: string) => {
    if (!selectedAgent) return;

    const agent = roster.find(r => r.agentId === selectedAgent);
    if (!agent) return;

    onUpdateSkills(
      selectedAgent,
      agent.skills.filter(s => s.id !== skillId)
    );
  };

  const getSkillLevelColor = (level: SkillLevel) => {
    const colors = {
      beginner: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      intermediate: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      advanced: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      expert: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    };
    return colors[level];
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-blue-600 dark:text-blue-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="flex h-full bg-white dark:bg-gray-800">
      {/* Agent List Sidebar */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Agent Roster</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {roster.length} agents
          </p>
        </div>

        <div className="p-2">
          {roster.map(agent => (
            <button
              key={agent.agentId}
              onClick={() => setSelectedAgent(agent.agentId)}
              className={`w-full p-3 rounded-lg text-left transition-colors mb-1 ${
                selectedAgent === agent.agentId
                  ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <User size={16} className="text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
                  {agent.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{agent.skills.length} skills</span>
                <span>•</span>
                <span>{agent.currentTasks.length} tasks</span>
              </div>
              <div className="mt-1">
                {agent.availability.isAvailable ? (
                  <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Available
                  </span>
                ) : (
                  <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <XCircle size={12} />
                    Unavailable
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Agent Details Panel */}
      <div className="flex-1 overflow-y-auto">
        {selectedRoster ? (
          <div>
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                  {selectedRoster.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    {selectedRoster.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedRoster.currentTasks.length} active tasks • {selectedRoster.performance.capacity - selectedRoster.performance.currentWorkload} slots available
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('skills')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'skills'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Award size={16} className="inline mr-2" />
                  Skills
                </button>
                <button
                  onClick={() => setActiveTab('performance')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'performance'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <TrendingUp size={16} className="inline mr-2" />
                  Performance
                </button>
                <button
                  onClick={() => setActiveTab('availability')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'availability'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Calendar size={16} className="inline mr-2" />
                  Availability
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {activeTab === 'skills' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                      Skills ({selectedRoster.skills.length})
                    </h3>
                    <button
                      onClick={() => setIsAddingSkill(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      <Plus size={16} />
                      Add Skill
                    </button>
                  </div>

                  {isAddingSkill && (
                    <div className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={newSkill.skillName}
                          onChange={(e) => setNewSkill({ ...newSkill, skillName: e.target.value })}
                          placeholder="Skill name (e.g., React, Python)"
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <select
                            value={newSkill.skillCategory}
                            onChange={(e) => setNewSkill({ ...newSkill, skillCategory: e.target.value as any })}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm"
                          >
                            <option value="frontend">Frontend</option>
                            <option value="backend">Backend</option>
                            <option value="devops">DevOps</option>
                            <option value="mobile">Mobile</option>
                            <option value="testing">Testing</option>
                            <option value="design">Design</option>
                            <option value="database">Database</option>
                            <option value="ai-ml">AI/ML</option>
                            <option value="other">Other</option>
                          </select>
                          <select
                            value={newSkill.level}
                            onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value as SkillLevel })}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm"
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                            <option value="expert">Expert</option>
                          </select>
                        </div>
                        <input
                          type="number"
                          value={newSkill.yearsOfExperience}
                          onChange={(e) => setNewSkill({ ...newSkill, yearsOfExperience: parseFloat(e.target.value) })}
                          placeholder="Years of experience"
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm"
                          min="0"
                          step="0.5"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleAddSkill}
                            className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setIsAddingSkill(false)}
                            className="flex-1 px-3 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {selectedRoster.skills.map(skill => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {skill.skillName}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs ${getSkillLevelColor(skill.level)}`}>
                              {skill.level}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span>{skill.skillCategory}</span>
                            {skill.yearsOfExperience !== undefined && (
                              <>
                                <span>•</span>
                                <span>{skill.yearsOfExperience} years</span>
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveSkill(skill.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'performance' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Target size={18} className="text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Quality Score</span>
                      </div>
                      <div className={`text-3xl font-bold ${getPerformanceColor(selectedRoster.performance.qualityScore)}`}>
                        {selectedRoster.performance.qualityScore.toFixed(0)}%
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={18} className="text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">On-Time Delivery</span>
                      </div>
                      <div className={`text-3xl font-bold ${getPerformanceColor(selectedRoster.performance.onTimeDeliveryRate)}`}>
                        {selectedRoster.performance.onTimeDeliveryRate.toFixed(0)}%
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Users size={18} className="text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Collaboration</span>
                      </div>
                      <div className={`text-3xl font-bold ${getPerformanceColor(selectedRoster.performance.collaborationScore)}`}>
                        {selectedRoster.performance.collaborationScore.toFixed(0)}%
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={18} className="text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Completion</span>
                      </div>
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedRoster.performance.averageCompletionTime.toFixed(1)}h
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Task Statistics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Tasks Completed</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {selectedRoster.performance.totalTasksCompleted}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Tasks In Progress</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {selectedRoster.performance.totalTasksInProgress}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Current Workload</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {selectedRoster.performance.currentWorkload} / {selectedRoster.performance.capacity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'availability' && (
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium text-gray-800 dark:text-gray-200">Status</span>
                      {selectedRoster.availability.isAvailable ? (
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
                          Available
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm">
                          Unavailable
                        </span>
                      )}
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Timezone</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {selectedRoster.availability.timezone}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Working Hours</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {selectedRoster.availability.workingHours?.start} - {selectedRoster.availability.workingHours?.end}
                        </span>
                      </div>
                      {selectedRoster.availability.daysOff && selectedRoster.availability.daysOff.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Days Off</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200 capitalize">
                            {selectedRoster.availability.daysOff.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
            Select an agent to view details
          </div>
        )}
      </div>
    </div>
  );
}
