'use client';

import { CodingAgent, AgentSkill } from '@/types/agent';
import { Users, TrendingUp, Clock, Activity, Award } from 'lucide-react';

interface AgentRosterProps {
  agents: CodingAgent[];
  onAgentClick?: (agentId: string) => void;
}

export const AgentRoster = ({ agents, onAgentClick }: AgentRosterProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users size={20} className="text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Agent Roster</h3>
        <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
          {agents.length} agents
        </span>
      </div>

      <div className="space-y-3">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onClick={() => onAgentClick?.(agent.id)}
          />
        ))}
      </div>
    </div>
  );
};

const AgentCard = ({
  agent,
  onClick,
}: {
  agent: CodingAgent;
  onClick?: () => void;
}) => {
  const loadPercentage = agent.availability.currentLoad;
  const loadColor =
    loadPercentage < 30
      ? 'bg-green-500'
      : loadPercentage < 70
      ? 'bg-yellow-500'
      : 'bg-red-500';

  const isAvailable = agent.availability.isAvailable;

  return (
    <div
      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold ${
            agent.avatarColor || 'bg-gray-500'
          }`}
        >
          {agent.avatar || agent.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
              {agent.name}
            </h4>
            {!isAvailable && (
              <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                Unavailable
              </span>
            )}
          </div>
          {agent.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
              {agent.description}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
        <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
            <Award size={12} />
            <span>Success</span>
          </div>
          <div className="font-bold text-gray-900 dark:text-white">
            {agent.performanceMetrics.successRate}%
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
            <TrendingUp size={12} />
            <span>Completed</span>
          </div>
          <div className="font-bold text-gray-900 dark:text-white">
            {agent.performanceMetrics.tasksCompleted}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
            <Activity size={12} />
            <span>In Progress</span>
          </div>
          <div className="font-bold text-gray-900 dark:text-white">
            {agent.performanceMetrics.tasksInProgress}
          </div>
        </div>
      </div>

      {/* Load Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
          <span>Current Load</span>
          <span>{loadPercentage}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${loadColor} transition-all`}
            style={{ width: `${loadPercentage}%` }}
          />
        </div>
      </div>

      {/* Skills */}
      {agent.skills && agent.skills.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Top Skills:
          </div>
          <div className="flex flex-wrap gap-1">
            {agent.skills
              .filter(s => s.level === 'expert' || s.level === 'advanced')
              .slice(0, 4)
              .map((skill, index) => (
                <SkillBadge key={index} skill={skill} />
              ))}
            {agent.skills.filter(s => s.level === 'expert' || s.level === 'advanced').length >
              4 && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                +
                {agent.skills.filter(s => s.level === 'expert' || s.level === 'advanced').length -
                  4}{' '}
                more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Average completion time */}
      {agent.performanceMetrics.averageCompletionTime && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <Clock size={12} />
            <span>
              Avg. completion: {agent.performanceMetrics.averageCompletionTime.toFixed(1)}h
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const SkillBadge = ({ skill }: { skill: AgentSkill }) => {
  const levelColors = {
    beginner: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    intermediate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    advanced: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    expert: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  };

  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${levelColors[skill.level]}`}
      title={`${skill.name} - ${skill.level}`}
    >
      {skill.name}
    </span>
  );
};

// Compact version for sidebars
export const AgentRosterCompact = ({ agents }: { agents: CodingAgent[] }) => {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
        Agent Status
      </div>
      {agents.map((agent) => {
        const loadPercentage = agent.availability.currentLoad;
        const loadColor =
          loadPercentage < 30
            ? 'bg-green-500'
            : loadPercentage < 70
            ? 'bg-yellow-500'
            : 'bg-red-500';

        return (
          <div
            key={agent.id}
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                agent.avatarColor || 'bg-gray-500'
              }`}
            >
              {agent.avatar || agent.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                {agent.name}
              </div>
              <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full ${loadColor}`}
                  style={{ width: `${loadPercentage}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {agent.performanceMetrics.tasksInProgress}
            </div>
          </div>
        );
      })}
    </div>
  );
};
