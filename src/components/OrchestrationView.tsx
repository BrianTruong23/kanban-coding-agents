'use client';

import { useState } from 'react';
import { Task, TaskDependency } from '@/types/task';
import { CodingAgent } from '@/types/agent';
import { Sparkles, Users, GitBranch, BarChart3 } from 'lucide-react';
import { TaskBreakdownModal } from './TaskBreakdownModal';
import { AgentRoster } from './AgentRoster';
import { DependencyGraph } from './DependencyGraph';
import { recommendAgentForTask, autoAssignTasks } from '@/lib/autoAssignment';
import { BreakdownResult } from '@/lib/taskBreakdown';

interface OrchestrationViewProps {
  tasks: Task[];
  agents: CodingAgent[];
  dependencies: TaskDependency[];
  onTasksCreated: (tasks: Task[]) => void;
  onTaskUpdated: (task: Task) => void;
}

type ViewMode = 'breakdown' | 'roster' | 'dependencies' | 'insights';

export const OrchestrationView = ({
  tasks,
  agents,
  dependencies,
  onTasksCreated,
  onTaskUpdated
}: OrchestrationViewProps) => {
  const [activeView, setActiveView] = useState<ViewMode | null>(null);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);

  const handleBreakdownComplete = (result: BreakdownResult) => {
    // Convert breakdown result to tasks and create them
    const newTasks: Task[] = result.tasks.map(task => ({
      ...task,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }));

    onTasksCreated(newTasks);
  };

  const handleAutoAssign = () => {
    const unassignedTasks = tasks.filter(t => !t.assignedAgentId && t.status !== 'done');
    const assignments = autoAssignTasks(unassignedTasks, agents, tasks);

    assignments.forEach((agentId, taskId) => {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        onTaskUpdated({ ...task, assignedAgentId: agentId });
      }
    });

    alert(`Auto-assigned ${assignments.size} tasks to agents based on skills and workload`);
  };

  const getRecommendationForTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.assignedAgentId) return null;
    return recommendAgentForTask(task, agents, tasks);
  };

  const unassignedCount = tasks.filter(t => !t.assignedAgentId && t.status !== 'done').length;

  return (
    <>
      {/* Orchestration Toolbar */}
      <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Task Orchestration
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBreakdownModal(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
            >
              <Sparkles size={16} />
              AI Breakdown
            </button>

            {unassignedCount > 0 && (
              <button
                onClick={handleAutoAssign}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700 transition-colors"
              >
                Auto-Assign ({unassignedCount})
              </button>
            )}
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mt-4">
          {[
            { id: 'roster' as ViewMode, label: 'Agent Roster', icon: Users },
            { id: 'dependencies' as ViewMode, label: 'Dependencies', icon: GitBranch },
            { id: 'insights' as ViewMode, label: 'Insights', icon: BarChart3 }
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(activeView === view.id ? null : view.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                activeView === view.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <view.icon size={16} />
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active View */}
      {activeView && (
        <div className="mb-4">
          {activeView === 'roster' && (
            <AgentRoster agents={agents} tasks={tasks} />
          )}

          {activeView === 'dependencies' && (
            <DependencyGraph
              tasks={tasks}
              dependencies={dependencies}
              onTaskClick={taskId => {
                const recommendation = getRecommendationForTask(taskId);
                if (recommendation) {
                  console.log('Recommendation for task:', recommendation);
                }
              }}
            />
          )}

          {activeView === 'insights' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Project Insights
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Tasks */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Total Tasks</div>
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {tasks.length}
                  </div>
                </div>

                {/* Completed */}
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="text-sm text-green-600 dark:text-green-400 mb-1">Completed</div>
                  <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                    {tasks.filter(t => t.status === 'done').length}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {tasks.length > 0
                      ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)
                      : 0}% complete
                  </div>
                </div>

                {/* High Priority */}
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="text-sm text-red-600 dark:text-red-400 mb-1">High Priority</div>
                  <div className="text-3xl font-bold text-red-900 dark:text-red-100">
                    {tasks.filter(t => t.priority >= 4 && t.status !== 'done').length}
                  </div>
                </div>

                {/* High Risk */}
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="text-sm text-orange-600 dark:text-orange-400 mb-1">High Risk</div>
                  <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                    {tasks.filter(t => (t.riskLevel === 'high' || t.riskLevel === 'critical') && t.status !== 'done').length}
                  </div>
                </div>
              </div>

              {/* Agent Workload Summary */}
              <div className="mt-6">
                <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3">
                  Agent Workload
                </h4>
                <div className="space-y-2">
                  {agents.map(agent => {
                    const agentTasks = tasks.filter(
                      t => t.assignedAgentId === agent.id && t.status !== 'done'
                    );
                    const totalWorkload = agentTasks.reduce(
                      (sum, task) => sum + (task.priority || 3),
                      0
                    );

                    return (
                      <div key={agent.id} className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full ${
                            agent.avatarColor || 'bg-gray-400'
                          } flex items-center justify-center text-white text-xs font-bold`}
                        >
                          {agent.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {agent.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {agentTasks.length} tasks • {totalWorkload} workload
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                totalWorkload > 15
                                  ? 'bg-red-500'
                                  : totalWorkload > 10
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(100, (totalWorkload / 20) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Risk Distribution */}
              <div className="mt-6">
                <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3">
                  Risk Distribution
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {['low', 'medium', 'high', 'critical'].map(level => {
                    const count = tasks.filter(t => t.riskLevel === level).length;
                    return (
                      <div
                        key={level}
                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-center"
                      >
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 capitalize">
                          {level}
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task Breakdown Modal */}
      <TaskBreakdownModal
        isOpen={showBreakdownModal}
        onClose={() => setShowBreakdownModal(false)}
        onBreakdownComplete={handleBreakdownComplete}
      />
    </>
  );
};
