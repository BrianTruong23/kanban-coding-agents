'use client';

import { useMemo } from 'react';
import { ExtendedTask, TaskDependency } from '@/types/taskHierarchy';
import { AlertTriangle, ArrowRight, Link2, CheckCircle2, Circle } from 'lucide-react';

interface TaskDependencyGraphProps {
  tasks: ExtendedTask[];
  dependencies: TaskDependency[];
  onTaskClick?: (task: ExtendedTask) => void;
}

interface GraphNode {
  task: ExtendedTask;
  x: number;
  y: number;
  level: number;
  dependencies: string[];
  dependents: string[];
}

export const TaskDependencyGraph = ({ tasks, dependencies, onTaskClick }: TaskDependencyGraphProps) => {
  const graph = useMemo(() => {
    return buildDependencyGraph(tasks, dependencies);
  }, [tasks, dependencies]);

  const { nodes, maxLevel } = graph;

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        <p>No tasks to visualize</p>
      </div>
    );
  }

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 overflow-auto">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Task Dependencies</h3>
        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Epic</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Ticket</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Subtask</span>
          </div>
        </div>
      </div>

      <svg
        width={Math.max(800, maxLevel * 250)}
        height={Math.max(400, nodes.length * 80)}
        className="w-full"
        style={{ minHeight: '400px' }}
      >
        {/* Draw dependency lines first (so they appear behind nodes) */}
        {dependencies.map((dep) => {
          const fromNode = nodes.find((n) => n.task.id === dep.dependsOnTaskId);
          const toNode = nodes.find((n) => n.task.id === dep.dependentTaskId);

          if (!fromNode || !toNode) return null;

          const color = dep.dependencyType === 'blocks' ? '#ef4444' : '#6366f1';

          return (
            <g key={dep.id}>
              <line
                x1={fromNode.x + 100}
                y1={fromNode.y + 20}
                x2={toNode.x}
                y2={toNode.y + 20}
                stroke={color}
                strokeWidth={2}
                strokeDasharray={dep.dependencyType === 'relates-to' ? '5,5' : '0'}
                opacity={0.6}
              />
              {/* Arrow head */}
              <polygon
                points={`${toNode.x},${toNode.y + 20} ${toNode.x - 8},${toNode.y + 15} ${toNode.x - 8},${toNode.y + 25}`}
                fill={color}
                opacity={0.6}
              />
            </g>
          );
        })}

        {/* Draw nodes */}
        {nodes.map((node) => {
          const { task } = node;
          const color = getTaskColor(task);
          const isDone = task.status === 'done';
          const isBlocked = (task.blockedBy?.length || 0) > 0;

          return (
            <g
              key={task.id}
              transform={`translate(${node.x}, ${node.y})`}
              className="cursor-pointer transition-transform hover:scale-105"
              onClick={() => onTaskClick?.(task)}
            >
              {/* Node background */}
              <rect
                width={200}
                height={60}
                rx={8}
                fill={color}
                opacity={isDone ? 0.5 : 1}
                className="transition-all"
              />

              {/* Task ID badge */}
              <rect x={5} y={5} width={60} height={18} rx={4} fill="white" opacity={0.9} />
              <text
                x={35}
                y={17}
                textAnchor="middle"
                className="text-[10px] font-bold"
                fill={color}
              >
                {task.taskId}
              </text>

              {/* Task title */}
              <text
                x={10}
                y={35}
                className="text-xs font-medium fill-white"
                style={{ fontSize: '11px' }}
              >
                {truncate(task.title, 25)}
              </text>

              {/* Status indicator */}
              <g transform="translate(10, 42)">
                {isDone ? (
                  <CheckCircle2 size={14} className="text-white" />
                ) : isBlocked ? (
                  <AlertTriangle size={14} className="text-yellow-300" />
                ) : (
                  <Circle size={14} className="text-white opacity-50" />
                )}
              </g>

              {/* Priority indicator */}
              <text x={190} y={17} textAnchor="end" className="text-[10px] font-bold fill-white">
                P{task.priority}
              </text>

              {/* Complexity badge */}
              {task.complexity && (
                <g transform="translate(170, 42)">
                  <rect
                    width={25}
                    height={14}
                    rx={3}
                    fill="white"
                    opacity={0.2}
                  />
                  <text
                    x={12.5}
                    y={10}
                    textAnchor="middle"
                    className="text-[9px] font-semibold fill-white"
                  >
                    {task.complexity[0].toUpperCase()}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend for dependency types */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Dependency Types:</p>
        <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-red-500"></div>
            <span>Blocks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-indigo-500" style={{ backgroundImage: 'repeating-linear-gradient(to right, #6366f1 0, #6366f1 5px, transparent 5px, transparent 10px)' }}></div>
            <span>Relates to</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to build the graph layout
function buildDependencyGraph(
  tasks: ExtendedTask[],
  dependencies: TaskDependency[]
): { nodes: GraphNode[]; maxLevel: number } {
  const nodes: GraphNode[] = [];
  const taskMap = new Map<string, ExtendedTask>();

  tasks.forEach((task) => taskMap.set(task.id, task));

  // Build dependency and dependent lists
  const dependencyMap = new Map<string, string[]>();
  const dependentMap = new Map<string, string[]>();

  dependencies.forEach((dep) => {
    const deps = dependencyMap.get(dep.dependentTaskId) || [];
    deps.push(dep.dependsOnTaskId);
    dependencyMap.set(dep.dependentTaskId, deps);

    const dependents = dependentMap.get(dep.dependsOnTaskId) || [];
    dependents.push(dep.dependentTaskId);
    dependentMap.set(dep.dependsOnTaskId, dependents);
  });

  // Calculate levels (topological sort)
  const levels = calculateLevels(tasks, dependencies);
  const maxLevel = Math.max(...Array.from(levels.values()), 0);

  // Group tasks by level
  const tasksByLevel = new Map<number, ExtendedTask[]>();
  tasks.forEach((task) => {
    const level = levels.get(task.id) || 0;
    const tasksAtLevel = tasksByLevel.get(level) || [];
    tasksAtLevel.push(task);
    tasksByLevel.set(level, tasksAtLevel);
  });

  // Position nodes
  const padding = 50;
  const nodeWidth = 200;
  const nodeHeight = 80;

  tasksByLevel.forEach((tasksAtLevel, level) => {
    tasksAtLevel.forEach((task, index) => {
      nodes.push({
        task,
        x: padding + level * (nodeWidth + 50),
        y: padding + index * nodeHeight,
        level,
        dependencies: dependencyMap.get(task.id) || [],
        dependents: dependentMap.get(task.id) || [],
      });
    });
  });

  return { nodes, maxLevel };
}

// Calculate task levels using topological sort
function calculateLevels(tasks: ExtendedTask[], dependencies: TaskDependency[]): Map<string, number> {
  const levels = new Map<string, number>();
  const inDegree = new Map<string, number>();
  const adjacencyList = new Map<string, string[]>();

  // Initialize
  tasks.forEach((task) => {
    inDegree.set(task.id, 0);
    adjacencyList.set(task.id, []);
  });

  // Build graph
  dependencies.forEach((dep) => {
    const current = inDegree.get(dep.dependentTaskId) || 0;
    inDegree.set(dep.dependentTaskId, current + 1);

    const adj = adjacencyList.get(dep.dependsOnTaskId) || [];
    adj.push(dep.dependentTaskId);
    adjacencyList.set(dep.dependsOnTaskId, adj);
  });

  // Find starting nodes (no dependencies)
  const queue: string[] = [];
  tasks.forEach((task) => {
    if ((inDegree.get(task.id) || 0) === 0) {
      queue.push(task.id);
      levels.set(task.id, 0);
    }
  });

  // Process queue
  while (queue.length > 0) {
    const taskId = queue.shift()!;
    const currentLevel = levels.get(taskId) || 0;

    const neighbors = adjacencyList.get(taskId) || [];
    neighbors.forEach((neighborId) => {
      const degree = (inDegree.get(neighborId) || 0) - 1;
      inDegree.set(neighborId, degree);

      const newLevel = currentLevel + 1;
      const existingLevel = levels.get(neighborId) || 0;
      levels.set(neighborId, Math.max(existingLevel, newLevel));

      if (degree === 0) {
        queue.push(neighborId);
      }
    });
  }

  return levels;
}

function getTaskColor(task: ExtendedTask): string {
  switch (task.taskType) {
    case 'epic':
      return '#9333ea'; // purple
    case 'ticket':
      return '#3b82f6'; // blue
    case 'subtask':
      return '#10b981'; // green
    default:
      return '#6b7280'; // gray
  }
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}
