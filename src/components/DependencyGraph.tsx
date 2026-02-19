'use client';

import { useMemo, useState } from 'react';
import { Task } from '@/types/task';
import { TaskDependency } from '@/types/breakdown';
import { X, ArrowRight, GitBranch, ZoomIn, ZoomOut } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onClose: () => void;
}

interface Node {
  id: string;
  task: Task;
  x: number;
  y: number;
  level: number;
}

interface Edge {
  from: string;
  to: string;
  type: TaskDependency['type'];
}

export const DependencyGraph = ({ tasks, dependencies, onClose }: DependencyGraphProps) => {
  const [zoom, setZoom] = useState(1);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  // Build graph data
  const { nodes, edges } = useMemo(() => {
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    // Create nodes with hierarchy levels
    const nodes: Node[] = [];
    const visited = new Set<string>();
    const inDegree = new Map<string, number>();

    // Calculate in-degrees
    tasks.forEach(task => inDegree.set(task.id, 0));
    dependencies.forEach(dep => {
      const current = inDegree.get(dep.fromTaskId) || 0;
      inDegree.set(dep.fromTaskId, current + 1);
    });

    // Topological sort to determine levels
    const queue: string[] = [];
    tasks.forEach(task => {
      if ((inDegree.get(task.id) || 0) === 0) {
        queue.push(task.id);
      }
    });

    const levels = new Map<string, number>();
    let currentLevel = 0;

    while (queue.length > 0) {
      const levelSize = queue.length;

      for (let i = 0; i < levelSize; i++) {
        const taskId = queue.shift()!;
        levels.set(taskId, currentLevel);
        visited.add(taskId);

        // Find tasks that depend on this one
        dependencies
          .filter(dep => dep.toTaskId === taskId)
          .forEach(dep => {
            const degree = inDegree.get(dep.fromTaskId)! - 1;
            inDegree.set(dep.fromTaskId, degree);
            if (degree === 0 && !visited.has(dep.fromTaskId)) {
              queue.push(dep.fromTaskId);
            }
          });
      }
      currentLevel++;
    }

    // Handle tasks with no dependencies (isolated nodes)
    tasks.forEach(task => {
      if (!levels.has(task.id)) {
        levels.set(task.id, currentLevel);
      }
    });

    // Position nodes
    const levelGroups = new Map<number, string[]>();
    levels.forEach((level, taskId) => {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(taskId);
    });

    const nodeSpacingX = 200;
    const nodeSpacingY = 120;
    const startX = 50;
    const startY = 50;

    levelGroups.forEach((taskIds, level) => {
      taskIds.forEach((taskId, index) => {
        const task = taskMap.get(taskId);
        if (task) {
          nodes.push({
            id: taskId,
            task,
            x: startX + level * nodeSpacingX,
            y: startY + index * nodeSpacingY,
            level,
          });
        }
      });
    });

    // Create edges
    const edges: Edge[] = dependencies.map(dep => ({
      from: dep.toTaskId,
      to: dep.fromTaskId,
      type: dep.type,
    }));

    return { nodes, edges };
  }, [tasks, dependencies]);

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'backlog': return 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200';
      case 'in-progress': return 'bg-blue-200 dark:bg-blue-600 text-blue-800 dark:text-blue-200';
      case 'review': return 'bg-yellow-200 dark:bg-yellow-600 text-yellow-800 dark:text-yellow-200';
      case 'done': return 'bg-green-200 dark:bg-green-600 text-green-800 dark:text-green-200';
      default: return 'bg-gray-200 dark:bg-gray-600';
    }
  };

  const getDependencyColor = (type: TaskDependency['type']) => {
    switch (type) {
      case 'blocks': return 'stroke-red-500';
      case 'requires': return 'stroke-blue-500';
      case 'relates-to': return 'stroke-gray-400';
      case 'duplicates': return 'stroke-purple-500';
      default: return 'stroke-gray-400';
    }
  };

  const maxX = Math.max(...nodes.map(n => n.x), 0) + 200;
  const maxY = Math.max(...nodes.map(n => n.y), 0) + 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full h-full max-w-7xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitBranch size={24} />
            <div>
              <h2 className="text-xl font-bold">Task Dependencies</h2>
              <p className="text-sm text-white/80">
                {nodes.length} tasks, {edges.length} dependencies
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Zoom out"
            >
              <ZoomOut size={20} />
            </button>
            <span className="text-sm font-mono px-2">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Zoom in"
            >
              <ZoomIn size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-6 text-xs flex-wrap">
            <div className="font-semibold text-gray-700 dark:text-gray-300">Legend:</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-blue-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Requires</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-red-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Blocks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-gray-400"></div>
              <span className="text-gray-600 dark:text-gray-400">Relates to</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-purple-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Duplicates</span>
            </div>
          </div>
        </div>

        {/* Graph */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-4">
          {nodes.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <GitBranch size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No dependencies yet</p>
                <p className="text-sm mt-1">Add dependencies between tasks to see the graph</p>
              </div>
            </div>
          ) : (
            <div
              className="relative"
              style={{
                width: maxX * zoom,
                height: maxY * zoom,
                minWidth: '100%',
                minHeight: '100%',
              }}
            >
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{
                  width: maxX * zoom,
                  height: maxY * zoom,
                }}
              >
                {/* Draw edges */}
                {edges.map((edge, idx) => {
                  const fromNode = nodes.find(n => n.id === edge.from);
                  const toNode = nodes.find(n => n.id === edge.to);
                  if (!fromNode || !toNode) return null;

                  const x1 = (fromNode.x + 80) * zoom;
                  const y1 = (fromNode.y + 20) * zoom;
                  const x2 = toNode.x * zoom;
                  const y2 = (toNode.y + 20) * zoom;

                  return (
                    <g key={idx}>
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        className={getDependencyColor(edge.type)}
                        strokeWidth={2 * zoom}
                        markerEnd="url(#arrowhead)"
                      />
                    </g>
                  );
                })}

                {/* Arrow marker */}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3, 0 6"
                      className="fill-gray-400"
                    />
                  </marker>
                </defs>
              </svg>

              {/* Draw nodes */}
              {nodes.map(node => (
                <div
                  key={node.id}
                  className={`absolute cursor-pointer transition-all ${
                    selectedTask === node.id ? 'ring-4 ring-blue-500 z-10' : ''
                  }`}
                  style={{
                    left: node.x * zoom,
                    top: node.y * zoom,
                    width: 160 * zoom,
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                  }}
                  onClick={() => setSelectedTask(node.id === selectedTask ? null : node.id)}
                >
                  <div className="bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-2 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        {node.task.taskId}
                      </div>
                      <div className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(node.task.status)}`}>
                        {node.task.status}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                      {node.task.title}
                    </div>
                    {node.task.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {node.task.tags.slice(0, 2).map((tag, i) => (
                          <span
                            key={i}
                            className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {node.task.tags.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{node.task.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected task details */}
        {selectedTask && (
          <div className="bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 p-4">
            {(() => {
              const task = tasks.find(t => t.id === selectedTask);
              if (!task) return null;

              const dependsOn = dependencies
                .filter(d => d.fromTaskId === selectedTask)
                .map(d => tasks.find(t => t.id === d.toTaskId))
                .filter(Boolean);

              const blockedBy = dependencies
                .filter(d => d.toTaskId === selectedTask)
                .map(d => tasks.find(t => t.id === d.fromTaskId))
                .filter(Boolean);

              return (
                <div className="max-w-4xl">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                    {task.taskId}: {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {task.description}
                    </p>
                  )}
                  <div className="flex gap-6 text-sm">
                    {dependsOn.length > 0 && (
                      <div>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          Depends on:
                        </span>
                        <div className="mt-1 space-y-1">
                          {dependsOn.map(dep => (
                            <div key={dep!.id} className="text-gray-600 dark:text-gray-400">
                              • {dep!.taskId}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {blockedBy.length > 0 && (
                      <div>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          Blocks:
                        </span>
                        <div className="mt-1 space-y-1">
                          {blockedBy.map(blocker => (
                            <div key={blocker!.id} className="text-gray-600 dark:text-gray-400">
                              • {blocker!.taskId}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
