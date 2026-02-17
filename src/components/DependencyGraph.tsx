'use client';

import { Task, TaskDependency } from '@/types/task';
import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onTaskClick?: (task: Task) => void;
}

interface GraphNode {
  task: Task;
  x: number;
  y: number;
  level: number;
}

export const DependencyGraph = ({ tasks, dependencies, onTaskClick }: DependencyGraphProps) => {
  const { nodes, edges } = useMemo(() => {
    // Build dependency graph
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const depMap = new Map<string, string[]>();

    // Map each task to its dependencies
    dependencies.forEach(dep => {
      const deps = depMap.get(dep.taskId) || [];
      deps.push(dep.dependsOnTaskId);
      depMap.set(dep.taskId, deps);
    });

    // Calculate levels (topological sort)
    const levels = new Map<string, number>();
    const visited = new Set<string>();

    function calculateLevel(taskId: string): number {
      if (levels.has(taskId)) return levels.get(taskId)!;
      if (visited.has(taskId)) return 0; // Cycle detected, break it

      visited.add(taskId);

      const deps = depMap.get(taskId) || [];
      if (deps.length === 0) {
        levels.set(taskId, 0);
        return 0;
      }

      const maxDepLevel = Math.max(...deps.map(depId => calculateLevel(depId)));
      const level = maxDepLevel + 1;
      levels.set(taskId, level);

      return level;
    }

    tasks.forEach(task => calculateLevel(task.id));

    // Group tasks by level
    const tasksByLevel = new Map<number, Task[]>();
    tasks.forEach(task => {
      const level = levels.get(task.id) || 0;
      const levelTasks = tasksByLevel.get(level) || [];
      levelTasks.push(task);
      tasksByLevel.set(level, levelTasks);
    });

    // Position nodes
    const nodes: GraphNode[] = [];
    const NODE_WIDTH = 200;
    const NODE_HEIGHT = 80;
    const HORIZONTAL_GAP = 100;
    const VERTICAL_GAP = 120;

    Array.from(tasksByLevel.entries())
      .sort((a, b) => a[0] - b[0])
      .forEach(([level, levelTasks]) => {
        levelTasks.forEach((task, index) => {
          nodes.push({
            task,
            x: level * (NODE_WIDTH + HORIZONTAL_GAP),
            y: index * (NODE_HEIGHT + VERTICAL_GAP),
            level,
          });
        });
      });

    // Create edges
    const edges = dependencies.map(dep => {
      const fromNode = nodes.find(n => n.task.id === dep.dependsOnTaskId);
      const toNode = nodes.find(n => n.task.id === dep.taskId);
      return { from: fromNode, to: toNode, dependency: dep };
    });

    return { nodes, edges };
  }, [tasks, dependencies]);

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        No tasks to display
      </div>
    );
  }

  if (dependencies.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        No dependencies between tasks
      </div>
    );
  }

  // Calculate SVG size
  const maxX = Math.max(...nodes.map(n => n.x)) + 220;
  const maxY = Math.max(...nodes.map(n => n.y)) + 100;

  return (
    <div className="w-full overflow-auto bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
      <svg width={maxX} height={maxY} className="min-w-full">
        {/* Draw edges */}
        {edges.map((edge, i) => {
          if (!edge.from || !edge.to) return null;

          const x1 = edge.from.x + 200;
          const y1 = edge.from.y + 40;
          const x2 = edge.to.x;
          const y2 = edge.to.y + 40;

          return (
            <g key={i}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#9ca3af"
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
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#9ca3af" />
          </marker>
        </defs>

        {/* Draw nodes */}
        {nodes.map((node, i) => (
          <g key={i}>
            <foreignObject x={node.x} y={node.y} width="200" height="80">
              <div
                className={`w-full h-full bg-white dark:bg-gray-800 border-2 ${
                  node.task.riskLevel === 'critical'
                    ? 'border-red-500'
                    : node.task.riskLevel === 'high'
                    ? 'border-orange-500'
                    : 'border-gray-300 dark:border-gray-600'
                } rounded-lg p-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => onTaskClick?.(node.task)}
              >
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  {node.task.taskId}
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {node.task.title}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {node.task.taskType === 'epic' && (
                    <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                      Epic
                    </span>
                  )}
                  {node.task.taskType === 'subtask' && (
                    <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                      Sub
                    </span>
                  )}
                  {node.task.riskLevel && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        node.task.riskLevel === 'critical'
                          ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                          : node.task.riskLevel === 'high'
                          ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                          : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                      }`}
                    >
                      {node.task.riskLevel}
                    </span>
                  )}
                </div>
              </div>
            </foreignObject>
          </g>
        ))}
      </svg>
    </div>
  );
};
