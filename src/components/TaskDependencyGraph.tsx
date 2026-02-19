'use client';

import { useEffect, useRef, useState } from 'react';
import { Task } from '@/types/task';

interface TaskNode {
  id: string;
  title: string;
  status: string;
  x: number;
  y: number;
  dependencies: string[];
  taskType?: string;
}

interface DependencyEdge {
  from: string;
  to: string;
}

interface TaskDependencyGraphProps {
  tasks: Task[];
  onTaskClick?: (taskId: string) => void;
  highlightedTaskId?: string;
}

export default function TaskDependencyGraph({
  tasks,
  onTaskClick,
  highlightedTaskId
}: TaskDependencyGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<TaskNode[]>([]);
  const [edges, setEdges] = useState<DependencyEdge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Build graph data structure
  useEffect(() => {
    const taskNodes: TaskNode[] = [];
    const taskEdges: DependencyEdge[] = [];

    // Create nodes
    tasks.forEach((task, index) => {
      taskNodes.push({
        id: task.id,
        title: task.title,
        status: task.status,
        taskType: task.taskType,
        x: 0, // Will be calculated by layout algorithm
        y: 0,
        dependencies: task.dependencies || []
      });

      // Create edges for dependencies
      (task.dependencies || []).forEach(depId => {
        taskEdges.push({
          from: depId,
          to: task.id
        });
      });
    });

    // Simple force-directed layout algorithm
    layoutNodes(taskNodes, taskEdges);

    setNodes(taskNodes);
    setEdges(taskEdges);
  }, [tasks]);

  // Layout algorithm - hierarchical based on dependencies
  const layoutNodes = (nodes: TaskNode[], edges: DependencyEdge[]) => {
    const width = 800;
    const height = 600;
    const layers: Map<string, number> = new Map();

    // Calculate layer for each node (topological sort)
    const calculateLayer = (nodeId: string, visited: Set<string> = new Set()): number => {
      if (layers.has(nodeId)) {
        return layers.get(nodeId)!;
      }

      if (visited.has(nodeId)) {
        return 0; // Circular dependency - place at root
      }

      visited.add(nodeId);

      const incomingEdges = edges.filter(e => e.to === nodeId);
      if (incomingEdges.length === 0) {
        layers.set(nodeId, 0);
        return 0;
      }

      const maxParentLayer = Math.max(
        ...incomingEdges.map(e => calculateLayer(e.from, new Set(visited)))
      );

      const layer = maxParentLayer + 1;
      layers.set(nodeId, layer);
      return layer;
    };

    // Calculate layers for all nodes
    nodes.forEach(node => calculateLayer(node.id));

    // Group nodes by layer
    const nodesByLayer: Map<number, TaskNode[]> = new Map();
    nodes.forEach(node => {
      const layer = layers.get(node.id) || 0;
      if (!nodesByLayer.has(layer)) {
        nodesByLayer.set(layer, []);
      }
      nodesByLayer.get(layer)!.push(node);
    });

    // Position nodes
    const maxLayer = Math.max(...Array.from(layers.values()), 0);
    const layerHeight = height / (maxLayer + 2);

    nodesByLayer.forEach((layerNodes, layer) => {
      const layerWidth = width / (layerNodes.length + 1);
      layerNodes.forEach((node, index) => {
        node.x = layerWidth * (index + 1);
        node.y = layerHeight * (layer + 1);
      });
    });
  };

  // Draw the graph
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = Math.max(600, rect.height);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);

      if (fromNode && toNode) {
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);

        // Draw curved line
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;
        ctx.quadraticCurveTo(midX, fromNode.y, midX, midY);
        ctx.quadraticCurveTo(midX, toNode.y, toNode.x, toNode.y);

        // Highlight if related to hovered or highlighted node
        if (
          hoveredNode === edge.from ||
          hoveredNode === edge.to ||
          highlightedTaskId === edge.from ||
          highlightedTaskId === edge.to
        ) {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = '#d1d5db';
          ctx.lineWidth = 1;
        }

        ctx.stroke();

        // Draw arrow
        drawArrow(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const isHovered = hoveredNode === node.id;
      const isHighlighted = highlightedTaskId === node.id;

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, isHovered || isHighlighted ? 8 : 6, 0, 2 * Math.PI);

      // Color based on status
      const statusColors = {
        'backlog': '#94a3b8',
        'in-progress': '#3b82f6',
        'review': '#f59e0b',
        'done': '#10b981'
      };
      ctx.fillStyle = statusColors[node.status as keyof typeof statusColors] || '#94a3b8';
      ctx.fill();

      if (isHovered || isHighlighted) {
        ctx.strokeStyle = '#1e40af';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Node label
      ctx.fillStyle = '#1f2937';
      ctx.font = isHovered || isHighlighted ? 'bold 12px sans-serif' : '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const maxWidth = 100;
      const truncated = node.title.length > 20 ? node.title.substring(0, 20) + '...' : node.title;
      ctx.fillText(truncated, node.x, node.y + 12, maxWidth);

      // Task type badge
      if (node.taskType) {
        const badge = node.taskType.charAt(0).toUpperCase();
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badge, node.x, node.y);
      }
    });
  }, [nodes, edges, hoveredNode, highlightedTaskId]);

  // Draw arrow helper
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ) => {
    const headLength = 8;
    const angle = Math.atan2(toY - fromY, toX - fromX);

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

  // Handle mouse events
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find hovered node
    const hovered = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < 10;
    });

    setHoveredNode(hovered?.id || null);
    canvas.style.cursor = hovered ? 'pointer' : 'default';
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredNode && onTaskClick) {
      onTaskClick(hoveredNode);
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full min-h-[600px] bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Task Dependencies</h3>
        <div className="flex gap-4 mt-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span className="text-gray-600 dark:text-gray-400">Backlog</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-600 dark:text-gray-400">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Review</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Done</span>
          </div>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        className="w-full h-full"
      />
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">No tasks with dependencies</p>
        </div>
      )}
    </div>
  );
}
