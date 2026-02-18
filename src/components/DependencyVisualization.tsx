'use client';

import { Task, TaskDependency } from '@/types/task';
import { X, GitBranch, AlertCircle, ArrowRight } from 'lucide-react';

interface DependencyVisualizationProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  dependencies: TaskDependency[];
}

export const DependencyVisualization = ({ isOpen, onClose, tasks, dependencies }: DependencyVisualizationProps) => {
  if (!isOpen) return null;

  // Create a map of task ID to task
  const taskMap = new Map(tasks.map(t => [t.id, t]));

  // Group dependencies by task
  const dependencyGraph = new Map<string, { task: Task; dependencies: Array<{ task: Task; type: string }> }>();

  for (const task of tasks) {
    const taskDeps = dependencies
      .filter(d => d.taskId === task.id)
      .map(d => ({
        task: taskMap.get(d.dependsOnTaskId)!,
        type: d.dependencyType,
      }))
      .filter(d => d.task);

    if (taskDeps.length > 0 || dependencies.some(d => d.dependsOnTaskId === task.id)) {
      dependencyGraph.set(task.id, {
        task,
        dependencies: taskDeps,
      });
    }
  }

  // Detect circular dependencies
  const circularDeps = detectCircularDependencies(tasks, dependencies);

  // Build dependency chains
  const chains = buildDependencyChains(tasks, dependencies);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <GitBranch size={24} />
              Task Dependencies
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {dependencies.length} dependency(ies) across {dependencyGraph.size} task(s)
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Circular Dependencies Warning */}
          {circularDeps.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex gap-3">
                <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Circular Dependencies Detected</h4>
                  <div className="text-sm text-red-700 dark:text-red-300 space-y-1">
                    {circularDeps.map((cycle, idx) => (
                      <div key={idx}>
                        {cycle.map(taskId => taskMap.get(taskId)?.taskId).join(' → ')} → {taskMap.get(cycle[0])?.taskId}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dependency Chains */}
          {chains.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Critical Paths</h4>
              <div className="space-y-3">
                {chains.map((chain, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Chain {idx + 1} ({chain.length} task{chain.length > 1 ? 's' : ''})
                      </span>
                      {chain.reduce((sum, taskId) => sum + (taskMap.get(taskId)?.estimatedHours || 0), 0) > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          • Est. {chain.reduce((sum, taskId) => sum + (taskMap.get(taskId)?.estimatedHours || 0), 0)}h total
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {chain.map((taskId, tidx) => (
                        <div key={taskId} className="flex items-center gap-2">
                          <TaskChip task={taskMap.get(taskId)!} />
                          {tidx < chain.length - 1 && (
                            <ArrowRight size={16} className="text-gray-400 dark:text-gray-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dependency Graph */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">All Dependencies</h4>
            {dependencyGraph.size > 0 ? (
              <div className="space-y-4">
                {Array.from(dependencyGraph.values()).map(({ task, dependencies: deps }) => (
                  <div key={task.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <TaskChip task={task} showDescription />
                      </div>
                      {deps.length > 0 && (
                        <div className="flex-shrink-0">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Depends on:</div>
                          <div className="space-y-2">
                            {deps.map(({ task: depTask, type }) => (
                              <div key={depTask.id} className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDependencyTypeStyles(type)}`}>
                                  {type}
                                </span>
                                <TaskChip task={depTask} compact />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                <GitBranch size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No task dependencies defined</p>
                <p className="text-xs mt-1">Create dependencies when breaking down tasks</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function TaskChip({ task, compact = false, showDescription = false }: { task: Task; compact?: boolean; showDescription?: boolean }) {
  const typeColors = {
    epic: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    story: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    subtask: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{task.taskId}</span>
        <span className="text-sm text-gray-900 dark:text-white truncate max-w-[200px]">{task.title}</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{task.taskId}</span>
          {task.taskType && (
            <span className={`px-2 py-0.5 text-xs font-medium rounded uppercase ${typeColors[task.taskType]}`}>
              {task.taskType}
            </span>
          )}
          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusStyles(task.status)}`}>
            {task.status}
          </span>
        </div>
        <div className="font-medium text-gray-900 dark:text-white">{task.title}</div>
        {showDescription && task.description && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</div>
        )}
        {task.estimatedHours && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Est. {task.estimatedHours}h</div>
        )}
      </div>
    </div>
  );
}

function getStatusStyles(status: string) {
  switch (status) {
    case 'backlog':
      return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    case 'in-progress':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    case 'review':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    case 'done':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
  }
}

function getDependencyTypeStyles(type: string) {
  switch (type) {
    case 'blocks':
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    case 'blocked_by':
      return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
    case 'relates_to':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
  }
}

function detectCircularDependencies(tasks: Task[], dependencies: TaskDependency[]): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const adjacencyList = new Map<string, string[]>();
  for (const dep of dependencies) {
    if (!adjacencyList.has(dep.taskId)) {
      adjacencyList.set(dep.taskId, []);
    }
    adjacencyList.get(dep.taskId)!.push(dep.dependsOnTaskId);
  }

  function dfs(taskId: string, path: string[]): boolean {
    visited.add(taskId);
    recursionStack.add(taskId);
    path.push(taskId);

    const neighbors = adjacencyList.get(taskId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor, [...path])) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        const cycleStart = path.indexOf(neighbor);
        cycles.push(path.slice(cycleStart));
        return true;
      }
    }

    recursionStack.delete(taskId);
    return false;
  }

  for (const task of tasks) {
    if (!visited.has(task.id)) {
      dfs(task.id, []);
    }
  }

  return cycles;
}

function buildDependencyChains(tasks: Task[], dependencies: TaskDependency[]): string[][] {
  const chains: string[][] = [];
  const adjacencyList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Build adjacency list and in-degree map
  for (const task of tasks) {
    adjacencyList.set(task.id, []);
    inDegree.set(task.id, 0);
  }

  for (const dep of dependencies) {
    adjacencyList.get(dep.dependsOnTaskId)?.push(dep.taskId);
    inDegree.set(dep.taskId, (inDegree.get(dep.taskId) || 0) + 1);
  }

  // Find all root tasks (tasks with no dependencies)
  const roots = tasks.filter(t => (inDegree.get(t.id) || 0) === 0 && (adjacencyList.get(t.id)?.length || 0) > 0);

  // DFS from each root to find all paths
  function findAllPaths(taskId: string, path: string[], visited: Set<string>) {
    path.push(taskId);
    visited.add(taskId);

    const neighbors = adjacencyList.get(taskId) || [];
    if (neighbors.length === 0) {
      if (path.length > 1) {
        chains.push([...path]);
      }
    } else {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          findAllPaths(neighbor, path, new Set(visited));
        }
      }
    }

    path.pop();
  }

  for (const root of roots) {
    findAllPaths(root.id, [], new Set());
  }

  // Sort chains by length (longest first)
  chains.sort((a, b) => b.length - a.length);

  // Return top 5 longest chains
  return chains.slice(0, 5);
}
