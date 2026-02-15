'use client';

import { useEffect, useRef, useState } from 'react';
import { Task } from '@/types/task';
import { TaskDependency } from '@/types/dependency';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onTaskClick?: (taskId: string) => void;
}

interface GraphNode {
  id: string;
  task: Task;
  x: number;
  y: number;
  level: number;
}

/**
 * Calculate levels for tasks based on dependencies using topological sort
 */
function calculateLevels(
  tasks: Task[],
  dependencyMap: Map<string, string[]>
): Map<string, number> {
  const levels = new Map<string, number>();
  const visited = new Set<string>();

  function calculateLevel(taskId: string): number {
    if (levels.has(taskId)) {
      return levels.get(taskId)!;
    }

    if (visited.has(taskId)) {
      // Circular dependency detected, assign to next level
      return 0;
    }

    visited.add(taskId);

    const dependencies = dependencyMap.get(taskId) || [];
    if (dependencies.length === 0) {
      levels.set(taskId, 0);
      return 0;
    }

    let maxLevel = -1;
    for (const depId of dependencies) {
      const depLevel = calculateLevel(depId);
      maxLevel = Math.max(maxLevel, depLevel);
    }

    const level = maxLevel + 1;
    levels.set(taskId, level);
    return level;
  }

  for (const task of tasks) {
    if (!levels.has(task.id)) {
      calculateLevel(task.id);
    }
  }

  return levels;
}

export const DependencyGraph = ({ tasks, dependencies, onTaskClick }: DependencyGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    if (!tasks.length) return;

    // Build dependency graph to determine levels
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const dependencyMap = new Map<string, string[]>();

    // Build adjacency list
    for (const dep of dependencies) {
      const deps = dependencyMap.get(dep.taskId) || [];
      deps.push(dep.dependsOnTaskId);
      dependencyMap.set(dep.taskId, deps);
    }

    // Calculate levels using topological sort
    const levels = calculateLevels(tasks, dependencyMap);
    const levelGroups = new Map<number, Task[]>();

    for (const [taskId, level] of levels.entries()) {
      const task = taskMap.get(taskId);
      if (task) {
        const group = levelGroups.get(level) || [];
        group.push(task);
        levelGroups.set(level, group);
      }
    }

    // Calculate positions
    const nodeWidth = 200;
    const nodeHeight = 80;
    const levelGap = 250;
    const nodeGap = 100;
    const padding = 40;

    const graphNodes: GraphNode[] = [];
    let maxWidth = 0;

    for (const [level, levelTasks] of Array.from(levelGroups.entries()).sort(
      ([a], [b]) => a - b
    )) {
      const x = padding + level * levelGap;
      const totalHeight = levelTasks.length * (nodeHeight + nodeGap) - nodeGap;
      const startY = padding;

      levelTasks.forEach((task, index) => {
        const y = startY + index * (nodeHeight + nodeGap);
        graphNodes.push({
          id: task.id,
          task,
          x,
          y,
          level,
        });
      });

      maxWidth = Math.max(maxWidth, x + nodeWidth);
    }

    setNodes(graphNodes);

    // Draw on canvas
    if (canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        const maxHeight =
          Math.max(...graphNodes.map((n) => n.y)) + nodeHeight + padding;

        canvas.width = maxWidth + padding;
        canvas.height = maxHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw dependencies (arrows)
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 2;

        for (const dep of dependencies) {
          const fromNode = graphNodes.find((n) => n.id === dep.dependsOnTaskId);
          const toNode = graphNodes.find((n) => n.id === dep.taskId);

          if (fromNode && toNode) {
            const fromX = fromNode.x + nodeWidth;
            const fromY = fromNode.y + nodeHeight / 2;
            const toX = toNode.x;
            const toY = toNode.y + nodeHeight / 2;

            // Draw bezier curve
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);

            const controlPoint1X = fromX + (toX - fromX) / 3;
            const controlPoint2X = fromX + ((toX - fromX) * 2) / 3;

            ctx.bezierCurveTo(
              controlPoint1X,
              fromY,
              controlPoint2X,
              toY,
              toX,
              toY
            );
            ctx.stroke();

            // Draw arrowhead
            const arrowSize = 8;
            ctx.beginPath();
            ctx.moveTo(toX, toY);
            ctx.lineTo(toX - arrowSize, toY - arrowSize / 2);
            ctx.lineTo(toX - arrowSize, toY + arrowSize / 2);
            ctx.closePath();
            ctx.fillStyle = '#9ca3af';
            ctx.fill();
          }
        }
      }
    }
  }, [tasks, dependencies]);

  const handleNodeClick = (nodeId: string) => {
    if (onTaskClick) {
      onTaskClick(nodeId);
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return 'bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700';
    if (priority >= 4) return 'bg-orange-100 dark:bg-orange-900 border-orange-300 dark:border-orange-700';
    if (priority >= 3) return 'bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700';
    if (priority >= 2) return 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700';
    return 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'text-green-600 dark:text-green-400';
      case 'in-progress':
        return 'text-blue-600 dark:text-blue-400';
      case 'review':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!tasks.length) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">No tasks to visualize</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto"
      style={{ maxHeight: '600px' }}
    >
      <canvas ref={canvasRef} className="absolute top-0 left-0" />

      {/* Task nodes */}
      <div className="relative">
        {nodes.map((node) => (
          <div
            key={node.id}
            style={{
              position: 'absolute',
              left: `${node.x}px`,
              top: `${node.y}px`,
              width: '200px',
              height: '80px',
            }}
            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${getPriorityColor(
              node.task.priority
            )} ${
              hoveredNode === node.id
                ? 'shadow-lg scale-105 z-10'
                : 'shadow hover:shadow-md'
            }`}
            onClick={() => handleNodeClick(node.id)}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <div className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-1">
              {node.task.taskId}
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
              {node.task.title}
            </div>
            <div className={`text-xs font-medium uppercase ${getStatusColor(node.task.status)}`}>
              {node.task.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
