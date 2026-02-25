'use client';

import { useState, useEffect, useRef } from 'react';
import { Task } from '@/types/task';
import { TaskDependency, DependencyType } from '@/types/breakdown';
import { ArrowRight, Maximize2, Minimize2 } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onTaskClick?: (taskId: string) => void;
  highlightedTaskId?: string;
}

interface GraphNode {
  id: string;
  task: Task;
  x: number;
  y: number;
  level: number; // Depth in the graph (for positioning)
}

interface GraphEdge {
  source: string;
  target: string;
  type: DependencyType;
}

export const DependencyGraph = ({
  tasks,
  dependencies,
  onTaskClick,
  highlightedTaskId,
}: DependencyGraphProps) => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Build graph layout
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const graphNodes: GraphNode[] = [];
    const graphEdges: GraphEdge[] = [];

    // Create edges
    for (const dep of dependencies) {
      if (taskMap.has(dep.sourceTaskId) && taskMap.has(dep.targetTaskId)) {
        graphEdges.push({
          source: dep.sourceTaskId,
          target: dep.targetTaskId,
          type: dep.type,
        });
      }
    }

    // Calculate levels (topological sort for positioning)
    const levels = calculateLevels(tasks, graphEdges);

    // Position nodes
    const nodesByLevel = new Map<number, Task[]>();
    for (const task of tasks) {
      const level = levels.get(task.id) || 0;
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level)!.push(task);
    }

    const NODE_WIDTH = 200;
    const NODE_HEIGHT = 80;
    const HORIZONTAL_SPACING = 100;
    const VERTICAL_SPACING = 120;

    let currentY = 50;
    for (let level = 0; level <= Math.max(...levels.values()); level++) {
      const tasksAtLevel = nodesByLevel.get(level) || [];
      const levelWidth = tasksAtLevel.length * (NODE_WIDTH + HORIZONTAL_SPACING);
      let currentX = 50;

      for (const task of tasksAtLevel) {
        graphNodes.push({
          id: task.id,
          task,
          x: currentX,
          y: currentY,
          level,
        });
        currentX += NODE_WIDTH + HORIZONTAL_SPACING;
      }

      currentY += NODE_HEIGHT + VERTICAL_SPACING;
    }

    setNodes(graphNodes);
    setEdges(graphEdges);
  }, [tasks, dependencies]);

  if (tasks.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        No tasks to visualize
      </div>
    );
  }

  if (dependencies.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        No dependencies defined yet
      </div>
    );
  }

  const svgWidth = Math.max(800, Math.max(...nodes.map((n) => n.x)) + 250);
  const svgHeight = Math.max(600, Math.max(...nodes.map((n) => n.y)) + 150);

  return (
    <div
      className={`${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900'
          : 'relative border border-gray-200 dark:border-gray-700 rounded-lg'
      } overflow-auto`}
    >
      <div className="sticky top-0 right-0 z-10 flex justify-end p-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur">
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      </div>

      <svg
        ref={svgRef}
        width={svgWidth}
        height={svgHeight}
        className="w-full"
        style={{ minHeight: '400px' }}
      >
        <defs>
          <marker
            id="arrowhead-blocks"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            className="fill-red-500"
          >
            <polygon points="0 0, 10 3, 0 6" />
          </marker>
          <marker
            id="arrowhead-blocked-by"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            className="fill-orange-500"
          >
            <polygon points="0 0, 10 3, 0 6" />
          </marker>
          <marker
            id="arrowhead-related"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            className="fill-blue-500"
          >
            <polygon points="0 0, 10 3, 0 6" />
          </marker>
        </defs>

        {/* Draw edges */}
        {edges.map((edge, idx) => {
          const sourceNode = nodes.find((n) => n.id === edge.source);
          const targetNode = nodes.find((n) => n.id === edge.target);

          if (!sourceNode || !targetNode) return null;

          const x1 = sourceNode.x + 100;
          const y1 = sourceNode.y + 40;
          const x2 = targetNode.x + 100;
          const y2 = targetNode.y + 40;

          const color =
            edge.type === 'blocks'
              ? 'stroke-red-500'
              : edge.type === 'blocked-by'
              ? 'stroke-orange-500'
              : 'stroke-blue-500';

          const markerEnd =
            edge.type === 'blocks'
              ? 'url(#arrowhead-blocks)'
              : edge.type === 'blocked-by'
              ? 'url(#arrowhead-blocked-by)'
              : 'url(#arrowhead-related)';

          return (
            <g key={idx}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className={`${color} dark:opacity-80`}
                strokeWidth="2"
                markerEnd={markerEnd}
              />
              <text
                x={(x1 + x2) / 2}
                y={(y1 + y2) / 2 - 5}
                className="text-xs fill-gray-600 dark:fill-gray-400"
                textAnchor="middle"
              >
                {edge.type}
              </text>
            </g>
          );
        })}

        {/* Draw nodes */}
        {nodes.map((node) => {
          const isHighlighted = highlightedTaskId === node.id;
          const hasIncoming = edges.some((e) => e.target === node.id);
          const hasOutgoing = edges.some((e) => e.source === node.id);

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              className="cursor-pointer"
              onClick={() => onTaskClick?.(node.id)}
            >
              <rect
                width="200"
                height="80"
                rx="8"
                className={`
                  ${isHighlighted ? 'fill-blue-100 dark:fill-blue-900' : 'fill-white dark:fill-gray-800'}
                  stroke-gray-300 dark:stroke-gray-600
                  ${isHighlighted ? 'stroke-2' : 'stroke-1'}
                  transition-all hover:fill-gray-50 dark:hover:fill-gray-700
                `}
              />

              {/* Task ID */}
              <text
                x="10"
                y="20"
                className="text-xs font-mono fill-gray-500 dark:fill-gray-400"
              >
                {node.task.taskId}
              </text>

              {/* Task Title */}
              <foreignObject x="10" y="30" width="180" height="40">
                <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                  {node.task.title}
                </div>
              </foreignObject>

              {/* Status badge */}
              <rect
                x="10"
                y="65"
                width="60"
                height="10"
                rx="5"
                className={`
                  ${
                    node.task.status === 'done'
                      ? 'fill-green-500'
                      : node.task.status === 'in-progress'
                      ? 'fill-blue-500'
                      : node.task.status === 'review'
                      ? 'fill-purple-500'
                      : 'fill-gray-400'
                  }
                `}
              />
              <text
                x="40"
                y="73"
                className="text-[8px] fill-white font-medium"
                textAnchor="middle"
              >
                {node.task.status.toUpperCase()}
              </text>

              {/* Dependency indicators */}
              {hasIncoming && (
                <circle
                  cx="190"
                  cy="10"
                  r="5"
                  className="fill-orange-500"
                  title="Has dependencies"
                />
              )}
              {hasOutgoing && (
                <circle
                  cx="180"
                  cy="10"
                  r="5"
                  className="fill-red-500"
                  title="Blocks other tasks"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-12 h-0.5 bg-red-500" />
            <span className="text-gray-700 dark:text-gray-300">Blocks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-0.5 bg-orange-500" />
            <span className="text-gray-700 dark:text-gray-300">Blocked By</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-0.5 bg-blue-500" />
            <span className="text-gray-700 dark:text-gray-300">Related To</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Calculate levels for each task (topological sort)
 */
function calculateLevels(tasks: Task[], edges: GraphEdge[]): Map<string, number> {
  const levels = new Map<string, number>();
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  // Initialize
  for (const task of tasks) {
    levels.set(task.id, 0);
    inDegree.set(task.id, 0);
    adjList.set(task.id, []);
  }

  // Build adjacency list and in-degree count
  for (const edge of edges) {
    if (edge.type === 'blocks' || edge.type === 'blocked-by') {
      const from = edge.type === 'blocks' ? edge.target : edge.source;
      const to = edge.type === 'blocks' ? edge.source : edge.target;

      adjList.get(from)?.push(to);
      inDegree.set(to, (inDegree.get(to) || 0) + 1);
    }
  }

  // Topological sort using Kahn's algorithm
  const queue: string[] = [];
  for (const [taskId, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(taskId);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLevel = levels.get(current) || 0;

    for (const neighbor of adjList.get(current) || []) {
      levels.set(neighbor, Math.max(levels.get(neighbor) || 0, currentLevel + 1));
      inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);

      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  return levels;
}
