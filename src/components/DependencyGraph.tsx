'use client';

import { useMemo } from 'react';
import { BreakdownTask, TaskDependency } from '@/types/breakdown';
import { ArrowRight, GitBranch, AlertCircle } from 'lucide-react';

interface DependencyGraphProps {
  tasks: BreakdownTask[];
  onTaskClick?: (taskId: string) => void;
}

interface GraphNode {
  task: BreakdownTask;
  x: number;
  y: number;
  level: number;
}

interface GraphEdge {
  from: GraphNode;
  to: GraphNode;
  type: 'blocks' | 'blocked_by' | 'relates_to';
}

export const DependencyGraph = ({ tasks, onTaskClick }: DependencyGraphProps) => {
  const { nodes, edges, hasCircularDependency } = useMemo(() => {
    // Build dependency graph
    const taskMap = new Map<string, BreakdownTask>();
    tasks.forEach((task) => taskMap.set(task.taskId, task));

    // Calculate levels using topological sort
    const levels = new Map<string, number>();
    const visited = new Set<string>();
    const visiting = new Set<string>();
    let hasCircular = false;

    const calculateLevel = (taskId: string, depth = 0): number => {
      if (depth > 100) {
        hasCircular = true;
        return 0;
      }

      if (visited.has(taskId)) {
        return levels.get(taskId) || 0;
      }

      if (visiting.has(taskId)) {
        hasCircular = true;
        return 0;
      }

      visiting.add(taskId);

      const task = taskMap.get(taskId);
      if (!task) {
        visited.add(taskId);
        return 0;
      }

      let maxLevel = 0;
      task.dependencies.forEach((dep) => {
        if (dep.type === 'blocked_by') {
          const depLevel = calculateLevel(dep.taskId, depth + 1);
          maxLevel = Math.max(maxLevel, depLevel + 1);
        }
      });

      levels.set(taskId, maxLevel);
      visiting.delete(taskId);
      visited.add(taskId);
      return maxLevel;
    };

    tasks.forEach((task) => {
      if (!visited.has(task.taskId)) {
        calculateLevel(task.taskId);
      }
    });

    // Group tasks by level
    const levelGroups = new Map<number, BreakdownTask[]>();
    tasks.forEach((task) => {
      const level = levels.get(task.taskId) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(task);
    });

    // Calculate positions
    const nodeWidth = 200;
    const nodeHeight = 80;
    const horizontalGap = 100;
    const verticalGap = 120;

    const graphNodes: GraphNode[] = [];
    let maxLevel = 0;

    levelGroups.forEach((tasksInLevel, level) => {
      maxLevel = Math.max(maxLevel, level);
      tasksInLevel.forEach((task, index) => {
        graphNodes.push({
          task,
          x: level * (nodeWidth + horizontalGap),
          y: index * (nodeHeight + verticalGap),
          level,
        });
      });
    });

    // Build edges
    const graphEdges: GraphEdge[] = [];
    graphNodes.forEach((node) => {
      node.task.dependencies.forEach((dep) => {
        const targetNode = graphNodes.find((n) => n.task.taskId === dep.taskId);
        if (targetNode) {
          graphEdges.push({
            from: targetNode,
            to: node,
            type: dep.type,
          });
        }
      });
    });

    return {
      nodes: graphNodes,
      edges: graphEdges,
      hasCircularDependency: hasCircular,
    };
  }, [tasks]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'epic':
        return 'border-purple-500 bg-purple-50 dark:bg-purple-900/30';
      case 'story':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/30';
      case 'task':
        return 'border-green-500 bg-green-50 dark:bg-green-900/30';
      case 'subtask':
        return 'border-gray-400 bg-gray-50 dark:bg-gray-700';
      default:
        return 'border-gray-400 bg-gray-50 dark:bg-gray-700';
    }
  };

  const getEdgeColor = (type: string) => {
    switch (type) {
      case 'blocks':
        return 'stroke-red-500';
      case 'blocked_by':
        return 'stroke-orange-500';
      default:
        return 'stroke-gray-400';
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-400 dark:text-gray-500">
        <GitBranch size={48} className="mb-4" />
        <p className="text-lg font-medium">No tasks to visualize</p>
        <p className="text-sm mt-1">Create tasks to see their dependency graph</p>
      </div>
    );
  }

  // Calculate SVG dimensions
  const width = Math.max(
    ...nodes.map((n) => n.x + 200),
    800
  );
  const height = Math.max(
    ...nodes.map((n) => n.y + 80),
    400
  );

  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-900 rounded-lg overflow-auto">
      {hasCircularDependency && (
        <div className="m-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">
            Warning: Circular dependencies detected. This may cause issues in task execution.
          </span>
        </div>
      )}

      <div className="p-8">
        <svg width={width} height={height} className="overflow-visible">
          {/* Draw edges first (so they appear behind nodes) */}
          {edges.map((edge, idx) => {
            const fromX = edge.from.x + 200;
            const fromY = edge.from.y + 40;
            const toX = edge.to.x;
            const toY = edge.to.y + 40;

            // Calculate control points for curved lines
            const midX = (fromX + toX) / 2;

            return (
              <g key={`edge-${idx}`}>
                <path
                  d={`M ${fromX} ${fromY} Q ${midX} ${fromY}, ${midX} ${(fromY + toY) / 2} T ${toX} ${toY}`}
                  className={`fill-none ${getEdgeColor(edge.type)}`}
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
              </g>
            );
          })}

          {/* Define arrowhead marker */}
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

          {/* Draw nodes */}
          {nodes.map((node) => (
            <g
              key={node.task.id}
              transform={`translate(${node.x}, ${node.y})`}
              onClick={() => onTaskClick?.(node.task.id)}
              className="cursor-pointer"
            >
              <rect
                width="200"
                height="80"
                rx="8"
                className={`${getTypeColor(node.task.type)} border-2 transition-all hover:shadow-lg`}
              />
              <foreignObject width="200" height="80">
                <div className="p-3 h-full flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-1">
                      {node.task.taskId}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                      {node.task.title}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-0.5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                      {node.task.type}
                    </span>
                    {node.task.estimatedHours && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {node.task.estimatedHours}h
                      </span>
                    )}
                  </div>
                </div>
              </foreignObject>
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Legend
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/30" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Epic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/30" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Story</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-green-500 bg-green-50 dark:bg-green-900/30" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Task</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-gray-400 bg-gray-50 dark:bg-gray-700" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Subtask</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <ArrowRight size={16} className="text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Dependencies flow from left to right
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
