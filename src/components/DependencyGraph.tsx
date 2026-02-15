'use client';

import { useState, useEffect, useRef } from 'react';
import { TaskBreakdownItem, Dependency } from '@/types/taskBreakdown';
import { GitBranch, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface DependencyGraphProps {
  items: TaskBreakdownItem[];
  dependencies: Dependency[];
  onItemClick?: (item: TaskBreakdownItem) => void;
}

interface GraphNode {
  item: TaskBreakdownItem;
  x: number;
  y: number;
  dependencies: Dependency[];
}

export const DependencyGraph = ({ items, dependencies, onItemClick }: DependencyGraphProps) => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Calculate node positions using a simple layered layout
    const layers: TaskBreakdownItem[][] = [];
    const visited = new Set<string>();
    const itemMap = new Map(items.map(item => [item.id, item]));

    // Find root nodes (items with no dependencies on them)
    const rootItems = items.filter(item =>
      !dependencies.some(dep => dep.fromItemId === item.id)
    );

    if (rootItems.length === 0 && items.length > 0) {
      // If no clear roots, start with epics
      layers.push(items.filter(item => item.type === 'epic'));
    } else {
      layers.push(rootItems);
    }

    visited.clear();
    rootItems.forEach(item => visited.add(item.id));

    // Build layers
    let currentLayer = 0;
    while (currentLayer < layers.length && currentLayer < 10) {
      const nextLayer: TaskBreakdownItem[] = [];

      layers[currentLayer].forEach(item => {
        const childDeps = dependencies.filter(dep => dep.toItemId === item.id);
        childDeps.forEach(dep => {
          const childItem = itemMap.get(dep.fromItemId);
          if (childItem && !visited.has(childItem.id)) {
            nextLayer.push(childItem);
            visited.add(childItem.id);
          }
        });
      });

      if (nextLayer.length > 0) {
        layers.push(nextLayer);
      }
      currentLayer++;
    }

    // Add any orphaned items to the last layer
    const orphans = items.filter(item => !visited.has(item.id));
    if (orphans.length > 0) {
      layers.push(orphans);
    }

    // Calculate positions
    const nodeSpacingX = 220;
    const nodeSpacingY = 120;
    const newNodes: GraphNode[] = [];

    layers.forEach((layer, layerIndex) => {
      const layerWidth = layer.length * nodeSpacingX;
      const startX = -layerWidth / 2;

      layer.forEach((item, itemIndex) => {
        const itemDeps = dependencies.filter(
          dep => dep.fromItemId === item.id || dep.toItemId === item.id
        );

        newNodes.push({
          item,
          x: startX + itemIndex * nodeSpacingX + nodeSpacingX / 2,
          y: layerIndex * nodeSpacingY + 50,
          dependencies: itemDeps,
        });
      });
    });

    setNodes(newNodes);
  }, [items, dependencies]);

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

    if (nodes.length === 0) return;

    // Calculate center offset
    const canvasWidth = canvas.offsetWidth;
    const canvasHeight = canvas.offsetHeight;
    const offsetX = canvasWidth / 2;
    const offsetY = 20;

    // Draw dependencies first (so they appear behind nodes)
    dependencies.forEach(dep => {
      const fromNode = nodes.find(n => n.item.id === dep.fromItemId);
      const toNode = nodes.find(n => n.item.id === dep.toItemId);

      if (!fromNode || !toNode) return;

      const fromX = fromNode.x + offsetX;
      const fromY = fromNode.y + offsetY + 25; // Bottom of from node
      const toX = toNode.x + offsetX;
      const toY = toNode.y + offsetY; // Top of to node

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);

      // Draw curved line
      const controlY = (fromY + toY) / 2;
      ctx.bezierCurveTo(fromX, controlY, toX, controlY, toX, toY);

      // Color based on dependency type
      switch (dep.type) {
        case 'blocks':
          ctx.strokeStyle = '#ef4444';
          break;
        case 'requires':
          ctx.strokeStyle = '#f59e0b';
          break;
        default:
          ctx.strokeStyle = '#94a3b8';
      }

      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw arrow head
      const arrowSize = 8;
      const angle = Math.atan2(toY - controlY, toX - toX);
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
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    });
  }, [nodes, dependencies]);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node.item.id);
    if (onItemClick) {
      onItemClick(node.item);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'done':
        return 'bg-green-100 dark:bg-green-900 border-green-500';
      case 'in-progress':
        return 'bg-blue-100 dark:bg-blue-900 border-blue-500';
      case 'blocked':
        return 'bg-red-100 dark:bg-red-900 border-red-500';
      case 'review':
        return 'bg-purple-100 dark:bg-purple-900 border-purple-500';
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'epic') return '🎯';
    if (type === 'ticket') return '🎫';
    return '✓';
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        <GitBranch size={48} className="mb-4" />
        <p>No items to visualize</p>
        <p className="text-sm mt-2">Break down a task to see dependencies</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Canvas for dependency lines */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Nodes */}
      <div className="relative w-full h-full overflow-auto p-8">
        <div className="relative" style={{ minHeight: '600px', minWidth: '800px' }}>
          {nodes.map(node => {
            const canvasWidth = canvasRef.current?.offsetWidth || 800;
            const offsetX = canvasWidth / 2;
            const offsetY = 20;

            return (
              <div
                key={node.item.id}
                className={`absolute cursor-pointer transition-all transform hover:scale-105 ${
                  selectedNode === node.item.id ? 'ring-2 ring-blue-500 scale-105' : ''
                }`}
                style={{
                  left: `${node.x + offsetX - 80}px`,
                  top: `${node.y + offsetY}px`,
                  width: '160px',
                }}
                onClick={() => handleNodeClick(node)}
              >
                <div
                  className={`p-3 rounded-lg border-2 shadow-sm ${getStatusColor(
                    node.item.status
                  )}`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg">{getTypeIcon(node.item.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        {node.item.taskId}
                      </div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                        {node.item.title}
                      </div>
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="flex items-center gap-2 mt-2">
                    {node.item.status === 'done' && (
                      <CheckCircle2 size={14} className="text-green-600" />
                    )}
                    {node.item.status === 'blocked' && (
                      <AlertTriangle size={14} className="text-red-600" />
                    )}
                    <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                      {node.item.status.replace('-', ' ')}
                    </span>
                  </div>

                  {/* Priority */}
                  <div className="mt-1 flex gap-0.5">
                    {Array.from({ length: node.item.priority }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          node.item.priority >= 4 ? 'bg-red-500' : 'bg-yellow-500'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-xs">
        <div className="font-semibold mb-2 text-gray-900 dark:text-white">
          Dependencies
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500" />
            <span className="text-gray-600 dark:text-gray-400">Blocks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-amber-500" />
            <span className="text-gray-600 dark:text-gray-400">Requires</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">Relates</span>
          </div>
        </div>
      </div>
    </div>
  );
};
