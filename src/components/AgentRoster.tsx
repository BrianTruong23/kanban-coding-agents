'use client';

import { useState } from 'react';
import { CodingAgent, AgentSkill } from '@/types/agent';
import { Task } from '@/types/task';
import { User, Award, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { agentOrchestrationService } from '@/lib/agentOrchestration';

interface AgentRosterProps {
  agents: CodingAgent[];
  tasks: Task[];
  onUpdateAgent: (agent: CodingAgent) => void;
  onAutoAssign: () => void;
}

export function AgentRoster({ agents, tasks, onUpdateAgent, onAutoAssign }: AgentRosterProps) {
  const [selectedAgent, setSelectedAgent] = useState<CodingAgent | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleAgentClick = (agent: CodingAgent) => {
    setSelectedAgent(agent);
    setShowDetails(true);
  };

  const getAgentTasks = (agentId: string) => {
    return tasks.filter(t => t.assignedAgentId === agentId);
  };

  const getAgentActiveTasks = (agentId: string) => {
    return tasks.filter(t => t.assignedAgentId === agentId && t.status !== 'done');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Agent Roster</h2>
        <button
          onClick={onAutoAssign}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          Auto-Assign Tasks
        </button>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => {
          const agentTasks = getAgentTasks(agent.id);
          const activeTasks = getAgentActiveTasks(agent.id);
          const performance = agent.performance;

          return (
            <div
              key={agent.id}
              onClick={() => handleAgentClick(agent)}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800"
            >
              {/* Agent Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${agent.avatarColor || 'bg-gray-500'}`}>
                  {agent.avatar || <User className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{agent.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {agent.description || 'No description'}
                  </p>
                  <div className="mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        agent.availability === 'available'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : agent.availability === 'busy'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {agent.availability || 'available'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed
                  </div>
                  <p className="text-lg font-bold">{performance?.tasksCompleted || 0}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <Clock className="w-3 h-3" />
                    Active
                  </div>
                  <p className="text-lg font-bold">{activeTasks.length}</p>
                </div>
              </div>

              {/* Performance */}
              {performance && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Success Rate</span>
                    <span className="font-medium">
                      {Math.round(performance.successRate * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${performance.successRate * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Skills */}
              {agent.skills && agent.skills.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <Award className="w-3 h-3" />
                    Top Skills
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {agent.skills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded"
                      >
                        {skill.name} ({skill.level}/5)
                      </span>
                    ))}
                    {agent.skills.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{agent.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Agent Details Modal */}
      {showDetails && selectedAgent && (
        <AgentDetailsModal
          agent={selectedAgent}
          tasks={getAgentTasks(selectedAgent.id)}
          allTasks={tasks}
          onClose={() => setShowDetails(false)}
          onUpdate={onUpdateAgent}
        />
      )}
    </div>
  );
}

interface AgentDetailsModalProps {
  agent: CodingAgent;
  tasks: Task[];
  allTasks: Task[];
  onClose: () => void;
  onUpdate: (agent: CodingAgent) => void;
}

function AgentDetailsModal({ agent, tasks, allTasks, onClose, onUpdate }: AgentDetailsModalProps) {
  const performance = agent.performance;
  const activeTasks = tasks.filter(t => t.status !== 'done');
  const completedTasks = tasks.filter(t => t.status === 'done');

  // Calculate suggested skills
  const suggestedSkills = agentOrchestrationService.suggestSkills(agent, completedTasks);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${agent.avatarColor || 'bg-gray-500'}`}>
              {agent.avatar || <User className="w-8 h-8" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{agent.name}</h2>
              <p className="text-gray-600 dark:text-gray-400">{agent.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Performance Metrics */}
          {performance && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Performance Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
                  <p className="text-2xl font-bold">{performance.tasksCompleted}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">In Progress</p>
                  <p className="text-2xl font-bold">{activeTasks.length}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Success Rate</p>
                  <p className="text-2xl font-bold">{Math.round(performance.successRate * 100)}%</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Time</p>
                  <p className="text-2xl font-bold">{Math.round(performance.averageCompletionTime)}h</p>
                </div>
              </div>
            </div>
          )}

          {/* Skills */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Skills</h3>
            {agent.skills && agent.skills.length > 0 ? (
              <div className="space-y-2">
                {agent.skills.map((skill, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{skill.name}</span>
                      <span className="text-xs text-gray-500">({skill.category})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(skill.level / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-8 text-right">
                        {skill.level}/5
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No skills defined</p>
            )}
          </div>

          {/* Suggested Skills */}
          {suggestedSkills.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-500" />
                Suggested Skills (based on completed tasks)
              </h3>
              <div className="flex flex-wrap gap-2">
                {suggestedSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-700"
                  >
                    {skill.name} (Level {skill.level})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Specializations */}
          {performance?.specializations && performance.specializations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Specializations</h3>
              <div className="flex flex-wrap gap-2">
                {performance.specializations.map((spec, idx) => (
                  <span
                    key={idx}
                    className="text-sm bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Active Tasks */}
          {activeTasks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Active Tasks ({activeTasks.length})</h3>
              <div className="space-y-2">
                {activeTasks.map(task => (
                  <div
                    key={task.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-xs text-gray-600 dark:text-gray-400">
                          {task.taskId}
                        </p>
                        <p className="font-medium">{task.title}</p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          task.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : task.status === 'review'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
