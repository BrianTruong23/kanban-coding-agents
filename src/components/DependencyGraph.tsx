'use client';

import { Task } from '@/types/task';
import { useMemo } from 'react';
import { GitBranch, AlertTriangle, Clock } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

interface TaskNode {
  task: Task;
  dependencies: Task[];
  dependents: Task[];
  level: number; // Depth level in the dependency tree
}

/**
 * Dependency Graph Component - Visualizes task dependencies
 */
export const DependencyGraph = ({ tasks, onTaskClick }: DependencyGraphProps) => {
  const taskNodes = useMemo(() => {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const nodes: TaskNode[] = [];

    // Build dependency graph
    for (const task of tasks) {
      const dependencies = (task.dependencies || [])
        .map(depId => taskMap.get(depId))
        .filter((t): t is Task => t !== undefined);

      const dependents = tasks.filter(t =>
        (t.dependencies || []).includes(task.id)
      );

      nodes.push({
        task,
        dependencies,
        dependents,
        level: 0, // Will be calculated
      });
    }

    // Calculate levels (topological sort)
    const calculateLevels = () => {
      const visited = new Set<string>();
      const levels = new Map<string, number>();

      const visit = (taskId: string): number => {
        if (visited.has(taskId)) {
          return levels.get(taskId) || 0;
        }

        visited.add(taskId);
        const node = nodes.find(n => n.task.id === taskId);
        if (!node) return 0;

        if (node.dependencies.length === 0) {
          levels.set(taskId, 0);
          return 0;
        }

        const maxDepLevel = Math.max(
          ...node.dependencies.map(dep => visit(dep.id))
        );
        const level = maxDepLevel + 1;
        levels.set(taskId, level);
        return level;
      };

      nodes.forEach(node => visit(node.task.id));
      nodes.forEach(node => {
        node.level = levels.get(node.task.id) || 0;
      });
    };

    calculateLevels();

    // Sort by level
    return nodes.sort((a, b) => a.level - b.level);
  }, [tasks]);

  // Group by level
  const levelGroups = useMemo(() => {
    const groups = new Map<number, TaskNode[]>();
    taskNodes.forEach(node => {
      const level = node.level;
      if (!groups.has(level)) {
        groups.set(level, []);
      }
      groups.get(level)!.push(node);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a - b);
  }, [taskNodes]);

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600';
      case 'high': return 'bg-orange-100 dark:bg-orange-900/30 border-orange-400 dark:border-orange-600';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600';
      case 'low': return 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600';
      default: return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-500';
      case 'review': return 'bg-blue-500';
      case 'in-progress': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <GitBranch className="mx-auto mb-2" size={32} />
        <p>No tasks to visualize</p>
      </div>
    );
  }

  const tasksWithDependencies = taskNodes.filter(
    n => n.dependencies.length > 0 || n.dependents.length > 0
  );

  if (tasksWithDependencies.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <GitBranch className="mx-auto mb-2" size={32} />
        <p>No task dependencies found</p>
        <p className="text-sm mt-1">Add dependencies to visualize relationships</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Done</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Review</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400" />
          <span>Backlog</span>
        </div>
      </div>

      {/* Dependency Graph */}
      <div className="space-y-8">
        {levelGroups.map(([level, nodes]) => (
          <div key={level} className="space-y-2">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Level {level} {level === 0 && '(No Dependencies)'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {nodes.map(node => (
                <div
                  key={node.task.id}
                  onClick={() => onTaskClick?.(node.task)}
                  className={`p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${getRiskColor(
                    node.task.riskLevel
                  )}`}
                >
                  {/* Task Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                          {node.task.taskId}
                        </span>
                        <div
                          className={`w-2 h-2 rounded-full ${getStatusColor(node.task.status)}`}
                          title={node.task.status}
                        />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mt-1 line-clamp-2">
                        {node.task.title}
                      </h4>
                    </div>
                  </div>

                  {/* Task Info */}
                  <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {node.task.priority && (
                      <span className="flex items-center gap-1">
                        P{node.task.priority}
                      </span>
                    )}
                    {node.task.estimatedHours && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {node.task.estimatedHours}h
                      </span>
                    )}
                    {node.task.riskLevel && node.task.riskLevel !== 'low' && (
                      <span className="flex items-center gap-1">
                        <AlertTriangle size={12} />
                        {node.task.riskLevel}
                      </span>
                    )}
                  </div>

                  {/* Dependencies Info */}
                  {(node.dependencies.length > 0 || node.dependents.length > 0) && (
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2 space-y-1">
                      {node.dependencies.length > 0 && (
                        <div className="text-xs">
                          <span className="text-gray-500 dark:text-gray-400">Blocked by:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {node.dependencies.map(dep => (
                              <span
                                key={dep.id}
                                className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono"
                              >
                                {dep.taskId}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {node.dependents.length > 0 && (
                        <div className="text-xs">
                          <span className="text-gray-500 dark:text-gray-400">Blocks:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {node.dependents.map(dep => (
                              <span
                                key={dep.id}
                                className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono"
                              >
                                {dep.taskId}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Task Type Badge */}
                  {node.task.taskType && (
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded ${
                        node.task.taskType === 'epic'
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : node.task.taskType === 'ticket'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {node.task.taskType}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
