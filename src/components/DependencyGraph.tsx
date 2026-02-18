'use client';

import { Task, TaskDependency } from '@/types/task';
import { useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

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
  vx: number;
  vy: number;
}

interface GraphEdge {
  from: string;
  to: string;
  type: 'blocks' | 'related' | 'subtask';
}

export const DependencyGraph = ({ tasks, dependencies, onClose }: DependencyGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Build graph data
  const nodes = useRef<GraphNode[]>([]);
  const edges = useRef<GraphEdge[]>([]);

  useEffect(() => {
    // Initialize nodes
    nodes.current = tasks.map((task, i) => ({
      id: task.id,
      task,
      x: Math.random() * 600 + 100,
      y: Math.random() * 400 + 100,
      vx: 0,
      vy: 0,
    }));

    // Initialize edges from dependencies
    edges.current = dependencies.map(dep => ({
      from: dep.taskId,
      to: dep.dependsOnTaskId,
      type: dep.dependencyType,
    }));

    // Also add parent-child relationships
    tasks.forEach(task => {
      if (task.parentId) {
        edges.current.push({
          from: task.id,
          to: task.parentId,
          type: 'subtask',
        });
      }
    });
  }, [tasks, dependencies]);

  // Force-directed layout simulation
  useEffect(() => {
    if (nodes.current.length === 0) return;

    const simulate = () => {
      const repulsionStrength = 2000;
      const attractionStrength = 0.01;
      const damping = 0.8;

      // Apply forces
      for (let i = 0; i < nodes.current.length; i++) {
        const node1 = nodes.current[i];

        // Reset forces
        let fx = 0;
        let fy = 0;

        // Repulsion between all nodes
        for (let j = 0; j < nodes.current.length; j++) {
          if (i === j) continue;
          const node2 = nodes.current[j];

          const dx = node1.x - node2.x;
          const dy = node1.y - node2.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;

          const force = repulsionStrength / (distance * distance);
          fx += (dx / distance) * force;
          fy += (dy / distance) * force;
        }

        // Attraction along edges
        edges.current.forEach(edge => {
          let other: GraphNode | undefined;
          let direction = 1;

          if (edge.from === node1.id) {
            other = nodes.current.find(n => n.id === edge.to);
            direction = 1;
          } else if (edge.to === node1.id) {
            other = nodes.current.find(n => n.id === edge.from);
            direction = -1;
          }

          if (other) {
            const dx = other.x - node1.x;
            const dy = other.y - node1.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;

            fx += dx * attractionStrength * direction;
            fy += dy * attractionStrength * direction;
          }
        });

        // Apply forces
        node1.vx = (node1.vx + fx) * damping;
        node1.vy = (node1.vy + fy) * damping;
      }

      // Update positions
      nodes.current.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        // Keep nodes in bounds
        node.x = Math.max(50, Math.min(750, node.x));
        node.y = Math.max(50, Math.min(550, node.y));
      });

      renderGraph();
    };

    // Run simulation for initial layout
    let iterations = 0;
    const maxIterations = 100;
    const interval = setInterval(() => {
      simulate();
      iterations++;
      if (iterations >= maxIterations) {
        clearInterval(interval);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [tasks, dependencies]);

  const renderGraph = () => {
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
    edges.current.forEach(edge => {
      const fromNode = nodes.current.find(n => n.id === edge.from);
      const toNode = nodes.current.find(n => n.id === edge.to);

      if (!fromNode || !toNode) return;

      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);

      // Style based on edge type
      if (edge.type === 'blocks') {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
      } else if (edge.type === 'subtask') {
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
      } else {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
      }

      ctx.stroke();
      ctx.setLineDash([]);

      // Draw arrow
      const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
      const arrowSize = 8;
      ctx.beginPath();
      ctx.moveTo(toNode.x, toNode.y);
      ctx.lineTo(
        toNode.x - arrowSize * Math.cos(angle - Math.PI / 6),
        toNode.y - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        toNode.x - arrowSize * Math.cos(angle + Math.PI / 6),
        toNode.y - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    });

    // Draw nodes
    nodes.current.forEach(node => {
      const isSelected = selectedNode === node.id;
      const isHovered = hoveredNode === node.id;

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, isSelected ? 28 : isHovered ? 25 : 22, 0, 2 * Math.PI);

      // Color by task type
      const colors = {
        epic: '#8b5cf6',
        story: '#3b82f6',
        task: '#10b981',
        subtask: '#f59e0b',
      };
      ctx.fillStyle = colors[node.task.taskType] || '#64748b';
      ctx.fill();

      if (isSelected || isHovered) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Task ID text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.task.taskId.replace('TASK-', ''), node.x, node.y);

      // Task title below
      if (isHovered || isSelected) {
        ctx.fillStyle = '#1f2937';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        const maxWidth = 120;
        const title = node.task.title.length > 20
          ? node.task.title.substring(0, 20) + '...'
          : node.task.title;
        ctx.fillText(title, node.x, node.y + 40);
      }
    });

    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / zoom;
    const y = (e.clientY - rect.top - offset.y) / zoom;

    // Check if clicking on a node
    const clickedNode = nodes.current.find(node => {
      const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      return distance < 22;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode.id === selectedNode ? null : clickedNode.id);
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      renderGraph();
    } else {
      // Check hover
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - offset.x) / zoom;
      const y = (e.clientY - rect.top - offset.y) / zoom;

      const hoveredNode = nodes.current.find(node => {
        const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
        return distance < 22;
      });

      setHoveredNode(hoveredNode?.id || null);
      renderGraph();
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(z => Math.min(z * 1.2, 3));
    setTimeout(renderGraph, 0);
  };

  const handleZoomOut = () => {
    setZoom(z => Math.max(z / 1.2, 0.5));
    setTimeout(renderGraph, 0);
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setTimeout(renderGraph, 0);
  };

  const selectedTask = selectedNode
    ? tasks.find(t => t.id === selectedNode)
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Task Dependency Graph
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Visualize task relationships and dependencies
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Legend */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Epic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Story</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Task</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Subtask</span>
          </div>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-red-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Blocks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 border-t-2 border-dashed border-purple-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Parent/Child</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 border-t border-dashed border-gray-400"></div>
            <span className="text-gray-600 dark:text-gray-400">Related</span>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 relative">
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
                className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                title="Zoom In"
              >
                <ZoomIn size={20} />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                title="Zoom Out"
              >
                <ZoomOut size={20} />
              </button>
              <button
                onClick={handleReset}
                className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                title="Reset View"
              >
                <Maximize2 size={20} />
              </button>
            </div>
          </div>

          {/* Details panel */}
          {selectedTask && (
            <div className="w-80 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                    {selectedTask.taskId}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedTask.title}
                  </h3>
                </div>

                {selectedTask.description && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                      Description
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedTask.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Type</div>
                    <div className="font-medium text-gray-900 dark:text-white capitalize">
                      {selectedTask.taskType}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Status</div>
                    <div className="font-medium text-gray-900 dark:text-white capitalize">
                      {selectedTask.status}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Priority</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedTask.priority}
                    </div>
                  </div>
                  {selectedTask.estimatedHours && (
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Estimate</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {selectedTask.estimatedHours}h
                      </div>
                    </div>
                  )}
                </div>

                {selectedTask.tags && selectedTask.tags.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                      Tags
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedTask.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTask.riskFlags && selectedTask.riskFlags.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase mb-2">
                      Risk Flags
                    </div>
                    <ul className="space-y-1">
                      {selectedTask.riskFlags.map((risk, i) => (
                        <li key={i} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1">
                          <span>⚠</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
