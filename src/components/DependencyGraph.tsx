'use client';

import { Task, TaskDependency } from '@/types/task';
import { useMemo, useState } from 'react';
import { X, GitBranch, AlertCircle } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onClose: () => void;
}

interface GraphNode {
  task: Task;
  x: number;
  y: number;
  level: number;
  dependencies: string[]; // IDs of tasks this depends on
  dependents: string[]; // IDs of tasks that depend on this
}

export const DependencyGraph = ({ tasks, dependencies, onClose }: DependencyGraphProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');

  // Build dependency graph
  const graph = useMemo(() => {
    const nodes = new Map<string, GraphNode>();

    // Initialize nodes
    tasks.forEach(task => {
      nodes.set(task.id, {
        task,
        x: 0,
        y: 0,
        level: 0,
        dependencies: [],
        dependents: [],
      });
    });

    // Build relationships
    dependencies.forEach(dep => {
      const node = nodes.get(dep.taskId);
      const depNode = nodes.get(dep.dependsOnTaskId);

      if (node && depNode) {
        node.dependencies.push(dep.dependsOnTaskId);
        depNode.dependents.push(dep.taskId);
      }
    });

    // Calculate levels (topological sort)
    const visited = new Set<string>();
    const calculateLevel = (taskId: string): number => {
      if (visited.has(taskId)) return nodes.get(taskId)?.level || 0;
      visited.add(taskId);

      const node = nodes.get(taskId);
      if (!node) return 0;

      let maxLevel = 0;
      for (const depId of node.dependencies) {
        const depLevel = calculateLevel(depId);
        maxLevel = Math.max(maxLevel, depLevel + 1);
      }

      node.level = maxLevel;
      return maxLevel;
    };

    tasks.forEach(task => calculateLevel(task.id));

    // Position nodes
    const levelGroups = new Map<number, GraphNode[]>();
    nodes.forEach(node => {
      if (!levelGroups.has(node.level)) {
        levelGroups.set(node.level, []);
      }
      levelGroups.get(node.level)!.push(node);
    });

    const nodeWidth = 200;
    const nodeHeight = 80;
    const horizontalSpacing = 280;
    const verticalSpacing = 120;

    levelGroups.forEach((nodesInLevel, level) => {
      nodesInLevel.forEach((node, index) => {
        node.x = level * horizontalSpacing + 50;
        node.y = index * verticalSpacing + 50;
      });
    });

    return { nodes, levelGroups };
  }, [tasks, dependencies]);

  // Detect circular dependencies
  const circularDeps = useMemo(() => {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const detectCycle = (taskId: string, path: string[]): boolean => {
      if (recStack.has(taskId)) {
        const cycleStart = path.indexOf(taskId);
        cycles.push(path.slice(cycleStart));
        return true;
      }

      if (visited.has(taskId)) return false;

      visited.add(taskId);
      recStack.add(taskId);
      path.push(taskId);

      const node = graph.nodes.get(taskId);
      if (node) {
        for (const depId of node.dependencies) {
          if (detectCycle(depId, [...path])) {
            // Cycle detected
          }
        }
      }

      recStack.delete(taskId);
      return false;
    };

    tasks.forEach(task => {
      if (!visited.has(task.id)) {
        detectCycle(task.id, []);
      }
    });

    return cycles;
  }, [tasks, graph.nodes]);

  // Calculate critical path (longest path)
  const criticalPath = useMemo(() => {
    const paths: string[][] = [];

    const findPaths = (taskId: string, currentPath: string[]) => {
      const node = graph.nodes.get(taskId);
      if (!node) return;

      currentPath.push(taskId);

      if (node.dependents.length === 0) {
        paths.push([...currentPath]);
      } else {
        node.dependents.forEach(depId => findPaths(depId, [...currentPath]));
      }
    };

    // Start from root nodes (nodes with no dependencies)
    graph.nodes.forEach((node, taskId) => {
      if (node.dependencies.length === 0) {
        findPaths(taskId, []);
      }
    });

    // Find longest path by estimated hours
    let longestPath: string[] = [];
    let maxHours = 0;

    paths.forEach(path => {
      const totalHours = path.reduce((sum, taskId) => {
        const task = graph.nodes.get(taskId)?.task;
        return sum + (task?.estimatedHours || 0);
      }, 0);

      if (totalHours > maxHours) {
        maxHours = totalHours;
        longestPath = path;
      }
    });

    return longestPath;
  }, [graph.nodes]);

  const getTaskTitle = (taskId: string) => {
    return graph.nodes.get(taskId)?.task.taskId || taskId.slice(0, 8);
  };

  if (viewMode === 'list') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <GitBranch className="text-purple-500" size={24} />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Task Dependencies</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('graph')}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Graph View
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Warnings */}
          {circularDeps.length > 0 && (
            <div className="m-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-red-600 dark:text-red-400">
                <strong>Circular dependencies detected!</strong>
                <div className="mt-1 space-y-1">
                  {circularDeps.map((cycle, i) => (
                    <div key={i}>
                      {cycle.map(getTaskTitle).join(' → ')} → {getTaskTitle(cycle[0])}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* List View */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {tasks.map(task => {
                const node = graph.nodes.get(task.id);
                if (!node) return null;

                return (
                  <div
                    key={task.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{task.taskId}</span>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        criticalPath.includes(task.id)
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {criticalPath.includes(task.id) ? 'Critical Path' : `Level ${node.level}`}
                      </span>
                    </div>

                    {node.dependencies.length > 0 && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Depends on: </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {node.dependencies.map(getTaskTitle).join(', ')}
                        </span>
                      </div>
                    )}

                    {node.dependents.length > 0 && (
                      <div className="mt-1 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Blocks: </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {node.dependents.map(getTaskTitle).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Graph view with SVG
  const svgWidth = Math.max(...Array.from(graph.nodes.values()).map(n => n.x)) + 300;
  const svgHeight = Math.max(...Array.from(graph.nodes.values()).map(n => n.y)) + 150;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <GitBranch className="text-purple-500" size={24} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Task Dependencies</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              List View
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Warnings */}
        {circularDeps.length > 0 && (
          <div className="m-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
            <div className="text-sm text-red-600 dark:text-red-400">
              <strong>Circular dependencies detected!</strong> This will cause deadlocks.
            </div>
          </div>
        )}

        {/* Graph */}
        <div className="flex-1 overflow-auto p-6">
          <svg width={svgWidth} height={svgHeight} className="border border-gray-200 dark:border-gray-700 rounded-lg">
            {/* Draw edges */}
            {dependencies.map((dep, i) => {
              const from = graph.nodes.get(dep.dependsOnTaskId);
              const to = graph.nodes.get(dep.taskId);
              if (!from || !to) return null;

              const isCritical =
                criticalPath.includes(dep.dependsOnTaskId) && criticalPath.includes(dep.taskId);

              return (
                <g key={i}>
                  <defs>
                    <marker
                      id={`arrowhead-${i}`}
                      markerWidth="10"
                      markerHeight="10"
                      refX="9"
                      refY="3"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path
                        d="M0,0 L0,6 L9,3 z"
                        fill={isCritical ? '#ef4444' : '#9ca3af'}
                      />
                    </marker>
                  </defs>
                  <line
                    x1={from.x + 200}
                    y1={from.y + 40}
                    x2={to.x}
                    y2={to.y + 40}
                    stroke={isCritical ? '#ef4444' : '#9ca3af'}
                    strokeWidth={isCritical ? 3 : 2}
                    markerEnd={`url(#arrowhead-${i})`}
                  />
                </g>
              );
            })}

            {/* Draw nodes */}
            {Array.from(graph.nodes.values()).map(node => {
              const isCritical = criticalPath.includes(node.task.id);
              const isSelected = selectedTask?.id === node.task.id;

              return (
                <g
                  key={node.task.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => setSelectedTask(node.task)}
                  className="cursor-pointer"
                >
                  <rect
                    width="200"
                    height="80"
                    rx="8"
                    fill={isSelected ? '#ddd6fe' : isCritical ? '#fef2f2' : '#ffffff'}
                    stroke={isSelected ? '#8b5cf6' : isCritical ? '#ef4444' : '#e5e7eb'}
                    strokeWidth={isSelected ? 3 : isCritical ? 2 : 1}
                  />
                  <text
                    x="100"
                    y="25"
                    textAnchor="middle"
                    fontSize="10"
                    fill="#6b7280"
                    fontFamily="monospace"
                  >
                    {node.task.taskId}
                  </text>
                  <text
                    x="100"
                    y="45"
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill="#111827"
                  >
                    {node.task.title.length > 25
                      ? node.task.title.slice(0, 22) + '...'
                      : node.task.title}
                  </text>
                  <text
                    x="100"
                    y="65"
                    textAnchor="middle"
                    fontSize="10"
                    fill="#9ca3af"
                  >
                    {node.task.estimatedHours ? `${node.task.estimatedHours}h` : ''}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected task details */}
        {selectedTask && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{selectedTask.taskId}</span>
                <h3 className="font-semibold text-gray-900 dark:text-white">{selectedTask.title}</h3>
                {selectedTask.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedTask.description}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
