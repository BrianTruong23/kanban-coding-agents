'use client';

import { Task, TaskDependency } from '@/types/task';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onClose: () => void;
}

interface Node {
  id: string;
  taskId: string;
  title: string;
  x: number;
  y: number;
  status: string;
  taskType?: string;
}

interface Edge {
  from: string;
  to: string;
  type: string;
}

export const DependencyGraph = ({ tasks, dependencies, onClose }: DependencyGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    // Create nodes from tasks
    const taskNodes: Node[] = tasks.map((task, index) => ({
      id: task.id,
      taskId: task.taskId,
      title: task.title,
      status: task.status,
      taskType: task.taskType,
      x: 0,
      y: 0,
    }));

    // Create edges from dependencies
    const dependencyEdges: Edge[] = dependencies.map(dep => ({
      from: dep.dependsOnTaskId,
      to: dep.taskId,
      type: dep.dependencyType,
    }));

    // Layout nodes using a simple force-directed layout
    layoutNodes(taskNodes, dependencyEdges);

    setNodes(taskNodes);
    setEdges(dependencyEdges);
  }, [tasks, dependencies]);

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
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw edges
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);

      if (fromNode && toNode) {
        drawEdge(ctx, fromNode, toNode, edge.type);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      drawNode(ctx, node, node.id === selectedNode?.id);
    });
  }, [nodes, edges, selectedNode]);

  const layoutNodes = (nodes: Node[], edges: Edge[]) => {
    // Group by task type for better layout
    const epics = nodes.filter(n => n.taskType === 'epic');
    const stories = nodes.filter(n => n.taskType === 'story');
    const tasks = nodes.filter(n => n.taskType === 'task' || !n.taskType);
    const subtasks = nodes.filter(n => n.taskType === 'subtask');

    const padding = 50;
    const nodeWidth = 120;
    const nodeHeight = 60;
    const levelSpacing = 150;

    // Layout epics at the top
    epics.forEach((node, idx) => {
      node.x = padding + idx * (nodeWidth + 40);
      node.y = padding;
    });

    // Layout stories below epics
    stories.forEach((node, idx) => {
      node.x = padding + idx * (nodeWidth + 40);
      node.y = padding + levelSpacing;
    });

    // Layout tasks below stories
    tasks.forEach((node, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      node.x = padding + col * (nodeWidth + 40);
      node.y = padding + levelSpacing * 2 + row * (nodeHeight + 30);
    });

    // Layout subtasks at the bottom
    subtasks.forEach((node, idx) => {
      const col = idx % 5;
      const row = Math.floor(idx / 5);
      node.x = padding + col * (nodeWidth + 40);
      node.y = padding + levelSpacing * 3 + row * (nodeHeight + 30);
    });
  };

  const drawNode = (ctx: CanvasRenderingContext2D, node: Node, isSelected: boolean) => {
    const width = 120;
    const height = 60;

    // Determine color based on status
    let fillColor = '#f3f4f6';
    let borderColor = '#d1d5db';

    switch (node.status) {
      case 'backlog':
        fillColor = '#eff6ff';
        borderColor = '#3b82f6';
        break;
      case 'in-progress':
        fillColor = '#fef3c7';
        borderColor = '#f59e0b';
        break;
      case 'review':
        fillColor = '#f3e8ff';
        borderColor = '#a855f7';
        break;
      case 'done':
        fillColor = '#d1fae5';
        borderColor = '#10b981';
        break;
    }

    // Draw shadow if selected
    if (isSelected) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
    }

    // Draw node box
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = isSelected ? '#000000' : borderColor;
    ctx.lineWidth = isSelected ? 3 : 2;

    roundRect(ctx, node.x, node.y, width, height, 8);
    ctx.fill();
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw task ID
    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(node.taskId, node.x + 8, node.y + 18);

    // Draw title (truncated)
    ctx.fillStyle = '#111827';
    ctx.font = '12px sans-serif';
    const truncatedTitle = truncateText(ctx, node.title, width - 16);
    wrapText(ctx, truncatedTitle, node.x + 8, node.y + 35, width - 16, 14);

    // Draw task type badge if applicable
    if (node.taskType && node.taskType !== 'task') {
      ctx.fillStyle = '#9ca3af';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(node.taskType.toUpperCase(), node.x + width - 8, node.y + 18);
    }
  };

  const drawEdge = (
    ctx: CanvasRenderingContext2D,
    from: Node,
    to: Node,
    type: string
  ) => {
    const fromX = from.x + 60;
    const fromY = from.y + 30;
    const toX = to.x + 60;
    const toY = to.y + 30;

    // Choose color based on dependency type
    ctx.strokeStyle = type === 'blocks' ? '#ef4444' : '#94a3b8';
    ctx.lineWidth = 2;

    // Draw line with arrow
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);

    // Use bezier curve for better visualization
    const controlY = (fromY + toY) / 2;
    ctx.bezierCurveTo(fromX, controlY, toX, controlY, toX, toY);
    ctx.stroke();

    // Draw arrowhead
    drawArrowhead(ctx, fromX, controlY, toX, toY);
  };

  const drawArrowhead = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowLength = 10;

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - arrowLength * Math.cos(angle - Math.PI / 6),
      y2 - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - arrowLength * Math.cos(angle + Math.PI / 6),
      y2 - arrowLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
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
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const truncateText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string => {
    const metrics = ctx.measureText(text);
    if (metrics.width <= maxWidth) return text;

    let truncated = text;
    while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + '...';
  };

  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(' ');
    let line = '';
    let lineY = y;

    for (let i = 0; i < words.length && lineY < y + lineHeight; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, x, lineY);
        line = words[i] + ' ';
        lineY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (lineY < y + lineHeight) {
      ctx.fillText(line, x, lineY);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if click is on a node
    const clickedNode = nodes.find(
      node =>
        x >= node.x &&
        x <= node.x + 120 &&
        y >= node.y &&
        y <= node.y + 60
    );

    setSelectedNode(clickedNode || null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full h-full max-w-6xl max-h-[90vh] shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Task Dependency Graph</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Visualizing {tasks.length} tasks with {dependencies.length} dependencies
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 p-4 overflow-hidden">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-full h-full border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer bg-white dark:bg-gray-900"
            style={{ imageRendering: 'auto' }}
          />
        </div>

        {selectedNode && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">{selectedNode.taskId}</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedNode.title}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                    {selectedNode.status}
                  </span>
                  {selectedNode.taskType && (
                    <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                      {selectedNode.taskType}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex gap-6 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-100 border-2 border-blue-500 rounded"></div>
              <span>Backlog</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-100 border-2 border-yellow-500 rounded"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-100 border-2 border-purple-500 rounded"></div>
              <span>Review</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-100 border-2 border-green-500 rounded"></div>
              <span>Done</span>
            </div>
            <div className="flex items-center gap-2 ml-6">
              <div className="w-6 h-0.5 bg-red-500"></div>
              <span>Blocks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-gray-400"></div>
              <span>Related</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
