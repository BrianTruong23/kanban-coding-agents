'use client';

import { Task } from '@/types/task';
import { Dependency } from '@/types/breakdown';
import { useEffect, useRef, useState } from 'react';
import { GitBranch, AlertCircle, Link2 } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: Dependency[];
  onTaskClick?: (taskId: string) => void;
}

interface GraphNode {
  id: string;
  task: Task;
  x: number;
  y: number;
  dependsOn: string[];
  blocks: string[];
}

export const DependencyGraph = ({ tasks, dependencies, onTaskClick }: DependencyGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [nodes, setNodes] = useState<GraphNode[]>([]);

  useEffect(() => {
    // Build graph nodes
    const graphNodes: GraphNode[] = tasks.map((task, index) => {
      const dependsOn = dependencies
        .filter((d) => d.toTaskId === task.id)
        .map((d) => d.fromTaskId);
      const blocks = dependencies
        .filter((d) => d.fromTaskId === task.id && d.type === 'blocks')
        .map((d) => d.toTaskId);

      return {
        id: task.id,
        task,
        x: 0,
        y: 0,
        dependsOn,
        blocks,
      };
    });

    // Simple layout algorithm (hierarchical)
    layoutNodes(graphNodes, dependencies);
    setNodes(graphNodes);
  }, [tasks, dependencies]);

  useEffect(() => {
    if (viewMode === 'graph' && canvasRef.current && nodes.length > 0) {
      drawGraph();
    }
  }, [nodes, selectedNode, viewMode]);

  const layoutNodes = (graphNodes: GraphNode[], deps: Dependency[]) => {
    if (graphNodes.length === 0) return;

    // Calculate levels (topological sort)
    const levels = new Map<string, number>();
    const visited = new Set<string>();

    const calculateLevel = (nodeId: string, deps: Dependency[]): number => {
      if (levels.has(nodeId)) return levels.get(nodeId)!;
      if (visited.has(nodeId)) return 0; // Circular dependency

      visited.add(nodeId);

      const dependencies = deps.filter((d) => d.toTaskId === nodeId);
      if (dependencies.length === 0) {
        levels.set(nodeId, 0);
        return 0;
      }

      const maxLevel = Math.max(
        ...dependencies.map((d) => calculateLevel(d.fromTaskId, deps))
      );
      const level = maxLevel + 1;
      levels.set(nodeId, level);
      return level;
    };

    graphNodes.forEach((node) => calculateLevel(node.id, deps));

    // Group by level
    const levelGroups = new Map<number, GraphNode[]>();
    graphNodes.forEach((node) => {
      const level = levels.get(node.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(node);
    });

    // Position nodes
    const nodeWidth = 180;
    const nodeHeight = 80;
    const horizontalSpacing = 220;
    const verticalSpacing = 120;

    levelGroups.forEach((nodesInLevel, level) => {
      const totalWidth = nodesInLevel.length * horizontalSpacing;
      const startX = 50;

      nodesInLevel.forEach((node, index) => {
        node.x = startX + index * horizontalSpacing;
        node.y = 50 + level * verticalSpacing;
      });
    });
  };

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = Math.max(400, (Math.max(...nodes.map((n) => n.y)) + 100));

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges first (so they appear behind nodes)
    dependencies.forEach((dep) => {
      const fromNode = nodes.find((n) => n.id === dep.fromTaskId);
      const toNode = nodes.find((n) => n.id === dep.toTaskId);

      if (fromNode && toNode) {
        drawEdge(ctx, fromNode, toNode, dep.type);
      }
    });

    // Draw nodes
    nodes.forEach((node) => {
      drawNode(ctx, node, node.id === selectedNode);
    });
  };

  const drawNode = (ctx: CanvasRenderingContext2D, node: GraphNode, selected: boolean) => {
    const width = 160;
    const height = 70;

    // Node background
    ctx.fillStyle = selected ? '#3b82f6' : getStatusColor(node.task.status);
    ctx.strokeStyle = selected ? '#1d4ed8' : '#d1d5db';
    ctx.lineWidth = selected ? 3 : 1;

    roundRect(ctx, node.x, node.y, width, height, 8);
    ctx.fill();
    ctx.stroke();

    // Task ID
    ctx.fillStyle = selected ? '#ffffff' : '#111827';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(node.task.taskId, node.x + 8, node.y + 18);

    // Task title (truncated)
    ctx.fillStyle = selected ? '#ffffff' : '#374151';
    ctx.font = '12px sans-serif';
    const title = truncate(node.task.title, 20);
    ctx.fillText(title, node.x + 8, node.y + 35);

    // Priority badge
    ctx.fillStyle = getPriorityColor(node.task.priority);
    ctx.fillRect(node.x + 8, node.y + 45, 6, 6);

    // Status text
    ctx.fillStyle = selected ? '#ffffff' : '#6b7280';
    ctx.font = '10px sans-serif';
    ctx.fillText(node.task.status, node.x + 20, node.y + 51);
  };

  const drawEdge = (
    ctx: CanvasRenderingContext2D,
    from: GraphNode,
    to: GraphNode,
    type: string
  ) => {
    const fromX = from.x + 80;
    const fromY = from.y + 70;
    const toX = to.x + 80;
    const toY = to.y;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);

    // Draw bezier curve for better visibility
    const controlY = fromY + (toY - fromY) / 2;
    ctx.bezierCurveTo(fromX, controlY, toX, controlY, toX, toY);

    ctx.strokeStyle = type === 'blocks' ? '#ef4444' : '#9ca3af';
    ctx.lineWidth = type === 'blocks' ? 2 : 1;
    ctx.setLineDash(type === 'related-to' ? [5, 5] : []);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw arrow
    drawArrow(ctx, toX, toY, Math.atan2(toY - controlY, toX - toX));
  };

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number
  ) => {
    const headLength = 8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
      x - headLength * Math.cos(angle - Math.PI / 6),
      y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(x, y);
    ctx.lineTo(
      x - headLength * Math.cos(angle + Math.PI / 6),
      y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      backlog: '#f3f4f6',
      'in-progress': '#fef3c7',
      review: '#dbeafe',
      done: '#d1fae5',
    };
    return colors[status] || '#f3f4f6';
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return '#ef4444';
    if (priority >= 4) return '#f97316';
    if (priority >= 3) return '#eab308';
    return '#22c55e';
  };

  const truncate = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if click is on a node
    const clickedNode = nodes.find(
      (node) =>
        x >= node.x &&
        x <= node.x + 160 &&
        y >= node.y &&
        y <= node.y + 70
    );

    if (clickedNode) {
      setSelectedNode(clickedNode.id);
      if (onTaskClick) {
        onTaskClick(clickedNode.id);
      }
    } else {
      setSelectedNode(null);
    }
  };

  const getDependencyList = () => {
    const list: Array<{
      from: Task;
      to: Task;
      type: string;
    }> = [];

    dependencies.forEach((dep) => {
      const from = tasks.find((t) => t.id === dep.fromTaskId);
      const to = tasks.find((t) => t.id === dep.toTaskId);
      if (from && to) {
        list.push({ from, to, type: dep.type });
      }
    });

    return list;
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <GitBranch className="mx-auto mb-4" size={48} />
        <p>No tasks to visualize</p>
      </div>
    );
  }

  if (dependencies.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <Link2 className="mx-auto mb-4" size={48} />
        <p>No dependencies defined</p>
        <p className="text-sm mt-2">Create dependencies to see the graph</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {/* View Mode Toggle */}
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Task Dependencies
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('graph')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              viewMode === 'graph'
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <GitBranch size={16} className="inline mr-1" />
            Graph
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Graph View */}
      {viewMode === 'graph' && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-auto">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-full cursor-pointer"
            style={{ minHeight: '400px' }}
          />
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {getDependencyList().map((dep, index) => (
            <div
              key={index}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900 dark:text-white">
                    {dep.from.taskId}: {dep.from.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {dep.from.status}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {dep.type === 'blocks' && (
                    <span className="text-red-500 text-xs font-semibold px-2 py-0.5 bg-red-50 dark:bg-red-900/30 rounded">
                      BLOCKS
                    </span>
                  )}
                  {dep.type === 'depends-on' && (
                    <span className="text-blue-500 text-xs font-semibold px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 rounded">
                      DEPENDS ON
                    </span>
                  )}
                  {dep.type === 'related-to' && (
                    <span className="text-gray-500 text-xs font-semibold px-2 py-0.5 bg-gray-50 dark:bg-gray-700 rounded">
                      RELATED
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900 dark:text-white">
                    {dep.to.taskId}: {dep.to.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {dep.to.status}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-2">
          Legend
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-red-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Blocks (critical path)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-gray-400"></div>
            <span className="text-gray-700 dark:text-gray-300">Depends on</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-gray-400 border-dashed"></div>
            <span className="text-gray-700 dark:text-gray-300">Related to</span>
          </div>
        </div>
      </div>
    </div>
  );
};
