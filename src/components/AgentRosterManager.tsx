'use client';

import { useState } from 'react';
import { ExtendedAgent, AgentSkill, SkillCategory } from '@/types/agentSkills';
import { Users, Plus, X, TrendingUp, Award, Clock, Target } from 'lucide-react';
import { agentAssignmentService } from '@/services/agentAssignment';

interface AgentRosterManagerProps {
  agents: ExtendedAgent[];
  onClose: () => void;
  onUpdateAgent?: (agent: ExtendedAgent) => void;
}

export const AgentRosterManager = ({ agents, onClose, onUpdateAgent }: AgentRosterManagerProps) => {
  const [selectedAgent, setSelectedAgent] = useState<ExtendedAgent | null>(null);
  const rosterReport = agentAssignmentService.generateRosterReport(agents);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users size={24} />
              Agent Roster Management
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage agent skills, performance, and workload
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Roster Stats */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Agents</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {rosterReport.activeAgents}/{rosterReport.totalAgents}
                  </p>
                </div>
                <Users className="text-blue-500" size={32} />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Utilization</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {rosterReport.utilizationRate}%
                  </p>
                </div>
                <TrendingUp className="text-green-500" size={32} />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Available Hours</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {rosterReport.availableHours}h
                  </p>
                </div>
                <Clock className="text-orange-500" size={32} />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bottlenecks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {rosterReport.bottlenecks.length}
                  </p>
                </div>
                <Target className="text-red-500" size={32} />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Agent List */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Agents</h3>
              <div className="space-y-2">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedAgent?.id === agent.id
                        ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: agent.avatarColor }}
                      >
                        {agent.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{agent.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            agent.workload.availability === 'available' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                            agent.workload.availability === 'busy' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                            agent.workload.availability === 'overloaded' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}>
                            {agent.workload.availability}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {agent.workload.currentTasks} tasks
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Agent Details */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedAgent ? (
              <div className="space-y-6">
                {/* Agent Header */}
                <div className="flex items-start gap-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                    style={{ backgroundColor: selectedAgent.avatarColor }}
                  >
                    {selectedAgent.avatar}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedAgent.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedAgent.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        selectedAgent.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {selectedAgent.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Performance Metrics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard
                      label="Success Rate"
                      value={`${selectedAgent.performance.successRate}%`}
                      icon={<Award size={16} />}
                      color="green"
                    />
                    <MetricCard
                      label="Quality Score"
                      value={`${selectedAgent.performance.qualityScore}%`}
                      icon={<TrendingUp size={16} />}
                      color="blue"
                    />
                    <MetricCard
                      label="On-Time Delivery"
                      value={`${selectedAgent.performance.onTimeDeliveryRate}%`}
                      icon={<Clock size={16} />}
                      color="orange"
                    />
                    <MetricCard
                      label="Tasks Completed"
                      value={selectedAgent.performance.tasksCompleted.toString()}
                      icon={<Target size={16} />}
                      color="purple"
                    />
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Skills & Expertise</h4>
                  <div className="space-y-2">
                    {selectedAgent.skills.map((skill) => (
                      <div key={skill.id} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                              {skill.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Level {skill.proficiency}/5
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                              style={{ width: `${(skill.proficiency / 5) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Workload */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Current Workload</h4>
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Current Tasks</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                          {selectedAgent.workload.currentTasks}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Estimated Hours</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                          {selectedAgent.workload.estimatedHoursRemaining}h
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specializations */}
                {selectedAgent.performance.specializations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Specializations</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAgent.performance.specializations.map((spec, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-xs font-medium"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                <p>Select an agent to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Performers */}
        {rosterReport.topPerformers.length > 0 && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Top Performers</h4>
            <div className="flex gap-3 overflow-x-auto">
              {rosterReport.topPerformers.map((performer, index) => (
                <div
                  key={performer.id}
                  className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 min-w-[200px]"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🏆</span>
                    <span className="font-medium text-gray-900 dark:text-white">{performer.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Quality: {performer.qualityScore}%</span>
                    <span>{performer.tasksCompleted} tasks</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'orange' | 'purple';
}) => {
  const colorClasses = {
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400',
  };

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
};
