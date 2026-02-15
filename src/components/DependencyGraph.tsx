'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Task } from '@/types/task';
import { TaskDependency } from '@/types/taskBreakdown';
import { X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onClose?: () => void;
}

interface NodePosition {
  x: number;
  y: number;
}

export function DependencyGraph({ tasks, dependencies, onClose }: DependencyGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const nodePositions = useRef<Map<string, NodePosition>>(new Map());

  useEffect(() => {
    calculateNodePositions();
    drawGraph();
  }, [tasks, dependencies, zoom, pan, hoveredNode]);

  const calculateNodePositions = () => {
    const positions = new Map<string, NodePosition>();
    const width = canvasRef.current?.width || 800;
    const height = canvasRef.current?.height || 600;

    // Group tasks by status for column layout
    const statusColumns = {
      'backlog': tasks.filter(t => t.status === 'backlog'),
      'in-progress': tasks.filter(t => t.status === 'in-progress'),
      'review': tasks.filter(t => t.status === 'review'),
      'done': tasks.filter(t => t.status === 'done'),
    };

    const columnWidth = width / 4;
    const padding = 100;

    Object.entries(statusColumns).forEach(([status, columnTasks], colIndex) => {
      const x = padding + colIndex * columnWidth;
      const verticalSpacing = (height - 2 * padding) / (columnTasks.length + 1);

      columnTasks.forEach((task, rowIndex) => {
        positions.set(task.id, {
          x,
          y: padding + (rowIndex + 1) * verticalSpacing,
        });
      });
    });

    nodePositions.current = positions;
  };

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw dependencies (edges)
    dependencies.forEach(dep => {
      const sourcePos = nodePositions.current.get(dep.sourceTaskId);
      const targetPos = nodePositions.current.get(dep.targetTaskId);

      if (sourcePos && targetPos) {
        drawEdge(ctx, sourcePos, targetPos, dep.type);
      }
    });

    // Draw tasks (nodes)
    tasks.forEach(task => {
      const pos = nodePositions.current.get(task.id);
      if (pos) {
        drawNode(ctx, task, pos, task.id === hoveredNode);
      }
    });

    ctx.restore();
  };

  const drawEdge = (
    ctx: CanvasRenderingContext2D,
    from: NodePosition,
    to: NodePosition,
    type: string
  ) => {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);

    // Bezier curve for smooth connections
    const midX = (from.x + to.x) / 2;
    ctx.bezierCurveTo(midX, from.y, midX, to.y, to.x, to.y);

    // Color based on dependency type
    const colors = {
      'blocks': '#ef4444',
      'depends-on': '#3b82f6',
      'related-to': '#6b7280',
    };
    ctx.strokeStyle = colors[type as keyof typeof colors] || '#6b7280';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw arrow
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const arrowSize = 10;
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(
      to.x - arrowSize * Math.cos(angle - Math.PI / 6),
      to.y - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      to.x - arrowSize * Math.cos(angle + Math.PI / 6),
      to.y - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  };

  const drawNode = (
    ctx: CanvasRenderingContext2D,
    task: Task,
    pos: NodePosition,
    isHovered: boolean
  ) => {
    const nodeWidth = 120;
    const nodeHeight = 60;
    const x = pos.x - nodeWidth / 2;
    const y = pos.y - nodeHeight / 2;

    // Draw node background
    ctx.fillStyle = isHovered ? '#f3f4f6' : '#ffffff';
    ctx.strokeStyle = isHovered ? '#3b82f6' : '#d1d5db';
    ctx.lineWidth = isHovered ? 3 : 2;

    ctx.beginPath();
    ctx.roundRect(x, y, nodeWidth, nodeHeight, 8);
    ctx.fill();
    ctx.stroke();

    // Draw task ID
    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(task.taskId, pos.x, pos.y - 10);

    // Draw task title (truncated)
    ctx.fillStyle = '#1f2937';
    ctx.font = '11px sans-serif';
    const title = task.title.length > 15 ? task.title.substring(0, 15) + '...' : task.title;
    ctx.fillText(title, pos.x, pos.y + 5);

    // Draw priority indicator
    const priorityColors = ['#10b981', '#84cc16', '#fbbf24', '#fb923c', '#ef4444'];
    ctx.fillStyle = priorityColors[task.priority - 1];
    ctx.beginPath();
    ctx.arc(x + nodeWidth - 10, y + 10, 4, 0, 2 * Math.PI);
    ctx.fill();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else {
      // Check for node hover
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;

      let foundNode: string | null = null;
      for (const [taskId, pos] of nodePositions.current.entries()) {
        const dx = x - pos.x;
        const dy = y - pos.y;
        if (Math.abs(dx) < 60 && Math.abs(dy) < 30) {
          foundNode = taskId;
          break;
        }
      }
      setHoveredNode(foundNode);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-[90%] h-[90%] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Task Dependency Graph
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Depends On</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Blocks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-gray-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Related To</span>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            width={1200}
            height={800}
            className="w-full h-full cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />

          {/* Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <button
              onClick={handleZoomIn}
              className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              title="Reset View"
            >
              <Maximize2 size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Zoom indicator */}
          <div className="absolute bottom-4 left-4 px-3 py-1 bg-white dark:bg-gray-700 rounded-lg shadow-lg text-sm text-gray-600 dark:text-gray-400">
            {(zoom * 100).toFixed(0)}%
          </div>
        </div>

        {/* Footer info */}
        {hoveredNode && (
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
            {tasks.find(t => t.id === hoveredNode)?.title}
          </div>
        )}
      </div>
    </div>
  );
}
