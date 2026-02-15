'use client';

import { useState } from 'react';
import { Task } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { TaskBreakdownPanel } from './TaskBreakdownPanel';
import { PMDashboard } from './PMDashboard';
import { AgentRosterManager } from './AgentRosterManager';
import { LayoutDashboard, GitBranch, Users, X } from 'lucide-react';

interface ProjectManagementHubProps {
  tasks: Task[];
  agents: CodingAgent[];
  onUpdateTask: (task: Task) => void;
  onAddAgent: (agent: CodingAgent) => void;
  onUpdateAgent: (agent: CodingAgent) => void;
  onDeleteAgent: (agentId: string) => void;
  onClose: () => void;
}

type Tab = 'dashboard' | 'breakdown' | 'roster';

export const ProjectManagementHub = ({
  tasks,
  agents,
  onUpdateTask,
  onAddAgent,
  onUpdateAgent,
  onDeleteAgent,
  onClose,
}: ProjectManagementHubProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const tabs = [
    { id: 'dashboard' as Tab, label: 'PM Dashboard', icon: LayoutDashboard },
    { id: 'breakdown' as Tab, label: 'Task Breakdown', icon: GitBranch },
    { id: 'roster' as Tab, label: 'Agent Roster', icon: Users },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Project Management Hub
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Automated task breakdown, agent orchestration, and resource management
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'dashboard' && (
          <PMDashboard tasks={tasks} agents={agents} />
        )}
        {activeTab === 'breakdown' && (
          <TaskBreakdownPanel />
        )}
        {activeTab === 'roster' && (
          <AgentRosterManager
            agents={agents}
            onAddAgent={onAddAgent}
            onUpdateAgent={onUpdateAgent}
            onDeleteAgent={onDeleteAgent}
          />
        )}
      </div>
    </div>
  );
};
