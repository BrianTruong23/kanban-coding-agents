'use client';

import { useState } from 'react';
import { CodingAgent } from '@/types/agent';
import { EnhancedAgent, AgentSkill, SkillCategory } from '@/types/agentSkills';
import { X, Plus, Trash2, Users, Award, Activity, Settings } from 'lucide-react';
import { getInitials, getAvatarColor } from '@/lib/utils';
import clsx from 'clsx';

interface AgentRosterManagerProps {
  agents: CodingAgent[];
  onClose: () => void;
}

const SKILL_CATEGORIES: SkillCategory[] = [
  'frontend',
  'backend',
  'database',
  'devops',
  'testing',
  'mobile',
  'design',
  'architecture'
];

export const AgentRosterManager = ({ agents, onClose }: AgentRosterManagerProps) => {
  const [selectedAgent, setSelectedAgent] = useState<CodingAgent | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'performance'>('overview');

  // Mock enhanced data - in production, this would come from the database
  const getEnhancedAgent = (agent: CodingAgent): EnhancedAgent => {
    return {
      ...agent,
      skills: [
        {
          id: '1',
          name: 'React',
          category: 'frontend',
          proficiencyLevel: 4,
          yearsOfExperience: 3
        },
        {
          id: '2',
          name: 'Node.js',
          category: 'backend',
          proficiencyLevel: 3,
          yearsOfExperience: 2
        }
      ],
      performance: {
        tasksCompleted: 42,
        tasksInProgress: 3,
        averageCompletionTime: 18.5,
        onTimeDeliveryRate: 0.92,
        codeQualityScore: 87,
        bugRate: 2.3,
        collaborationScore: 91,
        lastActive: Date.now()
      },
      availability: {
        status: 'available',
        currentLoad: 3,
        maxLoad: 5
      },
      createdAt: agent.createdAt
    };
  };

  const renderOverview = (agent: EnhancedAgent) => (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
        <div className="flex items-center gap-4 mb-4">
          <div
            className={clsx(
              "w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-semibold",
              agent.avatarColor || getAvatarColor(agent.name)
            )}
          >
            {agent.avatar || getInitials(agent.name)}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{agent.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{agent.description || 'No description'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">Status</span>
          </div>
          <div className="text-lg font-bold text-blue-700 dark:text-blue-300 capitalize">
            {agent.availability.status}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {agent.availability.currentLoad}/{agent.availability.maxLoad} tasks
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award size={16} className="text-green-600 dark:text-green-400" />
            <span className="text-xs font-semibold text-green-900 dark:text-green-100">Quality</span>
          </div>
          <div className="text-lg font-bold text-green-700 dark:text-green-300">
            {agent.performance.codeQualityScore}/100
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
            Code quality score
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-semibold text-purple-900 dark:text-purple-100">Tasks</span>
          </div>
          <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
            {agent.performance.tasksCompleted}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            Completed
          </div>
        </div>
      </div>
    </div>
  );

  const renderSkills = (agent: EnhancedAgent) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900 dark:text-white">Skills & Expertise</h4>
        <button className="text-blue-600 dark:text-blue-400 text-sm flex items-center gap-1 hover:underline">
          <Plus size={14} />
          Add Skill
        </button>
      </div>

      <div className="space-y-3">
        {agent.skills.map(skill => (
          <div
            key={skill.id}
            className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 flex items-center justify-between"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900 dark:text-white">{skill.name}</span>
                <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                  {skill.category}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Proficiency</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(level => (
                      <div
                        key={level}
                        className={clsx(
                          'h-2 w-8 rounded',
                          level <= skill.proficiencyLevel
                            ? 'bg-blue-600 dark:bg-blue-400'
                            : 'bg-gray-200 dark:bg-gray-700'
                        )}
                      />
                    ))}
                  </div>
                </div>
                {skill.yearsOfExperience && (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {skill.yearsOfExperience} years
                  </div>
                )}
              </div>
            </div>
            <button className="text-red-400 hover:text-red-600 dark:hover:text-red-300 ml-2">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {agent.skills.length === 0 && (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <p>No skills added yet</p>
          <button className="mt-2 text-blue-600 dark:text-blue-400 text-sm hover:underline">
            Add your first skill
          </button>
        </div>
      )}
    </div>
  );

  const renderPerformance = (agent: EnhancedAgent) => (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900 dark:text-white">Performance Metrics</h4>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tasks Completed</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {agent.performance.tasksCompleted}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">In Progress</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {agent.performance.tasksInProgress}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Completion Time</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {agent.performance.averageCompletionTime}h
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">On-Time Delivery</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(agent.performance.onTimeDeliveryRate * 100)}%
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Code Quality</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {agent.performance.codeQualityScore}/100
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Bug Rate</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {agent.performance.bugRate}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">per 100 tasks</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex">
        {/* Agent List Sidebar */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-gray-600 dark:text-gray-400" />
                <h3 className="font-bold text-gray-900 dark:text-white">Agent Roster</h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {agents.length} agent{agents.length !== 1 ? 's' : ''} total
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {agents.map(agent => {
              const avatarColor = agent.avatarColor || getAvatarColor(agent.name);
              const isSelected = selectedAgent?.id === agent.id;

              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={clsx(
                    'w-full p-3 rounded-lg mb-2 flex items-center gap-3 transition-all',
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                      : 'bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 border-2 border-transparent'
                  )}
                >
                  <div
                    className={clsx(
                      "w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0",
                      avatarColor
                    )}
                  >
                    {agent.avatar || getInitials(agent.name)}
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {agent.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {agent.description || 'No description'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
              <Plus size={16} />
              Add New Agent
            </button>
          </div>
        </div>

        {/* Agent Details */}
        <div className="flex-1 flex flex-col">
          {selectedAgent ? (
            <>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-2 mb-4">
                  {(['overview', 'skills', 'performance'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={clsx(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                        activeTab === tab
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'overview' && renderOverview(getEnhancedAgent(selectedAgent))}
                {activeTab === 'skills' && renderSkills(getEnhancedAgent(selectedAgent))}
                {activeTab === 'performance' && renderPerformance(getEnhancedAgent(selectedAgent))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
              <div className="text-center">
                <Users size={48} className="mx-auto mb-3 opacity-50" />
                <p>Select an agent to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
