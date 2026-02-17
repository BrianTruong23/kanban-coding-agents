'use client';

import { useState } from 'react';
import {
  CodingAgent,
  AgentSkill,
  SkillCategory,
  AgentAvailability,
} from '@/types/agent';
import { AgentOrchestrationService } from '@/services/agentOrchestrationService';
import { Users, Plus, Trash2, Edit2, CheckCircle2, XCircle, TrendingUp, Clock } from 'lucide-react';

interface AgentRosterManagerProps {
  agents: CodingAgent[];
  onAgentUpdate?: (agent: CodingAgent) => void;
  onAgentAdd?: (agent: CodingAgent) => void;
  onAgentRemove?: (agentId: string) => void;
}

export const AgentRosterManager = ({
  agents,
  onAgentUpdate,
  onAgentAdd,
  onAgentRemove,
}: AgentRosterManagerProps) => {
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const workloadSummary = AgentOrchestrationService.getAgentWorkloadSummary(agents);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={28} />
            Agent Roster
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your coding agents, skills, and performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Table
            </button>
          </div>
          <button
            onClick={() => setIsAddingAgent(true)}
            className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            Add Agent
          </button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Agents</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{agents.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Available</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {agents.filter((a) => a.availability.status === 'available').length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Busy</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {agents.filter((a) => a.availability.status === 'busy').length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Success Rate</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {Math.round(
              (agents.reduce((sum, a) => sum + (a.performance.successRate || 0), 0) /
                agents.length) *
                100
            )}
            %
          </div>
        </div>
      </div>

      {/* Agent List - Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={() => setEditingAgent(agent.id)}
              onRemove={() => onAgentRemove?.(agent.id)}
            />
          ))}
        </div>
      )}

      {/* Agent List - Table View */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Agent
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Skills
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Performance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Workload
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {agents.map((agent) => {
                const workload = workloadSummary.find((w) => w.agentId === agent.id);
                return (
                  <tr key={agent.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: agent.avatarColor || '#666' }}
                        >
                          {agent.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {agent.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {agent.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          agent.availability.status === 'available'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : agent.availability.status === 'busy'
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {agent.availability.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {agent.skills.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded"
                          >
                            {skill.category}
                          </span>
                        ))}
                        {agent.skills.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{agent.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-green-500" />
                        <span className="text-sm">
                          {Math.round((agent.performance.successRate || 0) * 100)}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {agent.performance.tasksCompleted} completed
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {workload?.currentTasks || 0} tasks
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {workload?.capacity || 0}% capacity
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingAgent(agent.id)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => onAgentRemove?.(agent.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Agent Card Component
const AgentCard = ({
  agent,
  onEdit,
  onRemove,
}: {
  agent: CodingAgent;
  onEdit: () => void;
  onRemove: () => void;
}) => {
  const getStatusIcon = (status: AgentAvailability['status']) => {
    switch (status) {
      case 'available':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'busy':
        return <Clock size={16} className="text-orange-500" />;
      case 'offline':
        return <XCircle size={16} className="text-gray-500" />;
      default:
        return <XCircle size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: agent.avatarColor || '#666' }}
          >
            {agent.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">{agent.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{agent.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="text-gray-400 hover:text-blue-600">
            <Edit2 size={16} />
          </button>
          <button onClick={onRemove} className="text-gray-400 hover:text-red-600">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 mb-4">
        {getStatusIcon(agent.availability.status)}
        <span className="text-sm capitalize">{agent.availability.status}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          • {agent.availability.currentCapacity || 0}% capacity
        </span>
      </div>

      {/* Skills */}
      <div className="mb-4">
        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Skills</div>
        <div className="flex flex-wrap gap-1">
          {agent.skills.slice(0, 5).map((skill, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded"
            >
              {skill.category} ({skill.proficiency}/5)
            </span>
          ))}
          {agent.skills.length > 5 && (
            <span className="text-xs text-gray-500">+{agent.skills.length - 5} more</span>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Success Rate</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {Math.round((agent.performance.successRate || 0) * 100)}%
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Tasks Done</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {agent.performance.tasksCompleted}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Quality</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {Math.round((agent.performance.qualityScore || 0) * 100)}%
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600 dark:text-gray-400">On-Time</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {Math.round((agent.performance.onTimeDeliveryRate || 0) * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
};
