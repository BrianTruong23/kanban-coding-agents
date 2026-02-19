'use client';

import { useEffect, useRef, useState } from 'react';
import { X, GitBranch, AlertCircle } from 'lucide-react';
import type { Task, TaskDependency } from '@/types/task';

interface DependencyGraphProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  dependencies: TaskDependency[];
}

interface GraphNode {
  id: string;
  task: Task;
  x: number;
  y: number;
  dependsOn: string[];
  blockedBy: string[];
}

export function DependencyGraph({ isOpen, onClose, tasks, dependencies }: DependencyGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [circularDeps, setCircularDeps] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen || tasks.length === 0) return;

    // Build graph nodes
    const graphNodes = buildGraphLayout(tasks, dependencies);
    setNodes(graphNodes);

    // Detect circular dependencies
    const circular = detectCircularDependencies(tasks, dependencies);
    setCircularDeps(circular);
  }, [isOpen, tasks, dependencies]);

  useEffect(() => {
    if (!isOpen || !canvasRef.current || nodes.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw edges first
    dependencies.forEach(dep => {
      const fromNode = nodes.find(n => n.id === dep.taskId);
      const toNode = nodes.find(n => n.id === dep.dependsOnTaskId);
      if (!fromNode || !toNode) return;

      drawEdge(ctx, fromNode, toNode, dep.dependencyType, circularDeps.includes(dep.id));
    });

    // Draw nodes
    nodes.forEach(node => {
      const isHovered = hoveredNode === node.id;
      drawNode(ctx, node, isHovered);
    });
  }, [nodes, hoveredNode, dependencies, circularDeps, isOpen]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
      return distance < 30;
    });

    if (clickedNode) {
      setHoveredNode(hoveredNode === clickedNode.id ? null : clickedNode.id);
    } else {
      setHoveredNode(null);
    }
  };

  if (!isOpen) return null;

  const hoveredTask = hoveredNode ? nodes.find(n => n.id === hoveredNode)?.task : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <GitBranch className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Task Dependencies
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Warnings */}
        {circularDeps.length > 0 && (
          <div className="mx-6 mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500" />
              <span className="font-semibold text-red-900 dark:text-red-200">
                Circular dependencies detected! ({circularDeps.length})
              </span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              These dependencies create cycles and should be resolved.
            </p>
          </div>
        )}

        {/* Graph Canvas */}
        <div className="flex-1 p-6 overflow-hidden">
          {tasks.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              No tasks to visualize
            </div>
          ) : dependencies.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              No dependencies defined yet
            </div>
          ) : (
            <div className="h-full relative">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="w-full h-full cursor-pointer"
                style={{ maxHeight: 'calc(90vh - 200px)' }}
              />

              {/* Legend */}
              <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm">
                <div className="font-semibold text-gray-900 dark:text-white mb-2">Legend</div>
                <div className="space-y-1 text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-blue-500" />
                    <span>Blocks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-orange-500" />
                    <span>Relates to</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-red-500" />
                    <span>Circular</span>
                  </div>
                </div>
              </div>

              {/* Task Info */}
              {hoveredTask && (
                <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-w-md shadow-lg">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    {hoveredTask.taskId}
                  </div>
                  <div className="text-base font-medium text-gray-900 dark:text-white mb-2">
                    {hoveredTask.title}
                  </div>
                  {hoveredTask.description && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {hoveredTask.description}
                    </div>
                  )}
                  <div className="flex gap-2 text-xs">
                    <span className={`px-2 py-1 rounded ${getStatusColor(hoveredTask.status)}`}>
                      {hoveredTask.status}
                    </span>
                    <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      Priority {hoveredTask.priority}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Click on a node to see details • {nodes.length} tasks • {dependencies.length} dependencies
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function buildGraphLayout(tasks: Task[], dependencies: TaskDependency[]): GraphNode[] {
  const nodes: GraphNode[] = [];

  // Build dependency map
  const depMap = new Map<string, { dependsOn: string[]; blockedBy: string[] }>();
  tasks.forEach(task => {
    depMap.set(task.id, { dependsOn: [], blockedBy: [] });
  });

  dependencies.forEach(dep => {
    const entry = depMap.get(dep.taskId);
    if (entry) {
      if (dep.dependencyType === 'blocks') {
        entry.dependsOn.push(dep.dependsOnTaskId);
      } else if (dep.dependencyType === 'blocked_by') {
        entry.blockedBy.push(dep.dependsOnTaskId);
      }
    }
  });

  // Simple force-directed layout
  const width = 800;
  const height = 600;
  const padding = 100;

  // Initial positions
  tasks.forEach((task, index) => {
    const angle = (index / tasks.length) * 2 * Math.PI;
    const radius = Math.min(width, height) / 3;
    const x = width / 2 + radius * Math.cos(angle);
    const y = height / 2 + radius * Math.sin(angle);

    const deps = depMap.get(task.id);
    nodes.push({
      id: task.id,
      task,
      x,
      y,
      dependsOn: deps?.dependsOn || [],
      blockedBy: deps?.blockedBy || []
    });
  });

  return nodes;
}

function drawNode(ctx: CanvasRenderingContext2D, node: GraphNode, isHovered: boolean) {
  const radius = isHovered ? 35 : 30;

  // Draw circle
  ctx.beginPath();
  ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = getNodeColor(node.task.status, node.task.priority, isHovered);
  ctx.fill();
  ctx.strokeStyle = isHovered ? '#6366f1' : '#e5e7eb';
  ctx.lineWidth = isHovered ? 3 : 2;
  ctx.stroke();

  // Draw task ID
  ctx.fillStyle = '#ffffff';
  ctx.font = isHovered ? 'bold 11px sans-serif' : '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(node.task.taskId, node.x, node.y);
}

function drawEdge(
  ctx: CanvasRenderingContext2D,
  from: GraphNode,
  to: GraphNode,
  type: string,
  isCircular: boolean
) {
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);

  if (isCircular) {
    ctx.strokeStyle = '#ef4444';
  } else if (type === 'blocks') {
    ctx.strokeStyle = '#3b82f6';
  } else {
    ctx.strokeStyle = '#f97316';
  }

  ctx.lineWidth = isCircular ? 3 : 2;
  ctx.stroke();

  // Draw arrow
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const arrowLength = 10;
  const arrowWidth = 6;

  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - arrowLength * Math.cos(angle - Math.PI / 6),
    to.y - arrowLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    to.x - arrowLength * Math.cos(angle + Math.PI / 6),
    to.y - arrowLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fill();
}

function getNodeColor(status: string, priority: number, isHovered: boolean): string {
  const baseColors: Record<string, string> = {
    'backlog': '#9ca3af',
    'in-progress': '#3b82f6',
    'review': '#f59e0b',
    'done': '#10b981'
  };

  const color = baseColors[status] || '#9ca3af';

  if (isHovered) {
    return color;
  }

  // Dim non-hovered nodes slightly
  return color + 'dd';
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'backlog': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    'in-progress': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    'review': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    'done': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
  };
  return colors[status] || colors.backlog;
}

function detectCircularDependencies(tasks: Task[], dependencies: TaskDependency[]): string[] {
  const circular: string[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  // Build adjacency list
  const graph = new Map<string, string[]>();
  tasks.forEach(task => graph.set(task.id, []));
  dependencies.forEach(dep => {
    const edges = graph.get(dep.taskId);
    if (edges) edges.push(dep.dependsOnTaskId);
  });

  function hasCycle(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const dep = dependencies.find(
          d => d.taskId === nodeId && d.dependsOnTaskId === neighbor
        );
        if (dep) circular.push(dep.id);
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  tasks.forEach(task => {
    if (!visited.has(task.id)) {
      hasCycle(task.id);
    }
  });

  return circular;
}
