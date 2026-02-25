'use client';

import { useState } from 'react';
import { CodingAgent } from '@/types/agent';
import { AgentSkill, AgentPerformanceMetrics, AgentAvailability, SkillCategory } from '@/types/agent-extended';
import { Users, Plus, Edit2, Trash2, Star, TrendingUp, Activity, CheckCircle, XCircle } from 'lucide-react';

interface AgentWithMetrics {
  agent: CodingAgent;
  skills: AgentSkill[];
  performance: AgentPerformanceMetrics;
  availability: AgentAvailability;
}

interface AgentRosterPanelProps {
  agents: CodingAgent[];
  onUpdate?: (agent: CodingAgent) => void;
  onDelete?: (agentId: string) => void;
}

const SKILL_CATEGORIES: SkillCategory[] = [
  'frontend',
  'backend',
  'database',
  'devops',
  'testing',
  'mobile',
  'ui-ux',
  'api-design',
];

export const AgentRosterPanel = ({ agents, onUpdate, onDelete }: AgentRosterPanelProps) => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');

  // Mock data for skills and metrics (in production, this would come from the database)
  const getAgentMetrics = (agentId: string): AgentWithMetrics => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    // Generate mock skills based on agent description
    const skills = generateMockSkills(agent);
    const performance = generateMockPerformance();
    const availability = generateMockAvailability();

    return { agent, skills, performance, availability };
  };

  const generateMockSkills = (agent: CodingAgent): AgentSkill[] => {
    const description = agent.description?.toLowerCase() || '';
    const skills: AgentSkill[] = [];

    if (description.includes('react') || description.includes('ui') || description.includes('frontend')) {
      skills.push({
        id: `${agent.id}-skill-1`,
        agentId: agent.id,
        category: 'frontend',
        name: 'React',
        proficiency: 5,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    if (description.includes('api') || description.includes('backend') || description.includes('server')) {
      skills.push({
        id: `${agent.id}-skill-2`,
        agentId: agent.id,
        category: 'backend',
        name: 'Node.js',
        proficiency: 4,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    if (description.includes('database') || description.includes('db')) {
      skills.push({
        id: `${agent.id}-skill-3`,
        agentId: agent.id,
        category: 'database',
        name: 'PostgreSQL',
        proficiency: 4,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    if (description.includes('devops') || description.includes('infrastructure')) {
      skills.push({
        id: `${agent.id}-skill-4`,
        agentId: agent.id,
        category: 'devops',
        name: 'Docker',
        proficiency: 5,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    if (description.includes('mobile') || description.includes('ios') || description.includes('android')) {
      skills.push({
        id: `${agent.id}-skill-5`,
        agentId: agent.id,
        category: 'mobile',
        name: 'React Native',
        proficiency: 4,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    if (description.includes('fullstack') || description.includes('both')) {
      skills.push(
        {
          id: `${agent.id}-skill-6`,
          agentId: agent.id,
          category: 'frontend',
          name: 'TypeScript',
          proficiency: 4,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: `${agent.id}-skill-7`,
          agentId: agent.id,
          category: 'backend',
          name: 'REST APIs',
          proficiency: 4,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
      );
    }

    return skills;
  };

  const generateMockPerformance = (): AgentPerformanceMetrics => ({
    id: 'perf-' + Math.random(),
    agentId: '',
    tasksCompleted: Math.floor(Math.random() * 50) + 10,
    tasksInProgress: Math.floor(Math.random() * 3),
    averageCompletionTime: Math.random() * 20 + 5,
    successRate: Math.random() * 20 + 80,
    lastTaskCompletedAt: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
    totalEstimatedHours: Math.random() * 200 + 100,
    totalActualHours: Math.random() * 220 + 90,
    currentWorkload: Math.floor(Math.random() * 3),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const generateMockAvailability = (): AgentAvailability => ({
    id: 'avail-' + Math.random(),
    agentId: '',
    available: Math.random() > 0.2,
    maxConcurrentTasks: 3,
    currentTasks: Math.floor(Math.random() * 3),
    notes: '',
    updatedAt: Date.now(),
  });

  const getProficiencyLabel = (level: number) => {
    const labels = ['', 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];
    return labels[level] || 'Unknown';
  };

  const renderAgentCard = (agent: CodingAgent) => {
    const metrics = getAgentMetrics(agent.id);

    return (
      <div
        key={agent.id}
        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => {
          setSelectedAgent(agent.id);
          setViewMode('details');
        }}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
              agent.avatarColor || 'bg-gray-500'
            }`}
          >
            {agent.avatar || agent.name.charAt(0)}
          </div>

          <div className="flex-1">
            {/* Name and Status */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{agent.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {agent.description || 'No description'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {metrics.availability.available ? (
                  <CheckCircle size={16} className="text-green-500" />
                ) : (
                  <XCircle size={16} className="text-red-500" />
                )}
              </div>
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-1 mt-3">
              {metrics.skills.slice(0, 3).map((skill) => (
                <span
                  key={skill.id}
                  className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded flex items-center gap-1"
                >
                  {skill.name}
                  <span className="text-[10px] opacity-70">L{skill.proficiency}</span>
                </span>
              ))}
              {metrics.skills.length > 3 && (
                <span className="text-xs px-2 py-1 text-gray-500 dark:text-gray-400">
                  +{metrics.skills.length - 3} more
                </span>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Tasks</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {metrics.performance.tasksCompleted}
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Success</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {metrics.performance.successRate.toFixed(0)}%
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Workload</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {metrics.availability.currentTasks}/{metrics.availability.maxConcurrentTasks}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAgentDetails = (agentId: string) => {
    const metrics = getAgentMetrics(agentId);
    const { agent, skills, performance, availability } = metrics;

    return (
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => setViewMode('list')}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          ← Back to roster
        </button>

        {/* Agent Header */}
        <div className="flex items-start gap-4">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl ${
              agent.avatarColor || 'bg-gray-500'
            }`}
          >
            {agent.avatar || agent.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{agent.name}</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{agent.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {availability.available ? (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium flex items-center gap-1">
                    <CheckCircle size={14} />
                    Available
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-medium flex items-center gap-1">
                    <XCircle size={14} />
                    Busy
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} />
            Performance Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {performance.tasksCompleted}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tasks Completed</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {performance.successRate.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Success Rate</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {performance.averageCompletionTime.toFixed(1)}h
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg Completion</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {availability.currentTasks}/{availability.maxConcurrentTasks}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current Load</div>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Star size={18} />
            Skills & Expertise
          </h3>
          {skills.length > 0 ? (
            <div className="space-y-3">
              {skills.map((skill) => (
                <div key={skill.id} className="flex items-center gap-3">
                  <div className="w-32 text-sm text-gray-700 dark:text-gray-300 font-medium">
                    {skill.name}
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full"
                      style={{ width: `${(skill.proficiency / 5) * 100}%` }}
                    />
                  </div>
                  <div className="w-24 text-sm text-gray-600 dark:text-gray-400">
                    {getProficiencyLabel(skill.proficiency)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                    {skill.category}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No skills defined yet</p>
          )}
        </div>

        {/* Workload */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity size={18} />
            Current Workload
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tasks in Progress</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {performance.tasksInProgress}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Capacity Used</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {availability.currentTasks > 0
                  ? ((availability.currentTasks / availability.maxConcurrentTasks) * 100).toFixed(0)
                  : 0}
                %
              </span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Workload</span>
                <span>
                  {availability.currentTasks} / {availability.maxConcurrentTasks} max
                </span>
              </div>
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full ${
                    availability.currentTasks >= availability.maxConcurrentTasks
                      ? 'bg-red-500'
                      : availability.currentTasks >= availability.maxConcurrentTasks * 0.7
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      (availability.currentTasks / availability.maxConcurrentTasks) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Users size={28} />
          Agent Roster
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage your team of coding agents, skills, and performance
        </p>
      </div>

      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => renderAgentCard(agent))}
        </div>
      ) : selectedAgent ? (
        renderAgentDetails(selectedAgent)
      ) : null}

      {agents.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          <p>No agents found</p>
          <p className="text-sm mt-2">Create agents to build your coding team</p>
        </div>
      )}
    </div>
  );
};
