'use client';

import { CodingAgent, AgentStats } from '@/types/agent';
import { Task } from '@/types/task';
import { getAssignmentRecommendations } from '@/lib/agentOrchestration';
import { TrendingUp, Award, CheckCircle } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface AssignmentRecommendationsProps {
  task: Task;
  agents: CodingAgent[];
  agentStats?: Map<string, AgentStats>;
  onAssign: (agentId: string) => void;
}

export const AssignmentRecommendations = ({
  task,
  agents,
  agentStats,
  onAssign,
}: AssignmentRecommendationsProps) => {
  const recommendation = getAssignmentRecommendations(task, agents, agentStats);

  if (recommendation.recommendations.length === 0) {
    return (
      <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
        No agents available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Recommended Agents
        </h4>
        {recommendation.autoAssignedAgentId && (
          <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full flex items-center gap-1">
            <CheckCircle size={12} />
            Auto-assign ready
          </span>
        )}
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {recommendation.recommendations.slice(0, 5).map((rec, index) => {
          const agent = agents.find((a) => a.id === rec.agentId);
          if (!agent) return null;

          const isTopRecommendation = index === 0;
          const isAutoAssigned = rec.agentId === recommendation.autoAssignedAgentId;

          return (
            <button
              key={rec.agentId}
              onClick={() => onAssign(rec.agentId)}
              className={`w-full p-3 rounded-lg border transition-all text-left ${
                isAutoAssigned
                  ? 'border-green-500 dark:border-green-500 bg-green-50 dark:bg-green-900/20'
                  : isTopRecommendation
                  ? 'border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                  style={{ backgroundColor: agent.avatarColor || '#6b7280' }}
                >
                  {getInitials(agent.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {agent.name}
                    </h5>
                    <div className="flex items-center gap-1">
                      {isAutoAssigned && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                          Best Match
                        </span>
                      )}
                      {isTopRecommendation && !isAutoAssigned && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          Top Pick
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1">
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            rec.score >= 80
                              ? 'bg-green-500'
                              : rec.score >= 60
                              ? 'bg-blue-500'
                              : rec.score >= 40
                              ? 'bg-yellow-500'
                              : 'bg-orange-500'
                          }`}
                          style={{ width: `${rec.score}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {rec.score}
                    </span>
                  </div>

                  {/* Reasons */}
                  {rec.reasons.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {rec.reasons.slice(0, 3).map((reason, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400"
                        >
                          <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                          <span>{reason}</span>
                        </div>
                      ))}
                      {rec.reasons.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-500 pl-3">
                          +{rec.reasons.length - 3} more reasons
                        </div>
                      )}
                    </div>
                  )}

                  {/* Agent Skills Preview */}
                  {agent.skills && agent.skills.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {agent.skills.slice(0, 3).map((skill) => {
                        const isRequired = task.requiredSkills?.some(
                          (req) =>
                            skill.toLowerCase().includes(req.toLowerCase()) ||
                            req.toLowerCase().includes(skill.toLowerCase())
                        );
                        return (
                          <span
                            key={skill}
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              isRequired
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {skill}
                          </span>
                        );
                      })}
                      {agent.skills.length > 3 && (
                        <span className="text-xs px-1.5 py-0.5 text-gray-500 dark:text-gray-500">
                          +{agent.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {recommendation.recommendations.length > 5 && (
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-2">
          +{recommendation.recommendations.length - 5} more agents available
        </p>
      )}
    </div>
  );
};
