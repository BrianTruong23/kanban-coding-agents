'use client';

import { Task, TaskDependency } from '@/types/task';
import { ArrowRight, AlertTriangle, Link2 } from 'lucide-react';
import { useMemo } from 'react';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onTaskClick?: (taskId: string) => void;
}

interface GraphNode {
  task: Task;
  x: number;
  y: number;
  level: number;
  dependencies: string[];
}

export const DependencyGraph = ({ tasks, dependencies, onTaskClick }: DependencyGraphProps) => {
  // Build dependency graph structure
  const graph = useMemo(() => {
    const nodes: GraphNode[] = [];
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const dependencyMap = new Map<string, string[]>();

    // Build adjacency list
    dependencies.forEach(dep => {
      if (!dependencyMap.has(dep.taskId)) {
        dependencyMap.set(dep.taskId, []);
      }
      dependencyMap.get(dep.taskId)!.push(dep.dependsOnTaskId);
    });

    // Calculate levels (topological sort simplified)
    const levels = new Map<string, number>();
    const visited = new Set<string>();

    const calculateLevel = (taskId: string): number => {
      if (levels.has(taskId)) return levels.get(taskId)!;
      if (visited.has(taskId)) return 0; // Circular dependency

      visited.add(taskId);
      const deps = dependencyMap.get(taskId) || [];
      const maxDepLevel = deps.length > 0
        ? Math.max(...deps.map(depId => calculateLevel(depId)))
        : -1;

      const level = maxDepLevel + 1;
      levels.set(taskId, level);
      return level;
    };

    tasks.forEach(task => {
      calculateLevel(task.id);
    });

    // Position nodes
    const levelGroups = new Map<number, Task[]>();
    tasks.forEach(task => {
      const level = levels.get(task.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(task);
    });

    const levelWidth = 220;
    const nodeHeight = 80;

    Array.from(levelGroups.entries()).forEach(([level, levelTasks]) => {
      levelTasks.forEach((task, index) => {
        nodes.push({
          task,
          x: level * levelWidth,
          y: index * nodeHeight,
          level,
          dependencies: dependencyMap.get(task.id) || []
        });
      });
    });

    return { nodes, taskMap };
  }, [tasks, dependencies]);

  const getNodeById = (id: string) => graph.nodes.find(n => n.task.id === id);

  const hasBlockedTasks = useMemo(() => {
    return dependencies.some(dep => {
      const task = graph.taskMap.get(dep.taskId);
      const blockedBy = graph.taskMap.get(dep.dependsOnTaskId);
      return task && blockedBy && blockedBy.status !== 'done' && task.status === 'in-progress';
    });
  }, [dependencies, graph.taskMap]);

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        <Link2 className="mx-auto mb-3 opacity-50" size={48} />
        <p>No tasks to visualize</p>
      </div>
    );
  }

  if (dependencies.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        <Link2 className="mx-auto mb-3 opacity-50" size={48} />
        <p>No dependencies defined</p>
        <p className="text-xs mt-2">Create dependencies to visualize task relationships</p>
      </div>
    );
  }

  const maxX = Math.max(...graph.nodes.map(n => n.x));
  const maxY = Math.max(...graph.nodes.map(n => n.y));

  return (
    <div className="w-full h-full overflow-auto bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      {hasBlockedTasks && (
        <div className="m-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
          <AlertTriangle size={16} />
          <span>Warning: Some in-progress tasks are blocked by incomplete dependencies</span>
        </div>
      )}

      <div className="p-8 min-w-max" style={{ minHeight: `${maxY + 200}px` }}>
        <svg
          className="absolute pointer-events-none"
          style={{ width: `${maxX + 400}px`, height: `${maxY + 200}px` }}
        >
          {/* Draw dependency arrows */}
          {graph.nodes.map(node => {
            return node.dependencies.map(depId => {
              const depNode = getNodeById(depId);
              if (!depNode) return null;

              const x1 = depNode.x + 180;
              const y1 = depNode.y + 40;
              const x2 = node.x + 20;
              const y2 = node.y + 40;

              const depTask = graph.taskMap.get(depId);
              const isBlocked = depTask && depTask.status !== 'done';

              return (
                <g key={`${node.task.id}-${depId}`}>
                  <defs>
                    <marker
                      id={`arrowhead-${node.task.id}-${depId}`}
                      markerWidth="10"
                      markerHeight="10"
                      refX="9"
                      refY="3"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3, 0 6"
                        fill={isBlocked ? '#f59e0b' : '#6b7280'}
                        opacity="0.6"
                      />
                    </marker>
                  </defs>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isBlocked ? '#f59e0b' : '#6b7280'}
                    strokeWidth="2"
                    strokeDasharray={isBlocked ? '5,5' : '0'}
                    opacity="0.6"
                    markerEnd={`url(#arrowhead-${node.task.id}-${depId})`}
                  />
                </g>
              );
            });
          })}
        </svg>

        {/* Draw nodes */}
        {graph.nodes.map(node => {
          const hasIncompleteDeps = node.dependencies.some(depId => {
            const dep = graph.taskMap.get(depId);
            return dep && dep.status !== 'done';
          });

          return (
            <div
              key={node.task.id}
              className={`absolute bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 transition-all cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ${
                hasIncompleteDeps && node.task.status === 'in-progress'
                  ? 'border-amber-400 dark:border-amber-600'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: '180px',
                minHeight: '70px'
              }}
              onClick={() => onTaskClick?.(node.task.id)}
            >
              <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                    {node.task.taskId}
                  </span>
                  {node.task.taskType && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {node.task.taskType}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-2">
                  {node.task.title}
                </h4>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      node.task.status === 'done'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : node.task.status === 'in-progress'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {node.task.status}
                  </span>
                  {hasIncompleteDeps && (
                    <AlertTriangle className="text-amber-500" size={14} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
