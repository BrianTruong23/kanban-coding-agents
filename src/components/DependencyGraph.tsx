'use client';

import { useEffect, useRef } from 'react';
import { Task, TaskDependency } from '@/types/task';
import { GitBranch, AlertCircle } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onTaskClick?: (taskId: string) => void;
}

interface GraphNode {
  id: string;
  task: Task;
  x: number;
  y: number;
  dependsOn: string[];
  blockedBy: string[];
}

export const DependencyGraph = ({ tasks, dependencies, onTaskClick }: DependencyGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = Math.max(600, rect.height);

    // Build dependency graph
    const nodes = buildGraph(tasks, dependencies, canvas.width, canvas.height);

    // Draw graph
    drawGraph(ctx, nodes, dependencies);
  }, [tasks, dependencies]);

  const buildGraph = (
    tasks: Task[],
    dependencies: TaskDependency[],
    width: number,
    height: number
  ): GraphNode[] => {
    if (tasks.length === 0) return [];

    // Create nodes
    const nodes: GraphNode[] = tasks.map((task) => {
      const dependsOn = dependencies
        .filter((d) => d.taskId === task.id)
        .map((d) => d.dependsOnTaskId);

      const blockedBy = dependencies
        .filter((d) => d.dependsOnTaskId === task.id)
        .map((d) => d.taskId);

      return {
        id: task.id,
        task,
        x: 0,
        y: 0,
        dependsOn,
        blockedBy,
      };
    });

    // Simple layout algorithm: topological sort with levels
    const levels = assignLevels(nodes);
    const maxLevel = Math.max(...levels.values());

    // Position nodes
    const levelGroups = new Map<number, GraphNode[]>();
    nodes.forEach((node) => {
      const level = levels.get(node.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(node);
    });

    const padding = 100;
    const nodeWidth = 180;
    const nodeHeight = 80;
    const horizontalSpacing = width / (maxLevel + 2);
    const verticalSpacing = 120;

    levelGroups.forEach((levelNodes, level) => {
      const x = padding + level * horizontalSpacing;
      const totalHeight = levelNodes.length * (nodeHeight + verticalSpacing);
      const startY = (height - totalHeight) / 2;

      levelNodes.forEach((node, index) => {
        node.x = x;
        node.y = startY + index * (nodeHeight + verticalSpacing);
      });
    });

    return nodes;
  };

  const assignLevels = (nodes: GraphNode[]): Map<string, number> => {
    const levels = new Map<string, number>();
    const visited = new Set<string>();

    const dfs = (nodeId: string, level: number) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const currentLevel = levels.get(nodeId) || 0;
      levels.set(nodeId, Math.max(currentLevel, level));

      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        node.dependsOn.forEach((depId) => {
          dfs(depId, level - 1);
        });
        node.blockedBy.forEach((blockerId) => {
          dfs(blockerId, level + 1);
        });
      }
    };

    // Start DFS from nodes with no dependencies
    const rootNodes = nodes.filter((n) => n.dependsOn.length === 0);
    rootNodes.forEach((node) => dfs(node.id, 0));

    // Normalize levels to start from 0
    const minLevel = Math.min(...levels.values());
    levels.forEach((level, nodeId) => {
      levels.set(nodeId, level - minLevel);
    });

    return levels;
  };

  const drawGraph = (
    ctx: CanvasRenderingContext2D,
    nodes: GraphNode[],
    dependencies: TaskDependency[]
  ) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Determine if dark mode
    const isDark = document.documentElement.classList.contains('dark');
    const bgColor = isDark ? '#1f2937' : '#ffffff';
    const textColor = isDark ? '#ffffff' : '#111827';
    const edgeColor = isDark ? '#4b5563' : '#d1d5db';
    const nodeColor = isDark ? '#374151' : '#f3f4f6';

    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw edges first
    dependencies.forEach((dep) => {
      const fromNode = nodes.find((n) => n.id === dep.dependsOnTaskId);
      const toNode = nodes.find((n) => n.id === dep.taskId);

      if (fromNode && toNode) {
        drawEdge(ctx, fromNode, toNode, dep.dependencyType, edgeColor);
      }
    });

    // Draw nodes
    nodes.forEach((node) => {
      drawNode(ctx, node, nodeColor, textColor);
    });
  };

  const drawEdge = (
    ctx: CanvasRenderingContext2D,
    from: GraphNode,
    to: GraphNode,
    type: string,
    color: string
  ) => {
    const nodeWidth = 180;
    const nodeHeight = 80;

    const fromX = from.x + nodeWidth;
    const fromY = from.y + nodeHeight / 2;
    const toX = to.x;
    const toY = to.y + nodeHeight / 2;

    ctx.save();

    // Set style based on dependency type
    if (type === 'blocks') {
      ctx.strokeStyle = '#ef4444'; // red
      ctx.lineWidth = 2;
    } else if (type === 'follows') {
      ctx.strokeStyle = '#3b82f6'; // blue
      ctx.lineWidth = 1.5;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
    }

    // Draw curved line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);

    const cpX = (fromX + toX) / 2;
    ctx.bezierCurveTo(cpX, fromY, cpX, toY, toX, toY);

    ctx.stroke();

    // Draw arrow
    const arrowSize = 8;
    const angle = Math.atan2(toY - fromY, toX - fromX);

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
    ctx.fillStyle = type === 'blocks' ? '#ef4444' : type === 'follows' ? '#3b82f6' : color;
    ctx.fill();

    ctx.restore();
  };

  const drawNode = (
    ctx: CanvasRenderingContext2D,
    node: GraphNode,
    bgColor: string,
    textColor: string
  ) => {
    const nodeWidth = 180;
    const nodeHeight = 80;
    const borderRadius = 8;

    // Draw node background
    ctx.fillStyle = bgColor;
    ctx.strokeStyle = getStatusColor(node.task.status);
    ctx.lineWidth = 3;

    drawRoundedRect(ctx, node.x, node.y, nodeWidth, nodeHeight, borderRadius);
    ctx.fill();
    ctx.stroke();

    // Draw task ID
    ctx.fillStyle = textColor;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(node.task.taskId, node.x + 10, node.y + 20);

    // Draw task title (truncated)
    ctx.font = '11px sans-serif';
    const title =
      node.task.title.length > 25 ? node.task.title.substring(0, 22) + '...' : node.task.title;
    ctx.fillText(title, node.x + 10, node.y + 38);

    // Draw task type badge
    const taskType = node.task.taskType || 'task';
    ctx.font = 'bold 9px sans-serif';
    const badgeText = taskType.toUpperCase();
    const badgeWidth = ctx.measureText(badgeText).width + 8;
    const badgeX = node.x + 10;
    const badgeY = node.y + 50;

    ctx.fillStyle = getTaskTypeColor(taskType);
    drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, 16, 4);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(badgeText, badgeX + 4, badgeY + 11);

    // Draw priority indicator
    if (node.task.priority >= 4) {
      ctx.fillStyle = node.task.priority === 5 ? '#dc2626' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(node.x + nodeWidth - 15, node.y + 15, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawRoundedRect = (
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

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      backlog: '#6b7280',
      'in-progress': '#3b82f6',
      review: '#f59e0b',
      done: '#10b981',
    };
    return colors[status] || '#6b7280';
  };

  const getTaskTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      epic: '#8b5cf6',
      task: '#3b82f6',
      subtask: '#6b7280',
    };
    return colors[type] || '#3b82f6';
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        <GitBranch size={48} className="mb-2 opacity-50" />
        <p>No tasks to visualize</p>
      </div>
    );
  }

  if (dependencies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        <AlertCircle size={48} className="mb-2 opacity-50" />
        <p>No dependencies found</p>
        <p className="text-sm mt-1">Add dependencies to visualize the task flow</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full min-h-[600px] relative">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
        <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-red-500" />
            <span className="text-gray-600 dark:text-gray-400">Blocks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-blue-500" />
            <span className="text-gray-600 dark:text-gray-400">Follows</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 border-t border-dashed border-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">Related</span>
          </div>
        </div>
      </div>
    </div>
  );
};
