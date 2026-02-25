'use client';

import { useEffect, useRef, useState } from 'react';
import { DependencyGraph as DependencyGraphType, DependencyNode, DependencyEdge } from '@/types/dependency';
import { X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface DependencyGraphProps {
  graph: DependencyGraphType;
  onNodeClick?: (nodeId: string) => void;
  onClose?: () => void;
}

export const DependencyGraph = ({ graph, onNodeClick, onClose }: DependencyGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Calculate node positions using force-directed layout
  const calculateLayout = (): Map<string, { x: number; y: number }> => {
    const positions = new Map<string, { x: number; y: number }>();
    const nodeCount = graph.nodes.length;

    if (nodeCount === 0) return positions;

    // Simple circular layout for demonstration
    // In production, you'd use a proper force-directed algorithm
    const radius = Math.min(300, 50 + nodeCount * 20);
    const angleStep = (2 * Math.PI) / nodeCount;

    graph.nodes.forEach((node, index) => {
      const angle = index * angleStep;
      positions.set(node.id, {
        x: 400 + radius * Math.cos(angle),
        y: 300 + radius * Math.sin(angle),
      });
    });

    return positions;
  };

  const positions = calculateLayout();

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
    ctx.scale(scale, scale);

    // Draw edges
    graph.edges.forEach(edge => {
      const fromPos = positions.get(edge.from);
      const toPos = positions.get(edge.to);

      if (!fromPos || !toPos) return;

      ctx.beginPath();
      ctx.moveTo(fromPos.x, fromPos.y);
      ctx.lineTo(toPos.x, toPos.y);

      // Style based on dependency type
      if (edge.type === 'blocks') {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
      } else if (edge.type === 'parent-child') {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
      }

      ctx.stroke();

      // Draw arrow
      drawArrow(ctx, fromPos.x, fromPos.y, toPos.x, toPos.y);
    });

    // Draw nodes
    graph.nodes.forEach(node => {
      const pos = positions.get(node.id);
      if (!pos) return;

      const isHovered = hoveredNode === node.id;
      const nodeRadius = isHovered ? 35 : 30;

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);

      // Color based on type and status
      if (node.type === 'epic') {
        ctx.fillStyle = '#8b5cf6';
      } else if (node.type === 'subtask') {
        ctx.fillStyle = '#06b6d4';
      } else {
        ctx.fillStyle = '#10b981';
      }

      // Dimmer if done
      if (node.status === 'done') {
        ctx.globalAlpha = 0.5;
      }

      ctx.fill();
      ctx.globalAlpha = 1;

      // Border
      ctx.strokeStyle = isHovered ? '#000' : '#fff';
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.stroke();

      // Task ID text
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.taskId, pos.x, pos.y);
    });

    ctx.restore();
  }, [graph, positions, scale, offset, hoveredNode]);

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headLength = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Shorten the line to not overlap with nodes
    const shortenedToX = toX - 30 * Math.cos(angle);
    const shortenedToY = toY - 30 * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(shortenedToX, shortenedToY);
    ctx.lineTo(
      shortenedToX - headLength * Math.cos(angle - Math.PI / 6),
      shortenedToY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(shortenedToX, shortenedToY);
    ctx.lineTo(
      shortenedToX - headLength * Math.cos(angle + Math.PI / 6),
      shortenedToY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

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
    } else {
      // Check for hover
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - offset.x) / scale;
      const y = (e.clientY - rect.top - offset.y) / scale;

      let found: string | null = null;
      positions.forEach((pos, nodeId) => {
        const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        if (distance < 30) {
          found = nodeId;
        }
      });

      setHoveredNode(found);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onNodeClick) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;

    positions.forEach((pos, nodeId) => {
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance < 30) {
        onNodeClick(nodeId);
      }
    });
  };

  const handleZoomIn = () => {
    setScale(Math.min(scale * 1.2, 3));
  };

  const handleZoomOut = () => {
    setScale(Math.max(scale / 1.2, 0.3));
  };

  const handleReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Task Dependencies</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {graph.nodes.length} tasks, {graph.edges.length} dependencies
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Reset View"
            >
              <Maximize2 size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            width={1200}
            height={800}
            className="w-full h-full cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleClick}
          />

          {/* Hover info */}
          {hoveredNode && (
            <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              {(() => {
                const node = graph.nodes.find(n => n.id === hoveredNode);
                if (!node) return null;
                return (
                  <>
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      {node.taskId}
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {node.title}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Type: {node.type} • Status: {node.status}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Epic</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Task</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-cyan-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Subtask</span>
            </div>
            <div className="flex items-center gap-2 ml-8">
              <div className="w-8 h-0.5 bg-red-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Blocks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-blue-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Parent-Child</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-gray-400"></div>
              <span className="text-gray-600 dark:text-gray-400">Related</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
