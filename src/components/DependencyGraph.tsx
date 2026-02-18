'use client';

import { Task, TaskDependency } from '@/types/task';
import { useMemo } from 'react';
import { ArrowRight, GitBranch, Link as LinkIcon } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  onTaskClick?: (taskId: string) => void;
}

interface GraphNode {
  task: Task;
  x: number;
  y: number;
  level: number;
  dependencies: TaskDependency[];
}

export const DependencyGraph = ({ tasks, onTaskClick }: DependencyGraphProps) => {
  const { nodes, edges, hasAnyDependencies } = useMemo(() => {
    // Filter tasks that have dependencies
    const tasksWithDeps = tasks.filter(
      t => t.dependencies && t.dependencies.length > 0
    );

    if (tasksWithDeps.length === 0) {
      return { nodes: [], edges: [], hasAnyDependencies: false };
    }

    // Build dependency graph
    const nodeMap = new Map<string, GraphNode>();
    const allEdges: Array<{
      from: string;
      to: string;
      type: TaskDependency['type'];
    }> = [];

    // Create nodes
    tasks.forEach((task, index) => {
      nodeMap.set(task.id, {
        task,
        x: 0,
        y: 0,
        level: 0,
        dependencies: task.dependencies || [],
      });
    });

    // Extract edges
    tasksWithDeps.forEach(task => {
      task.dependencies?.forEach(dep => {
        if (dep.type === 'blocks') {
          allEdges.push({ from: task.id, to: dep.taskId, type: 'blocks' });
        } else if (dep.type === 'blocked-by') {
          allEdges.push({ from: dep.taskId, to: task.id, type: 'blocked-by' });
        } else {
          allEdges.push({ from: task.id, to: dep.taskId, type: 'relates-to' });
        }
      });
    });

    // Calculate levels (topological ordering)
    const visited = new Set<string>();
    const calculateLevel = (taskId: string, depth = 0): number => {
      if (visited.has(taskId)) return nodeMap.get(taskId)?.level || 0;

      visited.add(taskId);
      let maxLevel = depth;

      const incomingEdges = allEdges.filter(e => e.to === taskId);
      for (const edge of incomingEdges) {
        const sourceLevel = calculateLevel(edge.from, depth + 1);
        maxLevel = Math.max(maxLevel, sourceLevel + 1);
      }

      const node = nodeMap.get(taskId);
      if (node) {
        node.level = maxLevel;
      }

      return maxLevel;
    };

    tasksWithDeps.forEach(task => calculateLevel(task.id));

    // Position nodes
    const levelGroups = new Map<number, GraphNode[]>();
    nodeMap.forEach(node => {
      if (!levelGroups.has(node.level)) {
        levelGroups.set(node.level, []);
      }
      levelGroups.get(node.level)?.push(node);
    });

    const nodeSpacing = 180;
    const levelSpacing = 250;

    levelGroups.forEach((nodes, level) => {
      nodes.forEach((node, index) => {
        node.x = level * levelSpacing + 50;
        node.y = index * nodeSpacing + 50;
      });
    });

    return {
      nodes: Array.from(nodeMap.values()),
      edges: allEdges,
      hasAnyDependencies: true,
    };
  }, [tasks]);

  if (!hasAnyDependencies) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        <div className="text-center">
          <GitBranch size={48} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No task dependencies defined</p>
          <p className="text-xs mt-1">Add dependencies to visualize task relationships</p>
        </div>
      </div>
    );
  }

  // Calculate SVG dimensions
  const maxX = Math.max(...nodes.map(n => n.x)) + 200;
  const maxY = Math.max(...nodes.map(n => n.y)) + 100;

  return (
    <div className="w-full overflow-auto bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <GitBranch size={16} />
        <span className="font-semibold">Task Dependencies</span>
        <div className="ml-auto flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-red-500"></div>
            <span>Blocks</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-blue-500"></div>
            <span>Blocked By</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-gray-400 border-dashed border-t-2"></div>
            <span>Related</span>
          </div>
        </div>
      </div>

      <svg width={maxX} height={maxY} className="border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900">
        {/* Draw edges */}
        {edges.map((edge, index) => {
          const fromNode = nodes.find(n => n.task.id === edge.from);
          const toNode = nodes.find(n => n.task.id === edge.to);

          if (!fromNode || !toNode) return null;

          const x1 = fromNode.x + 160;
          const y1 = fromNode.y + 40;
          const x2 = toNode.x;
          const y2 = toNode.y + 40;

          const color = edge.type === 'blocks' ? '#ef4444' :
                       edge.type === 'blocked-by' ? '#3b82f6' : '#9ca3af';

          const isDashed = edge.type === 'relates-to';

          return (
            <g key={`edge-${index}`}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth="2"
                strokeDasharray={isDashed ? '5,5' : '0'}
                markerEnd={`url(#arrow-${edge.type})`}
              />
            </g>
          );
        })}

        {/* Arrow markers */}
        <defs>
          <marker
            id="arrow-blocks"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
          </marker>
          <marker
            id="arrow-blocked-by"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
          </marker>
          <marker
            id="arrow-relates-to"
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
        {nodes.map(node => (
          <g
            key={node.task.id}
            transform={`translate(${node.x}, ${node.y})`}
            onClick={() => onTaskClick?.(node.task.id)}
            className="cursor-pointer"
          >
            <rect
              width="160"
              height="80"
              rx="6"
              fill="currentColor"
              className="text-white dark:text-gray-700"
              stroke="currentColor"
              strokeWidth="2"
              className={`${getStatusColor(node.task.status)} hover:opacity-80 transition-opacity`}
            />
            <text
              x="10"
              y="20"
              className="text-xs font-mono fill-gray-600 dark:fill-gray-300"
            >
              {node.task.taskId}
            </text>
            <text
              x="10"
              y="40"
              className="text-sm font-semibold fill-gray-800 dark:fill-white"
            >
              {truncateText(node.task.title, 18)}
            </text>
            <text
              x="10"
              y="60"
              className="text-xs fill-gray-600 dark:fill-gray-400"
            >
              {node.task.type} • P{node.task.priority}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

function getStatusColor(status: Task['status']): string {
  const colors = {
    'backlog': 'fill-gray-100 dark:fill-gray-800 stroke-gray-300 dark:stroke-gray-600',
    'in-progress': 'fill-blue-100 dark:fill-blue-900/40 stroke-blue-400 dark:stroke-blue-600',
    'review': 'fill-yellow-100 dark:fill-yellow-900/40 stroke-yellow-400 dark:stroke-yellow-600',
    'done': 'fill-green-100 dark:fill-green-900/40 stroke-green-400 dark:stroke-green-600',
  };
  return colors[status];
}

function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
}
