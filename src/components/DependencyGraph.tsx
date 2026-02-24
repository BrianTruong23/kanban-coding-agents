'use client';

import { useMemo } from 'react';
import { Task, TaskDependency } from '@/types/task';
import { ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onTaskClick?: (taskId: string) => void;
}

interface Node {
  task: Task;
  x: number;
  y: number;
  level: number;
  blockedBy: string[];
  blocks: string[];
}

export const DependencyGraph = ({ tasks, dependencies, onTaskClick }: DependencyGraphProps) => {
  const { nodes, edges, levels } = useMemo(() => {
    // Build adjacency lists
    const blockedByMap = new Map<string, string[]>();
    const blocksMap = new Map<string, string[]>();

    dependencies.forEach(dep => {
      if (dep.dependencyType === 'blocked_by') {
        blockedByMap.set(dep.taskId, [...(blockedByMap.get(dep.taskId) || []), dep.dependsOnTaskId]);
        blocksMap.set(dep.dependsOnTaskId, [...(blocksMap.get(dep.dependsOnTaskId) || []), dep.taskId]);
      }
    });

    // Calculate levels (topological sort for layout)
    const levels: Map<string, number> = new Map();
    const visited = new Set<string>();

    const calculateLevel = (taskId: string): number => {
      if (levels.has(taskId)) return levels.get(taskId)!;
      if (visited.has(taskId)) return 0; // Cycle detection

      visited.add(taskId);

      const blockers = blockedByMap.get(taskId) || [];
      let maxLevel = 0;

      for (const blockerId of blockers) {
        const blockerLevel = calculateLevel(blockerId);
        maxLevel = Math.max(maxLevel, blockerLevel + 1);
      }

      levels.set(taskId, maxLevel);
      return maxLevel;
    };

    // Only show tasks that have dependencies
    const relevantTasks = tasks.filter(task =>
      blockedByMap.has(task.id) || blocksMap.has(task.id)
    );

    relevantTasks.forEach(task => calculateLevel(task.id));

    // Group tasks by level
    const levelGroups: Task[][] = [];
    relevantTasks.forEach(task => {
      const level = levels.get(task.id) || 0;
      if (!levelGroups[level]) levelGroups[level] = [];
      levelGroups[level].push(task);
    });

    // Calculate positions
    const nodes: Node[] = [];
    const NODE_WIDTH = 240;
    const NODE_HEIGHT = 100;
    const HORIZONTAL_SPACING = 80;
    const VERTICAL_SPACING = 60;

    levelGroups.forEach((levelTasks, level) => {
      levelTasks.forEach((task, indexInLevel) => {
        const y = level * (NODE_HEIGHT + VERTICAL_SPACING);
        const totalWidth = levelTasks.length * NODE_WIDTH + (levelTasks.length - 1) * HORIZONTAL_SPACING;
        const startX = -totalWidth / 2;
        const x = startX + indexInLevel * (NODE_WIDTH + HORIZONTAL_SPACING);

        nodes.push({
          task,
          x,
          y,
          level,
          blockedBy: blockedByMap.get(task.id) || [],
          blocks: blocksMap.get(task.id) || []
        });
      });
    });

    // Generate edges
    const edges = dependencies
      .filter(dep => dep.dependencyType === 'blocked_by')
      .map(dep => {
        const fromNode = nodes.find(n => n.task.id === dep.dependsOnTaskId);
        const toNode = nodes.find(n => n.task.id === dep.taskId);
        return { from: fromNode, to: toNode, dep };
      })
      .filter(e => e.from && e.to);

    return { nodes, edges, levels: levelGroups.length };
  }, [tasks, dependencies]);

  if (nodes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <AlertCircle className="mx-auto mb-4" size={48} />
        <p className="text-lg font-medium">No Dependencies Found</p>
        <p className="text-sm mt-2">Create task dependencies to see the dependency graph</p>
      </div>
    );
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return 'border-red-500 bg-red-50 dark:bg-red-900/20';
    if (priority >= 4) return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
    if (priority >= 3) return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
    return 'border-green-500 bg-green-50 dark:bg-green-900/20';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-500';
      case 'review': return 'bg-blue-500';
      case 'in-progress': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  // Calculate SVG dimensions
  const minX = Math.min(...nodes.map(n => n.x)) - 20;
  const maxX = Math.max(...nodes.map(n => n.x + 240)) + 20;
  const minY = Math.min(...nodes.map(n => n.y)) - 20;
  const maxY = Math.max(...nodes.map(n => n.y + 100)) + 20;

  const width = maxX - minX;
  const height = maxY - minY;

  return (
    <div className="w-full h-full overflow-auto bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Task Dependencies
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {nodes.length} tasks, {edges.length} dependencies
          </div>
        </div>

        <div className="relative" style={{ minWidth: width, minHeight: height }}>
          {/* SVG for edges */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width, height }}
            viewBox={`${minX} ${minY} ${width} ${height}`}
          >
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
                  fill="#9ca3af"
                  className="dark:fill-gray-600"
                />
              </marker>
            </defs>

            {edges.map((edge, idx) => {
              if (!edge.from || !edge.to) return null;

              // Calculate connection points
              const fromX = edge.from.x + 120; // Center of from node
              const fromY = edge.from.y + 100; // Bottom of from node
              const toX = edge.to.x + 120; // Center of to node
              const toY = edge.to.y; // Top of to node

              // Create a curved path
              const midY = (fromY + toY) / 2;

              return (
                <g key={idx}>
                  <path
                    d={`M ${fromX} ${fromY} Q ${fromX} ${midY}, ${toX} ${toY}`}
                    stroke="#9ca3af"
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                    className="dark:stroke-gray-600"
                  />
                </g>
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => (
            <div
              key={node.task.id}
              className={`absolute border-2 rounded-lg p-3 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${getPriorityColor(node.task.priority)}`}
              style={{
                left: node.x - minX,
                top: node.y - minY,
                width: 240,
              }}
              onClick={() => onTaskClick?.(node.task.id)}
            >
              {/* Status indicator */}
              <div className="flex items-center justify-between mb-2">
                <span className={`w-3 h-3 rounded-full ${getStatusColor(node.task.status)}`} />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {node.task.taskId}
                </span>
              </div>

              {/* Title */}
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1 line-clamp-2">
                {node.task.title}
              </h4>

              {/* Priority */}
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span>P{node.task.priority}</span>
                {node.task.status === 'done' && (
                  <CheckCircle2 size={14} className="text-green-500" />
                )}
              </div>

              {/* Dependency count */}
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {node.blockedBy.length > 0 && (
                  <div>⬆️ Blocked by {node.blockedBy.length}</div>
                )}
                {node.blocks.length > 0 && (
                  <div>⬇️ Blocks {node.blocks.length}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
