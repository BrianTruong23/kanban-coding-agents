'use client';

import { useEffect, useRef, useState } from 'react';
import { Task, TaskDependency } from '@/types/task';
import { X, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onClose: () => void;
}

interface GraphNode {
  id: string;
  task: Task;
  x: number;
  y: number;
  level: number;
}

interface GraphEdge {
  from: string;
  to: string;
  type: string;
}

export const DependencyGraph = ({ tasks, dependencies, onClose }: DependencyGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    // Build graph structure
    buildGraph();
  }, [tasks, dependencies]);

  useEffect(() => {
    // Render graph whenever nodes, zoom, or pan changes
    renderGraph();
  }, [nodes, edges, zoom, pan, hoveredNode]);

  const buildGraph = () => {
    // Create nodes from tasks
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    // Build dependency map
    const depMap = new Map<string, string[]>();
    dependencies.forEach(dep => {
      if (!depMap.has(dep.taskId)) {
        depMap.set(dep.taskId, []);
      }
      depMap.get(dep.taskId)!.push(dep.dependsOnTaskId);
    });

    // Calculate levels (topological sort)
    const levels = new Map<string, number>();
    const visited = new Set<string>();

    const calculateLevel = (taskId: string): number => {
      if (levels.has(taskId)) return levels.get(taskId)!;
      if (visited.has(taskId)) return 0; // Circular dependency

      visited.add(taskId);
      const deps = depMap.get(taskId) || [];
      const maxDepLevel = deps.reduce((max, depId) => {
        return Math.max(max, calculateLevel(depId));
      }, -1);

      const level = maxDepLevel + 1;
      levels.set(taskId, level);
      return level;
    };

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
    const nodeWidth = 200;
    const nodeHeight = 80;
    const levelGap = 250;
    const nodeGap = 100;

    const newNodes: GraphNode[] = [];
    levelGroups.forEach((tasksInLevel, level) => {
      const levelHeight = tasksInLevel.length * (nodeHeight + nodeGap);
      tasksInLevel.forEach((task, index) => {
        newNodes.push({
          id: task.id,
          task,
          x: level * levelGap,
          y: index * (nodeHeight + nodeGap) - levelHeight / 2,
          level
        });
      });
    });

    // Create edges
    const newEdges: GraphEdge[] = dependencies.map(dep => ({
      from: dep.dependsOnTaskId,
      to: dep.taskId,
      type: dep.dependencyType
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const renderGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
    ctx.scale(zoom, zoom);

    // Draw edges first
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);

      if (fromNode && toNode) {
        drawEdge(ctx, fromNode, toNode, edge.type);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      drawNode(ctx, node, node.id === hoveredNode);
    });

    ctx.restore();
  };

  const drawEdge = (ctx: CanvasRenderingContext2D, from: GraphNode, to: GraphNode, type: string) => {
    const nodeWidth = 200;
    const nodeHeight = 80;

    const fromX = from.x + nodeWidth;
    const fromY = from.y + nodeHeight / 2;
    const toX = to.x;
    const toY = to.y + nodeHeight / 2;

    // Draw curved line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);

    const controlPointOffset = Math.abs(toX - fromX) / 2;
    ctx.bezierCurveTo(
      fromX + controlPointOffset, fromY,
      toX - controlPointOffset, toY,
      toX, toY
    );

    // Style based on dependency type
    if (type === 'blocked_by') {
      ctx.strokeStyle = '#ef4444'; // red
      ctx.lineWidth = 2;
    } else if (type === 'blocks') {
      ctx.strokeStyle = '#f59e0b'; // amber
      ctx.lineWidth = 2;
    } else {
      ctx.strokeStyle = '#6b7280'; // gray
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
    }

    ctx.stroke();
    ctx.setLineDash([]);

    // Draw arrow
    const arrowSize = 10;
    const angle = Math.atan2(toY - fromY, -controlPointOffset);
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX + arrowSize * Math.cos(angle - Math.PI / 6),
      toY + arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX + arrowSize * Math.cos(angle + Math.PI / 6),
      toY + arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  };

  const drawNode = (ctx: CanvasRenderingContext2D, node: GraphNode, isHovered: boolean) => {
    const width = 200;
    const height = 80;
    const { x, y, task } = node;

    // Node background
    const bgColors: Record<string, string> = {
      epic: '#9333ea',
      ticket: '#3b82f6',
      subtask: '#10b981'
    };

    ctx.fillStyle = task.taskType ? bgColors[task.taskType] || '#6b7280' : '#6b7280';
    ctx.strokeStyle = isHovered ? '#fff' : 'transparent';
    ctx.lineWidth = isHovered ? 3 : 0;

    // Rounded rectangle
    const radius = 8;
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
    ctx.fill();
    if (isHovered) ctx.stroke();

    // Task ID badge
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(x, y, width, 24);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.fillText(task.taskId, x + 8, y + 16);

    // Task type badge
    if (task.taskType) {
      const typeText = task.taskType.toUpperCase();
      ctx.font = '10px Inter, system-ui, sans-serif';
      const typeWidth = ctx.measureText(typeText).width;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(x + width - typeWidth - 16, y + 6, typeWidth + 8, 14);
      ctx.fillStyle = '#fff';
      ctx.fillText(typeText, x + width - typeWidth - 12, y + 16);
    }

    // Task title
    ctx.fillStyle = '#fff';
    ctx.font = '13px Inter, system-ui, sans-serif';
    const title = truncateText(ctx, task.title, width - 16);
    ctx.fillText(title, x + 8, y + 44);

    // Estimated hours
    if (task.estimatedHours) {
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(`${task.estimatedHours}h`, x + 8, y + 62);
    }

    // Risk indicator
    if (task.riskLevel && task.riskLevel !== 'low') {
      const riskColors: Record<string, string> = {
        medium: '#fbbf24',
        high: '#f97316',
        critical: '#ef4444'
      };
      ctx.fillStyle = riskColors[task.riskLevel] || '#6b7280';
      ctx.beginPath();
      ctx.arc(x + width - 12, y + height - 12, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const truncateText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string => {
    const ellipsis = '...';
    let width = ctx.measureText(text).width;

    if (width <= maxWidth) return text;

    let truncated = text;
    while (width > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
      width = ctx.measureText(truncated + ellipsis).width;
    }

    return truncated + ellipsis;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else {
      // Check for hover
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - canvas.width / 2 - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - canvas.height / 2 - pan.y) / zoom;

      const hoveredNode = nodes.find(node =>
        mouseX >= node.x && mouseX <= node.x + 200 &&
        mouseY >= node.y && mouseY <= node.y + 80
      );

      setHoveredNode(hoveredNode?.id || null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom / 1.2, 0.3));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      className={`${
        isFullscreen ? 'fixed inset-0 z-50' : 'relative h-[600px]'
      } bg-gray-900 rounded-lg overflow-hidden flex flex-col`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div>
          <h3 className="text-lg font-semibold text-white">Task Dependencies</h3>
          <p className="text-sm text-gray-400">
            {nodes.length} tasks, {edges.length} dependencies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Reset View"
          >
            Reset
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <div className="w-px h-6 bg-gray-700 mx-1" />
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          {!isFullscreen && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-full"
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 text-xs">
          <h4 className="font-semibold text-white mb-2">Legend</h4>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-600 rounded" />
              <span className="text-gray-300">Epic</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded" />
              <span className="text-gray-300">Ticket</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 rounded" />
              <span className="text-gray-300">Subtask</span>
            </div>
            <div className="border-t border-gray-700 my-2" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-red-500" />
              <span className="text-gray-300">Blocked By</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-gray-500" style={{ borderTop: '1px dashed' }} />
              <span className="text-gray-300">Related</span>
            </div>
          </div>
        </div>

        {/* Zoom level indicator */}
        <div className="absolute bottom-4 right-4 bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-gray-300">
          {Math.round(zoom * 100)}%
        </div>
      </div>
    </div>
  );
};
