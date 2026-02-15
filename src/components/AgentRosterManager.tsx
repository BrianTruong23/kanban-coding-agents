'use client';

import { useState } from 'react';
import { AgentRoster, Skill, SkillCategory, SkillLevel } from '@/types/agentRoster';
import { AgentOrchestrator } from '@/lib/agentOrchestration';
import { Users, Plus, X, Edit2, TrendingUp, Activity, CheckCircle } from 'lucide-react';

interface AgentRosterManagerProps {
  agents: AgentRoster[];
  onUpdateAgent?: (agent: AgentRoster) => void;
  onAddSkill?: (agentId: string, skill: Skill) => void;
  onRemoveSkill?: (agentId: string, skillId: string) => void;
}

export const AgentRosterManager = ({
  agents,
  onUpdateAgent,
  onAddSkill,
  onRemoveSkill,
}: AgentRosterManagerProps) => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<SkillCategory>('frontend');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('intermediate');

  const selectedAgentData = agents.find(a => a.id === selectedAgent);
  const workloadDistribution = AgentOrchestrator.getWorkloadDistribution(agents);

  const handleAddSkill = () => {
    if (!selectedAgent || !newSkillName.trim()) return;

    const skill: Skill = {
      id: `skill-${Date.now()}`,
      name: newSkillName,
      category: newSkillCategory,
      level: newSkillLevel,
    };

    onAddSkill?.(selectedAgent, skill);
    setNewSkillName('');
    setIsAddingSkill(false);
  };

  const getSkillLevelColor = (level: SkillLevel) => {
    switch (level) {
      case 'expert': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'advanced': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'intermediate': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'beginner': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getCategoryColor = (category: SkillCategory) => {
    const colors: Record<SkillCategory, string> = {
      frontend: 'bg-blue-500',
      backend: 'bg-green-500',
      database: 'bg-yellow-500',
      devops: 'bg-orange-500',
      mobile: 'bg-pink-500',
      testing: 'bg-red-500',
      design: 'bg-purple-500',
      'ai-ml': 'bg-indigo-500',
    };
    return colors[category];
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return 'text-red-600 dark:text-red-400';
    if (rate >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Agent Roster Management
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage agent skills, performance, and availability
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Workload Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity size={20} />
            Workload Distribution
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(workloadDistribution).map(([agentId, data]) => (
              <div
                key={agentId}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                onClick={() => setSelectedAgent(agentId)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {data.agentName}
                  </span>
                  <span className={`text-xs font-semibold ${getUtilizationColor(data.utilizationRate)}`}>
                    {Math.round(data.utilizationRate)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      data.utilizationRate >= 80
                        ? 'bg-red-500'
                        : data.utilizationRate >= 60
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${data.utilizationRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>{data.currentTasks} active tasks</span>
                  <span>{data.capacity}% capacity</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Details */}
        {selectedAgentData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full ${selectedAgentData.avatarColor || 'bg-gray-500'} flex items-center justify-center text-white font-bold text-lg`}
                >
                  {selectedAgentData.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedAgentData.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedAgentData.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            {/* Performance Metrics */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <TrendingUp size={16} />
                Performance Metrics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedAgentData.performance.tasksCompleted}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Completed</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedAgentData.performance.tasksInProgress}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">In Progress</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(selectedAgentData.performance.onTimeDeliveryRate)}%
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">On-Time Rate</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(selectedAgentData.performance.qualityScore)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Quality Score</div>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <CheckCircle size={16} />
                Availability
              </h4>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Status: {selectedAgentData.availability.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedAgentData.availability.currentTasks.length} / {selectedAgentData.availability.maxConcurrentTasks} tasks
                  </span>
                </div>
                <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all"
                    style={{ width: `${100 - selectedAgentData.availability.currentCapacity}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Users size={16} />
                  Skills
                </h4>
                <button
                  onClick={() => setIsAddingSkill(true)}
                  className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <Plus size={14} />
                  Add Skill
                </button>
              </div>

              {isAddingSkill && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Skill name"
                      className="col-span-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newSkillName}
                      onChange={e => setNewSkillName(e.target.value)}
                    />
                    <select
                      className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newSkillCategory}
                      onChange={e => setNewSkillCategory(e.target.value as SkillCategory)}
                    >
                      <option value="frontend">Frontend</option>
                      <option value="backend">Backend</option>
                      <option value="database">Database</option>
                      <option value="devops">DevOps</option>
                      <option value="mobile">Mobile</option>
                      <option value="testing">Testing</option>
                      <option value="design">Design</option>
                      <option value="ai-ml">AI/ML</option>
                    </select>
                    <select
                      className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newSkillLevel}
                      onChange={e => setNewSkillLevel(e.target.value as SkillLevel)}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                    <button
                      onClick={handleAddSkill}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setIsAddingSkill(false);
                      setNewSkillName('');
                    }}
                    className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {selectedAgentData.skills.map(skill => (
                  <div
                    key={skill.id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${getSkillLevelColor(skill.level)}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${getCategoryColor(skill.category)}`} />
                    <span className="text-sm font-medium">{skill.name}</span>
                    <span className="text-xs opacity-75">({skill.level})</span>
                    {onRemoveSkill && (
                      <button
                        onClick={() => onRemoveSkill(selectedAgent!, skill.id)}
                        className="ml-1 opacity-50 hover:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
                {selectedAgentData.skills.length === 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    No skills added yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!selectedAgentData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Users size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Select an agent from the workload distribution to view details
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
