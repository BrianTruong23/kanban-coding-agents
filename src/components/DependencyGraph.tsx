'use client';

import { useMemo } from 'react';
import { Task } from '@/types/task';
import { DependencyGraphService } from '@/lib/dependencyGraph';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export const DependencyGraph = ({ tasks, onTaskClick }: DependencyGraphProps) => {
  const vizData = useMemo(() => {
    return DependencyGraphService.getVisualizationData(tasks);
  }, [tasks]);

  const criticalPath = useMemo(() => {
    return DependencyGraphService.findCriticalPath(tasks);
  }, [tasks]);

  const readyTasks = useMemo(() => {
    return DependencyGraphService.getReadyTasks(tasks);
  }, [tasks]);

  const circularDeps = useMemo(() => {
    return DependencyGraphService.detectCircularDependencies(tasks);
  }, [tasks]);

  if (vizData.nodes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
        <p>No task dependencies yet</p>
        <p className="text-xs mt-1">Dependencies will appear here once you create related tasks</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700';
      case 'in-progress':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700';
      case 'review':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600';
    }
  };

  // Group nodes by level for visual hierarchy
  const nodesByLevel = vizData.nodes.reduce((acc, node) => {
    if (!acc[node.level]) {
      acc[node.level] = [];
    }
    acc[node.level].push(node);
    return acc;
  }, {} as Record<number, typeof vizData.nodes>);

  const levels = Object.keys(nodesByLevel).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="space-y-6">
      {/* Warnings */}
      {circularDeps.length > 0 && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertTriangle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-600 dark:text-red-400">
            <p className="font-semibold">Circular Dependencies Detected!</p>
            <p className="text-xs mt-1">{circularDeps.length} circular dependency chain(s) found. Please review and fix.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <Clock size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">Ready to Start</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-300 mt-1">{readyTasks.length}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
            {readyTasks.length === 0 ? 'All tasks blocked or started' : 'Tasks with no blockers'}
          </p>
        </div>

        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
            <ArrowRight size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">Critical Path</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-300 mt-1">{criticalPath.totalHours}h</p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
            {criticalPath.tasks.length} tasks in longest path
          </p>
        </div>

        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle2 size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">Dependencies</span>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-300 mt-1">{vizData.edges.length}</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
            Total dependency links
          </p>
        </div>
      </div>

      {/* Dependency Graph Visualization */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Dependency Hierarchy</h4>

        <div className="space-y-4">
          {levels.map((levelKey) => {
            const level = Number(levelKey);
            const nodesInLevel = nodesByLevel[level];

            return (
              <div key={level} className="relative">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                  Level {level} {level === 0 && '(Foundation)'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {nodesInLevel.map((node) => {
                    const task = tasks.find(t => t.id === node.id);
                    if (!task) return null;

                    const blocking = DependencyGraphService.getBlockingTasks(task, tasks);
                    const blocked = DependencyGraphService.getBlockedTasks(task, tasks);

                    return (
                      <button
                        key={node.id}
                        onClick={() => onTaskClick?.(task)}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all hover:shadow-md ${getStatusColor(node.status)}`}
                        title={`${task.title}\nBlocking: ${blocking.length} tasks\nBlocked by: ${blocked.length} tasks`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{node.label}</span>
                          {blocking.length > 0 && (
                            <span className="text-xs opacity-60">→ {blocking.length}</span>
                          )}
                          {blocked.length > 0 && (
                            <span className="text-xs opacity-60">← {blocked.length}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
            Legend
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"></div>
              <span className="text-gray-600 dark:text-gray-400">Backlog</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"></div>
              <span className="text-gray-600 dark:text-gray-400">In Progress</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700"></div>
              <span className="text-gray-600 dark:text-gray-400">Review</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700"></div>
              <span className="text-gray-600 dark:text-gray-400">Done</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <p>→ Number indicates tasks this one blocks</p>
            <p>← Number indicates tasks blocking this one</p>
          </div>
        </div>
      </div>

      {/* Critical Path Details */}
      {criticalPath.tasks.length > 0 && (
        <div className="border border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
          <h4 className="text-sm font-bold text-purple-700 dark:text-purple-400 mb-3">
            Critical Path ({criticalPath.totalHours}h total)
          </h4>
          <div className="flex flex-wrap gap-2">
            {criticalPath.tasks.map((task, idx) => (
              <div key={task.id} className="flex items-center gap-1">
                <button
                  onClick={() => onTaskClick?.(task)}
                  className="px-2 py-1 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded text-xs font-medium text-purple-700 dark:text-purple-400 hover:shadow-sm transition-all"
                >
                  {task.taskId}
                </button>
                {idx < criticalPath.tasks.length - 1 && (
                  <ArrowRight size={12} className="text-purple-400 dark:text-purple-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ready Tasks */}
      {readyTasks.length > 0 && (
        <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
          <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-3">
            Ready to Start ({readyTasks.length} tasks)
          </h4>
          <div className="flex flex-wrap gap-2">
            {readyTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => onTaskClick?.(task)}
                className="px-2 py-1 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded text-xs font-medium text-blue-700 dark:text-blue-400 hover:shadow-sm transition-all"
              >
                {task.taskId}: {task.title.slice(0, 30)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
