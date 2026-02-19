'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Star, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { ExtendedAgent, AgentSkill } from '@/types/breakdown';
import { agentRosterService } from '@/services/agentRoster';
import { useAuth } from '@/contexts/AuthContext';

interface AgentRosterProps {
  onClose: () => void;
}

const SKILL_CATEGORIES = ['frontend', 'backend', 'database', 'devops', 'mobile', 'testing', 'design'] as const;

export const AgentRoster = ({ onClose }: AgentRosterProps) => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<ExtendedAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<ExtendedAgent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<typeof SKILL_CATEGORIES[number]>('frontend');
  const [newSkillProficiency, setNewSkillProficiency] = useState<1 | 2 | 3 | 4 | 5>(3);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const extendedAgents = await agentRosterService.getExtendedAgents(user.id);
      setAgents(extendedAgents);
      if (extendedAgents.length > 0 && !selectedAgent) {
        setSelectedAgent(extendedAgents[0]);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!selectedAgent || !newSkillName.trim()) return;

    const skill: Omit<AgentSkill, 'id'> = {
      name: newSkillName,
      category: newSkillCategory,
      proficiency: newSkillProficiency,
    };

    const addedSkill = await agentRosterService.addAgentSkill(selectedAgent.id, skill);

    if (addedSkill) {
      // Refresh agents
      await loadAgents();
      setIsAddingSkill(false);
      setNewSkillName('');
      setNewSkillProficiency(3);
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    const success = await agentRosterService.removeAgentSkill(skillId);
    if (success) {
      await loadAgents();
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'busy':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'offline':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getProficiencyStars = (proficiency: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        className={i < proficiency ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
          <p className="text-gray-600 dark:text-gray-400">Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Agent Roster</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage agent skills and view performance metrics
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Agent List */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-4 space-y-2">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`w-full text-left p-4 rounded-lg transition-colors ${
                    selectedAgent?.id === agent.id
                      ? 'bg-gray-100 dark:bg-gray-700 border-2 border-black dark:border-white'
                      : 'border-2 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full ${agent.avatarColor || 'bg-gray-400'} flex items-center justify-center text-white font-bold`}
                    >
                      {agent.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {agent.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getAvailabilityColor(agent.availability)}`}>
                          {agent.availability}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {agent.currentLoad}% load
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Agent Details */}
          {selectedAgent && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Agent Info */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-16 h-16 rounded-full ${selectedAgent.avatarColor || 'bg-gray-400'} flex items-center justify-center text-white text-2xl font-bold`}
                  >
                    {selectedAgent.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedAgent.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">{selectedAgent.description}</p>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <TrendingUp size={18} />
                  Performance Metrics
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                      <CheckCircle2 size={16} />
                      <span className="text-sm">Tasks Completed</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedAgent.performance.tasksCompleted}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                      <Clock size={16} />
                      <span className="text-sm">Avg. Completion Time</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedAgent.performance.averageCompletionTime.toFixed(1)}h
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                      <TrendingUp size={16} />
                      <span className="text-sm">Success Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Math.round(selectedAgent.performance.successRate * 100)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                      <TrendingUp size={16} />
                      <span className="text-sm">Current Load</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            selectedAgent.currentLoad > 80
                              ? 'bg-red-500'
                              : selectedAgent.currentLoad > 50
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${selectedAgent.currentLoad}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {selectedAgent.currentLoad}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Star size={18} />
                    Skills & Proficiency
                  </h4>
                  <button
                    onClick={() => setIsAddingSkill(true)}
                    className="text-sm flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <Plus size={16} />
                    Add Skill
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedAgent.skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {skill.name}
                          </span>
                          <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                            {skill.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getProficiencyStars(skill.proficiency)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveSkill(skill.id)}
                        className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  {selectedAgent.skills.length === 0 && !isAddingSkill && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No skills added yet. Click "Add Skill" to get started.
                    </p>
                  )}

                  {isAddingSkill && (
                    <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Skill Name
                        </label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                          placeholder="e.g., React, Node.js, PostgreSQL"
                          value={newSkillName}
                          onChange={(e) => setNewSkillName(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Category
                          </label>
                          <select
                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                            value={newSkillCategory}
                            onChange={(e) => setNewSkillCategory(e.target.value as typeof SKILL_CATEGORIES[number])}
                          >
                            {SKILL_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Proficiency (1-5)
                          </label>
                          <select
                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
                            value={newSkillProficiency}
                            onChange={(e) => setNewSkillProficiency(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                          >
                            <option value={1}>1 - Beginner</option>
                            <option value={2}>2 - Basic</option>
                            <option value={3}>3 - Intermediate</option>
                            <option value={4}>4 - Advanced</option>
                            <option value={5}>5 - Expert</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setIsAddingSkill(false);
                            setNewSkillName('');
                            setNewSkillProficiency(3);
                          }}
                          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddSkill}
                          className="px-3 py-1.5 text-sm bg-black dark:bg-white text-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-200"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
