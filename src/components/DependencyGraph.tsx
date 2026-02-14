'use client';

import { Task } from '@/types/task';
import { TaskDependency } from '@/types/breakdown';
import { ArrowRight, AlertCircle, Link2 } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onTaskClick?: (taskId: string) => void;
}

export const DependencyGraph = ({ tasks, dependencies, onTaskClick }: DependencyGraphProps) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 dark:text-gray-500">
        <Link2 size={48} className="mx-auto mb-2 opacity-20" />
        <p>No tasks to visualize</p>
      </div>
    );
  }

  // Build dependency map
  const dependencyMap = new Map<string, { blocking: string[]; blockedBy: string[] }>();

  tasks.forEach(task => {
    if (!dependencyMap.has(task.id)) {
      dependencyMap.set(task.id, { blocking: [], blockedBy: [] });
    }
  });

  dependencies.forEach(dep => {
    const source = dependencyMap.get(dep.sourceTaskId);
    const target = dependencyMap.get(dep.targetTaskId);

    if (source) {
      source.blocking.push(dep.targetTaskId);
    }
    if (target) {
      target.blockedBy.push(dep.sourceTaskId);
    }
  });

  // Detect circular dependencies
  const circularDeps = detectCircularDependencies(tasks, dependencies);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Task Dependencies
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Blocks</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Related</span>
          </div>
        </div>
      </div>

      {/* Circular dependency warning */}
      {circularDeps.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900 dark:text-red-200">
              Circular Dependencies Detected
            </p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
              {circularDeps.length} circular dependency chain(s) found. This may cause deadlocks.
            </p>
          </div>
        </div>
      )}

      {/* Dependency list */}
      <div className="space-y-3">
        {tasks.map(task => {
          const deps = dependencyMap.get(task.id);
          if (!deps || (deps.blocking.length === 0 && deps.blockedBy.length === 0)) {
            return null;
          }

          const isCircular = circularDeps.some(cycle => cycle.includes(task.id));

          return (
            <div
              key={task.id}
              className={`border rounded-lg p-3 ${
                isCircular
                  ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              {/* Task header */}
              <div
                className={`font-medium text-sm mb-2 ${
                  onTaskClick ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400' : ''
                } ${isCircular ? 'text-red-900 dark:text-red-200' : 'text-gray-900 dark:text-white'}`}
                onClick={() => onTaskClick?.(task.id)}
              >
                {task.taskId}: {task.title}
              </div>

              {/* Blocked by */}
              {deps.blockedBy.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Blocked by:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {deps.blockedBy.map(depTaskId => {
                      const depTask = tasks.find(t => t.id === depTaskId);
                      if (!depTask) return null;

                      return (
                        <div
                          key={depTaskId}
                          className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded flex items-center gap-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                          onClick={() => onTaskClick?.(depTaskId)}
                        >
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          {depTask.taskId}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Blocking */}
              {deps.blocking.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Blocking:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {deps.blocking.map(depTaskId => {
                      const depTask = tasks.find(t => t.id === depTaskId);
                      if (!depTask) return null;

                      return (
                        <div
                          key={depTaskId}
                          className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded flex items-center gap-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                          onClick={() => onTaskClick?.(depTaskId)}
                        >
                          <ArrowRight size={12} />
                          {depTask.taskId}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
        {dependencies.length} dependency relationship(s) across {tasks.length} task(s)
      </div>
    </div>
  );
};

/**
 * Detect circular dependencies using DFS
 */
function detectCircularDependencies(
  tasks: Task[],
  dependencies: TaskDependency[]
): string[][] {
  const graph = new Map<string, string[]>();
  const cycles: string[][] = [];

  // Build adjacency list
  tasks.forEach(task => {
    graph.set(task.id, []);
  });

  dependencies.forEach(dep => {
    const edges = graph.get(dep.sourceTaskId) || [];
    edges.push(dep.targetTaskId);
    graph.set(dep.sourceTaskId, edges);
  });

  // DFS to find cycles
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const currentPath: string[] = [];

  function dfs(taskId: string): boolean {
    visited.add(taskId);
    recursionStack.add(taskId);
    currentPath.push(taskId);

    const neighbors = graph.get(taskId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        // Cycle detected
        const cycleStart = currentPath.indexOf(neighbor);
        const cycle = currentPath.slice(cycleStart);
        cycles.push([...cycle, neighbor]);
        return true;
      }
    }

    recursionStack.delete(taskId);
    currentPath.pop();
    return false;
  }

  tasks.forEach(task => {
    if (!visited.has(task.id)) {
      dfs(task.id);
    }
  });

  return cycles;
}
