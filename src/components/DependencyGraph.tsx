'use client';

import { Task, TaskDependency } from '@/types/task';
import { useState, useMemo, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onTaskClick?: (taskId: string) => void;
}

interface GraphNode {
  task: Task;
  x: number;
  y: number;
  dependencies: string[];
  blockedBy: string[];
}

export const DependencyGraph = ({ tasks, dependencies, onTaskClick }: DependencyGraphProps) => {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Build graph layout using useMemo for derived state
  const nodes = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();
    const levels = new Map<string, number>();

    // Calculate levels for each node (topological sort)
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();

    tasks.forEach(task => {
      inDegree.set(task.id, 0);
      adjList.set(task.id, []);
    });

    dependencies.forEach(dep => {
      inDegree.set(dep.taskId, (inDegree.get(dep.taskId) || 0) + 1);
      const neighbors = adjList.get(dep.dependsOnTaskId) || [];
      neighbors.push(dep.taskId);
      adjList.set(dep.dependsOnTaskId, neighbors);
    });

    // BFS to assign levels
    const queue: string[] = [];
    tasks.forEach(task => {
      if (inDegree.get(task.id) === 0) {
        queue.push(task.id);
        levels.set(task.id, 0);
      }
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentLevel = levels.get(current) || 0;

      const neighbors = adjList.get(current) || [];
      neighbors.forEach(neighbor => {
        const degree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, degree);

        if (degree === 0) {
          queue.push(neighbor);
          levels.set(neighbor, currentLevel + 1);
        }
      });
    }

    // Assign positions
    const levelGroups = new Map<number, string[]>();
    tasks.forEach(task => {
      const level = levels.get(task.id) || 0;
      const group = levelGroups.get(level) || [];
      group.push(task.id);
      levelGroups.set(level, group);
    });

    const horizontalSpacing = 200;
    const verticalSpacing = 100;

    tasks.forEach(task => {
      const level = levels.get(task.id) || 0;
      const group = levelGroups.get(level) || [];
      const indexInLevel = group.indexOf(task.id);

      const taskDeps = dependencies
        .filter(d => d.taskId === task.id)
        .map(d => d.dependsOnTaskId);

      const blockedBy = dependencies
        .filter(d => d.dependsOnTaskId === task.id)
        .map(d => d.taskId);

      nodeMap.set(task.id, {
        task,
        x: level * horizontalSpacing,
        y: indexInLevel * verticalSpacing,
        dependencies: taskDeps,
        blockedBy
      });
    });

    return nodeMap;
  }, [tasks, dependencies]);

  const getTaskStatus = (task: Task) => {
    switch (task.status) {
      case 'done':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'review':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const hasBlockingIssues = (taskId: string) => {
    const node = nodes.get(taskId);
    if (!node) return false;

    // Check if any dependencies are not done
    return node.dependencies.some(depId => {
      const depTask = tasks.find(t => t.id === depId);
      return depTask && depTask.status !== 'done';
    });
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 dark:text-gray-500">
        No tasks to visualize
      </div>
    );
  }

  if (dependencies.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 dark:text-gray-500">
        No dependencies defined yet
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Task Dependencies
        </h3>

        {/* Legend */}
        <div className="flex gap-4 mb-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            Done
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            In Progress
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            Review
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            Backlog
          </div>
        </div>

        {/* Graph Canvas */}
        <div ref={canvasRef} className="relative min-h-[400px]">
          {/* Draw edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {Array.from(nodes.values()).map(node =>
              node.dependencies.map(depId => {
                const depNode = nodes.get(depId);
                if (!depNode) return null;

                const isBlocking = depNode.task.status !== 'done';

                return (
                  <g key={`${node.task.id}-${depId}`}>
                    <line
                      x1={depNode.x + 80}
                      y1={depNode.y + 20}
                      x2={node.x}
                      y2={node.y + 20}
                      stroke={isBlocking ? '#ef4444' : '#9ca3af'}
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                  </g>
                );
              })
            )}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#9ca3af" />
              </marker>
            </defs>
          </svg>

          {/* Draw nodes */}
          {Array.from(nodes.values()).map(node => {
            const isBlocked = hasBlockingIssues(node.task.id);
            const isSelected = selectedTask === node.task.id;

            return (
              <div
                key={node.task.id}
                className={`absolute cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-blue-500 scale-105' : ''
                }`}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  transform: 'translate(0, 0)'
                }}
                onClick={() => {
                  setSelectedTask(node.task.id);
                  onTaskClick?.(node.task.id);
                }}
              >
                <div
                  className={`w-40 p-3 rounded-lg border-2 ${
                    isBlocked
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
                  } shadow-sm hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3 h-3 rounded-full ${getTaskStatus(node.task)}`} />
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                      {node.task.taskId}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-2">
                    {node.task.title}
                  </div>
                  {isBlocked && (
                    <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                      <AlertTriangle size={12} />
                      Blocked
                    </div>
                  )}
                  {node.task.assignedAgentId && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Assigned
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Task Details */}
        {selectedTask && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            {(() => {
              const node = nodes.get(selectedTask);
              if (!node) return null;

              return (
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                    {node.task.taskId}: {node.task.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {node.task.description}
                  </p>

                  {node.dependencies.length > 0 && (
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Depends on:
                      </span>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                        {node.dependencies.map(depId => {
                          const depTask = tasks.find(t => t.id === depId);
                          return depTask ? (
                            <li key={depId}>
                              {depTask.taskId} - {depTask.title} ({depTask.status})
                            </li>
                          ) : null;
                        })}
                      </ul>
                    </div>
                  )}

                  {node.blockedBy.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Blocks:
                      </span>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                        {node.blockedBy.map(blockedId => {
                          const blockedTask = tasks.find(t => t.id === blockedId);
                          return blockedTask ? (
                            <li key={blockedId}>
                              {blockedTask.taskId} - {blockedTask.title}
                            </li>
                          ) : null;
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
