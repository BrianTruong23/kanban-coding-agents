'use client';

import { useState } from 'react';
import { X, Plus, Edit2, Trash2, Award, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { EnhancedAgent, AgentSkill } from '@/types/agentRoster';

interface AgentRosterModalProps {
  isOpen: boolean;
  agents: EnhancedAgent[];
  onClose: () => void;
  onUpdateAgent: (agent: EnhancedAgent) => void;
  onDeleteAgent: (agentId: string) => void;
}

export const AgentRosterModal = ({ isOpen, agents, onClose, onUpdateAgent, onDeleteAgent }: AgentRosterModalProps) => {
  const [selectedAgent, setSelectedAgent] = useState<EnhancedAgent | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  if (!isOpen) return null;

  const handleEditAgent = (agent: EnhancedAgent) => {
    setSelectedAgent(agent);
    setIsEditing(true);
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'busy': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'offline': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getPerformanceRating = (score: number) => {
    if (score >= 0.8) return { label: 'Excellent', color: 'text-green-600 dark:text-green-400' };
    if (score >= 0.6) return { label: 'Good', color: 'text-blue-600 dark:text-blue-400' };
    if (score >= 0.4) return { label: 'Fair', color: 'text-yellow-600 dark:text-yellow-400' };
    return { label: 'Needs Improvement', color: 'text-red-600 dark:text-red-400' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Agent Roster Management
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              View and manage agent skills, performance, and availability
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {agents.map((agent) => {
              const performanceRating = getPerformanceRating(agent.performanceMetrics.qualityScore / 5);
              const successRate = (agent.performanceMetrics.successRate * 100).toFixed(0);

              return (
                <div
                  key={agent.id}
                  className="bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-5 hover:shadow-lg transition-shadow"
                >
                  {/* Agent Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 ${agent.avatarColor || 'bg-gray-400'} rounded-full flex items-center justify-center text-white font-bold text-lg`}
                      >
                        {agent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {agent.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {agent.description || 'No description'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditAgent(agent)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Edit agent"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete agent ${agent.name}?`)) {
                            onDeleteAgent(agent.id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete agent"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Availability Status */}
                  <div className="mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getAvailabilityColor(agent.availability)}`}>
                      {agent.availability.charAt(0).toUpperCase() + agent.availability.slice(1)}
                    </span>
                  </div>

                  {/* Skills */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                      Skills
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {agent.skills.length > 0 ? (
                        agent.skills.slice(0, 5).map((skill) => (
                          <span
                            key={skill.id}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs flex items-center gap-1"
                          >
                            {skill.name}
                            <span className="text-xs opacity-70">L{skill.proficiencyLevel}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">No skills defined</span>
                      )}
                      {agent.skills.length > 5 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                          +{agent.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Specializations */}
                  {agent.specializations.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                        Specializations
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {agent.specializations.map((spec, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Performance Metrics */}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4 space-y-3">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                      Performance Metrics
                    </h4>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Tasks Done</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {agent.performanceMetrics.tasksCompleted}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Success Rate</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {successRate}%
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Award size={16} className={performanceRating.color} />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Quality</p>
                          <p className={`font-semibold ${performanceRating.color}`}>
                            {performanceRating.label}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-yellow-600 dark:text-yellow-400" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Avg Time</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {agent.performanceMetrics.averageCompletionTime.toFixed(1)}h
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Workload Bar */}
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Current Workload</span>
                        <span>{agent.performanceMetrics.workload}h / {agent.maxConcurrentTasks * 8}h</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min((agent.performanceMetrics.workload / (agent.maxConcurrentTasks * 8)) * 100, 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {agents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No agents available
              </p>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 mx-auto">
                <Plus size={16} />
                Add Agent
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
