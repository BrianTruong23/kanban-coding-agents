'use client';

import { useEffect, useRef, useState } from 'react';
import { Task } from '@/types/task';
import { TaskDependency, DependencyType } from '@/types/dependency';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onClose?: () => void;
}

interface GraphNode {
  id: string;
  task: Task;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const DependencyGraph = ({ tasks, dependencies, onClose }: DependencyGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    // Create a map of task IDs to tasks
    const taskMap = new Map(tasks.map((t) => [t.id, t]));

    // Calculate node positions using a simple force-directed layout
    const nodeWidth = 180;
    const nodeHeight = 80;
    const padding = 40;

    // Group tasks by status for initial layout
    const statusGroups: Record<string, Task[]> = {
      backlog: [],
      'in-progress': [],
      review: [],
      done: [],
    };

    tasks.forEach((task) => {
      if (statusGroups[task.status]) {
        statusGroups[task.status].push(task);
      }
    });

    // Calculate positions
    const graphNodes: GraphNode[] = [];
    let columnX = padding;
    const statusColumns = ['backlog', 'in-progress', 'review', 'done'];

    statusColumns.forEach((status) => {
      const columnTasks = statusGroups[status];
      let rowY = padding;

      columnTasks.forEach((task) => {
        graphNodes.push({
          id: task.id,
          task,
          x: columnX,
          y: rowY,
          width: nodeWidth,
          height: nodeHeight,
        });
        rowY += nodeHeight + 20;
      });

      columnX += nodeWidth + 60;
    });

    setNodes(graphNodes);
  }, [tasks]);

  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw dependencies (edges) first
    dependencies.forEach((dep) => {
      const fromNode = nodes.find((n) => n.id === dep.dependsOnTaskId);
      const toNode = nodes.find((n) => n.id === dep.taskId);

      if (fromNode && toNode) {
        drawEdge(ctx, fromNode, toNode, dep.dependencyType);
      }
    });

    // Draw nodes
    nodes.forEach((node) => {
      const isHovered = hoveredNode === node.id;
      drawNode(ctx, node, isHovered);
    });
  }, [nodes, dependencies, hoveredNode]);

  const drawNode = (ctx: CanvasRenderingContext2D, node: GraphNode, isHovered: boolean) => {
    const { x, y, width, height, task } = node;

    // Shadow for hover
    if (isHovered) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
    }

    // Background
    ctx.fillStyle = getStatusColor(task.status);
    ctx.strokeStyle = isHovered ? '#000' : '#ccc';
    ctx.lineWidth = isHovered ? 3 : 1;

    // Rounded rectangle
    roundRect(ctx, x, y, width, height, 8);
    ctx.fill();
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Task ID
    ctx.fillStyle = '#666';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(task.taskId, x + 8, y + 18);

    // Title (truncated)
    ctx.fillStyle = '#000';
    ctx.font = '12px sans-serif';
    const maxWidth = width - 16;
    let title = task.title;
    if (ctx.measureText(title).width > maxWidth) {
      while (ctx.measureText(title + '...').width > maxWidth && title.length > 0) {
        title = title.substring(0, title.length - 1);
      }
      title += '...';
    }
    ctx.fillText(title, x + 8, y + 35);

    // Priority indicator
    const priorityColors = ['#10b981', '#84cc16', '#fbbf24', '#f97316', '#ef4444'];
    ctx.fillStyle = priorityColors[task.priority - 1] || '#fbbf24';
    ctx.beginPath();
    ctx.arc(x + width - 15, y + 15, 6, 0, Math.PI * 2);
    ctx.fill();

    // Risk indicator removed - riskLevel is not part of Task type

    // Assigned agent indicator
    if (task.assignedAgentId) {
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x + width - 15, y + height - 15, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawEdge = (
    ctx: CanvasRenderingContext2D,
    fromNode: GraphNode,
    toNode: GraphNode,
    type: DependencyType
  ) => {
    const fromX = fromNode.x + fromNode.width;
    const fromY = fromNode.y + fromNode.height / 2;
    const toX = toNode.x;
    const toY = toNode.y + toNode.height / 2;

    // Line style based on dependency type
    ctx.strokeStyle = type === 'blocks' ? '#ef4444' : type === 'related' ? '#3b82f6' : '#9ca3af';
    ctx.lineWidth = type === 'blocks' ? 2 : 1;

    if (type === 'related' || type === 'duplicate') {
      ctx.setLineDash([5, 5]);
    } else {
      ctx.setLineDash([]);
    }

    // Draw curved line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);

    const midX = (fromX + toX) / 2;
    ctx.bezierCurveTo(midX, fromY, midX, toY, toX, toY);
    ctx.stroke();

    // Draw arrow head
    const arrowSize = 8;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - arrowSize * Math.cos(angle - Math.PI / 6),
      toY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - arrowSize * Math.cos(angle + Math.PI / 6),
      toY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();

    ctx.setLineDash([]);
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
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      backlog: '#f3f4f6',
      'in-progress': '#dbeafe',
      review: '#fef3c7',
      done: '#d1fae5',
    };
    return colors[status] || '#f3f4f6';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if hovering over any node
    const hoveredNode = nodes.find(
      (node) => x >= node.x && x <= node.x + node.width && y >= node.y && y <= node.y + node.height
    );

    setHoveredNode(hoveredNode?.id || null);
  };

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No tasks to visualize
      </div>
    );
  }

  return (
    <div
      className={`${
        isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : 'relative'
      } flex flex-col`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Task Dependencies</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tasks.length} tasks, {dependencies.length} dependencies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 text-xs bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-red-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Blocks</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 border-t-2 border-dashed border-blue-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Related</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Has agent</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-yellow-500">⚠</span>
          <span className="text-gray-600 dark:text-gray-400">Has risk</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-white dark:bg-gray-900">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          className="w-full h-full cursor-pointer"
          style={{ minHeight: isFullscreen ? '100%' : '500px' }}
        />
      </div>
    </div>
  );
};
