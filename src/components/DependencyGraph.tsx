'use client';

import { useState, useEffect, useRef } from 'react';
import { Task } from '@/types/task';
import { Subtask } from '@/types/subtask';
import { DependencyNode } from '@/types/dependency';
import { X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  subtasks: Subtask[];
  dependencies: Map<string, string[]>; // taskId -> [dependsOnTaskIds]
  onClose: () => void;
}

export const DependencyGraph = ({ tasks, subtasks, dependencies, onClose }: DependencyGraphProps) => {
  const [nodes, setNodes] = useState<DependencyNode[]>([]);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Build dependency nodes
    const nodeMap = new Map<string, DependencyNode>();

    // Add tasks
    tasks.forEach(task => {
      nodeMap.set(task.id, {
        id: task.id,
        title: task.title,
        status: task.status,
        type: 'task',
        dependencies: dependencies.get(task.id) || [],
      });
    });

    // Add subtasks
    subtasks.forEach(subtask => {
      nodeMap.set(subtask.id, {
        id: subtask.id,
        title: subtask.title,
        status: subtask.status,
        type: 'subtask',
        dependencies: dependencies.get(subtask.id) || [],
      });
    });

    setNodes(Array.from(nodeMap.values()));
  }, [tasks, subtasks, dependencies]);

  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate layout
    const layout = calculateLayout(nodes, rect.width, rect.height);

    // Draw connections first (so nodes appear on top)
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 2;
    nodes.forEach(node => {
      const nodePos = layout.get(node.id);
      if (!nodePos) return;

      node.dependencies.forEach(depId => {
        const depPos = layout.get(depId);
        if (!depPos) return;

        // Draw arrow
        drawArrow(ctx, nodePos.x, nodePos.y, depPos.x, depPos.y);
      });
    });

    // Draw nodes
    nodes.forEach(node => {
      const pos = layout.get(node.id);
      if (!pos) return;

      drawNode(ctx, node, pos.x, pos.y);
    });
  }, [nodes, zoom]);

  const calculateLayout = (nodes: DependencyNode[], width: number, height: number): Map<string, { x: number; y: number }> => {
    const layout = new Map<string, { x: number; y: number }>();

    // Simple hierarchical layout
    // Group nodes by dependency level
    const levels = new Map<number, string[]>();
    const nodeLevel = new Map<string, number>();

    // Calculate levels using topological sort
    const visited = new Set<string>();
    const calculateLevel = (nodeId: string, currentLevel: number = 0): number => {
      if (visited.has(nodeId)) return nodeLevel.get(nodeId) || 0;
      visited.add(nodeId);

      const node = nodes.find(n => n.id === nodeId);
      if (!node) return currentLevel;

      let maxDepLevel = currentLevel;
      for (const depId of node.dependencies) {
        const depLevel = calculateLevel(depId, currentLevel + 1);
        maxDepLevel = Math.max(maxDepLevel, depLevel);
      }

      nodeLevel.set(nodeId, maxDepLevel);
      if (!levels.has(maxDepLevel)) {
        levels.set(maxDepLevel, []);
      }
      levels.get(maxDepLevel)!.push(nodeId);

      return maxDepLevel;
    };

    nodes.forEach(node => calculateLevel(node.id));

    // Position nodes
    const levelCount = levels.size;
    const horizontalSpacing = width / (levelCount + 1);

    levels.forEach((nodeIds, level) => {
      const verticalSpacing = height / (nodeIds.length + 1);
      nodeIds.forEach((nodeId, index) => {
        layout.set(nodeId, {
          x: horizontalSpacing * (level + 1),
          y: verticalSpacing * (index + 1),
        });
      });
    });

    return layout;
  };

  const drawNode = (ctx: CanvasRenderingContext2D, node: DependencyNode, x: number, y: number) => {
    const width = 150;
    const height = 60;

    // Node background
    const statusColors: Record<string, string> = {
      'backlog': '#f3f4f6',
      'todo': '#f3f4f6',
      'in-progress': '#dbeafe',
      'review': '#fef3c7',
      'done': '#d1fae5',
      'blocked': '#fee2e2',
    };

    ctx.fillStyle = statusColors[node.status] || '#f3f4f6';
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;

    // Rounded rectangle
    const radius = 8;
    ctx.beginPath();
    ctx.moveTo(x - width / 2 + radius, y - height / 2);
    ctx.lineTo(x + width / 2 - radius, y - height / 2);
    ctx.quadraticCurveTo(x + width / 2, y - height / 2, x + width / 2, y - height / 2 + radius);
    ctx.lineTo(x + width / 2, y + height / 2 - radius);
    ctx.quadraticCurveTo(x + width / 2, y + height / 2, x + width / 2 - radius, y + height / 2);
    ctx.lineTo(x - width / 2 + radius, y + height / 2);
    ctx.quadraticCurveTo(x - width / 2, y + height / 2, x - width / 2, y + height / 2 - radius);
    ctx.lineTo(x - width / 2, y - height / 2 + radius);
    ctx.quadraticCurveTo(x - width / 2, y - height / 2, x - width / 2 + radius, y - height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Node type badge
    ctx.fillStyle = node.type === 'task' ? '#6366f1' : '#8b5cf6';
    ctx.fillRect(x - width / 2, y - height / 2, 40, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(node.type.toUpperCase(), x - width / 2 + 20, y - height / 2 + 14);

    // Node title
    ctx.fillStyle = '#1f2937';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    const maxWidth = width - 20;
    const title = node.title.length > 25 ? node.title.substring(0, 25) + '...' : node.title;
    ctx.fillText(title, x, y + 5);

    // Status
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px sans-serif';
    ctx.fillText(node.status, x, y + 20);
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headLength = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.5));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl h-[80vh] shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Maximize2 className="text-blue-500" size={20} />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Task Dependency Graph</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              title="Zoom out"
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              title="Zoom in"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Graph Canvas */}
        <div ref={containerRef} className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900 relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
          />
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-400 dark:text-gray-500 mb-2">No dependencies to visualize</p>
                <p className="text-xs text-gray-400 dark:text-gray-600">
                  Add dependencies between tasks to see the graph
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-indigo-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Task</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Subtask</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-gray-400"></div>
              <span className="text-gray-600 dark:text-gray-400">Depends on</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
