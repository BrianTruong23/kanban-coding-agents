'use client';

import { Task } from '@/types/task';
import { TaskDependency } from '@/types/epic';
import { ArrowRight, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

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
  incomingDeps: TaskDependency[];
  outgoingDeps: TaskDependency[];
}

export function DependencyGraph({ tasks, dependencies, onTaskClick }: DependencyGraphProps) {
  // Build dependency graph
  const nodes = buildGraphNodes(tasks, dependencies);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">No dependencies to visualize</p>
      </div>
    );
  }

  // Calculate SVG dimensions
  const maxLevel = Math.max(...nodes.map(n => n.level));
  const width = Math.max(800, (maxLevel + 1) * 300);
  const height = Math.max(400, nodes.length * 80);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-4 overflow-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Task Dependencies</h3>
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Blocks</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Requires</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            <span>Related</span>
          </div>
        </div>
      </div>

      <svg width={width} height={height} className="min-w-full">
        {/* Draw dependency arrows */}
        {dependencies.map((dep, idx) => {
          const sourceNode = nodes.find(n => n.task.id === dep.sourceTaskId);
          const targetNode = nodes.find(n => n.task.id === dep.targetTaskId);

          if (!sourceNode || !targetNode) return null;

          const color = dep.dependencyType === 'blocks' ? '#ef4444' :
                       dep.dependencyType === 'requires' ? '#3b82f6' : '#9ca3af';

          return (
            <g key={`dep-${idx}`}>
              <defs>
                <marker
                  id={`arrowhead-${idx}`}
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill={color} />
                </marker>
              </defs>
              <line
                x1={targetNode.x + 200}
                y1={targetNode.y + 30}
                x2={sourceNode.x}
                y2={sourceNode.y + 30}
                stroke={color}
                strokeWidth="2"
                markerEnd={`url(#arrowhead-${idx})`}
                opacity="0.6"
              />
            </g>
          );
        })}

        {/* Draw task nodes */}
        {nodes.map((node, idx) => (
          <g
            key={`node-${idx}`}
            transform={`translate(${node.x}, ${node.y})`}
            className="cursor-pointer"
            onClick={() => onTaskClick?.(node.task.id)}
          >
            <rect
              width="200"
              height="60"
              rx="8"
              fill="currentColor"
              className={getNodeColor(node.task.status)}
              opacity="0.9"
            />
            <foreignObject width="200" height="60">
              <div className="p-2 h-full flex flex-col justify-between">
                <div className="flex items-start gap-2">
                  {getStatusIcon(node.task.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                      {node.task.taskId}
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {node.task.title}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {node.task.priority >= 4 && (
                    <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-1.5 py-0.5 rounded">
                      High Priority
                    </span>
                  )}
                  {node.incomingDeps.length > 0 && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-1.5 py-0.5 rounded">
                      {node.incomingDeps.length} deps
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
}

function buildGraphNodes(tasks: Task[], dependencies: TaskDependency[]): GraphNode[] {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const nodes: GraphNode[] = [];

  // Build dependency map
  const depMap = new Map<string, { incoming: TaskDependency[], outgoing: TaskDependency[] }>();
  tasks.forEach(task => {
    depMap.set(task.id, { incoming: [], outgoing: [] });
  });

  dependencies.forEach(dep => {
    const source = depMap.get(dep.sourceTaskId);
    const target = depMap.get(dep.targetTaskId);
    if (source) source.outgoing.push(dep);
    if (target) target.incoming.push(dep);
  });

  // Calculate levels (topological sort)
  const levels = new Map<string, number>();
  const visited = new Set<string>();

  function calculateLevel(taskId: string): number {
    if (visited.has(taskId)) {
      return levels.get(taskId) || 0;
    }

    visited.add(taskId);
    const deps = depMap.get(taskId)?.outgoing || [];

    if (deps.length === 0) {
      levels.set(taskId, 0);
      return 0;
    }

    const maxDepLevel = Math.max(...deps.map(dep => calculateLevel(dep.targetTaskId)));
    const level = maxDepLevel + 1;
    levels.set(taskId, level);
    return level;
  }

  tasks.forEach(task => calculateLevel(task.id));

  // Group tasks by level
  const levelGroups = new Map<number, Task[]>();
  tasks.forEach(task => {
    const level = levels.get(task.id) || 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(task);
  });

  // Position nodes
  levelGroups.forEach((tasksAtLevel, level) => {
    tasksAtLevel.forEach((task, index) => {
      const deps = depMap.get(task.id)!;
      nodes.push({
        task,
        x: level * 300 + 50,
        y: index * 100 + 50,
        level,
        incomingDeps: deps.incoming,
        outgoingDeps: deps.outgoing,
      });
    });
  });

  return nodes;
}

function getNodeColor(status: Task['status']): string {
  switch (status) {
    case 'done':
      return 'text-green-100 dark:text-green-900';
    case 'in-progress':
      return 'text-blue-100 dark:text-blue-900';
    case 'review':
      return 'text-purple-100 dark:text-purple-900';
    default:
      return 'text-gray-100 dark:text-gray-700';
  }
}

function getStatusIcon(status: Task['status']) {
  switch (status) {
    case 'done':
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case 'in-progress':
      return <Clock className="w-4 h-4 text-blue-600" />;
    case 'review':
      return <AlertTriangle className="w-4 h-4 text-purple-600" />;
    default:
      return <div className="w-4 h-4 rounded-full border-2 border-gray-400" />;
  }
}
