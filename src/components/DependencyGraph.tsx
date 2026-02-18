'use client';

import { useEffect, useRef, useState } from 'react';
import { Task } from '@/types/task';
import { X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  onClose: () => void;
  onTaskClick?: (taskId: string) => void;
}

interface Node {
  id: string;
  taskId: string;
  title: string;
  type: string;
  status: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Edge {
  from: string;
  to: string;
  type: 'blocks' | 'blocked-by' | 'relates-to';
}

export const DependencyGraph = ({ tasks, onClose, onTaskClick }: DependencyGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Helper functions
  const getNodeColor = (type: string, status: string): string => {
    const statusColors: Record<string, string> = {
      'backlog': '#f3f4f6',
      'in-progress': '#dbeafe',
      'review': '#fef3c7',
      'done': '#d1fae5',
    };
    return statusColors[status] || '#ffffff';
  };

  const getTypeBadgeColor = (type: string): string => {
    const typeColors: Record<string, string> = {
      epic: '#9333ea',
      story: '#3b82f6',
      task: '#10b981',
      subtask: '#f59e0b',
      bug: '#ef4444',
    };
    return typeColors[type] || '#6b7280';
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  // Build graph data
  const nodes: Node[] = tasks.map((task, index) => ({
    id: task.id,
    taskId: task.taskId,
    title: task.title,
    type: task.type || 'task',
    status: task.status,
    x: 0,
    y: 0,
    width: 200,
    height: 80,
  }));

  const edges: Edge[] = [];
  tasks.forEach(task => {
    if (task.dependencies) {
      task.dependencies.forEach(dep => {
        edges.push({
          from: dep.type === 'blocked-by' ? dep.taskId : task.id,
          to: dep.type === 'blocked-by' ? task.id : dep.taskId,
          type: dep.type,
        });
      });
    }
  });

  // Simple force-directed layout
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // Layout algorithm - hierarchical by task type
    const typeOrder: Record<string, number> = {
      epic: 0,
      story: 1,
      task: 2,
      subtask: 3,
      bug: 2,
    };

    const levelGroups = new Map<number, Node[]>();
    nodes.forEach(node => {
      const level = typeOrder[node.type] || 2;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(node);
    });

    const levelSpacing = 200;
    const nodeSpacing = 250;
    const startY = 100;

    let maxWidth = 0;
    levelGroups.forEach((levelNodes, level) => {
      const totalWidth = levelNodes.length * nodeSpacing;
      maxWidth = Math.max(maxWidth, totalWidth);
      const startX = (canvas.width - totalWidth) / 2 + nodeSpacing / 2;

      levelNodes.forEach((node, index) => {
        node.x = startX + index * nodeSpacing;
        node.y = startY + level * levelSpacing;
      });
    });

    // Draw function
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply transformations
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Draw edges first
      edges.forEach(edge => {
        const fromNode = nodes.find(n => n.id === edge.from);
        const toNode = nodes.find(n => n.id === edge.to);

        if (fromNode && toNode) {
          ctx.beginPath();
          ctx.moveTo(fromNode.x + fromNode.width / 2, fromNode.y + fromNode.height);

          // Bezier curve for better visibility
          const midY = (fromNode.y + fromNode.height + toNode.y) / 2;
          ctx.bezierCurveTo(
            fromNode.x + fromNode.width / 2, midY,
            toNode.x + toNode.width / 2, midY,
            toNode.x + toNode.width / 2, toNode.y
          );

          // Style based on edge type
          if (edge.type === 'blocks') {
            ctx.strokeStyle = '#ef4444'; // red
            ctx.lineWidth = 2;
          } else if (edge.type === 'relates-to') {
            ctx.strokeStyle = '#94a3b8'; // gray
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
          } else {
            ctx.strokeStyle = '#3b82f6'; // blue
            ctx.lineWidth = 2;
          }

          ctx.stroke();
          ctx.setLineDash([]);

          // Draw arrowhead
          const angle = Math.atan2(
            toNode.y - (fromNode.y + fromNode.height),
            toNode.x + toNode.width / 2 - (fromNode.x + fromNode.width / 2)
          );
          const arrowSize = 8;
          ctx.beginPath();
          ctx.moveTo(toNode.x + toNode.width / 2, toNode.y);
          ctx.lineTo(
            toNode.x + toNode.width / 2 - arrowSize * Math.cos(angle - Math.PI / 6),
            toNode.y - arrowSize * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            toNode.x + toNode.width / 2 - arrowSize * Math.cos(angle + Math.PI / 6),
            toNode.y - arrowSize * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fill();
        }
      });

      // Draw nodes
      nodes.forEach(node => {
        const isHovered = hoveredNode === node.id;

        // Node background
        ctx.fillStyle = getNodeColor(node.type, node.status);
        ctx.fillRect(node.x, node.y, node.width, node.height);

        // Node border
        ctx.strokeStyle = isHovered ? '#000000' : '#e5e7eb';
        ctx.lineWidth = isHovered ? 3 : 1;
        ctx.strokeRect(node.x, node.y, node.width, node.height);

        // Task ID
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(node.taskId, node.x + 8, node.y + 18);

        // Task title
        ctx.fillStyle = '#111827';
        ctx.font = '13px sans-serif';
        const maxWidth = node.width - 16;
        const titleLines = wrapText(ctx, node.title, maxWidth);
        titleLines.slice(0, 2).forEach((line, i) => {
          ctx.fillText(line, node.x + 8, node.y + 35 + i * 16);
        });

        // Type badge
        ctx.fillStyle = getTypeBadgeColor(node.type);
        ctx.fillRect(node.x + node.width - 60, node.y + node.height - 22, 52, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(node.type.toUpperCase(), node.x + node.width - 56, node.y + node.height - 11);
      });

      ctx.restore();
    };

    draw();
  }, [tasks, zoom, pan, hoveredNode]);

  const getNodeColor = (type: string, status: string): string => {
    const statusColors: Record<string, string> = {
      'backlog': '#f3f4f6',
      'in-progress': '#dbeafe',
      'review': '#fef3c7',
      'done': '#d1fae5',
    };
    return statusColors[status] || '#ffffff';
  };

  const getTypeBadgeColor = (type: string): string => {
    const typeColors: Record<string, string> = {
      epic: '#9333ea',
      story: '#3b82f6',
      task: '#10b981',
      subtask: '#f59e0b',
      bug: '#ef4444',
    };
    return typeColors[type] || '#6b7280';
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else {
      // Check for hover
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;

      const hovered = nodes.find(node =>
        x >= node.x && x <= node.x + node.width &&
        y >= node.y && y <= node.y + node.height
      );

      setHoveredNode(hovered ? hovered.id : null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full h-full max-w-7xl max-h-[90vh] m-4 overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Task Dependency Graph</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Visual representation of task relationships and dependencies
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative bg-gray-50 dark:bg-gray-900">
          <canvas
            ref={canvasRef}
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
              className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Reset View"
            >
              <Maximize2 size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
            <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Legend</div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#9333ea' }}></div>
                <span className="text-gray-600 dark:text-gray-400">Epic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
                <span className="text-gray-600 dark:text-gray-400">Story</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }}></div>
                <span className="text-gray-600 dark:text-gray-400">Task</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
                <span className="text-gray-600 dark:text-gray-400">Subtask</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Drag to pan • Scroll to zoom • {nodes.length} tasks • {edges.length} dependencies
          </div>
        </div>
      </div>
    </div>
  );
};
