'use client';

import { useState } from 'react';
import { Users, Award, Clock, TrendingUp, Activity } from 'lucide-react';
import { AgentRoster, TeamComposition } from '@/types/agentRoster';
import { AgentOrchestrator } from '@/lib/agentOrchestrator';

interface AgentRosterManagerProps {
  agents: AgentRoster[];
  onUpdateAgent?: (agent: AgentRoster) => void;
}

export function AgentRosterManager({ agents, onUpdateAgent }: AgentRosterManagerProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const teamComposition = AgentOrchestrator.getTeamComposition(agents);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-300';
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'bg-red-500';
    if (utilization >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Agent Roster Manager
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage coding agents, skills, and performance metrics
        </p>
      </div>

      {/* Team Overview */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Team Overview
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {teamComposition.totalAgents}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total Agents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {teamComposition.availableAgents}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Available</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {teamComposition.busyAgents}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Busy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">
              {teamComposition.offlineAgents}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Offline</div>
          </div>
        </div>
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-3">
          {agents.map((agent) => {
            const workload = teamComposition.workloadDistribution.find(
              (w) => w.agentId === agent.id
            );

            return (
              <div
                key={agent.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedAgent === agent.id
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setSelectedAgent(agent.id)}
              >
                {/* Agent Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                        agent.avatarColor || 'bg-blue-500'
                      }`}
                    >
                      {agent.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        {agent.name}
                      </h4>
                      {agent.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {agent.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${getStatusColor(
                        agent.availability.status
                      )}`}
                      title={agent.availability.status}
                    />
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Skills:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {agent.skills.slice(0, 5).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                      >
                        {skill.name} ({skill.level})
                      </span>
                    ))}
                    {agent.skills.length > 5 && (
                      <span className="px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                        +{agent.skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-4 gap-3 mb-3 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                      <Award className="w-3 h-3" />
                      Quality
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {agent.performanceMetrics.qualityScore || 0}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      On-time
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {agent.performanceMetrics.onTimeDeliveryRate || 0}%
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                      <TrendingUp className="w-3 h-3" />
                      Completed
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {agent.performanceMetrics.tasksCompleted}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                      <Activity className="w-3 h-3" />
                      Active
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {agent.performanceMetrics.tasksInProgress}
                    </div>
                  </div>
                </div>

                {/* Workload */}
                <div>
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>Workload</span>
                    <span>
                      {agent.availability.currentWorkload}/{agent.availability.maxCapacity} (
                      {workload?.capacityUtilization || 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getUtilizationColor(
                        workload?.capacityUtilization || 0
                      )}`}
                      style={{ width: `${workload?.capacityUtilization || 0}%` }}
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedAgent === agent.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Specializations:
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {agent.specializations.join(', ') || 'None specified'}
                        </p>
                      </div>
                      {agent.preferences && (
                        <div>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Preferred Task Types:
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {agent.preferences.preferredTaskTypes.join(', ') || 'None specified'}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Recent Assignments:
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {agent.assignmentHistory.length} total assignments
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Skill Coverage */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Skill Coverage
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {teamComposition.skillCoverage.slice(0, 6).map((skill) => (
            <div key={skill.category} className="text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                {skill.category}
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {skill.agentCount} agents
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
