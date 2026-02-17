'use client';

import { useState } from 'react';
import { CodingAgent, AgentSkill } from '@/types/agent';
import { Task } from '@/types/task';
import { agentOrchestrationService } from '@/services/agentOrchestrationService';
import { Users, TrendingUp, AlertCircle, CheckCircle, Zap, UserPlus } from 'lucide-react';

interface AgentRosterProps {
  agents: CodingAgent[];
  tasks: Task[];
  onAgentUpdate?: (agent: CodingAgent) => void;
  onAutoAssign?: (assignments: Map<string, string>) => void;
}

const SKILL_OPTIONS: AgentSkill[] = [
  'frontend',
  'backend',
  'fullstack',
  'devops',
  'mobile',
  'database',
  'testing',
  'ui-ux',
  'api',
  'security',
];

export const AgentRoster = ({ agents, tasks, onAgentUpdate, onAutoAssign }: AgentRosterProps) => {
  const [showWorkloadBalance, setShowWorkloadBalance] = useState(false);
  const [workloadAnalysis, setWorkloadAnalysis] = useState<{
    balanced: boolean;
    recommendations: string[];
    agentUtilization: Map<string, number>;
  } | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleAnalyzeWorkload = async () => {
    setProcessing(true);
    const analysis = await agentOrchestrationService.balanceWorkload(tasks, agents);
    setWorkloadAnalysis(analysis);
    setShowWorkloadBalance(true);
    setProcessing(false);
  };

  const handleAutoAssign = async () => {
    setProcessing(true);
    const backlogTasks = tasks.filter(t => t.status === 'backlog' && !t.assignedAgentId);
    const assignments = await agentOrchestrationService.autoAssignTasks(backlogTasks, agents);
    onAutoAssign?.(assignments);
    setProcessing(false);
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'bg-red-500';
    if (utilization >= 70) return 'bg-orange-500';
    if (utilization >= 40) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getUtilizationLabel = (utilization: number) => {
    if (utilization >= 90) return 'Overloaded';
    if (utilization >= 70) return 'Busy';
    if (utilization >= 40) return 'Active';
    return 'Available';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users size={20} />
              Agent Roster
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {agents.length} agent{agents.length !== 1 ? 's' : ''} •{' '}
              {agents.filter(a => a.isActive).length} active
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAnalyzeWorkload}
              disabled={processing}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              <TrendingUp size={14} />
              Analyze Workload
            </button>
            <button
              onClick={handleAutoAssign}
              disabled={processing}
              className="px-3 py-1.5 text-sm bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              <Zap size={14} />
              Auto-Assign
            </button>
          </div>
        </div>
      </div>

      {/* Workload Balance Panel */}
      {showWorkloadBalance && workloadAnalysis && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-start gap-3 mb-3">
            {workloadAnalysis.balanced ? (
              <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0" size={20} />
            ) : (
              <AlertCircle className="text-orange-600 dark:text-orange-400 flex-shrink-0" size={20} />
            )}
            <div className="flex-1">
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                {workloadAnalysis.balanced ? 'Workload Balanced' : 'Workload Imbalance Detected'}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                {workloadAnalysis.recommendations.map((rec, idx) => (
                  <div key={idx}>• {rec}</div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setShowWorkloadBalance(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Agent List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {agents.map(agent => {
          const utilization = agent.performance
            ? (agent.performance.currentWorkload / agent.maxConcurrentTasks) * 100
            : 0;
          const utilizationColor = getUtilizationColor(utilization);
          const utilizationLabel = getUtilizationLabel(utilization);

          return (
            <div key={agent.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full ${agent.avatarColor} flex items-center justify-center text-white font-semibold flex-shrink-0`}
                >
                  {agent.avatar}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {agent.name}
                    </div>
                    {!agent.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        Inactive
                      </span>
                    )}
                  </div>

                  {agent.description && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {agent.description}
                    </div>
                  )}

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {agent.skills.map(skill => (
                      <span
                        key={skill}
                        className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Performance Metrics */}
                  {agent.performance && (
                    <div className="space-y-2">
                      {/* Workload Bar */}
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                          <span>
                            Workload: {agent.performance.currentWorkload}/{agent.maxConcurrentTasks}
                          </span>
                          <span className="font-medium">{utilizationLabel}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${utilizationColor} transition-all duration-300`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-gray-500 dark:text-gray-400">Tasks Done</div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {agent.performance.tasksCompleted}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 dark:text-gray-400">Success Rate</div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {agent.performance.successRate.toFixed(0)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 dark:text-gray-400">Avg Time</div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {agent.performance.averageCompletionTime.toFixed(1)}h
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {agents.length === 0 && (
        <div className="p-8 text-center">
          <Users className="mx-auto mb-3 text-gray-400 dark:text-gray-500" size={48} />
          <p className="text-gray-600 dark:text-gray-400 mb-1">No agents yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Create your first agent to get started
          </p>
        </div>
      )}
    </div>
  );
};
