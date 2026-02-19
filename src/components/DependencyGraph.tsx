'use client';

import { useEffect, useRef, useState } from 'react';
import { TaskDependency } from '@/types/breakdown';
import { X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  status?: string;
  priority?: number;
}

interface Edge {
  source: string;
  target: string;
  type: 'blocks' | 'relates-to' | 'duplicates';
}

interface DependencyGraphProps {
  dependencies: TaskDependency[];
  tasks: Array<{
    id: string;
    title: string;
    status?: string;
    priority?: number;
  }>;
  onClose?: () => void;
}

export const DependencyGraph = ({ dependencies, tasks, onClose }: DependencyGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Convert dependencies to graph structure
  useEffect(() => {
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    // Create nodes from tasks
    const graphNodes: Node[] = tasks.map((task, index) => ({
      id: task.id,
      label: task.title.length > 30 ? task.title.substring(0, 30) + '...' : task.title,
      x: 0,
      y: 0,
      status: task.status,
      priority: task.priority,
    }));

    // Create edges from dependencies
    const graphEdges: Edge[] = dependencies.map(dep => ({
      source: dep.sourceTaskId,
      target: dep.targetTaskId,
      type: dep.dependencyType,
    }));

    // Calculate layout using force-directed algorithm
    calculateLayout(graphNodes, graphEdges);

    setNodes(graphNodes);
    setEdges(graphEdges);
  }, [dependencies, tasks]);

  // Simple force-directed layout
  const calculateLayout = (nodes: Node[], edges: Edge[]) => {
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    // Initialize positions in a circle
    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      const radius = Math.min(width, height) / 3;
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
    });

    // Run force simulation
    const iterations = 50;
    const k = 50; // Optimal distance
    const c = 0.1; // Cooling factor

    for (let iter = 0; iter < iterations; iter++) {
      const forces = nodes.map(() => ({ x: 0, y: 0 }));

      // Repulsive forces between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (k * k) / dist;

          forces[i].x += (dx / dist) * force;
          forces[i].y += (dy / dist) * force;
          forces[j].x -= (dx / dist) * force;
          forces[j].y -= (dy / dist) * force;
        }
      }

      // Attractive forces along edges
      edges.forEach(edge => {
        const sourceIdx = nodes.findIndex(n => n.id === edge.source);
        const targetIdx = nodes.findIndex(n => n.id === edge.target);

        if (sourceIdx !== -1 && targetIdx !== -1) {
          const dx = nodes[targetIdx].x - nodes[sourceIdx].x;
          const dy = nodes[targetIdx].y - nodes[sourceIdx].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist * dist) / k;

          forces[sourceIdx].x += (dx / dist) * force;
          forces[sourceIdx].y += (dy / dist) * force;
          forces[targetIdx].x -= (dx / dist) * force;
          forces[targetIdx].y -= (dy / dist) * force;
        }
      });

      // Apply forces
      const temp = 1 - (iter / iterations);
      nodes.forEach((node, i) => {
        node.x += forces[i].x * c * temp;
        node.y += forces[i].y * c * temp;

        // Keep nodes within bounds
        node.x = Math.max(50, Math.min(width - 50, node.x));
        node.y = Math.max(50, Math.min(height - 50, node.y));
      });
    }
  };

  // Draw the graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // Draw edges
    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);

      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);

        // Style based on dependency type
        if (edge.type === 'blocks') {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
        } else if (edge.type === 'relates-to') {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
        } else {
          ctx.strokeStyle = '#6b7280';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
        }

        ctx.stroke();
        ctx.setLineDash([]);

        // Draw arrow
        drawArrow(ctx, source.x, source.y, target.x, target.y);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, 25, 0, 2 * Math.PI);

      // Color based on priority
      if (node.priority && node.priority >= 4) {
        ctx.fillStyle = '#fef3c7'; // Yellow for high priority
        ctx.strokeStyle = '#f59e0b';
      } else {
        ctx.fillStyle = '#e0e7ff';
        ctx.strokeStyle = '#6366f1';
      }

      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      // Node label
      ctx.fillStyle = '#1f2937';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const maxWidth = 80;
      const label = node.label;
      if (ctx.measureText(label).width > maxWidth) {
        const truncated = label.substring(0, 10) + '...';
        ctx.fillText(truncated, node.x, node.y);
      } else {
        ctx.fillText(label, node.x, node.y);
      }
    });

    ctx.restore();
  }, [nodes, edges, zoom, offset]);

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ) => {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const arrowLength = 10;
    const arrowAngle = Math.PI / 6;

    // Calculate arrow tip position (on the edge of the target circle)
    const tipX = toX - 25 * Math.cos(angle);
    const tipY = toY - 25 * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX - arrowLength * Math.cos(angle - arrowAngle),
      tipY - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX - arrowLength * Math.cos(angle + arrowAngle),
      tipY - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.stroke();
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
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
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Task Dependencies
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {nodes.length} tasks, {edges.length} dependencies
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative bg-gray-50 dark:bg-gray-900">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
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
              className="bg-white dark:bg-gray-700 p-2 rounded-lg shadow hover:bg-gray-100 dark:hover:bg-gray-600"
              title="Zoom in"
            >
              <ZoomIn size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={handleZoomOut}
              className="bg-white dark:bg-gray-700 p-2 rounded-lg shadow hover:bg-gray-100 dark:hover:bg-gray-600"
              title="Zoom out"
            >
              <ZoomOut size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={handleReset}
              className="bg-white dark:bg-gray-700 p-2 rounded-lg shadow hover:bg-gray-100 dark:hover:bg-gray-600"
              title="Reset view"
            >
              <Maximize2 size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-center gap-6 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-red-500"></div>
              <span>Blocks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-blue-500 border-dashed"></div>
              <span>Relates to</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-gray-500 border-dashed"></div>
              <span>Duplicates</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-100 border-2 border-yellow-500"></div>
              <span>High Priority</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
