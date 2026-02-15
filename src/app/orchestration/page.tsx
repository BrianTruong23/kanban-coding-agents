'use client';

import { useState } from 'react';
import { useBreakdown } from '@/hooks/useBreakdown';
import { useAgents } from '@/hooks/useAgents';
import { BreakdownResult } from '@/types/breakdown';
import TaskBreakdownWizard from '@/components/TaskBreakdownWizard';
import TaskBreakdownView from '@/components/TaskBreakdownView';
import AgentRoster from '@/components/AgentRoster';
import AutoAssignment from '@/components/AutoAssignment';
import { Sparkles, Users, Network, Plus } from 'lucide-react';

type TabType = 'overview' | 'breakdown' | 'agents' | 'assignment';

export default function OrchestrationPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showWizard, setShowWizard] = useState(false);

  const {
    epics,
    tickets,
    subtasks,
    dependencies,
    agentSkills,
    agentPerformance,
    isLoaded: breakdownLoaded,
    addEpic,
    addTicket,
    addSubtask,
    addDependency,
    updateAgentSkills,
    updateTicket,
  } = useBreakdown();

  const { agents, isLoaded: agentsLoaded } = useAgents();

  const handleBreakdownComplete = async (result: BreakdownResult) => {
    try {
      // Save epics
      for (const epic of result.epics) {
        await addEpic(epic);
      }

      // Save tickets
      for (const ticket of result.tickets) {
        await addTicket(ticket);
      }

      // Save subtasks
      for (const subtask of result.subtasks) {
        await addSubtask(subtask);
      }

      // Save dependencies
      for (const dep of result.dependencies) {
        await addDependency(dep);
      }

      setShowWizard(false);
      setActiveTab('breakdown');
    } catch (error) {
      console.error('Error saving breakdown:', error);
      alert('Error saving breakdown. Please try again.');
    }
  };

  const handleAutoAssign = async (assignments: Array<{ ticketId: string; agentId: string }>) => {
    try {
      for (const assignment of assignments) {
        const ticket = tickets.find(t => t.id === assignment.ticketId);
        if (ticket) {
          await updateTicket({
            ...ticket,
            assignedAgentId: assignment.agentId,
          });
        }
      }
      alert('Assignments applied successfully!');
    } catch (error) {
      console.error('Error applying assignments:', error);
      alert('Error applying assignments. Please try again.');
    }
  };

  const isLoaded = breakdownLoaded && agentsLoaded;

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading orchestration system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Network className="w-8 h-8 text-blue-600" />
                Task Orchestration
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Automated task breakdown and intelligent agent assignment
              </p>
            </div>
            <button
              onClick={() => setShowWizard(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Breakdown
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6">
            {[
              { id: 'overview' as TabType, label: 'Overview', icon: Sparkles },
              { id: 'breakdown' as TabType, label: 'Task Breakdown', icon: Network },
              { id: 'agents' as TabType, label: 'Agent Roster', icon: Users },
              { id: 'assignment' as TabType, label: 'Auto-Assignment', icon: Sparkles },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  activeTab === id
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold text-blue-600">{epics.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active Epics</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold text-green-600">{tickets.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Tickets</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold text-purple-600">{agents.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active Agents</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold text-orange-600">
                  {tickets.filter(t => !t.assignedAgentId).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Unassigned</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setShowWizard(true)}
                  className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                >
                  <Sparkles className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="font-medium">Break Down New Task</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Analyze issue, PRD, or screenshot
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('assignment')}
                  className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors"
                >
                  <Users className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <div className="font-medium">Auto-Assign Tasks</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Use AI to assign based on skills
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('agents')}
                  className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors"
                >
                  <Network className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <div className="font-medium">Manage Agent Skills</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Update agent capabilities
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Recent Tickets</h2>
              {tickets.length === 0 ? (
                <p className="text-gray-500 italic text-center py-8">
                  No tickets yet. Create a breakdown to get started!
                </p>
              ) : (
                <div className="space-y-2">
                  {tickets.slice(0, 5).map(ticket => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div>
                        <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {ticket.ticketId}
                        </span>
                        <span className="ml-2">{ticket.title}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {ticket.assignedAgentId ? '✅ Assigned' : '⏳ Unassigned'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'breakdown' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <TaskBreakdownView
              epics={epics}
              tickets={tickets}
              subtasks={subtasks}
              dependencies={dependencies}
              agents={agents}
            />
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <AgentRoster
              agents={agents}
              agentSkills={agentSkills}
              agentPerformance={agentPerformance}
              onUpdateSkills={updateAgentSkills}
            />
          </div>
        )}

        {activeTab === 'assignment' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <AutoAssignment
              tickets={tickets}
              agents={agents}
              agentSkills={agentSkills}
              agentPerformance={agentPerformance}
              onAssign={handleAutoAssign}
            />
          </div>
        )}
      </div>

      {/* Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <TaskBreakdownWizard
            onComplete={handleBreakdownComplete}
            onCancel={() => setShowWizard(false)}
          />
        </div>
      )}
    </div>
  );
}
