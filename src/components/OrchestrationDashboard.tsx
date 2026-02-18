'use client';

import { useState } from 'react';
import { Task, TaskDependency } from '@/types/task';
import { CodingAgent, AgentStats } from '@/types/agent';
import { TaskBreakdownModal } from './TaskBreakdownModal';
import { AgentRosterPanel } from './AgentRosterPanel';
import { DependencyGraph } from './DependencyGraph';
import { BreakdownResult } from '@/lib/taskBreakdown';
import { Workflow, Users, GitBranch, X } from 'lucide-react';

interface OrchestrationDashboardProps {
  tasks: Task[];
  agents: CodingAgent[];
  dependencies: TaskDependency[];
  agentStats?: Map<string, AgentStats>;
  onAddTasks: (result: BreakdownResult) => Promise<void>;
  onAddAgent: (agent: Omit<CodingAgent, 'id' | 'createdAt'>) => void;
  onUpdateAgent: (agent: CodingAgent) => void;
  onDeleteAgent: (agentId: string) => void;
  onTaskClick?: (taskId: string) => void;
}

type TabType = 'breakdown' | 'roster' | 'dependencies';

export const OrchestrationDashboard = ({
  tasks,
  agents,
  dependencies,
  agentStats,
  onAddTasks,
  onAddAgent,
  onUpdateAgent,
  onDeleteAgent,
  onTaskClick,
}: OrchestrationDashboardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('breakdown');
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);

  const tabs = [
    { id: 'breakdown' as const, label: 'Task Breakdown', icon: Workflow },
    { id: 'roster' as const, label: 'Agent Roster', icon: Users },
    { id: 'dependencies' as const, label: 'Dependencies', icon: GitBranch },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-black dark:bg-white text-white dark:text-black px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-medium z-40"
      >
        <Workflow size={20} />
        Orchestration
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setIsOpen(false)} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Task Orchestration
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Automated task breakdown and agent management
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-black dark:border-white text-black dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'breakdown' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Automated Task Breakdown
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Analyze issues, PRDs, or screenshots to automatically generate epics, tasks,
                  and subtasks with definition of done, test notes, and risk flags.
                </p>
                <button
                  onClick={() => setShowBreakdownModal(true)}
                  className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-black dark:hover:border-white transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                >
                  <Workflow size={20} />
                  <span className="font-medium">Start Task Breakdown</span>
                </button>
              </div>

              {/* Recent Breakdown Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {tasks.filter((t) => t.type === 'epic').length}
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                    Epics
                  </div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {tasks.filter((t) => t.type === 'task').length}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Tasks
                  </div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {tasks.filter((t) => t.type === 'subtask').length}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Subtasks
                  </div>
                </div>
              </div>

              {/* Risk Summary */}
              {tasks.some((t) => t.riskLevel) && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Risk Overview
                  </h4>
                  <div className="space-y-2">
                    {(['critical', 'high', 'medium'] as const).map((level) => {
                      const count = tasks.filter((t) => t.riskLevel === level).length;
                      if (count === 0) return null;
                      return (
                        <div
                          key={level}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                        >
                          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                            {level} Risk
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              level === 'critical'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                : level === 'high'
                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            }`}
                          >
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'roster' && (
            <AgentRosterPanel
              agents={agents}
              agentStats={agentStats}
              onAddAgent={onAddAgent}
              onUpdateAgent={onUpdateAgent}
              onDeleteAgent={onDeleteAgent}
            />
          )}

          {activeTab === 'dependencies' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Task Dependencies
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Visual representation of task dependencies and relationships
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[500px]">
                <DependencyGraph
                  tasks={tasks}
                  dependencies={dependencies}
                  onTaskClick={onTaskClick}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Breakdown Modal */}
      <TaskBreakdownModal
        isOpen={showBreakdownModal}
        onClose={() => setShowBreakdownModal(false)}
        onConfirm={onAddTasks}
      />
    </>
  );
};
