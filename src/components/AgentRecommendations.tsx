'use client';

import { useMemo } from 'react';
import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { AgentOrchestrationService } from '@/lib/agentOrchestration';
import { Bot, TrendingUp, Users, Zap } from 'lucide-react';
import { getInitials, getAvatarColor } from '@/lib/utils';
import clsx from 'clsx';

interface AgentRecommendationsProps {
  task: Task;
  agents: CodingAgent[];
  allTasks: Task[];
  onAssign: (agentId: string) => void;
  onClose?: () => void;
}

export const AgentRecommendations = ({
  task,
  agents,
  allTasks,
  onAssign,
  onClose,
}: AgentRecommendationsProps) => {
  const recommendations = useMemo(() => {
    return AgentOrchestrationService.getRecommendations(task, agents, allTasks, 5);
  }, [task, agents, allTasks]);

  const bestMatch = recommendations[0];

  if (recommendations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <Users size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No agents available for this task</p>
        <p className="text-xs mt-1">Try adding more agents with relevant skills</p>
      </div>
    );
  }

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700';
      case 'low':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Bot className="text-blue-600 dark:text-blue-400" size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Agent Recommendations</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Based on skills, availability, and performance
            </p>
          </div>
        </div>
      </div>

      {/* Best Match Highlight */}
      {bestMatch && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-yellow-600 dark:text-yellow-400" />
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
              Best Match
            </span>
          </div>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold',
                  bestMatch.agent.avatarColor || getAvatarColor(bestMatch.agent.name)
                )}
              >
                {bestMatch.agent.avatar || getInitials(bestMatch.agent.name)}
              </div>
              <div>
                <h5 className="font-semibold text-gray-900 dark:text-white">{bestMatch.agent.name}</h5>
                <p className="text-xs text-gray-600 dark:text-gray-400">{bestMatch.agent.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <TrendingUp size={12} className="text-green-600 dark:text-green-400" />
                    <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                      {bestMatch.score}/100
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getConfidenceBadge(bestMatch.confidence)}`}>
                    {bestMatch.confidence} confidence
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onAssign(bestMatch.agentId);
                onClose?.();
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Assign
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {bestMatch.reasons.map((reason, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400 rounded"
              >
                {reason}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Other Recommendations */}
      {recommendations.length > 1 && (
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Other Options
          </h5>
          {recommendations.slice(1).map((rec) => (
            <div
              key={rec.agentId}
              className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold',
                      rec.agent.avatarColor || getAvatarColor(rec.agent.name)
                    )}
                  >
                    {rec.agent.avatar || getInitials(rec.agent.name)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h6 className="font-medium text-sm text-gray-900 dark:text-white">{rec.agent.name}</h6>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {rec.score}/100
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${getConfidenceBadge(rec.confidence)}`}>
                        {rec.confidence}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {rec.reasons.slice(0, 2).map((reason, idx) => (
                        <span
                          key={idx}
                          className="text-xs text-gray-600 dark:text-gray-400"
                        >
                          • {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onAssign(rec.agentId);
                    onClose?.();
                  }}
                  className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Assign
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Auto-assign all unassigned tasks */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            const assignments = AgentOrchestrationService.balanceWorkload(allTasks, agents);
            // This would need to be implemented in the parent component
            console.log('Auto-assign all:', assignments);
            onClose?.();
          }}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
        >
          <Users size={14} />
          Auto-assign All Unassigned Tasks
        </button>
      </div>
    </div>
  );
};
