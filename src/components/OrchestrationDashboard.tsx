'use client';

import { useState } from 'react';
import { CodingAgent } from '@/types/agent';
import { BreakdownResult, Ticket, Subtask, TaskDependency } from '@/types/breakdown';
import { TaskBreakdownModal } from './TaskBreakdownModal';
import { BreakdownResultsView } from './BreakdownResultsView';
import { DependencyGraph } from './DependencyGraph';
import { AgentOrchestrator } from '@/lib/agentOrchestrator';
import {
  Sparkles,
  Users,
  TrendingUp,
  Activity,
  GitBranch,
  AlertCircle
} from 'lucide-react';

interface OrchestrationDashboardProps {
  agents: CodingAgent[];
  userId: string;
  onTasksCreated: (tickets: Ticket[]) => void;
}

export const OrchestrationDashboard = ({
  agents,
  userId,
  onTasksCreated
}: OrchestrationDashboardProps) => {
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [breakdownResult, setBreakdownResult] = useState<BreakdownResult | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);

  // Calculate team capacity
  const teamCapacity = AgentOrchestrator.calculateTeamCapacity(agents);

  const handleBreakdownComplete = (result: BreakdownResult) => {
    setBreakdownResult(result);
    setShowBreakdownModal(false);
  };

  const handleApproveBreakdown = () => {
    if (!breakdownResult) return;

    // Add tickets and subtasks to the board
    setTickets([...tickets, ...breakdownResult.tickets]);
    setSubtasks([...subtasks, ...breakdownResult.subtasks]);
    setDependencies([...dependencies, ...breakdownResult.dependencies]);

    // Notify parent to update tasks
    onTasksCreated(breakdownResult.tickets);

    // Clear breakdown result
    setBreakdownResult(null);
  };

  const handleAutoAssign = () => {
    if (tickets.length === 0) return;

    const assignments = AgentOrchestrator.autoAssignTasks(tickets, agents);

    // Update tickets with assignments
    const updatedTickets = tickets.map(ticket => {
      const assignment = assignments.find(a => a.taskId === ticket.id);
      if (assignment) {
        return { ...ticket, assignedAgentId: assignment.agentId };
      }
      return ticket;
    });

    setTickets(updatedTickets);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Agent Orchestration Dashboard</h1>
            <p className="text-purple-100">
              Automated task breakdown and intelligent agent assignment
            </p>
          </div>
          <button
            onClick={() => setShowBreakdownModal(true)}
            className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center gap-2 shadow-lg"
          >
            <Sparkles size={20} />
            Break Down Task
          </button>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={20} />
              <span className="text-sm font-medium">Team Size</span>
            </div>
            <div className="text-3xl font-bold">{teamCapacity.totalAgents}</div>
            <div className="text-xs text-purple-100 mt-1">
              {teamCapacity.availableAgents} available
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={20} />
              <span className="text-sm font-medium">Avg Workload</span>
            </div>
            <div className="text-3xl font-bold">
              {Math.round(teamCapacity.averageWorkload)}%
            </div>
            <div className="text-xs text-purple-100 mt-1">across team</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} />
              <span className="text-sm font-medium">Capacity</span>
            </div>
            <div className="text-3xl font-bold">
              {Math.round(teamCapacity.teamCapacity)}%
            </div>
            <div className="text-xs text-purple-100 mt-1">remaining</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <GitBranch size={20} />
              <span className="text-sm font-medium">Dependencies</span>
            </div>
            <div className="text-3xl font-bold">{dependencies.length}</div>
            <div className="text-xs text-purple-100 mt-1">task relationships</div>
          </div>
        </div>
      </div>

      {/* Agent Performance Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Users size={24} className="text-purple-600 dark:text-purple-400" />
          Agent Performance
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-12 h-12 rounded-full ${agent.avatarColor || 'bg-gray-400'} flex items-center justify-center text-white font-bold`}
                >
                  {agent.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {agent.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {agent.availability.status}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {agent.performance.tasksCompleted}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Done</div>
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

              {/* Workload Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Workload</span>
                  <span>{agent.availability.currentWorkload}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      agent.availability.currentWorkload >= 80
                        ? 'bg-red-500'
                        : agent.availability.currentWorkload >= 50
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${agent.availability.currentWorkload}%` }}
                  ></div>
                </div>
              </div>

              {/* Skills Preview */}
              {agent.skills && agent.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {agent.skills.slice(0, 3).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded"
                    >
                      {skill.name}
                    </span>
                  ))}
                  {agent.skills.length > 3 && (
                    <span className="px-2 py-0.5 text-gray-500 dark:text-gray-400 text-xs">
                      +{agent.skills.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Auto-Assignment Section */}
      {tickets.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles size={24} className="text-purple-600 dark:text-purple-400" />
              Auto-Assignment
            </h2>
            <button
              onClick={handleAutoAssign}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Auto-Assign Tasks
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Automatically assign {tickets.filter(t => !t.assignedAgentId).length} unassigned tasks
            based on agent skills, performance, and availability.
          </p>
        </div>
      )}

      {/* Dependency Graph */}
      {(tickets.length > 0 || dependencies.length > 0) && (
        <DependencyGraph
          tickets={tickets}
          subtasks={subtasks}
          dependencies={dependencies}
        />
      )}

      {/* Breakdown Results Modal */}
      {breakdownResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <BreakdownResultsView
              result={breakdownResult}
              agents={agents}
              onApprove={handleApproveBreakdown}
              onCancel={() => setBreakdownResult(null)}
            />
          </div>
        </div>
      )}

      {/* Task Breakdown Modal */}
      <TaskBreakdownModal
        isOpen={showBreakdownModal}
        onClose={() => setShowBreakdownModal(false)}
        onBreakdownComplete={handleBreakdownComplete}
        userId={userId}
      />
    </div>
  );
};
