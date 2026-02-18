'use client';

import { useEffect, useRef, useState } from 'react';
import { Task } from '@/types/task';
import { TaskDependency } from '@/types/dependencies';
import { Network, GitFork, AlertCircle, X } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onClose?: () => void;
}

interface Node {
  id: string;
  taskId: string;
  title: string;
  status: Task['status'];
  x: number;
  y: number;
}

interface Edge {
  source: string;
  target: string;
  type: TaskDependency['type'];
}

export const DependencyGraph = ({ tasks, dependencies, onClose }: DependencyGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    // Build graph data structure
    const graphNodes: Node[] = [];
    const graphEdges: Edge[] = [];

    // Create nodes from tasks that have dependencies
    const tasksWithDeps = new Set<string>();
    dependencies.forEach(dep => {
      tasksWithDeps.add(dep.sourceTaskId);
      tasksWithDeps.add(dep.targetTaskId);
    });

    const relevantTasks = tasks.filter(t => tasksWithDeps.has(t.id));

    // Simple grid layout
    const cols = Math.ceil(Math.sqrt(relevantTasks.length));
    const spacing = 180;

    relevantTasks.forEach((task, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;

      graphNodes.push({
        id: task.id,
        taskId: task.taskId,
        title: task.title,
        status: task.status,
        x: col * spacing + 100,
        y: row * spacing + 100,
      });
    });

    // Create edges
    dependencies.forEach(dep => {
      graphEdges.push({
        source: dep.sourceTaskId,
        target: dep.targetTaskId,
        type: dep.type,
      });
    });

    setNodes(graphNodes);
    setEdges(graphEdges);
  }, [tasks, dependencies]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges first
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);

      if (!sourceNode || !targetNode) return;

      // Draw arrow
      drawArrow(
        ctx,
        sourceNode.x + 60,
        sourceNode.y + 20,
        targetNode.x,
        targetNode.y + 20,
        edge.type
      );
    });

    // Draw nodes
    nodes.forEach(node => {
      const isHovered = hoveredNode === node.id;
      const isSelected = selectedNode?.id === node.id;

      drawNode(ctx, node, isHovered, isSelected);
    });
  }, [nodes, edges, hoveredNode, selectedNode]);

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    type: TaskDependency['type']
  ) => {
    const headlen = 10;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    // Different colors for different dependency types
    const colors: Record<TaskDependency['type'], string> = {
      'blocks': '#ef4444',
      'blocked-by': '#f59e0b',
      'relates-to': '#3b82f6',
      'duplicates': '#8b5cf6',
    };

    ctx.strokeStyle = colors[type] || '#6b7280';
    ctx.lineWidth = 2;

    // Draw line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headlen * Math.cos(angle - Math.PI / 6),
      y2 - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headlen * Math.cos(angle + Math.PI / 6),
      y2 - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();

    // Draw label
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    ctx.fillStyle = colors[type];
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(type, midX, midY - 5);
  };

  const drawNode = (
    ctx: CanvasRenderingContext2D,
    node: Node,
    isHovered: boolean,
    isSelected: boolean
  ) => {
    const nodeWidth = 120;
    const nodeHeight = 40;

    // Status colors
    const statusColors: Record<Task['status'], { bg: string; border: string }> = {
      'backlog': { bg: '#f3f4f6', border: '#d1d5db' },
      'in-progress': { bg: '#dbeafe', border: '#3b82f6' },
      'review': { bg: '#fef3c7', border: '#f59e0b' },
      'done': { bg: '#d1fae5', border: '#10b981' },
    };

    const colors = statusColors[node.status];

    // Shadow for hover/select
    if (isHovered || isSelected) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }

    // Draw node background
    ctx.fillStyle = colors.bg;
    ctx.fillRect(node.x, node.y, nodeWidth, nodeHeight);

    // Draw border
    ctx.strokeStyle = isSelected ? '#8b5cf6' : colors.border;
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.strokeRect(node.x, node.y, nodeWidth, nodeHeight);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw task ID
    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(node.taskId, node.x + 5, node.y + 15);

    // Draw title (truncated)
    ctx.fillStyle = '#1f2937';
    ctx.font = '11px sans-serif';
    const maxWidth = nodeWidth - 10;
    let title = node.title;
    if (ctx.measureText(title).width > maxWidth) {
      while (ctx.measureText(title + '...').width > maxWidth && title.length > 0) {
        title = title.slice(0, -1);
      }
      title += '...';
    }
    ctx.fillText(title, node.x + 5, node.y + 30);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if click is on a node
    const clickedNode = nodes.find(
      node =>
        x >= node.x &&
        x <= node.x + 120 &&
        y >= node.y &&
        y <= node.y + 40
    );

    setSelectedNode(clickedNode || null);
  };

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if hovering over a node
    const hoveredNode = nodes.find(
      node =>
        x >= node.x &&
        x <= node.x + 120 &&
        y >= node.y &&
        y <= node.y + 40
    );

    setHoveredNode(hoveredNode?.id || null);
  };

  if (nodes.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            No Dependencies Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There are currently no task dependencies to visualize. Create dependencies between tasks to see them here.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Network size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Task Dependencies
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Visualize relationships and blockers between tasks
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Graph Canvas */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
          <canvas
            ref={canvasRef}
            className="w-full h-full min-h-[500px] cursor-pointer"
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMove}
          />
        </div>

        {/* Legend */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-red-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Blocks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-amber-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Blocked By</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-blue-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Relates To</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-purple-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Duplicates</span>
              </div>
            </div>
            {selectedNode && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Selected: <span className="font-semibold">{selectedNode.taskId}</span> - {selectedNode.title}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
