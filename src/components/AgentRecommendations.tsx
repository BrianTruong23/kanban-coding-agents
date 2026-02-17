'use client';

import { CodingAgent } from '@/types/agent';
import { Ticket, Subtask } from '@/types/breakdown';
import { AgentOrchestrator } from '@/lib/agentOrchestrator';
import { Users, TrendingUp, Zap, CheckCircle } from 'lucide-react';

interface AgentRecommendationsProps {
  task: Ticket | Subtask;
  agents: CodingAgent[];
  onAssign: (agentId: string) => void;
}

export const AgentRecommendations = ({
  task,
  agents,
  onAssign
}: AgentRecommendationsProps) => {
  const recommendations = AgentOrchestrator.getAgentRecommendations(task, agents, 3);

  if (recommendations.length === 0) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No agent recommendations available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Users size={18} className="text-purple-600 dark:text-purple-400" />
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Recommended Agents
        </h4>
      </div>

      {recommendations.map((rec, index) => {
        const agent = rec.agent;
        const confidencePercent = Math.round(rec.confidence * 100);

        return (
          <div
            key={agent.id}
            className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer"
            onClick={() => onAssign(agent.id)}
          >
            {/* Agent Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full ${agent.avatarColor || 'bg-gray-400'} flex items-center justify-center text-white font-bold text-sm`}
                >
                  {agent.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()}
                </div>

                {/* Name and Rank */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {agent.name}
                    </span>
                    {index === 0 && (
                      <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded">
                        Best Match
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {agent.description}
                  </p>
                </div>
              </div>

              {/* Confidence Badge */}
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1">
                  <TrendingUp size={14} className="text-green-600 dark:text-green-400" />
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    {confidencePercent}%
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">match</span>
              </div>
            </div>

            {/* Skills Match */}
            {agent.skills && agent.skills.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {agent.skills.slice(0, 4).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded"
                    >
                      {skill.name} ({skill.level})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {agent.performance.tasksCompleted}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Tasks Done</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {Math.round(agent.performance.successRate * 100)}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Success</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {agent.performance.qualityScore}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Quality</div>
              </div>
            </div>

            {/* Availability */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Zap
                  size={12}
                  className={
                    agent.availability.status === 'available'
                      ? 'text-green-500'
                      : agent.availability.status === 'busy'
                      ? 'text-yellow-500'
                      : 'text-gray-400'
                  }
                />
                <span className="text-gray-600 dark:text-gray-400 capitalize">
                  {agent.availability.status}
                </span>
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                Workload: {agent.availability.currentWorkload}%
              </div>
            </div>

            {/* Reasons */}
            {rec.reasons.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  {rec.reasons.slice(0, 3).map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assign Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAssign(agent.id);
              }}
              className="mt-3 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Assign to {agent.name.split(' ')[0]}
            </button>
          </div>
        );
      })}
    </div>
  );
};
