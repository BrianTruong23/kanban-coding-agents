'use client';

import { TaskBreakdown } from '@/types/breakdown';
import { TaskDependency } from '@/types/breakdown';
import { useEffect, useRef, useState } from 'react';
import { GitBranch, AlertTriangle } from 'lucide-react';

interface DependencyGraphProps {
  tasks: TaskBreakdown[];
  dependencies: TaskDependency[];
  onTaskClick?: (taskId: string) => void;
}

interface GraphNode {
  id: string;
  taskId: string;
  title: string;
  x: number;
  y: number;
  level: number;
  dependencies: string[];
  riskLevel: string;
}

export const DependencyGraph = ({ tasks, dependencies, onTaskClick }: DependencyGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    if (tasks.length === 0) return;

    const graphNodes = buildGraph(tasks, dependencies);
    setNodes(graphNodes);
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

    drawGraph(ctx, nodes, dependencies, hoveredNode, selectedNode, rect.width, rect.height);
  }, [nodes, dependencies, hoveredNode, selectedNode]);

  const buildGraph = (tasks: TaskBreakdown[], deps: TaskDependency[]): GraphNode[] => {
    const taskMap = new Map(tasks.map(t => [t.taskId, t]));
    const dependencyMap = new Map<string, string[]>();

    // Build dependency map
    deps.forEach(dep => {
      if (!dependencyMap.has(dep.taskId)) {
        dependencyMap.set(dep.taskId, []);
      }
      dependencyMap.get(dep.taskId)!.push(dep.dependsOn);
    });

    // Calculate levels (topological sort)
    const levels = new Map<string, number>();
    const visited = new Set<string>();

    const calculateLevel = (taskId: string): number => {
      if (levels.has(taskId)) return levels.get(taskId)!;
      if (visited.has(taskId)) return 0; // Circular dependency

      visited.add(taskId);
      const deps = dependencyMap.get(taskId) || [];

      if (deps.length === 0) {
        levels.set(taskId, 0);
        return 0;
      }

      const maxDepLevel = Math.max(...deps.map(dep => calculateLevel(dep)));
      const level = maxDepLevel + 1;
      levels.set(taskId, level);
      return level;
    };

    tasks.forEach(task => calculateLevel(task.taskId));

    // Group tasks by level
    const levelGroups = new Map<number, string[]>();
    levels.forEach((level, taskId) => {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(taskId);
    });

    // Position nodes
    const graphNodes: GraphNode[] = [];
    const padding = 60;
    const nodeWidth = 120;
    const nodeHeight = 60;
    const levelSpacing = 180;

    levelGroups.forEach((taskIds, level) => {
      const yOffset = padding + level * levelSpacing;

      taskIds.forEach((taskId, index) => {
        const task = taskMap.get(taskId);
        if (!task) return;

        const totalInLevel = taskIds.length;
        const xOffset = padding + (index + 0.5) * ((800 - 2 * padding) / totalInLevel);

        graphNodes.push({
          id: task.id,
          taskId: task.taskId,
          title: task.title,
          x: xOffset,
          y: yOffset,
          level,
          dependencies: dependencyMap.get(taskId) || [],
          riskLevel: task.riskLevel,
        });
      });
    });

    return graphNodes;
  };

  const drawGraph = (
    ctx: CanvasRenderingContext2D,
    nodes: GraphNode[],
    deps: TaskDependency[],
    hovered: string | null,
    selected: string | null,
    width: number,
    height: number
  ) => {
    ctx.clearRect(0, 0, width, height);

    const nodeMap = new Map(nodes.map(n => [n.taskId, n]));

    // Draw dependency lines
    deps.forEach(dep => {
      const fromNode = nodeMap.get(dep.dependsOn);
      const toNode = nodeMap.get(dep.taskId);

      if (!fromNode || !toNode) return;

      const isHighlighted = hovered === fromNode.taskId || hovered === toNode.taskId ||
                           selected === fromNode.taskId || selected === toNode.taskId;

      ctx.strokeStyle = isHighlighted ? '#3b82f6' : '#cbd5e1';
      ctx.lineWidth = isHighlighted ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y + 30);
      ctx.lineTo(toNode.x, toNode.y - 30);
      ctx.stroke();

      // Draw arrow
      if (isHighlighted) {
        const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
        const arrowSize = 8;
        ctx.beginPath();
        ctx.moveTo(toNode.x - arrowSize * Math.cos(angle - Math.PI / 6), toNode.y - 30 - arrowSize * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toNode.x, toNode.y - 30);
        ctx.lineTo(toNode.x - arrowSize * Math.cos(angle + Math.PI / 6), toNode.y - 30 - arrowSize * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const isHovered = hovered === node.taskId;
      const isSelected = selected === node.taskId;

      // Node background
      ctx.fillStyle = isSelected ? '#dbeafe' : isHovered ? '#f1f5f9' : '#ffffff';
      ctx.strokeStyle = getRiskColor(node.riskLevel);
      ctx.lineWidth = isSelected ? 3 : isHovered ? 2 : 1;

      const nodeWidth = 110;
      const nodeHeight = 50;
      const x = node.x - nodeWidth / 2;
      const y = node.y - nodeHeight / 2;

      // Rounded rectangle
      const radius = 8;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + nodeWidth - radius, y);
      ctx.quadraticCurveTo(x + nodeWidth, y, x + nodeWidth, y + radius);
      ctx.lineTo(x + nodeWidth, y + nodeHeight - radius);
      ctx.quadraticCurveTo(x + nodeWidth, y + nodeHeight, x + nodeWidth - radius, y + nodeHeight);
      ctx.lineTo(x + radius, y + nodeHeight);
      ctx.quadraticCurveTo(x, y + nodeHeight, x, y + nodeHeight - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Task ID
      ctx.fillStyle = '#64748b';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.taskId, node.x, node.y - 10);

      // Task title (truncated)
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 11px sans-serif';
      const maxWidth = nodeWidth - 10;
      let title = node.title;
      if (ctx.measureText(title).width > maxWidth) {
        while (ctx.measureText(title + '...').width > maxWidth && title.length > 0) {
          title = title.substring(0, title.length - 1);
        }
        title += '...';
      }
      ctx.fillText(title, node.x, node.y + 8);

      // Risk indicator
      if (node.riskLevel === 'high' || node.riskLevel === 'critical') {
        ctx.fillStyle = getRiskColor(node.riskLevel);
        ctx.beginPath();
        ctx.arc(node.x + nodeWidth / 2 - 10, node.y - nodeHeight / 2 + 10, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  };

  const getRiskColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'critical':
        return '#dc2626';
      case 'high':
        return '#f59e0b';
      case 'medium':
        return '#3b82f6';
      case 'low':
        return '#10b981';
      default:
        return '#94a3b8';
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.abs(dx) < 55 && Math.abs(dy) < 25;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode.taskId);
      if (onTaskClick) {
        onTaskClick(clickedNode.taskId);
      }
    }
  };

  const handleCanvasHover = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find hovered node
    const hoveredNode = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.abs(dx) < 55 && Math.abs(dy) < 25;
    });

    setHoveredNode(hoveredNode ? hoveredNode.taskId : null);
    canvas.style.cursor = hoveredNode ? 'pointer' : 'default';
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        <GitBranch size={48} className="mb-3" />
        <p>No tasks to visualize</p>
        <p className="text-sm mt-1">Break down a feature to see dependencies</p>
      </div>
    );
  }

  const hasCircularDeps = detectCircularDependencies(tasks, dependencies);

  return (
    <div className="space-y-4">
      {hasCircularDeps && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle size={16} className="text-red-600 dark:text-red-400 mt-0.5" />
          <div className="text-sm text-red-700 dark:text-red-300">
            <strong>Warning:</strong> Circular dependencies detected. Please review task dependencies.
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <GitBranch size={16} />
            Task Dependencies
          </h3>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span className="text-gray-600 dark:text-gray-400">Critical</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-gray-600 dark:text-gray-400">High Risk</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Low</span>
            </div>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasHover}
          onMouseLeave={() => setHoveredNode(null)}
          className="w-full h-96 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
        />

        {selectedNode && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Selected: <strong>{selectedNode}</strong>
            </p>
            {nodes.find(n => n.taskId === selectedNode)?.dependencies.length > 0 && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Depends on: {nodes.find(n => n.taskId === selectedNode)?.dependencies.join(', ')}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400">
        Click on a task to select it. Tasks are arranged from top (no dependencies) to bottom (depends on others).
      </div>
    </div>
  );
};

function detectCircularDependencies(tasks: TaskBreakdown[], dependencies: TaskDependency[]): boolean {
  const graph = new Map<string, string[]>();

  dependencies.forEach(dep => {
    if (!graph.has(dep.taskId)) {
      graph.set(dep.taskId, []);
    }
    graph.get(dep.taskId)!.push(dep.dependsOn);
  });

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const hasCycle = (taskId: string): boolean => {
    visited.add(taskId);
    recursionStack.add(taskId);

    const neighbors = graph.get(taskId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(taskId);
    return false;
  };

  for (const task of tasks) {
    if (!visited.has(task.taskId)) {
      if (hasCycle(task.taskId)) return true;
    }
  }

  return false;
}
